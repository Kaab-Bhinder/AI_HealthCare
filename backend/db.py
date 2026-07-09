import os
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DB = os.getenv('MONGODB_DB', 'healthcare')
client = None
db = None

MOCK_DOCTORS = [
    {
        '_id': 'doc_001',
        'name': 'Dr. Sarah Johnson',
        'specialty': 'General Practitioner',
        'specialties': ['headache', 'fever', 'cold', 'cough', 'sore throat'],
        'qualifications': 'MD, Board Certified',
        'experience_years': 10,
        'rating': 4.8,
        'availability': 'Mon-Fri 9AM-5PM',
        'phone': '555-0001'
    },
    {
        '_id': 'doc_002',
        'name': 'Dr. Michael Chen',
        'specialty': 'Internal Medicine',
        'specialties': ['fever', 'diabetes', 'hypertension', 'chest pain'],
        'qualifications': 'MD, Internal Medicine Specialist',
        'experience_years': 15,
        'rating': 4.9,
        'availability': 'Mon-Sat 10AM-6PM',
        'phone': '555-0002'
    },
    {
        '_id': 'doc_003',
        'name': 'Dr. Emily Rodriguez',
        'specialty': 'Neurology',
        'specialties': ['headache', 'migraine', 'dizziness', 'numbness'],
        'qualifications': 'MD, Neurology Specialist',
        'experience_years': 12,
        'rating': 4.7,
        'availability': 'Tue-Fri 2PM-8PM',
        'phone': '555-0003'
    },
    {
        '_id': 'doc_004',
        'name': 'Dr. James Wilson',
        'specialty': 'ENT Specialist',
        'specialties': ['sore throat', 'cough', 'cold', 'sinusitis'],
        'qualifications': 'MD, ENT Specialist',
        'experience_years': 18,
        'rating': 4.6,
        'availability': 'Mon-Thu 8AM-4PM',
        'phone': '555-0004'
    }
]
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
            doctors = [
                {
                    '_id': 'doc_001',
                    'name': 'Dr. Sarah Johnson',
                    'specialty': 'General Practitioner',
                    'specialties': ['headache', 'fever', 'cold', 'cough', 'sore throat'],
                    'qualifications': 'MD, Board Certified',
                    'experience_years': 10,
                    'rating': 4.8,
                    'availability': 'Mon-Fri 9AM-5PM',
                    'phone': '555-0001'
                },
                {
                    '_id': 'doc_002',
                    'name': 'Dr. Michael Chen',
                    'specialty': 'Internal Medicine',
                    'specialties': ['fever', 'diabetes', 'hypertension', 'chest pain'],
                    'qualifications': 'MD, Internal Medicine Specialist',
                    'experience_years': 15,
                    'rating': 4.9,
                    'availability': 'Mon-Sat 10AM-6PM',
                    'phone': '555-0002'
                },
                {
                    '_id': 'doc_003',
                    'name': 'Dr. Emily Rodriguez',
                    'specialty': 'Neurology',
                    'specialties': ['headache', 'migraine', 'dizziness', 'numbness'],
                    'qualifications': 'MD, Neurology Specialist',
                    'experience_years': 12,
                    'rating': 4.7,
                    'availability': 'Tue-Fri 2PM-8PM',
                    'phone': '555-0003'
                },
                {
                    '_id': 'doc_004',
                    'name': 'Dr. James Wilson',
                    'specialty': 'ENT Specialist',
                    'specialties': ['sore throat', 'cough', 'cold', 'sinusitis'],
                    'qualifications': 'MD, ENT Specialist',
                    'experience_years': 18,
                    'rating': 4.6,
                    'availability': 'Mon-Thu 8AM-4PM',
                    'phone': '555-0004'
                }
            ]
            db.doctors.insert_many(doctors)
            print("[DEBUG] Created doctors collection with sample data")
        if 'appointments' not in db.list_collection_names():
            db.create_collection('appointments')
            base_date = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
            appointments = []
            for doc_id in ['doc_001', 'doc_002', 'doc_003', 'doc_004']:
                for day_offset in range(7):
                    for hour in [9, 11, 14, 16]:
                        slot_time = base_date + timedelta(days=day_offset, hours=hour)
                        appointments.append({
                            'doctor_id': doc_id,
                            'slot_time': slot_time,
                            'is_available': True,
                            'booked_by': None,
                            'patient_email': None,
                            'patient_phone': None,
                            'created_at': datetime.now()
                        })
            db.appointments.insert_many(appointments)
            print("[DEBUG] Created appointments collection with sample slots")
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
