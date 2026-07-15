"""
ml_model/train_model.py
────────────────────────
Train a CNN on the FER-2013 dataset (or any compatible emotion dataset).

Dataset structure expected:
    data/
      train/
        angry/     *.jpg / *.png
        disgust/
        fear/
        happy/
        sad/
        surprise/
        neutral/
      test/
        (same structure)

Usage:
    python train_model.py --data_dir ./data --epochs 50 --batch_size 64

The trained model is saved to ./weights/emotion_model.h5
"""

import os
import argparse
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix

# ── Constants ──
EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
IMG_SIZE       = 48
NUM_CLASSES    = len(EMOTION_LABELS)


# ──────────────────────────────────────────────────────────────────
#  BUILD CNN MODEL
# ──────────────────────────────────────────────────────────────────
def build_model() -> tf.keras.Model:
    """
    Deep CNN architecture suitable for 48×48 grayscale face images.
    Architecture: 4 conv-blocks → GlobalAvgPool → Dense → Dropout → Softmax
    """
    model = models.Sequential([
        # ── Block 1 ──
        layers.Conv2D(32, (3,3), padding='same', activation='relu',
                      input_shape=(IMG_SIZE, IMG_SIZE, 1)),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3,3), padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2, 2),
        layers.Dropout(0.25),

        # ── Block 2 ──
        layers.Conv2D(64, (3,3), padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3,3), padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2, 2),
        layers.Dropout(0.25),

        # ── Block 3 ──
        layers.Conv2D(128, (3,3), padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3,3), padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2, 2),
        layers.Dropout(0.25),

        # ── Block 4 ──
        layers.Conv2D(256, (3,3), padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2, 2),
        layers.Dropout(0.25),

        # ── Classifier head ──
        layers.GlobalAveragePooling2D(),
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(NUM_CLASSES, activation='softmax'),
    ])

    model.compile(
        optimizer = tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss      = 'categorical_crossentropy',
        metrics   = ['accuracy']
    )

    model.summary()
    return model


# ──────────────────────────────────────────────────────────────────
#  DATA GENERATORS
# ──────────────────────────────────────────────────────────────────
def get_generators(data_dir: str, batch_size: int):
    """Create augmented train and validation ImageDataGenerators."""
    train_datagen = ImageDataGenerator(
        rescale            = 1.0/255,
        rotation_range     = 15,
        width_shift_range  = 0.1,
        height_shift_range = 0.1,
        horizontal_flip    = True,
        zoom_range         = 0.1,
        shear_range        = 0.1,
        fill_mode          = 'nearest',
        validation_split   = 0.15
    )
    val_datagen = ImageDataGenerator(
        rescale          = 1.0/255,
        validation_split = 0.15
    )

    train_gen = train_datagen.flow_from_directory(
        os.path.join(data_dir, 'train'),
        target_size  = (IMG_SIZE, IMG_SIZE),
        color_mode   = 'grayscale',
        class_mode   = 'categorical',
        batch_size   = batch_size,
        subset       = 'training',
        shuffle      = True,
        classes      = [e.lower() for e in EMOTION_LABELS]
    )
    val_gen = val_datagen.flow_from_directory(
        os.path.join(data_dir, 'train'),
        target_size  = (IMG_SIZE, IMG_SIZE),
        color_mode   = 'grayscale',
        class_mode   = 'categorical',
        batch_size   = batch_size,
        subset       = 'validation',
        shuffle      = False,
        classes      = [e.lower() for e in EMOTION_LABELS]
    )
    return train_gen, val_gen


# ──────────────────────────────────────────────────────────────────
#  TRAIN
# ──────────────────────────────────────────────────────────────────
def train(data_dir: str, epochs: int, batch_size: int, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    train_gen, val_gen = get_generators(data_dir, batch_size)
    model              = build_model()

    # ── Callbacks ──
    cb_list = [
        callbacks.ModelCheckpoint(
            os.path.join(output_dir, 'emotion_model_best.h5'),
            monitor='val_accuracy', save_best_only=True, verbose=1
        ),
        callbacks.EarlyStopping(
            monitor='val_loss', patience=10,
            restore_best_weights=True, verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.5,
            patience=5, min_lr=1e-7, verbose=1
        ),
        callbacks.TensorBoard(log_dir=os.path.join(output_dir, 'logs'))
    ]

    # ── Fit ──
    history = model.fit(
        train_gen,
        validation_data = val_gen,
        epochs          = epochs,
        callbacks       = cb_list
    )

    # ── Save final model ──
    final_path = os.path.join(output_dir, 'emotion_model.h5')
    model.save(final_path)
    print(f"\n✅  Model saved → {final_path}")

    # ── Plot training curves ──
    _plot_history(history, output_dir)

    # ── Evaluate on test set if present ──
    test_dir = os.path.join(data_dir, 'test')
    if os.path.isdir(test_dir):
        _evaluate(model, test_dir, batch_size, output_dir)

    return model


# ──────────────────────────────────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────────────────────────────────
def _plot_history(history, out_dir):
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    axes[0].plot(history.history['accuracy'],     label='Train')
    axes[0].plot(history.history['val_accuracy'], label='Val')
    axes[0].set_title('Accuracy'); axes[0].legend()

    axes[1].plot(history.history['loss'],     label='Train')
    axes[1].plot(history.history['val_loss'], label='Val')
    axes[1].set_title('Loss'); axes[1].legend()

    path = os.path.join(out_dir, 'training_curves.png')
    plt.savefig(path); plt.close()
    print(f"📊  Training curves saved → {path}")


def _evaluate(model, test_dir, batch_size, out_dir):
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    test_gen = ImageDataGenerator(rescale=1.0/255).flow_from_directory(
        test_dir,
        target_size = (IMG_SIZE, IMG_SIZE),
        color_mode  = 'grayscale',
        class_mode  = 'categorical',
        batch_size  = batch_size,
        shuffle     = False,
        classes     = [e.lower() for e in EMOTION_LABELS]
    )

    preds  = np.argmax(model.predict(test_gen), axis=1)
    y_true = test_gen.classes

    print("\n── Classification Report ──")
    print(classification_report(y_true, preds, target_names=EMOTION_LABELS))

    cm = confusion_matrix(y_true, preds)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d',
                xticklabels=EMOTION_LABELS, yticklabels=EMOTION_LABELS,
                cmap='Blues')
    plt.title('Confusion Matrix'); plt.tight_layout()
    path = os.path.join(out_dir, 'confusion_matrix.png')
    plt.savefig(path); plt.close()
    print(f"📊  Confusion matrix saved → {path}")


# ──────────────────────────────────────────────────────────────────
#  CLI
# ──────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train EmotiSense CNN')
    parser.add_argument('--data_dir',   default='./data',    help='Dataset root dir')
    parser.add_argument('--epochs',     default=50,  type=int)
    parser.add_argument('--batch_size', default=64,  type=int)
    parser.add_argument('--output_dir', default='./weights', help='Where to save model')
    args = parser.parse_args()

    train(args.data_dir, args.epochs, args.batch_size, args.output_dir)
