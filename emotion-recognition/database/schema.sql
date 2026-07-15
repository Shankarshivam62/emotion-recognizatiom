-- ============================================================
--  Emotion Recognition System - MySQL Database Schema
--  Author: EmotiSense Project
--  Run this file once to initialize the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS emotisense_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE emotisense_db;

-- ─────────────────────────────────────────────
--  USERS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    password_hash VARCHAR(255)        NOT NULL,
    role          ENUM('user','admin') DEFAULT 'user',
    avatar_url    VARCHAR(500)        DEFAULT NULL,
    is_active     TINYINT(1)          DEFAULT 1,
    created_at    DATETIME            DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME            DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login    DATETIME            DEFAULT NULL
);

-- ─────────────────────────────────────────────
--  EMOTION SESSIONS TABLE
--  One session = one webcam detection run
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emotion_sessions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT           NOT NULL,
    session_start   DATETIME      DEFAULT CURRENT_TIMESTAMP,
    session_end     DATETIME      DEFAULT NULL,
    total_detections INT          DEFAULT 0,
    dominant_emotion VARCHAR(50)  DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  EMOTION RECORDS TABLE
--  Every single frame-detection result
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emotion_records (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT            NOT NULL,
    session_id       INT            DEFAULT NULL,
    detected_emotion VARCHAR(50)    NOT NULL,
    confidence_score DECIMAL(5,2)   NOT NULL,
    all_scores       JSON           DEFAULT NULL,   -- store full probability vector
    detected_at      DATETIME       DEFAULT CURRENT_TIMESTAMP,
    image_snapshot   LONGTEXT       DEFAULT NULL,   -- optional base64 thumbnail
    FOREIGN KEY (user_id)   REFERENCES users(id)            ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES emotion_sessions(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
--  ADMIN LOGS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    admin_id    INT          NOT NULL,
    action      VARCHAR(255) NOT NULL,
    target_user INT          DEFAULT NULL,
    details     TEXT         DEFAULT NULL,
    logged_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  INDEXES for performance
-- ─────────────────────────────────────────────
CREATE INDEX idx_records_user     ON emotion_records (user_id);
CREATE INDEX idx_records_date     ON emotion_records (detected_at);
CREATE INDEX idx_records_emotion  ON emotion_records (detected_emotion);
CREATE INDEX idx_sessions_user    ON emotion_sessions (user_id);

-- ─────────────────────────────────────────────
--  DEFAULT ADMIN ACCOUNT
--  Password: Admin@123  (bcrypt hash)
-- ─────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role) VALUES
('System Admin',
 'admin@emotisense.com',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oG1VmHyBu',
 'admin');

-- ─────────────────────────────────────────────
--  SAMPLE DEMO USER (password: Demo@123)
-- ─────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role) VALUES
('Demo User',
 'demo@emotisense.com',
 '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWEBhAa',
 'user');

COMMIT;
