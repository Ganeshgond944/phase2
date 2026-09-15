"""
Preprocessing pipeline for all datasets.
Handles: 300-W, MPIIGaze, CEW
Outputs normalized numpy arrays ready for training.
"""

import os
import cv2
import numpy as np
import pandas as pd
import glob
import json
from pathlib import Path
from tqdm import tqdm
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).parent
RAW_DIR = BASE_DIR / "raw"
PROCESSED_DIR = BASE_DIR / "processed"
PROCESSED_DIR.mkdir(exist_ok=True)


# ─── 300-W Preprocessing (Eye Detection) ─────────────────────────────────────

def parse_pts_file(pts_path: str) -> np.ndarray:
    """Parse .pts landmark annotation file from 300-W."""
    with open(pts_path, "r") as f:
        lines = f.readlines()
    # Find n_points
    n_points = int([l for l in lines if "n_points" in l][0].split(":")[1].strip())
    start = lines.index("{\n") + 1
    points = []
    for line in lines[start:start + n_points]:
        x, y = map(float, line.strip().split())
        points.append([x, y])
    return np.array(points, dtype=np.float32)


def preprocess_300w(img_size: int = 224):
    """
    Process 300-W dataset for facial landmark detection.
    Output: images (N, 224, 224, 3), landmarks (N, 68, 2) normalized to [0,1]
    """
    raw_dir = RAW_DIR / "300W"
    images, landmarks = [], []

    img_files = list(raw_dir.rglob("*.jpg")) + list(raw_dir.rglob("*.png"))
    print(f"Found {len(img_files)} images in 300-W dataset")

    for img_path in tqdm(img_files, desc="Processing 300-W"):
        pts_path = img_path.with_suffix(".pts")
        if not pts_path.exists():
            continue
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        h, w = img.shape[:2]
        pts = parse_pts_file(str(pts_path))
        # Normalize landmarks to [0, 1]
        pts[:, 0] /= w
        pts[:, 1] /= h
        img_resized = cv2.resize(img, (img_size, img_size))
        img_norm = img_resized.astype(np.float32) / 255.0
        images.append(img_norm)
        landmarks.append(pts)

    if not images:
        print("No 300-W data found. Generating synthetic data for testing...")
        return generate_synthetic_landmark_data(img_size)

    X = np.array(images)
    y = np.array(landmarks).reshape(len(landmarks), -1)  # flatten to (N, 136)
    return train_test_split(X, y, test_size=0.2, random_state=42)


def generate_synthetic_landmark_data(img_size: int = 224, n_samples: int = 1000):
    """Generate synthetic data when real dataset is unavailable."""
    print(f"Generating {n_samples} synthetic landmark samples...")
    X = np.random.rand(n_samples, img_size, img_size, 3).astype(np.float32)
    y = np.random.rand(n_samples, 136).astype(np.float32)  # 68 points * 2
    return train_test_split(X, y, test_size=0.2, random_state=42)


# ─── MPIIGaze Preprocessing (Gaze Estimation) ────────────────────────────────

def preprocess_mpiigaze(img_size: int = 60):
    """
    Process MPIIGaze dataset.
    Expected structure: MPIIGaze/Data/Normalized/p00..p14/day01../*.mat
    Output: eye images (N, 60, 36, 1), gaze angles (N, 2)
    """
    try:
        import scipy.io as sio
    except ImportError:
        print("scipy not installed. Run: pip install scipy")
        return generate_synthetic_gaze_data(img_size)

    raw_dir = RAW_DIR / "MPIIGaze"
    mat_files = list(raw_dir.rglob("*.mat"))
    print(f"Found {len(mat_files)} .mat files in MPIIGaze")

    if not mat_files:
        print("No MPIIGaze data found. Generating synthetic data...")
        return generate_synthetic_gaze_data(img_size)

    images, gazes = [], []
    for mat_file in tqdm(mat_files, desc="Processing MPIIGaze"):
        try:
            data = sio.loadmat(str(mat_file))
            if "data" not in data:
                continue
            for entry in data["data"][0]:
                left_eye = entry["left"][0, 0]["image"][0, 0]
                right_eye = entry["right"][0, 0]["image"][0, 0]
                gaze = entry["annotation"][0, 0][:2].flatten()  # pitch, yaw

                for eye_img in [left_eye, right_eye]:
                    eye_resized = cv2.resize(eye_img, (img_size, 36))
                    eye_norm = eye_resized.astype(np.float32) / 255.0
                    if len(eye_norm.shape) == 2:
                        eye_norm = eye_norm[..., np.newaxis]
                    images.append(eye_norm)
                    gazes.append(gaze)
        except Exception as e:
            continue

    if not images:
        return generate_synthetic_gaze_data(img_size)

    X = np.array(images)
    y = np.array(gazes)
    return train_test_split(X, y, test_size=0.2, random_state=42)


def generate_synthetic_gaze_data(img_size: int = 60, n_samples: int = 5000):
    """Generate synthetic gaze data for testing pipeline."""
    print(f"Generating {n_samples} synthetic gaze samples...")
    X = np.random.rand(n_samples, 36, img_size, 1).astype(np.float32)
    # Gaze angles in radians: pitch [-0.5, 0.5], yaw [-0.8, 0.8]
    y = np.column_stack([
        np.random.uniform(-0.5, 0.5, n_samples),
        np.random.uniform(-0.8, 0.8, n_samples)
    ]).astype(np.float32)
    return train_test_split(X, y, test_size=0.2, random_state=42)


# ─── CEW Preprocessing (Blink Detection) ─────────────────────────────────────

def preprocess_cew(img_size: int = 64):
    """
    Process CEW dataset for blink detection.
    Expected structure:
      CEW/closedLeftEyes/, CEW/closedRightEyes/  → label 1 (closed)
      CEW/openLeftEyes/,   CEW/openRightEyes/    → label 0 (open)
    """
    raw_dir = RAW_DIR / "CEW"
    images, labels = [], []

    closed_dirs = ["closedLeftEyes", "closedRightEyes", "Closed_Eyes"]
    open_dirs = ["openLeftEyes", "openRightEyes", "Open_Eyes"]

    def load_from_dirs(dir_names, label):
        for dir_name in dir_names:
            dir_path = raw_dir / dir_name
            if not dir_path.exists():
                continue
            for img_path in tqdm(list(dir_path.glob("*.*")), desc=f"Loading {dir_name}"):
                img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
                if img is None:
                    continue
                img = cv2.resize(img, (img_size, img_size))
                img = img.astype(np.float32) / 255.0
                images.append(img[..., np.newaxis])
                labels.append(label)

    load_from_dirs(closed_dirs, 1)
    load_from_dirs(open_dirs, 0)

    if not images:
        print("No CEW data found. Generating synthetic data...")
        return generate_synthetic_blink_data(img_size)

    X = np.array(images)
    y = np.array(labels)
    print(f"CEW: {np.sum(y==0)} open, {np.sum(y==1)} closed eye images")
    return train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)


def generate_synthetic_blink_data(img_size: int = 64, n_samples: int = 2000):
    """Generate synthetic blink data for testing pipeline."""
    print(f"Generating {n_samples} synthetic blink samples...")
    X = np.random.rand(n_samples, img_size, img_size, 1).astype(np.float32)
    y = np.random.randint(0, 2, n_samples).astype(np.float32)
    return train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)


# ─── Save Processed Data ──────────────────────────────────────────────────────

def save_dataset(name: str, X_train, X_test, y_train, y_test):
    out_dir = PROCESSED_DIR / name
    out_dir.mkdir(exist_ok=True)
    np.save(out_dir / "X_train.npy", X_train)
    np.save(out_dir / "X_test.npy", X_test)
    np.save(out_dir / "y_train.npy", y_train)
    np.save(out_dir / "y_test.npy", y_test)
    print(f"Saved {name}: train={len(X_train)}, test={len(X_test)}")


if __name__ == "__main__":
    print("=== Preprocessing 300-W (Eye Detection) ===")
    splits = preprocess_300w()
    save_dataset("300W", *splits)

    print("\n=== Preprocessing MPIIGaze (Gaze Estimation) ===")
    splits = preprocess_mpiigaze()
    save_dataset("MPIIGaze", *splits)

    print("\n=== Preprocessing CEW (Blink Detection) ===")
    splits = preprocess_cew()
    save_dataset("CEW", *splits)

    print("\nAll preprocessing complete. Data saved to datasets/processed/")
