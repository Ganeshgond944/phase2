"""
Gaze Estimation Model — trained on MPIIGaze dataset
Input:  60x36x1 eye image (grayscale)
Output: (pitch, yaw) gaze angles → mapped to screen (x, y)
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
from pathlib import Path
import matplotlib.pyplot as plt

PROCESSED_DIR = Path(__file__).parent.parent / "datasets" / "processed" / "MPIIGaze"
SAVED_DIR = Path(__file__).parent.parent / "saved_models"
SAVED_DIR.mkdir(exist_ok=True)

EYE_W, EYE_H = 60, 36


def build_gaze_model(input_shape=(EYE_H, EYE_W, 1)) -> keras.Model:
    """
    Lightweight CNN for gaze angle regression.
    Outputs (pitch, yaw) in radians.
    """
    inputs = keras.Input(shape=input_shape, name="eye_input")

    x = layers.Conv2D(32, (3, 3), activation="relu", padding="same")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2, 2)(x)

    x = layers.Conv2D(64, (3, 3), activation="relu", padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2, 2)(x)

    x = layers.Conv2D(128, (3, 3), activation="relu", padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2, 2)(x)

    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(2, name="gaze_angles")(x)  # pitch, yaw (unbounded)

    return keras.Model(inputs, outputs, name="GazeEstimationModel")


def build_dual_eye_model() -> keras.Model:
    """
    Dual-eye model: takes both left and right eye images.
    Better accuracy than single-eye model.
    """
    eye_input_shape = (EYE_H, EYE_W, 1)

    left_input  = keras.Input(shape=eye_input_shape, name="left_eye")
    right_input = keras.Input(shape=eye_input_shape, name="right_eye")

    def eye_branch(name):
        return keras.Sequential([
            layers.Conv2D(32, 3, activation="relu", padding="same"),
            layers.BatchNormalization(),
            layers.MaxPooling2D(2),
            layers.Conv2D(64, 3, activation="relu", padding="same"),
            layers.BatchNormalization(),
            layers.MaxPooling2D(2),
            layers.Conv2D(128, 3, activation="relu", padding="same"),
            layers.GlobalAveragePooling2D(),
            layers.Dense(128, activation="relu"),
        ], name=name)

    left_branch  = eye_branch("left_branch")
    right_branch = eye_branch("right_branch")

    left_feat  = left_branch(left_input)
    right_feat = right_branch(right_input)

    merged = layers.Concatenate()([left_feat, right_feat])
    x = layers.Dense(256, activation="relu")(merged)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(128, activation="relu")(x)
    outputs = layers.Dense(2, name="gaze_angles")(x)

    return keras.Model(inputs=[left_input, right_input], outputs=outputs, name="DualEyeGazeModel")


def gaze_to_screen(pitch: float, yaw: float,
                   screen_w: int = 1920, screen_h: int = 1080) -> tuple:
    """
    Convert gaze angles (radians) to screen pixel coordinates.
    Uses linear mapping calibrated to typical webcam FOV.
    """
    # Typical webcam FOV: ~60° horizontal, ~40° vertical
    fov_h = np.radians(60)
    fov_v = np.radians(40)

    # Normalize angles to [0, 1]
    x_norm = (yaw   + fov_h / 2) / fov_h
    y_norm = (pitch + fov_v / 2) / fov_v

    x_norm = np.clip(x_norm, 0, 1)
    y_norm = np.clip(y_norm, 0, 1)

    return int(x_norm * screen_w), int(y_norm * screen_h)


def train(epochs: int = 60, batch_size: int = 64):
    if not (PROCESSED_DIR / "X_train.npy").exists():
        print("Processed data not found. Running preprocessing...")
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent / "datasets"))
        from preprocess import preprocess_mpiigaze, save_dataset
        splits = preprocess_mpiigaze()
        save_dataset("MPIIGaze", *splits)

    X_train = np.load(PROCESSED_DIR / "X_train.npy")
    X_test  = np.load(PROCESSED_DIR / "X_test.npy")
    y_train = np.load(PROCESSED_DIR / "y_train.npy")
    y_test  = np.load(PROCESSED_DIR / "y_test.npy")

    print(f"Train: {X_train.shape}, Test: {X_test.shape}")
    print(f"Gaze range — pitch: [{y_train[:,0].min():.3f}, {y_train[:,0].max():.3f}], "
          f"yaw: [{y_train[:,1].min():.3f}, {y_train[:,1].max():.3f}]")

    model = build_gaze_model(input_shape=X_train.shape[1:])
    model.summary()

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="mse",
        metrics=["mae"]
    )

    cb = [
        callbacks.EarlyStopping(patience=12, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(factor=0.5, patience=6, min_lr=1e-7),
        callbacks.ModelCheckpoint(
            str(SAVED_DIR / "gaze_estimation_best.h5"),
            save_best_only=True, monitor="val_loss"
        ),
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=cb,
    )

    loss, mae = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest MSE: {loss:.6f} | Test MAE: {mae:.6f} rad")

    # Convert MAE to degrees for interpretability
    mae_deg = np.degrees(mae)
    print(f"Test MAE: {mae_deg:.2f}°")

    model.save(str(SAVED_DIR / "gaze_estimation_model.h5"))
    print(f"Model saved.")

    plot_history(history)
    return model, history


def plot_history(history):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(history.history["loss"], label="Train")
    axes[0].plot(history.history["val_loss"], label="Val")
    axes[0].set_title("Gaze MSE Loss")
    axes[0].legend()
    axes[1].plot(history.history["mae"], label="Train")
    axes[1].plot(history.history["val_mae"], label="Val")
    axes[1].set_title("Gaze MAE (radians)")
    axes[1].legend()
    plt.tight_layout()
    plt.savefig(str(SAVED_DIR / "gaze_training.png"))
    plt.close()


if __name__ == "__main__":
    train(epochs=60, batch_size=64)
