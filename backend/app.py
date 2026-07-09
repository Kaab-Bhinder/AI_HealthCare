import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# Semantic (vector) retrieval, with automatic keyword fallback inside the engine.
from rag_engine import retrieve_context, search_knowledge_base
# Adding documents still writes to the shared documents.json knowledge base.
from rag_simple import add_to_knowledge_base
try:
    from db import connect_mongodb, init_collections, find_doctors_by_symptom, get_available_slots, book_appointment, get_doctor_details, get_all_doctors, update_doctor, delete_doctor, get_all_bookings, get_doctor_stats, cancel_booking
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False
    print("[WARNING] MongoDB module not available, appointment booking disabled")
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
2. Use simple, conversational language without markdown formatting
3. Organize information clearly using numbered lists (1. 2. 3.) or bullet points with dashes (-)
4. For symptoms, provide practical advice on what they might try
5. Always remind users to see a doctor for proper diagnosis
6. Be empathetic and acknowledge their concerns
7. Use knowledge base information when available to provide evidence-based guidance
8. Do NOT diagnose - only suggest possibilities or general guidance

FORMATTING RULES:
- NO markdown syntax: Do NOT use **, ##, ___, ~, or asterisks for formatting
- Use plain text for all responses
- Use complete sentences, not fragments
- Ensure every paragraph is fully finished
- If using lists, format them clearly:
  - Use dashes (-) for bullet points
  - Use numbers (1. 2. 3.) for ordered lists
- Write 3-5 full sentences minimum per response

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
                reply = clean_markdown(reply)
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
                reply = clean_markdown(reply)
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
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Password'
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
@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    return add_cors_headers(jsonify({"status": "ok"})), 200
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
        if not slot_id or not patient_email:
            return add_cors_headers(jsonify({"error": "slot_id and email required"})), 400
        success = book_appointment(slot_id, patient_email, patient_phone)
        if success:
            if DEBUG_AI:
                print(f"[DEBUG] Appointment booked: {slot_id} for {patient_email}")
            return add_cors_headers(jsonify({"success": True, "message": "Appointment booked successfully!"})), 200
        else:
            return add_cors_headers(jsonify({"success": False, "error": "Slot no longer available"})), 409
    except Exception as e:
        print(f"[ERROR] Book appointment: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')
@app.route('/api/admin/verify', methods=['POST', 'OPTIONS'])
def verify_admin():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        data = request.get_json()
        password = data.get('password', '')
        if password == ADMIN_PASSWORD:
            return add_cors_headers(jsonify({"success": True})), 200
        else:
            return add_cors_headers(jsonify({"success": False, "error": "Invalid password"})), 401
    except Exception as e:
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/admin/doctors', methods=['GET', 'OPTIONS'])
def admin_get_doctors():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        password = request.headers.get('X-Admin-Password', '')
        if password != ADMIN_PASSWORD:
            return add_cors_headers(jsonify({"error": "Unauthorized"})), 401
        doctors = get_all_doctors()
        return add_cors_headers(jsonify({"doctors": doctors})), 200
    except Exception as e:
        print(f"[ERROR] Get doctors: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/admin/doctors/<doctor_id>', methods=['PUT', 'OPTIONS'])
def admin_update_doctor(doctor_id):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        password = request.headers.get('X-Admin-Password', '')
        if password != ADMIN_PASSWORD:
            return add_cors_headers(jsonify({"error": "Unauthorized"})), 401
        data = request.get_json()
        success = update_doctor(doctor_id, data)
        if success:
            doctor = get_doctor_details(doctor_id)
            return add_cors_headers(jsonify({"success": True, "doctor": doctor})), 200
        else:
            return add_cors_headers(jsonify({"success": False, "error": "Failed to update"})), 500
    except Exception as e:
        print(f"[ERROR] Update doctor: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/admin/doctors/<doctor_id>', methods=['DELETE', 'OPTIONS'])
def admin_delete_doctor(doctor_id):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        password = request.headers.get('X-Admin-Password', '')
        if password != ADMIN_PASSWORD:
            return add_cors_headers(jsonify({"error": "Unauthorized"})), 401
        success = delete_doctor(doctor_id)
        if success:
            return add_cors_headers(jsonify({"success": True, "message": f"Doctor {doctor_id} deleted"})), 200
        else:
            return add_cors_headers(jsonify({"success": False, "error": "Failed to delete"})), 500
    except Exception as e:
        print(f"[ERROR] Delete doctor: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/admin/bookings', methods=['GET', 'OPTIONS'])
def admin_get_bookings():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        password = request.headers.get('X-Admin-Password', '')
        if password != ADMIN_PASSWORD:
            return add_cors_headers(jsonify({"error": "Unauthorized"})), 401
        bookings = get_all_bookings()
        return add_cors_headers(jsonify({"bookings": bookings})), 200
    except Exception as e:
        print(f"[ERROR] Get bookings: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/admin/stats', methods=['GET', 'OPTIONS'])
def admin_get_stats():
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        password = request.headers.get('X-Admin-Password', '')
        if password != ADMIN_PASSWORD:
            return add_cors_headers(jsonify({"error": "Unauthorized"})), 401
        stats = get_doctor_stats()
        return add_cors_headers(jsonify({"stats": stats})), 200
    except Exception as e:
        print(f"[ERROR] Get stats: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500
@app.route('/api/admin/bookings/<slot_id>', methods=['DELETE', 'OPTIONS'])
def admin_cancel_booking(slot_id):
    if request.method == 'OPTIONS':
        return add_cors_headers(jsonify({})), 200
    try:
        password = request.headers.get('X-Admin-Password', '')
        if password != ADMIN_PASSWORD:
            return add_cors_headers(jsonify({"error": "Unauthorized"})), 401
        success = cancel_booking(slot_id)
        if success:
            return add_cors_headers(jsonify({"success": True, "message": "Booking cancelled"})), 200
        else:
            return add_cors_headers(jsonify({"success": False, "error": "Failed to cancel"})), 500
    except Exception as e:
        print(f"[ERROR] Cancel booking: {e}")
        return add_cors_headers(jsonify({"error": str(e)})), 500

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

if __name__ == '__main__':
    init_chats_file()  
    
    if MONGO_AVAILABLE:
        if connect_mongodb():
            init_collections()
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
