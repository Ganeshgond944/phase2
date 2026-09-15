"""
Eye Detection Model — trained on 300-W dataset
Input:  224x224x3 face image
Output: 136 values (68 landmark points × 2 coordinates, normalized 0–1)
Eye landmarks: indices 36–41 (left), 42–47 (right)
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
from pathlib import Path
import matplotlib.pyplot as plt

PROCESSED_DIR = Path(__file__).parent.parent / "datasets" / "processed" / "300W"
SAVED_DIR = Path(__file__).parent.parent / "saved_models"
SAVED_DIR.mkdir(exist_ok=True)

IMG_SIZE = 224
N_LANDMARKS = 68
OUTPUT_DIM = N_LANDMARKS * 2  # 136


def build_eye_detection_model(input_shape=(IMG_SIZE, IMG_SIZE, 3)) -> keras.Model:
    """
    CNN for facial landmark regression.
    Uses MobileNetV2 backbone (pretrained on ImageNet) + regression head.
    """
    base = keras.applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet"
    )
    # Fine-tune top layers only
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    inputs = keras.Input(shape=input_shape)
    x = keras.applications.mobilenet_v2.preprocess_input(inputs * 255.0)
    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(512, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(OUTPUT_DIM, activation="sigmoid")(x)  # sigmoid → [0,1]

    model = keras.Model(inputs, outputs, name="EyeDetectionModel")
    return model


def train(epochs: int = 50, batch_size: int = 32):
    # Load data
    if not (PROCESSED_DIR / "X_train.npy").exists():
        print("Processed data not found. Running preprocessing...")
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent / "datasets"))
        from preprocess import preprocess_300w, save_dataset
        splits = preprocess_300w()
        save_dataset("300W", *splits)

    X_train = np.load(PROCESSED_DIR / "X_train.npy")
    X_test  = np.load(PROCESSED_DIR / "X_test.npy")
    y_train = np.load(PROCESSED_DIR / "y_train.npy")
    y_test  = np.load(PROCESSED_DIR / "y_test.npy")

    print(f"Train: {X_train.shape}, Test: {X_test.shape}")

    model = build_eye_detection_model()
    model.summary()

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-4),
        loss="mse",
        metrics=["mae"]
    )

    cb = [
        callbacks.EarlyStopping(patience=10, restore_best_weights=True, monitor="val_loss"),
        callbacks.ReduceLROnPlateau(factor=0.5, patience=5, min_lr=1e-7),
        callbacks.ModelCheckpoint(
            str(SAVED_DIR / "eye_detection_best.h5"),
            save_best_only=True, monitor="val_loss"
        ),
    ]

    # Data augmentation
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rotation_range=10,
        width_shift_range=0.05,
        height_shift_range=0.05,
        brightness_range=[0.8, 1.2],
        horizontal_flip=False,  # landmarks would need mirroring too
    )

    history = model.fit(
        datagen.flow(X_train, y_train, batch_size=batch_size),
        validation_data=(X_test, y_test),
        epochs=epochs,
        callbacks=cb,
        steps_per_epoch=len(X_train) // batch_size,
    )

    # Evaluate
    loss, mae = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest MSE: {loss:.6f} | Test MAE: {mae:.6f}")

    # Save final model
    model.save(str(SAVED_DIR / "eye_detection_model.h5"))
    print(f"Model saved to {SAVED_DIR / 'eye_detection_model.h5'}")

    plot_history(history)
    return model, history


def plot_history(history):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(history.history["loss"], label="Train Loss")
    axes[0].plot(history.history["val_loss"], label="Val Loss")
    axes[0].set_title("MSE Loss")
    axes[0].legend()
    axes[1].plot(history.history["mae"], label="Train MAE")
    axes[1].plot(history.history["val_mae"], label="Val MAE")
    axes[1].set_title("Mean Absolute Error")
    axes[1].legend()
    plt.tight_layout()
    plt.savefig(str(SAVED_DIR / "eye_detection_training.png"))
    plt.close()
    print("Training plot saved.")


def extract_eye_regions(landmarks_flat: np.ndarray, img: np.ndarray, padding: int = 10):
    """
    Given predicted landmarks (136,) and original image,
    extract left and right eye crops.
    Landmark indices: left eye 36–41, right eye 42–47
    """
    h, w = img.shape[:2]
    pts = landmarks_flat.reshape(68, 2)
    pts[:, 0] *= w
    pts[:, 1] *= h
    pts = pts.astype(int)

    def crop_eye(indices):
        eye_pts = pts[indices]
        x1, y1 = eye_pts.min(axis=0) - padding
        x2, y2 = eye_pts.max(axis=0) + padding
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        return img[y1:y2, x1:x2]

    left_eye  = crop_eye(list(range(36, 42)))
    right_eye = crop_eye(list(range(42, 48)))
    return left_eye, right_eye


if __name__ == "__main__":
    train(epochs=50, batch_size=32)
