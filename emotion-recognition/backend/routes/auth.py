"""
routes/auth.py
──────────────
Authentication routes: register, login, logout, profile.
Uses bcrypt for password hashing and Flask-JWT-Extended for tokens.
"""

import bcrypt
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from config.database import db
from models.models import User

auth_bp = Blueprint('auth', __name__)


# ────────────────────────────────────────
#  POST /api/auth/register
# ────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user account."""
    data = request.get_json()

    # ── Validate required fields ──
    required = ['name', 'email', 'password']
    missing  = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    name     = data['name'].strip()
    email    = data['email'].strip().lower()
    password = data['password']

    # ── Basic validation ──
    if len(name) < 2:
        return jsonify({'error': 'Name must be at least 2 characters'}), 400
    if '@' not in email or '.' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    # ── Check duplicate email ──
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    # ── Hash password ──
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # ── Create user ──
    user = User(
        name          = name,
        email         = email,
        password_hash = hashed.decode('utf-8'),
        role          = 'user'
    )
    db.session.add(user)
    db.session.commit()

    # ── Return token immediately (auto-login after register) ──
    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Registration successful',
        'token':   token,
        'user':    user.to_dict()
    }), 201


# ────────────────────────────────────────
#  POST /api/auth/login
# ────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()

    email    = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    # ── Find user ──
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated. Contact admin.'}), 403

    # ── Verify password ──
    if not bcrypt.checkpw(password.encode('utf-8'),
                          user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401

    # ── Update last login ──
    user.last_login = datetime.utcnow()
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Login successful',
        'token':   token,
        'user':    user.to_dict()
    }), 200


# ────────────────────────────────────────
#  GET /api/auth/profile
# ────────────────────────────────────────
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    """Return current user's profile."""
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


# ────────────────────────────────────────
#  PUT /api/auth/profile
# ────────────────────────────────────────
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update name or password."""
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()

    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password too short'}), 400
        hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        user.password_hash = hashed.decode('utf-8')

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200
