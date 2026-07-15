"""
models/models.py
────────────────
SQLAlchemy ORM models for EmotiSense.
"""

import json
from datetime import datetime
from config.database import db


# ────────────────────────────────────────────────────────
#  USER MODEL
# ────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.Enum('user', 'admin'), default='user')
    avatar_url    = db.Column(db.String(500), nullable=True)
    is_active     = db.Column(db.Boolean, default=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow,
                              onupdate=datetime.utcnow)
    last_login    = db.Column(db.DateTime, nullable=True)

    # Relationships
    sessions = db.relationship('EmotionSession', backref='user',
                               lazy=True, cascade='all, delete-orphan')
    records  = db.relationship('EmotionRecord',  backref='user',
                               lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'email':      self.email,
            'role':       self.role,
            'is_active':  self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }

    def __repr__(self):
        return f'<User {self.email}>'


# ────────────────────────────────────────────────────────
#  EMOTION SESSION MODEL
# ────────────────────────────────────────────────────────
class EmotionSession(db.Model):
    __tablename__ = 'emotion_sessions'

    id                = db.Column(db.Integer, primary_key=True)
    user_id           = db.Column(db.Integer, db.ForeignKey('users.id'),
                                  nullable=False)
    session_start     = db.Column(db.DateTime, default=datetime.utcnow)
    session_end       = db.Column(db.DateTime, nullable=True)
    total_detections  = db.Column(db.Integer, default=0)
    dominant_emotion  = db.Column(db.String(50), nullable=True)

    records = db.relationship('EmotionRecord', backref='session',
                              lazy=True, cascade='all, delete-orphan')

    def duration_seconds(self):
        if self.session_end:
            return (self.session_end - self.session_start).seconds
        return None

    def to_dict(self):
        return {
            'id':               self.id,
            'user_id':          self.user_id,
            'session_start':    self.session_start.isoformat() if self.session_start else None,
            'session_end':      self.session_end.isoformat()   if self.session_end   else None,
            'total_detections': self.total_detections,
            'dominant_emotion': self.dominant_emotion,
            'duration_seconds': self.duration_seconds(),
        }


# ────────────────────────────────────────────────────────
#  EMOTION RECORD MODEL
# ────────────────────────────────────────────────────────
class EmotionRecord(db.Model):
    __tablename__ = 'emotion_records'

    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey('users.id'),
                                 nullable=False)
    session_id       = db.Column(db.Integer, db.ForeignKey('emotion_sessions.id'),
                                 nullable=True)
    detected_emotion = db.Column(db.String(50), nullable=False)
    confidence_score = db.Column(db.Numeric(5, 2), nullable=False)
    all_scores       = db.Column(db.JSON, nullable=True)   # full probability dict
    detected_at      = db.Column(db.DateTime, default=datetime.utcnow)
    image_snapshot   = db.Column(db.Text, nullable=True)   # base64 thumbnail

    def to_dict(self):
        return {
            'id':               self.id,
            'user_id':          self.user_id,
            'session_id':       self.session_id,
            'detected_emotion': self.detected_emotion,
            'confidence_score': float(self.confidence_score),
            'all_scores':       self.all_scores,
            'detected_at':      self.detected_at.isoformat() if self.detected_at else None,
        }

    def __repr__(self):
        return f'<EmotionRecord {self.detected_emotion} @ {self.confidence_score}>'


# ────────────────────────────────────────────────────────
#  ADMIN LOG MODEL
# ────────────────────────────────────────────────────────
class AdminLog(db.Model):
    __tablename__ = 'admin_logs'

    id          = db.Column(db.Integer, primary_key=True)
    admin_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action      = db.Column(db.String(255), nullable=False)
    target_user = db.Column(db.Integer, nullable=True)
    details     = db.Column(db.Text, nullable=True)
    logged_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':          self.id,
            'admin_id':    self.admin_id,
            'action':      self.action,
            'target_user': self.target_user,
            'details':     self.details,
            'logged_at':   self.logged_at.isoformat() if self.logged_at else None,
        }
