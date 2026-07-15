"""
routes/admin.py
───────────────
Admin-only routes for user management and system analytics.
All routes require JWT + admin role.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import db
from models.models import User, EmotionRecord, EmotionSession, AdminLog
from functools import wraps

admin_bp = Blueprint('admin', __name__)


# ── Admin role guard decorator ──
def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user    = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin privileges required'}), 403
        return fn(*args, **kwargs)
    return wrapper


def log_admin_action(admin_id, action, target_user=None, details=None):
    """Helper to persist admin audit log."""
    entry = AdminLog(
        admin_id    = admin_id,
        action      = action,
        target_user = target_user,
        details     = details
    )
    db.session.add(entry)


# ────────────────────────────────────────
#  GET /api/admin/users
# ────────────────────────────────────────
@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """List all users with basic stats."""
    users = User.query.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        total = EmotionRecord.query.filter_by(user_id=u.id).count()
        d = u.to_dict()
        d['total_detections'] = total
        result.append(d)
    return jsonify({'users': result, 'total': len(result)}), 200


# ────────────────────────────────────────
#  GET /api/admin/users/<id>
# ────────────────────────────────────────
@admin_bp.route('/users/<int:uid>', methods=['GET'])
@admin_required
def get_user(uid):
    """Get detailed profile + records for a single user."""
    user = User.query.get(uid)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    records  = EmotionRecord.query.filter_by(user_id=uid)\
        .order_by(EmotionRecord.detected_at.desc()).limit(50).all()
    sessions = EmotionSession.query.filter_by(user_id=uid)\
        .order_by(EmotionSession.session_start.desc()).limit(10).all()

    # Emotion distribution
    all_records = EmotionRecord.query.filter_by(user_id=uid).all()
    emotion_counts = {}
    for r in all_records:
        emotion_counts[r.detected_emotion] = \
            emotion_counts.get(r.detected_emotion, 0) + 1

    return jsonify({
        'user':            user.to_dict(),
        'emotion_counts':  emotion_counts,
        'total_detections':len(all_records),
        'recent_records':  [r.to_dict() for r in records],
        'sessions':        [s.to_dict() for s in sessions]
    }), 200


# ────────────────────────────────────────
#  PUT /api/admin/users/<id>/toggle
# ────────────────────────────────────────
@admin_bp.route('/users/<int:uid>/toggle', methods=['PUT'])
@admin_required
def toggle_user(uid):
    """Activate / deactivate a user account."""
    admin_id = int(get_jwt_identity())
    user     = User.query.get(uid)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.is_active = not user.is_active
    action = 'activated' if user.is_active else 'deactivated'
    log_admin_action(admin_id, f'User {action}', target_user=uid)
    db.session.commit()

    return jsonify({
        'message':   f'User {action} successfully',
        'is_active': user.is_active
    }), 200


# ────────────────────────────────────────
#  GET /api/admin/analytics
# ────────────────────────────────────────
@admin_bp.route('/analytics', methods=['GET'])
@admin_required
def analytics():
    """System-wide analytics for admin dashboard."""
    total_users    = User.query.filter_by(role='user').count()
    active_users   = User.query.filter_by(role='user', is_active=True).count()
    total_records  = EmotionRecord.query.count()
    total_sessions = EmotionSession.query.count()

    # Global emotion distribution
    all_records    = EmotionRecord.query.all()
    emotion_counts = {}
    for r in all_records:
        emotion_counts[r.detected_emotion] = \
            emotion_counts.get(r.detected_emotion, 0) + 1

    # Most active users (top 5)
    from sqlalchemy import func
    top_users_q = db.session.query(
        User.id, User.name, User.email,
        func.count(EmotionRecord.id).label('cnt')
    ).join(EmotionRecord, EmotionRecord.user_id == User.id)\
     .group_by(User.id)\
     .order_by(func.count(EmotionRecord.id).desc())\
     .limit(5).all()

    top_users = [
        {'id': r[0], 'name': r[1], 'email': r[2], 'detections': r[3]}
        for r in top_users_q
    ]

    # Recent registrations (last 5)
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()

    return jsonify({
        'total_users':    total_users,
        'active_users':   active_users,
        'total_records':  total_records,
        'total_sessions': total_sessions,
        'emotion_counts': emotion_counts,
        'top_users':      top_users,
        'recent_users':   [u.to_dict() for u in recent_users]
    }), 200


# ────────────────────────────────────────
#  DELETE /api/admin/records/<id>
# ────────────────────────────────────────
@admin_bp.route('/records/<int:rid>', methods=['DELETE'])
@admin_required
def delete_record(rid):
    """Delete a single emotion record."""
    admin_id = int(get_jwt_identity())
    record   = EmotionRecord.query.get(rid)
    if not record:
        return jsonify({'error': 'Record not found'}), 404

    log_admin_action(admin_id, 'Deleted record', details=f'record_id={rid}')
    db.session.delete(record)
    db.session.commit()
    return jsonify({'message': 'Record deleted'}), 200
