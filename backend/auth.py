"""
Authentication & authorization for Auravia.

- User accounts live in the MongoDB `users` collection with a `role` of
  'patient', 'doctor', or 'admin'.
- Passwords are hashed with werkzeug (PBKDF2); never stored in plain text.
- Sessions are stateless JWTs (PyJWT) sent as `Authorization: Bearer <token>`.
- `@require_auth(role=...)` protects Flask routes and injects the current user.

Falls back gracefully: if MongoDB is unavailable, auth endpoints report a clear
error instead of crashing.
"""

import os
import jwt
import functools
from datetime import datetime, timedelta, timezone

from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

import db as dbmod

JWT_SECRET = os.getenv('JWT_SECRET', 'dev-secret-change-me')
JWT_ALGO = 'HS256'
JWT_TTL_HOURS = int(os.getenv('JWT_TTL_HOURS', '168'))  # 7 days
VALID_ROLES = ('patient', 'doctor', 'admin')


# ---- user store (MongoDB) ------------------------------------------------
def _users():
    """Return the users collection, or None if the DB isn't connected."""
    if dbmod.db is None:
        return None
    return dbmod.db.users


def _serialize_user(u):
    """Public-safe user dict (no password hash)."""
    if not u:
        return None
    return {
        'id': str(u.get('_id')),
        'email': u.get('email'),
        'name': u.get('name'),
        'role': u.get('role'),
        'gender': u.get('gender'),
        'phone': u.get('phone'),
        'doctor_id': u.get('doctor_id'),
        'created_at': u.get('created_at').isoformat() if u.get('created_at') else None,
    }


def find_user_by_email(email):
    users = _users()
    if users is None:
        return None
    return users.find_one({'email': email.strip().lower()})


def find_user_by_id(user_id):
    users = _users()
    if users is None:
        return None
    from bson.objectid import ObjectId
    try:
        return users.find_one({'_id': ObjectId(user_id)})
    except Exception:
        return None


def create_user(email, password, name, role='patient', gender=None, phone=None, doctor_id=None):
    """Create a user. Returns (user_dict, error_message)."""
    users = _users()
    if users is None:
        return None, 'Database unavailable'
    email = email.strip().lower()
    if role not in VALID_ROLES:
        return None, 'Invalid role'
    if find_user_by_email(email):
        return None, 'An account with this email already exists'
    doc = {
        'email': email,
        'password_hash': generate_password_hash(password),
        'name': name.strip() if name else email.split('@')[0],
        'role': role,
        'gender': gender,
        'phone': phone,
        'doctor_id': doctor_id,
        'created_at': datetime.now(timezone.utc),
    }
    res = users.insert_one(doc)
    doc['_id'] = res.inserted_id
    return doc, None


def verify_credentials(email, password):
    """Return the user doc if email+password are valid, else None."""
    user = find_user_by_email(email)
    if not user:
        return None
    if not check_password_hash(user.get('password_hash', ''), password):
        return None
    return user


# ---- JWT -----------------------------------------------------------------
def create_token(user):
    payload = {
        'sub': str(user['_id']),
        'role': user.get('role'),
        'email': user.get('email'),
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_TTL_HOURS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError:
        return None


def _current_user_from_request():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    payload = decode_token(auth[7:].strip())
    if not payload:
        return None
    return find_user_by_id(payload.get('sub'))


def require_auth(role=None):
    """
    Decorator that requires a valid JWT. `role` may be a string or a tuple of
    allowed roles. The resolved user is passed to the view as `current_user`.
    """
    allowed = (role,) if isinstance(role, str) else role

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            if request.method == 'OPTIONS':
                return fn(*args, **kwargs)
            user = _current_user_from_request()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            if allowed and user.get('role') not in allowed:
                return jsonify({'error': 'Forbidden'}), 403
            return fn(*args, current_user=user, **kwargs)
        return wrapper
    return decorator
