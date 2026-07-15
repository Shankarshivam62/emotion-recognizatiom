"""
ml_model/download_pretrained.py
────────────────────────────────
Downloads a pretrained emotion model from GitHub releases
(or any custom URL) so the backend works immediately
without training from scratch.

Usage:
    python download_pretrained.py
"""

import os
import urllib.request

# ── Public URL for a pretrained FER-2013 CNN model ──
# You can replace this with your own hosted model.
MODEL_URL = (
    "https://github.com/omar-sol/emotion_recognition_model/releases/"
    "download/v1.0/emotion_model.h5"
)

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'weights', 'emotion_model.h5')


def download(url: str, dest: str):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest):
        print(f"✅  Model already exists at {dest}. Skipping download.")
        return

    print(f"⬇️  Downloading pretrained model from:\n    {url}")
    print("    This may take a minute …")

    def _progress(block_num, block_size, total_size):
        pct = block_num * block_size / total_size * 100
        bar = '#' * int(pct // 2)
        print(f"\r    [{bar:<50}] {min(pct, 100):.1f}%", end='', flush=True)

    urllib.request.urlretrieve(url, dest, reporthook=_progress)
    print(f"\n✅  Model saved → {dest}")


if __name__ == '__main__':
    download(MODEL_URL, OUTPUT_PATH)
