import os
import json
import base64
import requests
from datetime import datetime
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# Retrieval: Atlas Vector Search when populated, else local semantic engine,
# else keyword — the fallback chain lives inside vector_db.retrieve_context.
from vector_db import retrieve_context
from rag_engine import search_knowledge_base
# Adding documents still writes to the shared documents.json knowledge base.
from rag_simple import add_to_knowledge_base
try:
    import db as dbmod
    from db import connect_mongodb, init_collections, find_doctors_by_symptom, get_available_slots, book_appointment, get_doctor_details, get_all_doctors, update_doctor, delete_doctor, get_all_bookings, get_doctor_stats, cancel_booking
    from db import (book_slot_for_patient, get_appointments_for_patient, get_appointments_for_doctor,
                    create_doctor, get_doctor_by_user, ensure_indexes, SEED_DOCTORS)
    MONGO_AVAILABLE = True
except ImportError as _e:
    MONGO_AVAILABLE = False
    print(f"[WARNING] MongoDB module not available: {_e}")

import auth
import matching
load_dotenv()
app = Flask(__name__)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
DEBUG_AI = os.getenv('DEBUG_AI', 'false').lower() == 'true'
FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
CORS_ORIGIN = os.getenv('CORS_ORIGIN', 'http://localhost:3000')
gemini_llm = None
if GEMINI_API_KEY:
    try:
        gemini_llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.2,
            max_output_tokens=2500
        )
        if DEBUG_AI:
            print("[DEBUG] Gemini LLM initialized")
    except Exception as e:
        print(f"[ERROR] Gemini init: {e}")
openai_llm = None
if OPENAI_API_KEY:
    try:
        openai_llm = ChatOpenAI(
            model="gpt-4o-mini",
            openai_api_key=OPENAI_API_KEY,
            temperature=0.2,
            max_tokens=2500
        )
        if DEBUG_AI:
            print("[DEBUG] OpenAI LLM initialized")
    except Exception as e:
        print(f"[ERROR] OpenAI init: {e}")
SYSTEM_PROMPT = """You are a helpful medical assistant providing general health guidance. Be empathetic, practical, and thorough.

RESPONSE GUIDELINES:
1. Write complete, well-formed responses - never cut sentences short
2. Use clear, conversational language
3. Organize information clearly with short paragraphs and lists
4. For symptoms, provide practical advice on what they might try
5. Always remind users to see a doctor for proper diagnosis
6. Be empathetic and acknowledge their concerns
7. Use knowledge base information when available to provide evidence-based guidance
8. Do NOT diagnose - only suggest possibilities or general guidance

FORMATTING RULES (use Markdown - it is rendered nicely in the UI):
- Use **bold** to highlight key terms and important warnings
- Use bullet lists (- item) and numbered lists (1. item) to organize steps
- Use short section headings (e.g. "### When to see a doctor") when it helps readability
- Keep paragraphs short (2-4 sentences); ensure every sentence is complete
- Do NOT wrap the whole answer in a code block

KNOWLEDGE BASE USAGE:
- If relevant information from the knowledge base is provided, incorporate it naturally
- Reference the source/context to build credibility
- Always add personalization and empathy on top of knowledge base information
- If no relevant knowledge base information is available, provide general guidance

EXAMPLE RESPONSE STYLE:
"I'm sorry to hear about your back pain. This is a common issue that can have several causes. Rest is important, but so is staying gently active. You might try applying ice for the first 24-48 hours to reduce inflammation, or heat afterward to relax muscles. Here are some things that often help:

1. Take breaks from sitting or standing every hour
2. Do gentle stretching like knee-to-chest or cat-cow poses
3. Ensure your mattress provides good support
4. Maintain proper posture when sitting and standing
5. Consider over-the-counter pain relievers if needed
However, please see a doctor if the pain is severe, persistent, or gets worse."

REMEMBER: Write complete responses that fully answer the user's question."""

prompt_template = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{message}")
])
DATA_DIR = "data"
CHATS_FILE = os.path.join(DATA_DIR, "chats.json")
def ensure_data_file():
    """Create data directory if it doesn't exist"""
    os.makedirs(DATA_DIR, exist_ok=True)
def init_chats_file():
    """Initialize chats file - clears history on server startup"""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CHATS_FILE, 'w') as f:
        json.dump([], f)
def load_conversation(conversation_id):
    try:
        with open(CHATS_FILE, 'r') as f:
            chats = json.load(f)
        messages = [
            {
                "role": "user" if msg.get("userMessage") else "assistant",
                "content": msg.get("userMessage") or msg.get("assistantReply")
            }
            for msg in chats if msg.get("conversationId") == conversation_id
        ]
        if DEBUG_AI:
            print(f"[DEBUG] Loaded {len(messages)} prior messages")
        return messages[-8:] if len(messages) > 8 else messages
    except Exception as e:
        if DEBUG_AI:
            print(f"[DEBUG] Error loading: {e}")
        return []
def save_chat(entry):
    ensure_data_file()  
    try:
        with open(CHATS_FILE, 'r') as f:
            chats = json.load(f)
        chats.append(entry)
        with open(CHATS_FILE, 'w') as f:
            json.dump(chats, f, indent=2)
        if DEBUG_AI:
            print("[DEBUG] Chat saved")
    except Exception as e:
        print(f"[ERROR] Save failed: {e}")

def clean_markdown(text):
    """Remove all markdown formatting from text"""
    import re
    # Remove bold (**text**)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    # Remove italic (*text*) - but be careful with lists
    text = re.sub(r'(?<![*])\*(?!\*)([^*\n]+?)\*(?!\*)', r'\1', text)
    # Remove underline (__text__)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    # Remove strikethrough (~~text~~)
    text = re.sub(r'~~([^~]+)~~', r'\1', text)
    # Remove headers (## text)
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove inline code (`code`)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    # Fix bullet points by replacing * with -
    text = re.sub(r'^\s*\*\s+', ' - ', text, flags=re.MULTILINE)
    # Clean up multiple spaces
    text = re.sub(r'  +', ' ', text)
    return text.strip()

def get_llm_response(message, conversation_id):
    """Get LLM response with RAG context and intelligent fallback"""
    prior_messages = load_conversation(conversation_id)
    if DEBUG_AI:
        print(f"[DEBUG] Building prompt with {len(prior_messages)} messages")
    
    # Try to retrieve relevant context from knowledge base (semantic search)
    context = ""
    knowledge_found = False
    sources = []
    try:
        context, knowledge_found, sources = retrieve_context(message, limit=3)
        if context and DEBUG_AI:
            titles = ", ".join(s["title"] for s in sources)
            print(f"[DEBUG] Retrieved {len(sources)} docs ({len(context)} chars): {titles}")
        if not knowledge_found and DEBUG_AI:
            print(f"[DEBUG] No relevant knowledge cleared the similarity threshold")
    except Exception as e:
        if DEBUG_AI:
            print(f"[DEBUG] RAG retrieval failed: {e}")
    
    # Build the final prompt with context if available
    if knowledge_found and context:
        final_message = f"{context}\n\nUser Question: {message}\n\nInstructions: Use the medical knowledge above to provide a detailed, evidence-based answer. Be comprehensive and thorough."
    else:
        final_message = f"User Question: {message}\n\nInstructions: Provide a detailed, helpful response. Be thorough, empathetic, and medically responsible."
    
    if gemini_llm:
        try:
            if DEBUG_AI:
                if knowledge_found:
                    print(f"[DEBUG] Calling Gemini with detailed RAG context")
                else:
                    print(f"[DEBUG] Calling Gemini without knowledge base")

            response = gemini_llm.invoke(final_message)
            if hasattr(response, 'content'):
                reply = str(response.content).strip()
            else:
                reply = str(response).strip()
            if reply:
                reply = reply.strip()  # keep Markdown; the UI renders it
                if DEBUG_AI:
                    print(f"[DEBUG] Gemini response: {reply[:100]}...")
                return reply, "gemini-2.5-flash", sources
            else:
                if DEBUG_AI:
                    print(f"[DEBUG] Gemini returned empty reply")
        except Exception as e:
            print(f"[ERROR] Gemini error: {e}")
            if DEBUG_AI:
                import traceback
                traceback.print_exc()
    else:
        print("[ERROR] Gemini LLM not initialized")
    
    if openai_llm:
        try:
            if DEBUG_AI:
                if knowledge_found:
                    print(f"[DEBUG] Calling OpenAI (fallback) with RAG context")
                else:
                    print(f"[DEBUG] Calling OpenAI (fallback) without knowledge base")
            response = openai_llm.invoke(final_message)
            if hasattr(response, 'content'):
                reply = str(response.content).strip()
            else:
                reply = str(response).strip()
            if reply:
                reply = reply.strip()  # keep Markdown; the UI renders it
                if DEBUG_AI:
                    print(f"[DEBUG] OpenAI response: {reply[:100]}...")
                return reply, "gpt-4o-mini", sources
        except Exception as e:
            if DEBUG_AI:
                print(f"[DEBUG] OpenAI error: {e}")
    else:
        if DEBUG_AI:
            print("[DEBUG] OpenAI LLM not configured")

    print("[ERROR] No LLM available or all LLMs failed")
    return None, None, []
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = CORS_ORIGIN
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Password, Authorization'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response
@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        conversation_id = data.get('conversationId', 'default')
        
        if not message:
            return add_cors_headers(jsonify({"error": "Message required"})), 400
        if DEBUG_AI:
            print(f"\n[DEBUG] Chat request: {message[:100]}...")
        
        reply, model, sources = get_llm_response(message, conversation_id)
        if not reply:
            if DEBUG_AI:
                print("[DEBUG] No reply from LLM")
            return add_cors_headers(jsonify({"error": "AI unavailable"})), 502

        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "conversationId": conversation_id,
            "model": model,
            "userMessage": message,
            "assistantReply": reply,
            "sources": sources
        }
        save_chat(entry)
        return add_cors_headers(jsonify({"reply": reply, "sources": sources})), 200
    except Exception as e:
        print(f"[ERROR] Chat endpoint: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/debug/keys', methods=['GET', 'OPTIONS'])
def debug_keys():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    return add_cors_headers(jsonify({
        "gemini": bool(GEMINI_API_KEY),
        "openai": bool(OPENAI_API_KEY),
        "debug_mode": DEBUG_AI
    })), 200
@app.route('/api/conversation/<conversation_id>', methods=['GET', 'OPTIONS'])
def get_conversation(conversation_id):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        with open(CHATS_FILE, 'r') as f:
            chats = json.load(f)
        messages = []
        for msg in chats:
            if msg.get("conversationId") == conversation_id:
                if msg.get("userMessage"):
                    messages.append({
                        "role": "user",
                        "content": msg.get("userMessage")
                    })
                if msg.get("assistantReply"):
                    messages.append({
                        "role": "assistant",
                        "content": msg.get("assistantReply")
                    })
        if DEBUG_AI:
            print(f"[DEBUG] Retrieved {len(messages)} messages for conversation {conversation_id}")
        return add_cors_headers(jsonify({"messages": messages})), 200
    except Exception as e:
        if DEBUG_AI:
            print(f"[DEBUG] Error retrieving conversation: {e}")
        return add_cors_headers(jsonify({"messages": []})), 200
def transcribe_with_gemini(audio_b64, mime_type='audio/wav'):
    """Transcribe base64-encoded audio using Gemini's multimodal endpoint.

    Works for audio recorded in any browser (the client always uploads WAV),
    so it fixes voice input for browsers without the Web Speech API (Firefox).
    Returns the transcript string, or '' if nothing could be transcribed.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    )
    body = {
        "contents": [{
            "parts": [
                {"text": "Transcribe this audio verbatim. Return ONLY the spoken "
                         "words with no commentary, labels, or quotation marks. "
                         "If there is no discernible speech, return an empty string."},
                {"inline_data": {"mime_type": mime_type, "data": audio_b64}},
            ]
        }],
        "generationConfig": {"temperature": 0},
    }
    resp = requests.post(url, json=body, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        text = ""
    # Gemini sometimes wraps in quotes or says it can't hear anything.
    text = text.strip().strip('"').strip()
    lowered = text.lower()
    if lowered in ("", "no discernible speech", "(no speech detected)") or \
       "no discernible speech" in lowered or "no audible speech" in lowered:
        return ""
    return text


@app.route('/api/voice/transcribe', methods=['POST', 'OPTIONS'])
def voice_transcribe():
    """Speech-to-text for all browsers. Body: { audio: <base64>, mime_type }."""
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json(silent=True) or {}
        audio_b64 = data.get('audio', '')
        mime_type = data.get('mime_type', 'audio/wav')
        if not audio_b64:
            return add_cors_headers(jsonify({"error": "audio required"})), 400

        # Guard against oversized uploads (~10 MB of base64).
        if len(audio_b64) > 10_000_000:
            return add_cors_headers(jsonify({"error": "audio too large"})), 413

        text = transcribe_with_gemini(audio_b64, mime_type)
        if DEBUG_AI:
            print(f"[DEBUG] Voice transcript: {text[:80]!r}")
        return add_cors_headers(jsonify({"text": text})), 200
    except requests.HTTPError as e:
        print(f"[ERROR] Transcribe (Gemini HTTP): {e}")
        return add_cors_headers(jsonify({"error": "Transcription service error"})), 502
    except Exception as e:
        print(f"[ERROR] Transcribe: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500


@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    return add_cors_headers(jsonify({"status": "ok"})), 200

# ==========================================================================
# Accounts & authentication (patient / doctor / admin)
# ==========================================================================
@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def auth_register():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip()
        password = data.get('password') or ''
        name = (data.get('name') or '').strip()
        if not email or not password:
            return add_cors_headers(jsonify({"error": "Email and password are required"})), 400
        if len(password) < 6:
            return add_cors_headers(jsonify({"error": "Password must be at least 6 characters"})), 400
        # Public registration only ever creates patients.
        user, err = auth.create_user(email, password, name, role='patient',
                                     gender=data.get('gender'), phone=data.get('phone'))
        if err:
            return add_cors_headers(jsonify({"error": err})), 409
        token = auth.create_token(user)
        return add_cors_headers(jsonify({"token": token, "user": auth._serialize_user(user)})), 201
    except Exception as e:
        print(f"[ERROR] register: {e}")
        return add_cors_headers(jsonify({"error": "Registration failed"})), 500


@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def auth_login():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip()
        password = data.get('password') or ''
        user = auth.verify_credentials(email, password)
        if not user:
            return add_cors_headers(jsonify({"error": "Invalid email or password"})), 401
        token = auth.create_token(user)
        return add_cors_headers(jsonify({"token": token, "user": auth._serialize_user(user)})), 200
    except Exception as e:
        print(f"[ERROR] login: {e}")
        return add_cors_headers(jsonify({"error": "Login failed"})), 500


@app.route('/api/auth/me', methods=['GET', 'OPTIONS'])
@auth.require_auth()
def auth_me(current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    out = auth._serialize_user(current_user)
    if current_user.get('role') == 'doctor':
        out['doctor_profile'] = get_doctor_by_user(str(current_user['_id']))
    return add_cors_headers(jsonify({"user": out})), 200


# ==========================================================================
# AI triage & doctor matching  (guest-friendly — no login required)
# ==========================================================================
@app.route('/api/match', methods=['POST', 'OPTIONS'])
def ai_match():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json(silent=True) or {}
        symptoms = (data.get('symptoms') or '').strip()
        if not symptoms:
            return add_cors_headers(jsonify({"error": "Please describe your symptoms"})), 400
        gender = data.get('gender') or None            # 'male' | 'female' preference
        preferred_time = data.get('preferred_time') or None  # 'morning'|'afternoon'|'evening'
        # A doctor browsing shouldn't be matched to themselves.
        exclude = None
        user = auth._current_user_from_request()
        if user and user.get('role') == 'doctor':
            exclude = user.get('doctor_id')
        result = matching.match_doctors(symptoms, gender=gender, preferred_time=preferred_time,
                                        exclude_doctor_id=exclude)
        if DEBUG_AI:
            print(f"[DEBUG] match: specialty={result['triage']['specialty']} "
                  f"urgency={result['triage']['urgency']} doctors={len(result['doctors'])}")
        return add_cors_headers(jsonify(result)), 200
    except Exception as e:
        print(f"[ERROR] match: {e}")
        return add_cors_headers(jsonify({"error": "Matching failed"})), 500


# ==========================================================================
# Patient dashboard
# ==========================================================================
@app.route('/api/me/appointments', methods=['GET', 'OPTIONS'])
@auth.require_auth('patient')
def my_appointments(current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    appts = get_appointments_for_patient(str(current_user['_id']))
    return add_cors_headers(jsonify({"appointments": appts})), 200


# ==========================================================================
# Doctor dashboard
# ==========================================================================
@app.route('/api/doctor/appointments', methods=['GET', 'OPTIONS'])
@auth.require_auth('doctor')
def doctor_appointments(current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    profile = get_doctor_by_user(str(current_user['_id']))
    if not profile:
        return add_cors_headers(jsonify({"appointments": [], "profile": None})), 200
    appts = get_appointments_for_doctor(profile['_id'])
    return add_cors_headers(jsonify({"appointments": appts, "profile": profile})), 200


# ==========================================================================
# Admin: add a doctor (creates a login account for them too)
# ==========================================================================
@app.route('/api/admin/doctors/create', methods=['POST', 'OPTIONS'])
@auth.require_auth('admin')
def admin_create_doctor(current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json(silent=True) or {}
        name = (data.get('name') or '').strip()
        login_email = (data.get('email') or '').strip()
        if not name or not login_email:
            return add_cors_headers(jsonify({"error": "Doctor name and login email are required"})), 400
        # Create the doctor's login account first.
        temp_password = data.get('password') or 'doctor123'
        user, err = auth.create_user(login_email, temp_password, name, role='doctor',
                                     gender=data.get('gender'), phone=data.get('phone'))
        if err:
            return add_cors_headers(jsonify({"error": err})), 409
        # Then the professional profile, linked to that account.
        profile = create_doctor({
            'name': name, 'specialty': data.get('specialty'), 'specialties': data.get('specialties', []),
            'gender': data.get('gender'), 'qualifications': data.get('qualifications'),
            'experience_years': data.get('experience_years'), 'rating': data.get('rating'),
            'availability': data.get('availability'), 'phone': data.get('phone'),
            'bio': data.get('bio'), 'user_id': str(user['_id']),
        })
        # Backlink the account to the profile.
        if profile and dbmod.db is not None:
            dbmod.db.users.update_one({'_id': user['_id']}, {'$set': {'doctor_id': profile['_id']}})
        return add_cors_headers(jsonify({"success": True, "doctor": profile,
                                         "login": {"email": login_email, "password": temp_password}})), 201
    except Exception as e:
        print(f"[ERROR] admin_create_doctor: {e}")
        return add_cors_headers(jsonify({"error": "Failed to create doctor"})), 500


@app.route('/api/doctors/search', methods=['POST', 'OPTIONS'])
def search_doctors():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json()
        symptom = data.get('symptom', '').strip()
        if not symptom:
            return add_cors_headers(jsonify({"error": "Symptom required"})), 400
        doctors = find_doctors_by_symptom(symptom)
        if DEBUG_AI:
            print(f"[DEBUG] Found {len(doctors)} doctors for symptom: {symptom}")
        return add_cors_headers(jsonify({"doctors": doctors})), 200
    except Exception as e:
        print(f"[ERROR] Doctor search: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/doctors/<doctor_id>/slots', methods=['GET', 'OPTIONS'])
def get_doctor_slots(doctor_id):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        days = request.args.get('days', 7, type=int)
        print(f"[DEBUG] Getting slots for doctor {doctor_id}, days={days}")
        slots = get_available_slots(doctor_id, days)
        print(f"[DEBUG] Found {len(slots)} available slots for doctor {doctor_id}")
        return add_cors_headers(jsonify({"slots": slots})), 200
    except Exception as e:
        print(f"[ERROR] Get slots: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/doctors/<doctor_id>', methods=['GET', 'OPTIONS'])
def get_doctor(doctor_id):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        doctor = get_doctor_details(doctor_id)
        if not doctor:
            return add_cors_headers(jsonify({"error": "Doctor not found"})), 404
        return add_cors_headers(jsonify(doctor)), 200
    except Exception as e:
        print(f"[ERROR] Get doctor: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/appointments/book', methods=['POST', 'OPTIONS'])
def book_appointment_endpoint():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json()
        slot_id = data.get('slot_id')
        patient_email = data.get('email', '').strip()
        patient_phone = data.get('phone', '').strip()
        patient_name = (data.get('name') or '').strip() or None
        if not slot_id or not patient_email:
            return add_cors_headers(jsonify({"error": "slot_id and email required"})), 400

        # Only patients (or guests) may book. Doctors/admins are providers, not
        # patients — this prevents a doctor booking an appointment with themselves.
        patient_id = None
        user = auth._current_user_from_request()
        if user:
            if user.get('role') != 'patient':
                return add_cors_headers(jsonify({"error": "Only patients can book appointments"})), 403
            patient_id = str(user['_id'])
            patient_email = patient_email or user.get('email')
            patient_name = patient_name or user.get('name')

        booking = book_slot_for_patient(slot_id, patient_id, patient_email, patient_phone, patient_name)
        if booking:
            if DEBUG_AI:
                print(f"[DEBUG] Appointment booked: {slot_id} for {patient_email}")
            return add_cors_headers(jsonify({"success": True, "booking": booking,
                                             "message": "Appointment booked successfully!"})), 200
        else:
            return add_cors_headers(jsonify({"success": False, "error": "That slot is no longer available"})), 409
    except Exception as e:
        print(f"[ERROR] Book appointment: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
# ==========================================================================
# Admin — protected by a real admin ACCOUNT (JWT), not a shared password.
# ==========================================================================
@app.route('/api/admin/doctors', methods=['GET', 'OPTIONS'])
@auth.require_auth('admin')
def admin_get_doctors(current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    return add_cors_headers(jsonify({"doctors": get_all_doctors()})), 200


@app.route('/api/admin/doctors/<doctor_id>', methods=['PUT', 'OPTIONS'])
@auth.require_auth('admin')
def admin_update_doctor(doctor_id, current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    data = request.get_json() or {}
    if update_doctor(doctor_id, data):
        return add_cors_headers(jsonify({"success": True, "doctor": get_doctor_details(doctor_id)})), 200
    return add_cors_headers(jsonify({"success": False, "error": "Failed to update"})), 500


@app.route('/api/admin/doctors/<doctor_id>', methods=['DELETE', 'OPTIONS'])
@auth.require_auth('admin')
def admin_delete_doctor(doctor_id, current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    if delete_doctor(doctor_id):
        return add_cors_headers(jsonify({"success": True, "message": f"Doctor {doctor_id} deleted"})), 200
    return add_cors_headers(jsonify({"success": False, "error": "Failed to delete"})), 500


@app.route('/api/admin/bookings', methods=['GET', 'OPTIONS'])
@auth.require_auth('admin')
def admin_get_bookings(current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    return add_cors_headers(jsonify({"bookings": get_all_bookings()})), 200


@app.route('/api/admin/stats', methods=['GET', 'OPTIONS'])
@auth.require_auth('admin')
def admin_get_stats(current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    return add_cors_headers(jsonify({"stats": get_doctor_stats()})), 200


@app.route('/api/admin/bookings/<slot_id>', methods=['DELETE', 'OPTIONS'])
@auth.require_auth('admin')
def admin_cancel_booking(slot_id, current_user=None):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    if cancel_booking(slot_id):
        return add_cors_headers(jsonify({"success": True, "message": "Booking cancelled"})), 200
    return add_cors_headers(jsonify({"success": False, "error": "Failed to cancel"})), 500

# RAG Knowledge Base Endpoints
@app.route('/api/rag/search', methods=['POST', 'OPTIONS'])
def rag_search():
    """Search the knowledge base"""
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        limit = data.get('limit', 3)
        
        if not query:
            return add_cors_headers(jsonify({"error": "Query required"})), 400
        
        results = search_knowledge_base(query, limit)
        if DEBUG_AI:
            print(f"[DEBUG] RAG search found {len(results)} results for: {query[:50]}")
        
        return add_cors_headers(jsonify({"results": results, "count": len(results)})), 200
    except Exception as e:
        print(f"[ERROR] RAG search: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500

@app.route('/api/rag/add', methods=['POST', 'OPTIONS'])
def rag_add_document():
    """Add document to knowledge base"""
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json()
        content = data.get('content', '').strip()
        title = data.get('title', 'Untitled Document')
        source = data.get('source', 'manual')
        
        if not content:
            return add_cors_headers(jsonify({"error": "Content required"})), 400
        
        if len(content) < 10:
            return add_cors_headers(jsonify({"error": "Content must be at least 10 characters"})), 400
        
        doc_id = add_to_knowledge_base(content, title, source)
        if DEBUG_AI:
            print(f"[DEBUG] Added document to RAG: {title} (ID: {doc_id})")
        
        return add_cors_headers(jsonify({
            "success": True, 
            "message": f"Document '{title}' added to knowledge base",
            "doc_id": doc_id
        })), 201
    except Exception as e:
        print(f"[ERROR] RAG add: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500

def seed_accounts():
    """Create the admin account and a login for each seeded doctor (idempotent)."""
    if not MONGO_AVAILABLE or dbmod.db is None:
        return
    try:
        ensure_indexes()
        # Admin
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@auravia.health')
        if not auth.find_user_by_email(admin_email):
            auth.create_user(admin_email, os.getenv('ADMIN_PASSWORD', 'admin123'),
                             'Auravia Admin', role='admin')
            print(f"[DEBUG] Seeded admin account: {admin_email}")
        # Doctor logins — email derived from name, linked to their profile.
        for doc in SEED_DOCTORS:
            slug = doc['name'].replace('Dr. ', '').replace(' ', '.').lower()
            email = f"{slug}@auravia.health"
            existing = auth.find_user_by_email(email)
            if existing:
                user_id = str(existing['_id'])
            else:
                user, err = auth.create_user(email, 'doctor123', doc['name'], role='doctor',
                                             gender=doc.get('gender'), phone=doc.get('phone'))
                if err:
                    continue
                user_id = str(user['_id'])
            # Link profile <-> account both ways.
            dbmod.db.doctors.update_one({'_id': doc['_id']}, {'$set': {'user_id': user_id}})
            dbmod.db.users.update_one({'_id': auth.find_user_by_email(email)['_id']},
                                      {'$set': {'doctor_id': doc['_id']}})
        print(f"[DEBUG] Seeded {len(SEED_DOCTORS)} doctor logins (password: doctor123)")
    except Exception as e:
        print(f"[WARNING] seed_accounts: {e}")


if __name__ == '__main__':
    init_chats_file()
    
    if MONGO_AVAILABLE:
        if connect_mongodb():
            init_collections()
            seed_accounts()
        else:
            print("[WARNING] Using mock appointment data (MongoDB not available)")
    print(f"[DEBUG] Starting Flask on port {FLASK_PORT}")
    print(f"[DEBUG] Gemini configured: {bool(GEMINI_API_KEY)}")
    print(f"[DEBUG] OpenAI configured: {bool(OPENAI_API_KEY)}")
    print(f"[DEBUG] Appointment booking: {'✓ Enabled' if MONGO_AVAILABLE else '✗ Disabled'}")
    try:
        from rag_engine import get_engine
        _eng = get_engine()
        _mode = "Semantic (Gemini embeddings)" if _eng.ready else "Keyword fallback"
        print(f"[DEBUG] RAG System: ✓ Enabled ({_mode}, {len(_eng.doc_ids)} docs)")
    except Exception as e:
        print(f"[DEBUG] RAG System: keyword fallback ({e})")
    app.run(host='0.0.0.0', port=FLASK_PORT, debug=False)
