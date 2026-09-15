"""
Blink Detection Model — trained on CEW dataset
Input:  64x64x1 grayscale eye image
Output: sigmoid probability → 0 = open, 1 = closed
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
from pathlib import Path
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

PROCESSED_DIR = Path(__file__).parent.parent / "datasets" / "processed" / "CEW"
SAVED_DIR = Path(__file__).parent.parent / "saved_models"
SAVED_DIR.mkdir(exist_ok=True)

IMG_SIZE = 64
BLINK_THRESHOLD = 0.5       # probability threshold
BLINK_DURATION_SEC = 0.8    # seconds eye must be closed to trigger click


def build_blink_model(input_shape=(IMG_SIZE, IMG_SIZE, 1)) -> keras.Model:
    """
    Compact CNN binary classifier: open (0) vs closed (1) eye.
    """
    inputs = keras.Input(shape=input_shape)

    x = layers.Conv2D(32, 3, activation="relu", padding="same")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)

    x = layers.Conv2D(64, 3, activation="relu", padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)

    x = layers.Conv2D(128, 3, activation="relu", padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)

    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(64, activation="relu")(x)
    outputs = layers.Dense(1, activation="sigmoid")(x)

    return keras.Model(inputs, outputs, name="BlinkDetectionModel")


def train(epochs: int = 40, batch_size: int = 32):
    if not (PROCESSED_DIR / "X_train.npy").exists():
        print("Processed data not found. Running preprocessing...")
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent / "datasets"))
        from preprocess import preprocess_cew, save_dataset
        splits = preprocess_cew()
        save_dataset("CEW", *splits)

    X_train = np.load(PROCESSED_DIR / "X_train.npy")
    X_test  = np.load(PROCESSED_DIR / "X_test.npy")
    y_train = np.load(PROCESSED_DIR / "y_train.npy")
    y_test  = np.load(PROCESSED_DIR / "y_test.npy")

    print(f"Train: {X_train.shape} | Test: {X_test.shape}")
    print(f"Class balance — Open: {np.sum(y_train==0)}, Closed: {np.sum(y_train==1)}")

    # Handle class imbalance
    n_open   = np.sum(y_train == 0)
    n_closed = np.sum(y_train == 1)
    total    = n_open + n_closed
    class_weight = {0: total / (2 * n_open), 1: total / (2 * n_closed)}

    model = build_blink_model(input_shape=X_train.shape[1:])
    model.summary()

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy", keras.metrics.AUC(name="auc")]
    )

    # Augmentation for eye images
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rotation_range=5,
        width_shift_range=0.05,
        height_shift_range=0.05,
        brightness_range=[0.7, 1.3],
        zoom_range=0.1,
    )

    cb = [
        callbacks.EarlyStopping(patience=10, restore_best_weights=True, monitor="val_auc", mode="max"),
        callbacks.ReduceLROnPlateau(factor=0.5, patience=5),
        callbacks.ModelCheckpoint(
            str(SAVED_DIR / "blink_detection_best.h5"),
            save_best_only=True, monitor="val_auc", mode="max"
        ),
    ]

    history = model.fit(
        datagen.flow(X_train, y_train, batch_size=batch_size),
        validation_data=(X_test, y_test),
        epochs=epochs,
        steps_per_epoch=len(X_train) // batch_size,
        class_weight=class_weight,
        callbacks=cb,
    )

    # Evaluate
    y_pred_prob = model.predict(X_test).flatten()
    y_pred = (y_pred_prob >= BLINK_THRESHOLD).astype(int)

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Open", "Closed"]))

    acc = np.mean(y_pred == y_test)
    print(f"Test Accuracy: {acc*100:.2f}%")

    model.save(str(SAVED_DIR / "blink_detection_model.h5"))
    print("Model saved.")

    plot_results(history, y_test, y_pred)
    return model, history


def plot_results(history, y_test, y_pred):
    fig, axes = plt.subplots(1, 3, figsize=(15, 4))

    axes[0].plot(history.history["loss"], label="Train")
    axes[0].plot(history.history["val_loss"], label="Val")
    axes[0].set_title("Loss")
    axes[0].legend()

    axes[1].plot(history.history["accuracy"], label="Train")
    axes[1].plot(history.history["val_accuracy"], label="Val")
    axes[1].set_title("Accuracy")
    axes[1].legend()

    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt="d", ax=axes[2],
                xticklabels=["Open", "Closed"],
                yticklabels=["Open", "Closed"])
    axes[2].set_title("Confusion Matrix")

    plt.tight_layout()
    plt.savefig(str(SAVED_DIR / "blink_training.png"))
    plt.close()


class BlinkDetector:
    """
    Real-time blink detector with duration-based click triggering.
    """
    def __init__(self, model_path: str, fps: int = 30,
                 threshold: float = BLINK_THRESHOLD,
                 blink_duration: float = BLINK_DURATION_SEC):
        self.model = keras.models.load_model(model_path)
        self.threshold = threshold
        self.frames_needed = int(fps * blink_duration)
        self.closed_frames = 0
        self.triggered = False

    def process_frame(self, eye_img: np.ndarray) -> dict:
        """
        eye_img: grayscale eye crop (any size, will be resized)
        Returns: {"is_closed": bool, "probability": float, "click_triggered": bool}
        """
        img = cv2.resize(eye_img, (IMG_SIZE, IMG_SIZE))
        img = img.astype(np.float32) / 255.0
        img = img[np.newaxis, ..., np.newaxis]

        prob = float(self.model.predict(img, verbose=0)[0][0])
        is_closed = prob >= self.threshold

        click = False
        if is_closed:
            self.closed_frames += 1
            if self.closed_frames >= self.frames_needed and not self.triggered:
                click = True
                self.triggered = True
        else:
            self.closed_frames = 0
            self.triggered = False

        return {"is_closed": is_closed, "probability": prob, "click_triggered": click}


if __name__ == "__main__":
    train(epochs=40, batch_size=32)
