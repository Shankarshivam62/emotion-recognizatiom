"""
utils/emotion_engine.py
────────────────────────
Core ML engine:
  1. Decodes an incoming JPEG/PNG byte string
  2. Detects faces using OpenCV Haar Cascade
  3. Pre-processes the face region (48×48 grayscale)
  4. Runs the Keras CNN model
  5. Returns the top emotion + full probability vector

The class is designed as a lazy singleton — the model is loaded
once and reused for every request.
"""

import os
import cv2
import numpy as np
from io import BytesIO
from PIL import Image

# Emotion labels — must match the order used during model training
EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy',
                  'Sad', 'Surprise', 'Neutral']

# Input size expected by the CNN
IMG_SIZE = 48


class EmotionEngine:
    """Loads the CNN model and Haar Cascade; exposes predict()."""

    def __init__(self):
        self.model       = None
        self.face_cascade = None
        self._load_models()

    # ──────────────────────────────────────────────
    #  Model loading
    # ──────────────────────────────────────────────
    def _load_models(self):
        model_path = os.getenv('MODEL_PATH',
                               './ml_model/weights/emotion_model.h5')
        cascade_path = os.getenv(
            'HAARCASCADE_PATH',
            os.path.join(cv2.data.haarcascades,
                         'haarcascade_frontalface_default.xml')
        )

        # ── Face detector ──
        if os.path.exists(cascade_path):
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            print("✅  Haar Cascade loaded.")
        else:
            # Fallback to OpenCV bundled cascade
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            print("⚠️  Using bundled Haar Cascade.")

        # ── CNN model ──
        if os.path.exists(model_path):
            try:
                from tensorflow.keras.models import load_model
                self.model = load_model(model_path)
                print(f"✅  CNN emotion model loaded from {model_path}")
            except Exception as e:
                print(f"⚠️  Could not load CNN model: {e}")
                print("   Running in DEMO mode (random predictions).")
                self.model = None
        else:
            print(f"ℹ️  Model not found at {model_path}. Using DEMO mode.")
            self.model = None

    # ──────────────────────────────────────────────
    #  Main predict method
    # ──────────────────────────────────────────────
    def predict(self, image_bytes: bytes) -> dict | None:
        """
        Parameters
        ----------
        image_bytes : raw bytes of a JPEG / PNG frame

        Returns
        -------
        dict  with keys: emotion, confidence, all_scores
        None  if no face is detected
        """
        # ── Decode image ──
        try:
            pil_img = Image.open(BytesIO(image_bytes)).convert('RGB')
            frame   = np.array(pil_img)
            # PIL → OpenCV (RGB → BGR)
            frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Image decode error: {e}")
            return None

        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)

        # ── Face detection ──
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor = 1.1,
            minNeighbors = 5,
            minSize      = (30, 30)
        )

        if len(faces) == 0:
            return None

        # ── Use the largest detected face ──
        x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
        roi         = gray[y:y + h, x:x + w]
        roi_resized = cv2.resize(roi, (IMG_SIZE, IMG_SIZE))
        roi_norm    = roi_resized.astype('float32') / 255.0
        roi_input   = np.expand_dims(np.expand_dims(roi_norm, -1), 0)
        # shape: (1, 48, 48, 1)

        # ── Predict ──
        if self.model is not None:
            preds = self.model.predict(roi_input, verbose=0)[0]
        else:
            # Demo mode: simulated softmax output
            preds = self._demo_predict()

        idx        = int(np.argmax(preds))
        emotion    = EMOTION_LABELS[idx]
        confidence = float(preds[idx])

        all_scores = {
            label: round(float(preds[i]) * 100, 2)
            for i, label in enumerate(EMOTION_LABELS)
        }

        return {
            'emotion':    emotion,
            'confidence': confidence,
            'all_scores': all_scores
        }

    # ──────────────────────────────────────────────
    #  Demo mode helper
    # ──────────────────────────────────────────────
    @staticmethod
    def _demo_predict() -> np.ndarray:
        """Return a realistic-looking softmax vector for demo purposes."""
        raw = np.random.dirichlet(np.ones(len(EMOTION_LABELS)) * 0.5)
        return raw.astype('float32')
