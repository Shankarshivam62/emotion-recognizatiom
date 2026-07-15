"""
app.py
──────
EmotiSense Backend — Flask application factory.

Run:
    python app.py
    
Production:
    gunicorn -w 4 -b 0.0.0.0:5000 app:app
"""

import os
from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

# ── Import sub-modules ──
from config.database import init_db
from routes.auth    import auth_bp
from routes.emotion import emotion_bp
from routes.admin   import admin_bp


def create_app() -> Flask:
    app = Flask(__name__)

    # ────────────────────────────────────────
    #  Core config
    # ────────────────────────────────────────
    app.config['SECRET_KEY']              = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY']          = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES']= timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
    )
    app.config['MAX_CONTENT_LENGTH']      = 16 * 1024 * 1024  # 16 MB upload limit

    # ────────────────────────────────────────
    #  Extensions
    # ────────────────────────────────────────
    CORS(app, resources={r'/api/*': {
        'origins': os.getenv('FRONTEND_URL', 'http://localhost:3000'),
        'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allow_headers': ['Content-Type', 'Authorization']
    }})

    JWTManager(app)
    init_db(app)

    # ────────────────────────────────────────
    #  Blueprints
    # ────────────────────────────────────────
    app.register_blueprint(auth_bp,    url_prefix='/api/auth')
    app.register_blueprint(emotion_bp, url_prefix='/api/emotion')
    app.register_blueprint(admin_bp,   url_prefix='/api/admin')

    # ────────────────────────────────────────
    #  Health check
    # ────────────────────────────────────────
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'service': 'EmotiSense API'}), 200

    # ────────────────────────────────────────
    #  Global error handlers
    # ────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    return app


# ── Entry point ──
app = create_app()

if __name__ == '__main__':
    port  = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    print(f"🚀  EmotiSense API running at http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
