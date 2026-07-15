# EmotiSense — Emotion Recognition System
### Full-Stack AI Web Application | College Minor Project

---

## 📌 Project Overview

**EmotiSense** is a full-stack web application that uses a **Convolutional Neural Network (CNN)** and **OpenCV** to detect human emotions from live webcam facial expressions. Users can register, log in, run emotion detection sessions, and view detailed history and analytics on a personal dashboard. An admin panel provides system-wide analytics and user management.

---

## 🧠 Technology Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | React 18, React Router, Chart.js        |
| Backend      | Python 3.10+, Flask, Flask-JWT-Extended |
| ML/CV        | TensorFlow/Keras CNN, OpenCV            |
| Database     | MySQL 8.0                               |
| Auth         | JWT tokens, bcrypt password hashing     |
| Styling      | Inline CSS (dark glassmorphism theme)   |

---

## 📁 Project Structure

```
emotion-recognition/
├── backend/
│   ├── app.py                    # Flask app factory + entry point
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment variables template
│   ├── config/
│   │   └── database.py           # SQLAlchemy + MySQL connection
│   ├── models/
│   │   └── models.py             # ORM models (User, EmotionRecord, Session)
│   ├── routes/
│   │   ├── auth.py               # Register, Login, Profile APIs
│   │   ├── emotion.py            # Detect, History, Stats APIs
│   │   └── admin.py              # Admin analytics, user management
│   └── utils/
│       └── emotion_engine.py     # CNN model + OpenCV face detection
│
├── frontend/
│   ├── package.json
│   ├── .env                      # API URL config
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.jsx               # Root component + routing
│       ├── index.js
│       ├── context/
│       │   └── AuthContext.jsx   # Global auth state
│       ├── utils/
│       │   ├── api.js            # Axios instance
│       │   └── emotionUtils.js   # Emotion metadata helpers
│       ├── components/
│       │   ├── Navbar.jsx        # Top navigation bar
│       │   └── ProtectedRoute.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx     # Charts, stats, history overview
│           ├── EmotionDetector.jsx # Live webcam detection
│           ├── History.jsx       # Full paginated history
│           └── AdminDashboard.jsx
│
├── ml_model/
│   ├── train_model.py            # CNN training script (FER-2013)
│   ├── download_pretrained.py    # Download pretrained weights
│   └── weights/                  # emotion_model.h5 goes here
│
└── database/
    └── schema.sql                # MySQL table creation script
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8.0+
- Git

---

### Step 1 — Clone the Repository
```bash
git clone https://github.com/yourname/emotion-recognition.git
cd emotion-recognition
```

---

### Step 2 — MySQL Database Setup
```bash
# Log in to MySQL
mysql -u root -p

# Run the schema file
SOURCE database/schema.sql;

# Verify tables
USE emotisense_db;
SHOW TABLES;
```

---

### Step 3 — Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set DB_PASSWORD to your MySQL root password
```

#### Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=emotisense_db
DB_USER=root
DB_PASSWORD=your_mysql_password
SECRET_KEY=any-random-long-string
JWT_SECRET_KEY=another-random-string
```

---

### Step 4 — Download Pretrained CNN Model
```bash
cd ../ml_model
python download_pretrained.py
# This saves emotion_model.h5 to ml_model/weights/
```

> **OR train your own model** (requires FER-2013 dataset):
> ```bash
> python train_model.py --data_dir ./data --epochs 50
> ```

---

### Step 5 — Run the Backend
```bash
cd ../backend
python app.py
# API runs at: http://localhost:5000
# Test: http://localhost:5000/api/health
```

---

### Step 6 — Frontend Setup
```bash
cd ../frontend
npm install
npm start
# Opens at: http://localhost:3000
```

---

## 🚀 Running the Full Application

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend && source venv/bin/activate && python app.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm start
```

Then open **http://localhost:3000** in your browser.

---

## 👤 Demo Accounts

| Role  | Email                   | Password  |
|-------|-------------------------|-----------|
| Admin | admin@emotisense.com    | Admin@123 |
| User  | demo@emotisense.com     | Demo@123  |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | /api/auth/register    | Create new account   |
| POST   | /api/auth/login       | Login, get JWT token |
| GET    | /api/auth/profile     | Get current user     |
| PUT    | /api/auth/profile     | Update profile       |

### Emotion
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| POST   | /api/emotion/detect              | Detect emotion from image|
| POST   | /api/emotion/session/start       | Start a new session      |
| POST   | /api/emotion/session/:id/end     | End and save session     |
| GET    | /api/emotion/history             | Get detection history    |
| GET    | /api/emotion/stats               | Get analytics data       |

### Admin (Admin JWT required)
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /api/admin/users            | List all users        |
| GET    | /api/admin/users/:id        | Get user details      |
| PUT    | /api/admin/users/:id/toggle | Activate/deactivate   |
| GET    | /api/admin/analytics        | System analytics      |

---

## 🎭 Detected Emotions

| Emotion  | Emoji | Description                  |
|----------|-------|------------------------------|
| Happy    | 😄    | Smiling, joyful expression   |
| Sad      | 😢    | Downturned mouth, droopy eyes|
| Angry    | 😠    | Furrowed brow, tense jaw     |
| Fear     | 😨    | Wide eyes, raised brows      |
| Surprise | 😲    | Raised brows, open mouth     |
| Neutral  | 😐    | No clear expression          |
| Disgust  | 🤢    | Wrinkled nose, raised lip    |

---

## 🧠 CNN Model Architecture

```
Input: 48×48 grayscale face image

Block 1: Conv2D(32) → BN → Conv2D(32) → BN → MaxPool → Dropout(0.25)
Block 2: Conv2D(64) → BN → Conv2D(64) → BN → MaxPool → Dropout(0.25)
Block 3: Conv2D(128) → BN → Conv2D(128) → BN → MaxPool → Dropout(0.25)
Block 4: Conv2D(256) → BN → MaxPool → Dropout(0.25)

Classifier: GlobalAvgPool → Dense(512) → BN → Dropout(0.5)
                          → Dense(256) → Dropout(0.3)
                          → Dense(7, softmax)
```

**Training details:**
- Dataset: FER-2013 (35,887 images, 7 classes)
- Optimizer: Adam (lr=0.001)
- Loss: Categorical Cross-Entropy
- Data augmentation: flips, rotation, zoom, shift
- Callbacks: EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

---

## 🔐 Security Features

- Passwords hashed with **bcrypt** (cost factor 12)
- **JWT tokens** expire after 24 hours
- **Admin role guard** on all admin endpoints
- **CORS** restricted to frontend origin
- **Input validation** on all registration/login fields
- **Account deactivation** by admin without data deletion

---

## 📊 Dashboard Features

- 📈 **Emotion distribution** doughnut chart
- 📊 **Frequency bar chart** per emotion
- 📉 **7-day timeline** line chart (Happy/Sad/Angry/Neutral)
- 📋 **Recent detection table** with confidence bars
- 🏆 **Top emotion** badge
- 🎬 **Session history** with dominant emotion per session

---

## 🏫 Project Submission Notes

This project demonstrates:
1. **Computer Vision** — Real-time face detection with OpenCV Haar Cascade
2. **Deep Learning** — CNN trained on FER-2013 facial expression dataset
3. **Full-Stack Development** — React frontend + Flask REST API backend
4. **Database Design** — Normalized MySQL schema with FK relationships
5. **Authentication** — Secure JWT-based session management
6. **REST API Design** — Proper HTTP methods, status codes, error handling
7. **Data Visualization** — Chart.js doughnut, bar, and line charts
8. **Admin Panel** — Role-based access control and system analytics

---

## 📝 License

MIT License — Free to use for educational purposes.

---

*Built for college minor project submission — EmotiSense v1.0*
