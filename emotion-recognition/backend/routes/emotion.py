"""
routes/emotion.py
─────────────────
Emotion detection API endpoints.
Receives a base64 image frame, runs face detection + CNN model,
returns the predicted emotion and confidence scores.
Also saves results to the database.
"""

import base64
import json
import numpy as np
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config.database import db
from models.models import EmotionRecord, EmotionSession, User
from utils.emotion_engine import EmotionEngine

emotion_bp = Blueprint('emotion', __name__)

# ── Singleton model instance (loaded once at import time) ──
engine = EmotionEngine()


# ────────────────────────────────────────
#  POST /api/emotion/detect
# ────────────────────────────────────────
@emotion_bp.route('/detect', methods=['POST'])
@jwt_required()
def detect_emotion():
    """
    Receive a base64 image, detect face, predict emotion.
    Body: { "image": "<base64>", "session_id": <int|null> }
    """
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    if not data or 'image' not in data:
        return jsonify({'error': 'Image data required'}), 400

    image_b64  = data['image']
    session_id = data.get('session_id')

    # ── Decode base64 frame ──
    try:
        if ',' in image_b64:          # strip data-URL header
            image_b64 = image_b64.split(',')[1]
        img_bytes = base64.b64decode(image_b64)
    except Exception:
        return jsonify({'error': 'Invalid image encoding'}), 400

    # ── Run detection ──
    result = engine.predict(img_bytes)

    if result is None:
        return jsonify({
            'status':  'no_face',
            'message': 'No face detected in frame'
        }), 200

    emotion    = result['emotion']
    confidence = result['confidence']
    all_scores = result['all_scores']

    # ── Save to database ──
    record = EmotionRecord(
        user_id          = user_id,
        session_id       = session_id,
        detected_emotion = emotion,
        confidence_score = round(confidence * 100, 2),
        all_scores       = all_scores,
        detected_at      = datetime.utcnow()
    )
    db.session.add(record)

    # ── Update session total detections ──
    if session_id:
        sess = EmotionSession.query.get(session_id)
        if sess and sess.user_id == user_id:
            sess.total_detections += 1

    db.session.commit()

    return jsonify({
        'status':          'detected',
        'emotion':         emotion,
        'confidence':      round(confidence * 100, 2),
        'all_scores':      all_scores,
        'record_id':       record.id,
        'detected_at':     record.detected_at.isoformat()
    }), 200


# ────────────────────────────────────────
#  POST /api/emotion/session/start
# ────────────────────────────────────────
@emotion_bp.route('/session/start', methods=['POST'])
@jwt_required()
def start_session():
    """Start a new emotion detection session."""
    user_id = int(get_jwt_identity())

    session = EmotionSession(
        user_id       = user_id,
        session_start = datetime.utcnow()
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        'message':    'Session started',
        'session_id': session.id,
        'started_at': session.session_start.isoformat()
    }), 201


# ────────────────────────────────────────
#  POST /api/emotion/session/<id>/end
# ────────────────────────────────────────
@emotion_bp.route('/session/<int:session_id>/end', methods=['POST'])
@jwt_required()
def end_session(session_id):
    """End session and compute dominant emotion."""
    user_id = int(get_jwt_identity())
    session = EmotionSession.query.filter_by(
        id=session_id, user_id=user_id
    ).first()

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    # ── Find dominant emotion from records ──
    records = EmotionRecord.query.filter_by(session_id=session_id).all()
    if records:
        emotion_counts = {}
        for r in records:
            emotion_counts[r.detected_emotion] = \
                emotion_counts.get(r.detected_emotion, 0) + 1
        dominant = max(emotion_counts, key=emotion_counts.get)
        session.dominant_emotion = dominant

    session.session_end      = datetime.utcnow()
    session.total_detections = len(records)
    db.session.commit()

    return jsonify({
        'message':          'Session ended',
        'session':          session.to_dict()
    }), 200


# ────────────────────────────────────────
#  GET /api/emotion/history
# ────────────────────────────────────────
@emotion_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Return paginated emotion history for the logged-in user."""
    user_id = int(get_jwt_identity())
    page    = request.args.get('page',  1,   type=int)
    per_page= request.args.get('limit', 20,  type=int)
    emotion = request.args.get('emotion', None)

    query = EmotionRecord.query.filter_by(user_id=user_id)
    if emotion:
        query = query.filter_by(detected_emotion=emotion)

    query = query.order_by(EmotionRecord.detected_at.desc())
    total   = query.count()
    records = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'total':   total,
        'page':    page,
        'records': [r.to_dict() for r in records]
    }), 200


# ────────────────────────────────────────
#  GET /api/emotion/stats
# ────────────────────────────────────────
@emotion_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Return aggregated stats for charts on the dashboard."""
    user_id = int(get_jwt_identity())

    records = EmotionRecord.query.filter_by(user_id=user_id).all()

    if not records:
        return jsonify({'total': 0, 'emotion_counts': {}, 'timeline': []}), 200

    # ── Emotion distribution ──
    emotion_counts = {}
    for r in records:
        emotion_counts[r.detected_emotion] = \
            emotion_counts.get(r.detected_emotion, 0) + 1

    # ── Average confidence per emotion ──
    confidence_map = {}
    count_map      = {}
    for r in records:
        e = r.detected_emotion
        confidence_map[e] = confidence_map.get(e, 0) + float(r.confidence_score)
        count_map[e]      = count_map.get(e, 0) + 1
    avg_confidence = {
        e: round(confidence_map[e] / count_map[e], 1)
        for e in confidence_map
    }

    # ── Timeline: last 7 days grouped by date ──
    from collections import defaultdict
    timeline = defaultdict(lambda: defaultdict(int))
    for r in records:
        day = r.detected_at.strftime('%Y-%m-%d')
        timeline[day][r.detected_emotion] += 1
    timeline_list = [
        {'date': d, 'emotions': dict(v)}
        for d, v in sorted(timeline.items())[-7:]
    ]

    # ── Recent sessions ──
    sessions = EmotionSession.query.filter_by(user_id=user_id)\
        .order_by(EmotionSession.session_start.desc()).limit(5).all()

    return jsonify({
        'total':           len(records),
        'emotion_counts':  emotion_counts,
        'avg_confidence':  avg_confidence,
        'timeline':        timeline_list,
        'recent_sessions': [s.to_dict() for s in sessions]
    }), 200
