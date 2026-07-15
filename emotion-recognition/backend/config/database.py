"""
config/database.py
──────────────────
MySQL database connection using SQLAlchemy + PyMySQL.
All models import `db` from here.
"""

import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()


def init_db(app):
    """Attach SQLAlchemy to the Flask app and create all tables."""
    db_uri = (
        f"mysql+pymysql://{os.getenv('DB_USER', 'root')}:"
        f"{os.getenv('DB_PASSWORD', '')}@"
        f"{os.getenv('DB_HOST', 'localhost')}:"
        f"{os.getenv('DB_PORT', '3306')}/"
        f"{os.getenv('DB_NAME', 'emotisense_db')}"
        f"?charset=utf8mb4"
    )

    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    db.init_app(app)

    with app.app_context():
        db.create_all()           # safe no-op if tables already exist
        print("✅  Database connected and tables ready.")
