import os
import uuid
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

# Richer seed set — spread across specialties and genders so AI matching has
# real variety to choose from.
SEED_DOCTORS = [
    {'_id': 'doc_001', 'name': 'Dr. Sarah Johnson', 'specialty': 'General Practitioner', 'gender': 'female',
     'specialties': ['headache', 'fever', 'cold', 'cough', 'sore throat', 'fatigue'],
     'qualifications': 'MD, Board Certified', 'experience_years': 10, 'rating': 4.8,
     'availability': 'Mon-Fri 9AM-5PM', 'phone': '555-0001', 'bio': 'Family medicine physician focused on preventive, whole-person care.'},
    {'_id': 'doc_002', 'name': 'Dr. Michael Chen', 'specialty': 'Internal Medicine', 'gender': 'male',
     'specialties': ['fever', 'diabetes', 'hypertension', 'fatigue'],
     'qualifications': 'MD, Internal Medicine', 'experience_years': 15, 'rating': 4.9,
     'availability': 'Mon-Sat 10AM-6PM', 'phone': '555-0002', 'bio': 'Internist specializing in chronic disease management.'},
    {'_id': 'doc_003', 'name': 'Dr. Emily Rodriguez', 'specialty': 'Neurology', 'gender': 'female',
     'specialties': ['headache', 'migraine', 'dizziness', 'numbness', 'seizure'],
     'qualifications': 'MD, Neurology', 'experience_years': 12, 'rating': 4.7,
     'availability': 'Tue-Fri 2PM-8PM', 'phone': '555-0003', 'bio': 'Neurologist treating headache, migraine and nerve disorders.'},
    {'_id': 'doc_004', 'name': 'Dr. James Wilson', 'specialty': 'ENT Specialist', 'gender': 'male',
     'specialties': ['sore throat', 'cough', 'cold', 'sinusitis', 'ear pain'],
     'qualifications': 'MD, Otolaryngology', 'experience_years': 18, 'rating': 4.6,
     'availability': 'Mon-Thu 8AM-4PM', 'phone': '555-0004', 'bio': 'Ear, nose and throat surgeon.'},
    {'_id': 'doc_005', 'name': 'Dr. Aisha Khan', 'specialty': 'Cardiology', 'gender': 'female',
     'specialties': ['chest pain', 'palpitation', 'hypertension', 'blood pressure'],
     'qualifications': 'MD, FACC', 'experience_years': 20, 'rating': 4.9,
     'availability': 'Mon-Fri 9AM-3PM', 'phone': '555-0005', 'bio': 'Cardiologist with two decades of clinical experience.'},
    {'_id': 'doc_006', 'name': 'Dr. David Park', 'specialty': 'Dermatology', 'gender': 'male',
     'specialties': ['rash', 'acne', 'skin', 'eczema', 'itching'],
     'qualifications': 'MD, Dermatology', 'experience_years': 9, 'rating': 4.5,
     'availability': 'Wed-Sat 10AM-5PM', 'phone': '555-0006', 'bio': 'Dermatologist for medical and cosmetic skin care.'},
    {'_id': 'doc_007', 'name': 'Dr. Priya Sharma', 'specialty': 'Pediatrics', 'gender': 'female',
     'specialties': ['child', 'infant', 'fever', 'cough', 'vaccination'],
     'qualifications': 'MD, Pediatrics', 'experience_years': 11, 'rating': 4.8,
     'availability': 'Mon-Fri 9AM-4PM', 'phone': '555-0007', 'bio': 'Pediatrician caring for newborns through teens.'},
    {'_id': 'doc_008', 'name': 'Dr. Robert Blake', 'specialty': 'Orthopedics', 'gender': 'male',
     'specialties': ['joint pain', 'back pain', 'fracture', 'muscle', 'knee'],
     'qualifications': 'MD, Orthopedic Surgery', 'experience_years': 16, 'rating': 4.6,
     'availability': 'Tue-Sat 8AM-2PM', 'phone': '555-0008', 'bio': 'Orthopedic surgeon focused on joints and sports injuries.'},
    {'_id': 'doc_009', 'name': 'Dr. Lena Fischer', 'specialty': 'Psychiatry', 'gender': 'female',
     'specialties': ['anxiety', 'depression', 'stress', 'sleep', 'panic'],
     'qualifications': 'MD, Psychiatry', 'experience_years': 13, 'rating': 4.7,
     'availability': 'Mon-Thu 11AM-7PM', 'phone': '555-0009', 'bio': 'Psychiatrist supporting mental and emotional wellbeing.'},
    {'_id': 'doc_010', 'name': 'Dr. Omar Farouk', 'specialty': 'Gastroenterology', 'gender': 'male',
     'specialties': ['stomach', 'nausea', 'diarrhea', 'abdominal pain', 'indigestion'],
     'qualifications': 'MD, Gastroenterology', 'experience_years': 14, 'rating': 4.6,
     'availability': 'Mon-Fri 10AM-5PM', 'phone': '555-0010', 'bio': 'Gastroenterologist for digestive health.'},
    {'_id': 'doc_011', 'name': 'Dr. Grace Lee', 'specialty': 'Pulmonology', 'gender': 'female',
     'specialties': ['cough', 'breathing', 'asthma', 'wheezing', 'shortness of breath'],
     'qualifications': 'MD, Pulmonology', 'experience_years': 10, 'rating': 4.5,
     'availability': 'Wed-Sat 9AM-4PM', 'phone': '555-0011', 'bio': 'Pulmonologist treating lung and airway conditions.'},
    {'_id': 'doc_012', 'name': 'Dr. Daniel Mercer', 'specialty': 'General Practitioner', 'gender': 'male',
     'specialties': ['fever', 'cold', 'flu', 'checkup', 'fatigue', 'headache'],
     'qualifications': 'MD, Family Medicine', 'experience_years': 7, 'rating': 4.7,
     'availability': 'Mon-Fri 8AM-6PM', 'phone': '555-0012', 'bio': 'Approachable family doctor for everyday health needs.'},
]

# Standard weekly slot template (hour of day) for generated availability.
_SLOT_HOURS = [9, 11, 14, 16]
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DB = os.getenv('MONGODB_DB', 'healthcare')
client = None
db = None

MOCK_DOCTORS = SEED_DOCTORS

def connect_mongodb():
    """Connect to MongoDB"""
    global client, db
    try:
        print(f"[DEBUG] Connecting to MongoDB at {MONGODB_URI}")
        client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            retryWrites=False
        )
        client.admin.command('ping')
        db = client[MONGODB_DB]
        print(f"[DEBUG] MongoDB connected successfully to database '{MONGODB_DB}'")
        print(f"[DEBUG] Database object: {db}")
        return True
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        print("[WARNING] Appointment booking disabled. Using mock data instead.")
        return False
def init_collections():
    """Initialize MongoDB collections with sample data"""
    if db is None:
        return False
    try:
        if 'doctors' not in db.list_collection_names():
            db.create_collection('doctors')
            db.doctors.insert_many(SEED_DOCTORS)
            print(f"[DEBUG] Created doctors collection with {len(SEED_DOCTORS)} doctors")
        if 'appointments' not in db.list_collection_names():
            db.create_collection('appointments')
            appointments = []
            for doc in SEED_DOCTORS:
                appointments.extend(_build_slots(doc['_id']))
            db.appointments.insert_many(appointments)
            print(f"[DEBUG] Created appointments collection with {len(appointments)} slots")
        if 'bookings' not in db.list_collection_names():
            db.create_collection('bookings')
            print("[DEBUG] Created bookings collection")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to initialize collections: {e}")
        return False
def find_doctors_by_symptom(symptom):
    """Find doctors relevant to a symptom"""
    if db is None:
        matching = [doc.copy() for doc in MOCK_DOCTORS if any(spec in symptom.lower() for spec in doc.get('specialties', []))]
        return matching[:5]
    try:
        doctors = list(db.doctors.find({
            'specialties': {'$regex': symptom.lower(), '$options': 'i'}
        }).limit(5))
        for doc in doctors:
            doc['_id'] = str(doc['_id'])
        return doctors
    except Exception as e:
        print(f"[ERROR] Error finding doctors: {e}")
        matching = [doc.copy() for doc in MOCK_DOCTORS if any(spec in symptom.lower() for spec in doc.get('specialties', []))]
        return matching[:5]
def get_available_slots(doctor_id, days_ahead=7):
    """Get available appointment slots for a doctor"""
    if db is None:
        print("[ERROR] Database is None in get_available_slots")
        return []
    try:
        now = datetime.now()
        future_date = now + timedelta(days=days_ahead)
        print(f"[DEBUG] Query: doctor={doctor_id}, now={now}, future={future_date}")
        
        slots = list(db.appointments.find({
            'doctor_id': doctor_id,
            'is_available': True,
            'slot_time': {'$gte': now, '$lte': future_date}
        }).sort('slot_time', 1).limit(10))
        
        print(f"[DEBUG] Found {len(slots)} slots")
        for slot in slots:
            slot['_id'] = str(slot['_id'])
            slot['slot_time'] = slot['slot_time'].isoformat()
        return slots
    except Exception as e:
        print(f"[ERROR] Error getting slots: {e}")
        return []
def book_appointment(slot_id, patient_email, patient_phone):
    """Book an appointment slot"""
    if db is None:
        return False
    try:
        from bson.objectid import ObjectId
        result = db.appointments.update_one(
            {'_id': ObjectId(slot_id), 'is_available': True},
            {
                '$set': {
                    'is_available': False,
                    'booked_by': patient_email,
                    'patient_email': patient_email,
                    'patient_phone': patient_phone,
                    'booked_at': datetime.now()
                }
            }
        )
        if result.modified_count > 0:
            db.bookings.insert_one({
                'slot_id': slot_id,
                'patient_email': patient_email,
                'patient_phone': patient_phone,
                'booked_at': datetime.now()
            })
            return True
        return False
    except Exception as e:
        print(f"[ERROR] Error booking appointment: {e}")
        return False
def get_doctor_details(doctor_id):
    """Get detailed info about a doctor"""
    if db is None:
        for doc in MOCK_DOCTORS:
            if doc['_id'] == doctor_id:
                return doc.copy()
        return None
    try:
        doctor = db.doctors.find_one({'_id': doctor_id})
        if doctor:
            doctor['_id'] = str(doctor['_id'])
        return doctor
    except Exception as e:
        print(f"[ERROR] Error getting doctor details: {e}")
        for doc in MOCK_DOCTORS:
            if doc['_id'] == doctor_id:
                return doc.copy()
        return None
def get_all_doctors():
    """Get all doctors for admin panel"""
    if db is None:
        return [doc.copy() for doc in MOCK_DOCTORS]
    try:
        doctors = list(db.doctors.find())
        for doc in doctors:
            doc['_id'] = str(doc['_id'])
        return doctors
    except Exception as e:
        print(f"[ERROR] Error getting doctors: {e}")
        return [doc.copy() for doc in MOCK_DOCTORS]
def update_doctor(doctor_id, update_data):
    """Update doctor information"""
    if db is None:
        return False
    try:
        result = db.doctors.update_one(
            {'_id': doctor_id},
            {'$set': update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"[ERROR] Error updating doctor: {e}")
        return False
def delete_doctor(doctor_id):
    """Delete a doctor and their appointments"""
    if db is None:
        return False
    try:
        db.doctors.delete_one({'_id': doctor_id})
        db.appointments.delete_many({'doctor_id': doctor_id})
        print(f"[DEBUG] Deleted doctor {doctor_id} and their appointments")
        return True
    except Exception as e:
        print(f"[ERROR] Error deleting doctor: {e}")
        return False
def get_all_bookings():
    """Get all bookings with doctor and appointment details"""
    if db is None:
        return []
    try:
        from bson.objectid import ObjectId
        bookings = list(db.bookings.find())
        result = []
        for booking in bookings:
            booking['_id'] = str(booking['_id'])
            booking['slot_id'] = str(booking['slot_id']) if isinstance(booking.get('slot_id'), ObjectId) else booking.get('slot_id')
            try:
                appointment = db.appointments.find_one({'_id': ObjectId(str(booking['slot_id']))})
                if appointment:
                    booking['doctor_id'] = appointment.get('doctor_id')
                    booking['slot_time'] = appointment.get('slot_time').isoformat() if appointment.get('slot_time') else None
                    doctor = db.doctors.find_one({'_id': appointment.get('doctor_id')})
                    if doctor:
                        booking['doctor_name'] = doctor.get('name')
            except:
                pass
            result.append(booking)
        return sorted(result, key=lambda x: x.get('booked_at', ''), reverse=True)
    except Exception as e:
        print(f"[ERROR] Error getting bookings: {e}")
        return []
def get_doctor_stats():
    """Get statistics for each doctor"""
    doctors = get_all_doctors()
    if not doctors:
        return []
    
    stats = []
    try:
        for doctor in doctors:
            doc_id = doctor['_id'] if isinstance(doctor['_id'], str) else str(doctor['_id'])
            if db is not None:
                total_slots = db.appointments.count_documents({'doctor_id': doc_id})
                available_slots = db.appointments.count_documents({
                    'doctor_id': doc_id,
                    'is_available': True
                })
            else:
                total_slots = 28
                available_slots = 28
            booked_slots = total_slots - available_slots
            bookings_count = booked_slots
            stats.append({
                'doctor_id': doc_id,
                'doctor_name': doctor.get('name'),
                'total_slots': total_slots,
                'available_slots': available_slots,
                'booked_slots': booked_slots,
                'bookings_count': bookings_count
            })
        return stats
    except Exception as e:
        print(f"[ERROR] Error getting doctor stats: {e}")
        return []
def cancel_booking(slot_id):
    """Cancel a booking and free up the slot"""
    if db is None:
        return False
    try:
        from bson.objectid import ObjectId
        result = db.appointments.update_one(
            {'_id': ObjectId(str(slot_id))},
            {
                '$set': {
                    'is_available': True,
                    'booked_by': None,
                    'patient_email': None,
                    'patient_phone': None,
                    'booked_at': None
                }
            }
        )
        db.bookings.delete_one({'slot_id': str(slot_id)})
        print(f"[DEBUG] Cancelled booking for slot {slot_id}")
        return result.modified_count > 0
    except Exception as e:
        print(f"[ERROR] Error cancelling booking: {e}")
        return False


# ==========================================================================
# Extended functions for accounts, AI matching, and role dashboards.
# ==========================================================================
def _build_slots(doctor_id, days=7):
    """Generate future open appointment slots for a doctor."""
    base = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now = datetime.now()
    slots = []
    for d in range(days):
        for h in _SLOT_HOURS:
            st = base + timedelta(days=d, hours=h)
            if st <= now:
                continue
            slots.append({
                'doctor_id': doctor_id, 'slot_time': st, 'is_available': True,
                'booked_by': None, 'patient_id': None, 'patient_email': None,
                'patient_phone': None, 'status': 'open', 'created_at': now,
            })
    return slots


def find_matching_doctors(specialties, gender=None, limit=20):
    """Find doctors for the given specialties (optionally filtered by gender)."""
    specialties = [s for s in (specialties or []) if s]
    if db is None:
        results = [d.copy() for d in MOCK_DOCTORS if d.get('specialty') in specialties]
        if gender:
            results = [d for d in results if d.get('gender') == gender]
        if not results:
            results = [d.copy() for d in MOCK_DOCTORS if not gender or d.get('gender') == gender]
        return results[:limit]
    try:
        query = {}
        if specialties:
            query['specialty'] = {'$in': specialties}
        if gender:
            query['gender'] = gender
        docs = list(db.doctors.find(query).limit(limit))
        if not docs and specialties:  # broaden if no specialty match
            q2 = {'gender': gender} if gender else {}
            docs = list(db.doctors.find(q2).limit(limit))
        for d in docs:
            d['_id'] = str(d['_id'])
        return docs
    except Exception as e:
        print(f"[ERROR] find_matching_doctors: {e}")
        return []


def get_earliest_available_slot(doctor_id):
    """Return the soonest available future slot for a doctor, or None."""
    if db is None:
        return None
    try:
        now = datetime.now()
        slot = db.appointments.find_one(
            {'doctor_id': doctor_id, 'is_available': True, 'slot_time': {'$gte': now}},
            sort=[('slot_time', 1)],
        )
        if slot:
            slot['_id'] = str(slot['_id'])
            slot['slot_time'] = slot['slot_time'].isoformat()
        return slot
    except Exception as e:
        print(f"[ERROR] get_earliest_available_slot: {e}")
        return None


def book_slot_for_patient(slot_id, patient_id, email, phone, patient_name=None):
    """Book a slot for a signed-in (or guest) patient. Returns booking info or None."""
    if db is None:
        return None
    from bson.objectid import ObjectId
    try:
        slot = db.appointments.find_one({'_id': ObjectId(slot_id)})
    except Exception:
        slot = None
    if not slot or not slot.get('is_available'):
        return None
    res = db.appointments.update_one(
        {'_id': slot['_id'], 'is_available': True},
        {'$set': {
            'is_available': False, 'status': 'booked', 'booked_by': email,
            'patient_id': patient_id, 'patient_email': email, 'patient_phone': phone,
            'patient_name': patient_name, 'booked_at': datetime.now(),
        }},
    )
    if res.modified_count == 0:
        return None
    doctor = db.doctors.find_one({'_id': slot['doctor_id']})
    booking = {
        'slot_id': str(slot['_id']), 'doctor_id': slot['doctor_id'],
        'doctor_name': doctor.get('name') if doctor else None,
        'patient_id': patient_id, 'patient_email': email, 'patient_phone': phone,
        'patient_name': patient_name, 'slot_time': slot['slot_time'],
        'status': 'booked', 'booked_at': datetime.now(),
    }
    ins = db.bookings.insert_one(booking)
    return {
        'booking_id': str(ins.inserted_id), 'doctor_id': slot['doctor_id'],
        'doctor_name': booking['doctor_name'], 'slot_time': slot['slot_time'].isoformat(),
    }


def _enrich_appointment(appt):
    appt['_id'] = str(appt['_id'])
    if appt.get('slot_time') and not isinstance(appt['slot_time'], str):
        appt['slot_time'] = appt['slot_time'].isoformat()
    for k in ('booked_at', 'created_at'):
        if appt.get(k) and not isinstance(appt[k], str):
            appt[k] = appt[k].isoformat()
    return appt


def get_appointments_for_patient(patient_id):
    """All booked appointments for a patient, newest first, with doctor info."""
    if db is None:
        return []
    try:
        appts = list(db.appointments.find({'patient_id': patient_id, 'status': 'booked'}).sort('slot_time', 1))
        out = []
        for a in appts:
            doctor = db.doctors.find_one({'_id': a.get('doctor_id')})
            a = _enrich_appointment(a)
            if doctor:
                a['doctor_name'] = doctor.get('name')
                a['doctor_specialty'] = doctor.get('specialty')
            out.append(a)
        return out
    except Exception as e:
        print(f"[ERROR] get_appointments_for_patient: {e}")
        return []


def get_appointments_for_doctor(doctor_id):
    """All booked appointments for a doctor, soonest first, with patient info."""
    if db is None:
        return []
    try:
        appts = list(db.appointments.find({'doctor_id': doctor_id, 'status': 'booked'}).sort('slot_time', 1))
        return [_enrich_appointment(a) for a in appts]
    except Exception as e:
        print(f"[ERROR] get_appointments_for_doctor: {e}")
        return []


def create_doctor(data):
    """Insert a new doctor profile + generate a week of slots. Returns the doctor."""
    if db is None:
        return None
    try:
        doc_id = data.get('_id') or ('doc_' + uuid.uuid4().hex[:8])
        doctor = {
            '_id': doc_id,
            'name': data.get('name', 'Dr. Unknown'),
            'specialty': data.get('specialty', 'General Practitioner'),
            'specialties': data.get('specialties', []),
            'gender': data.get('gender'),
            'qualifications': data.get('qualifications', ''),
            'experience_years': int(data.get('experience_years', 0) or 0),
            'rating': float(data.get('rating', 4.5) or 4.5),
            'availability': data.get('availability', 'Mon-Fri 9AM-5PM'),
            'phone': data.get('phone', ''),
            'bio': data.get('bio', ''),
            'user_id': data.get('user_id'),
        }
        db.doctors.insert_one(doctor)
        slots = _build_slots(doc_id)
        if slots:
            db.appointments.insert_many(slots)
        doctor['_id'] = str(doctor['_id'])
        return doctor
    except Exception as e:
        print(f"[ERROR] create_doctor: {e}")
        return None


def get_doctor_by_user(user_id):
    """Find the doctor profile linked to a doctor user account."""
    if db is None:
        return None
    try:
        d = db.doctors.find_one({'user_id': user_id})
        if d:
            d['_id'] = str(d['_id'])
        return d
    except Exception:
        return None


def ensure_indexes():
    """Create helpful indexes (safe to call repeatedly)."""
    if db is None:
        return
    try:
        db.users.create_index('email', unique=True)
        db.appointments.create_index([('doctor_id', 1), ('slot_time', 1)])
        db.appointments.create_index('patient_id')
    except Exception as e:
        print(f"[WARNING] ensure_indexes: {e}")
