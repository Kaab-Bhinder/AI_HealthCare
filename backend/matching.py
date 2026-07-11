"""
AI triage & doctor matching — the core of Auravia.

Flow:
  1. triage(symptoms): Gemini reads the free-text symptoms and returns structured
     JSON — the best-fit medical specialty, alternates, an urgency level
     (routine | urgent | emergency), a short patient-friendly reason, and any
     red-flag warnings.
  2. match_doctors(...): query doctors for those specialties (optionally filtered
     by gender), attach each doctor's earliest available slot, and rank them by a
     transparent score (specialty fit + rating + how soon they're free, with a
     nudge toward the patient's preferred time of day).

If Gemini is unavailable it falls back to a keyword→specialty map so the feature
still works offline.
"""

import os
import json
import requests
from datetime import datetime

import db as dbmod

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Specialties the system knows about (kept in sync with seeded doctors).
KNOWN_SPECIALTIES = [
    'General Practitioner', 'Internal Medicine', 'Neurology', 'ENT Specialist',
    'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Psychiatry',
    'Gastroenterology', 'Pulmonology', 'Endocrinology', 'Gynecology',
    'Ophthalmology', 'Urology',
]

# Fallback keyword → specialty map (used when the LLM is unavailable).
_KEYWORD_MAP = [
    (('headache', 'migraine', 'dizzy', 'numbness', 'seizure'), 'Neurology'),
    (('chest pain', 'palpitation', 'blood pressure', 'hypertension'), 'Cardiology'),
    (('sore throat', 'ear', 'sinus', 'nose', 'tonsil'), 'ENT Specialist'),
    (('rash', 'acne', 'skin', 'eczema', 'itch'), 'Dermatology'),
    (('stomach', 'nausea', 'diarrhea', 'vomit', 'abdominal'), 'Gastroenterology'),
    (('cough', 'breath', 'asthma', 'wheeze', 'lung'), 'Pulmonology'),
    (('anxiety', 'depress', 'stress', 'sleep', 'panic'), 'Psychiatry'),
    (('joint', 'bone', 'back pain', 'fracture', 'muscle'), 'Orthopedics'),
    (('diabetes', 'thyroid', 'hormone'), 'Endocrinology'),
    (('child', 'infant', 'baby', 'kid'), 'Pediatrics'),
    (('fever', 'cold', 'flu', 'tired', 'fatigue'), 'General Practitioner'),
]

_EMERGENCY_TERMS = (
    'chest pain', 'can\'t breathe', 'cannot breathe', 'shortness of breath',
    'unconscious', 'severe bleeding', 'stroke', 'suicid', 'overdose',
    'severe allergic', 'anaphylaxis', 'heart attack', 'not breathing',
)


def _fallback_triage(symptoms):
    s = symptoms.lower()
    specialty = 'General Practitioner'
    for keywords, spec in _KEYWORD_MAP:
        if any(k in s for k in keywords):
            specialty = spec
            break
    urgency = 'emergency' if any(t in s for t in _EMERGENCY_TERMS) else 'routine'
    return {
        'specialty': specialty,
        'alt_specialties': [],
        'urgency': urgency,
        'reason': 'Matched from symptom keywords.',
        'red_flags': [t for t in _EMERGENCY_TERMS if t in s],
    }


def triage(symptoms):
    """Return structured triage: specialty, alt_specialties, urgency, reason, red_flags."""
    symptoms = (symptoms or '').strip()
    if not symptoms:
        return _fallback_triage('')

    if not GEMINI_API_KEY:
        return _fallback_triage(symptoms)

    prompt = (
        "You are a medical triage assistant. Read the patient's symptoms and respond "
        "with STRICT JSON only (no prose) matching this shape:\n"
        '{"specialty": string, "alt_specialties": string[], '
        '"urgency": "routine"|"urgent"|"emergency", "reason": string, "red_flags": string[]}\n\n'
        f"Choose specialty from this list: {', '.join(KNOWN_SPECIALTIES)}.\n"
        "Set urgency to 'emergency' for life-threatening signs (e.g. chest pain with "
        "shortness of breath, stroke signs, severe bleeding, suicidal intent). "
        "Keep 'reason' to one calm, plain-language sentence for the patient.\n\n"
        f"Symptoms: {symptoms}"
    )
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }
    try:
        resp = requests.post(url, json=body, timeout=30)
        resp.raise_for_status()
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(text)
        # Normalize / validate
        specialty = data.get('specialty') or 'General Practitioner'
        if specialty not in KNOWN_SPECIALTIES:
            # snap to closest known specialty by case-insensitive contains
            match = next((k for k in KNOWN_SPECIALTIES if k.lower() in specialty.lower()
                          or specialty.lower() in k.lower()), 'General Practitioner')
            specialty = match
        urgency = data.get('urgency', 'routine')
        if urgency not in ('routine', 'urgent', 'emergency'):
            urgency = 'routine'
        return {
            'specialty': specialty,
            'alt_specialties': [s for s in data.get('alt_specialties', []) if isinstance(s, str)][:3],
            'urgency': urgency,
            'reason': (data.get('reason') or '').strip()[:300],
            'red_flags': [s for s in data.get('red_flags', []) if isinstance(s, str)][:5],
        }
    except Exception as e:
        print(f"[WARNING] triage LLM failed ({e}); using keyword fallback")
        return _fallback_triage(symptoms)


def _time_of_day_bucket(dt):
    h = dt.hour
    if h < 12:
        return 'morning'
    if h < 17:
        return 'afternoon'
    return 'evening'


def match_doctors(symptoms, gender=None, preferred_time=None, limit=6):
    """
    Full pipeline: triage the symptoms, then find & rank doctors.

    Returns a dict:
      {
        triage: {...},
        emergency: bool,
        recommended: <doctor with earliest slot> | None,
        doctors: [ {..doctor, earliest_slot, match_score, specialty_match} ]
      }
    """
    tri = triage(symptoms)
    specialties = [tri['specialty']] + tri.get('alt_specialties', [])

    doctors = dbmod.find_matching_doctors(specialties, gender=gender, limit=20)

    ranked = []
    for doc in doctors:
        earliest = dbmod.get_earliest_available_slot(doc['_id'])
        # Scoring — transparent and tunable.
        specialty_match = 1.0 if doc.get('specialty') == tri['specialty'] else 0.6
        rating = float(doc.get('rating') or 4.0)
        score = specialty_match * 3.0 + (rating - 4.0) * 2.0

        if earliest:
            slot_dt = datetime.fromisoformat(earliest['slot_time'])
            # Sooner is better: decay over days from now.
            days_away = max(0.0, (slot_dt - datetime.now()).total_seconds() / 86400.0)
            score += max(0.0, 3.0 - days_away * 0.4)
            # Nudge toward the patient's preferred time of day.
            if preferred_time and _time_of_day_bucket(slot_dt) == preferred_time:
                score += 1.0
        else:
            score -= 5.0  # no availability sinks the doctor

        d = dict(doc)
        d['earliest_slot'] = earliest
        d['match_score'] = round(score, 2)
        d['specialty_match'] = doc.get('specialty') == tri['specialty']
        ranked.append(d)

    ranked.sort(key=lambda x: x['match_score'], reverse=True)
    ranked = ranked[:limit]
    recommended = next((d for d in ranked if d.get('earliest_slot')), ranked[0] if ranked else None)

    return {
        'triage': tri,
        'emergency': tri['urgency'] == 'emergency',
        'recommended': recommended,
        'doctors': ranked,
    }
