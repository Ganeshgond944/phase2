"""
Train all 3 models using synthetic data (real datasets not required).
Synthetic data mirrors the structure of 300-W, MPIIGaze, and CEW.
Run: py models/train_all.py
"""

import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from pathlib import Path
from sklearn.model_selection import train_test_split

SAVED_DIR = Path(__file__).parent.parent / "saved_models"
SAVED_DIR.mkdir(exist_ok=True)

print(f"TensorFlow {tf.__version__} | Keras {keras.__version__}")
print(f"Models will be saved to: {SAVED_DIR}\n")


# ─── 1. EYE DETECTION MODEL (300-W style) ────────────────────────────────────
def train_eye_detection(n_samples=2000, epochs=15, batch_size=32):
    print("=" * 50)
    print("[1/3] Training Eye Detection Model (300-W)")
    print("=" * 50)

    # Synthetic: face images → 68 landmark coords (normalized 0-1)
    np.random.seed(42)
    X = np.random.rand(n_samples, 64, 64, 3).astype("float32")
    y = np.random.rand(n_samples, 136).astype("float32")  # 68 pts × 2
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    inputs = keras.Input(shape=(64, 64, 3))
    x = layers.Conv2D(32, 3, activation="relu", padding="same")(inputs)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Conv2D(64, 3, activation="relu", padding="same")(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Conv2D(128, 3, activation="relu", padding="same")(x)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(136, activation="sigmoid")(x)
    model = keras.Model(inputs, outputs, name="EyeDetectionModel")

    model.compile(optimizer=keras.optimizers.Adam(1e-3), loss="mse", metrics=["mae"])

    cb = [
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3, verbose=0),
    ]
    history = model.fit(X_train, y_train, validation_data=(X_test, y_test),
                        epochs=epochs, batch_size=batch_size, callbacks=cb, verbose=1)

    loss, mae = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nEye Detection → MSE: {loss:.6f} | MAE: {mae:.6f}")

    model.save(str(SAVED_DIR / "eye_detection_model.keras"))
    print(f"Saved: eye_detection_model.keras\n")
    return model


# ─── 2. GAZE ESTIMATION MODEL (MPIIGaze style) ───────────────────────────────
def train_gaze_estimation(n_samples=5000, epochs=20, batch_size=64):
    print("=" * 50)
    print("[2/3] Training Gaze Estimation Model (MPIIGaze)")
    print("=" * 50)

    # Synthetic: eye images → (pitch, yaw) gaze angles
    np.random.seed(42)
    X = np.random.rand(n_samples, 36, 60, 1).astype("float32")
    y = np.column_stack([
        np.random.uniform(-0.5, 0.5, n_samples),   # pitch
        np.random.uniform(-0.8, 0.8, n_samples),   # yaw
    ]).astype("float32")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    inputs = keras.Input(shape=(36, 60, 1))
    x = layers.Conv2D(32, 3, activation="relu", padding="same")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Conv2D(64, 3, activation="relu", padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Conv2D(128, 3, activation="relu", padding="same")(x)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(128, activation="relu")(x)
    outputs = layers.Dense(2, name="gaze_angles")(x)
    model = keras.Model(inputs, outputs, name="GazeEstimationModel")

    model.compile(optimizer=keras.optimizers.Adam(1e-3), loss="mse", metrics=["mae"])

    cb = [
        keras.callbacks.EarlyStopping(patience=6, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=4, verbose=0),
    ]
    history = model.fit(X_train, y_train, validation_data=(X_test, y_test),
                        epochs=epochs, batch_size=batch_size, callbacks=cb, verbose=1)

    loss, mae = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nGaze Estimation → MSE: {loss:.6f} | MAE: {mae:.6f} rad ({np.degrees(mae):.2f}°)")

    model.save(str(SAVED_DIR / "gaze_estimation_model.keras"))
    print(f"Saved: gaze_estimation_model.keras\n")
    return model


# ─── 3. BLINK DETECTION MODEL (CEW style) ────────────────────────────────────
def train_blink_detection(n_samples=3000, epochs=20, batch_size=32):
    print("=" * 50)
    print("[3/3] Training Blink Detection Model (CEW)")
    print("=" * 50)

    # Synthetic: eye images → 0=open, 1=closed
    np.random.seed(42)
    X = np.random.rand(n_samples, 64, 64, 1).astype("float32")
    y = np.random.randint(0, 2, n_samples).astype("float32")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    inputs = keras.Input(shape=(64, 64, 1))
    x = layers.Conv2D(32, 3, activation="relu", padding="same")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Conv2D(64, 3, activation="relu", padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Conv2D(128, 3, activation="relu", padding="same")(x)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.5)(x)
    outputs = layers.Dense(1, activation="sigmoid")(x)
    model = keras.Model(inputs, outputs, name="BlinkDetectionModel")

    model.compile(optimizer=keras.optimizers.Adam(1e-3),
                  loss="binary_crossentropy",
                  metrics=["accuracy"])

    cb = [
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3, verbose=0),
    ]
    history = model.fit(X_train, y_train, validation_data=(X_test, y_test),
                        epochs=epochs, batch_size=batch_size, callbacks=cb, verbose=1)

    loss, acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nBlink Detection → Loss: {loss:.4f} | Accuracy: {acc*100:.2f}%")

    model.save(str(SAVED_DIR / "blink_detection_model.keras"))
    print(f"Saved: blink_detection_model.keras\n")
    return model


if __name__ == "__main__":
    train_eye_detection()
    train_gaze_estimation()
    train_blink_detection()
    print("=" * 50)
    print("All 3 models trained and saved to saved_models/")
    print("=" * 50)
