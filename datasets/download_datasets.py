"""
Dataset Download & Preprocessing Script
Handles: MPIIGaze, 300-W, CEW, GazeCapture (subset)
"""

import os
import zipfile
import tarfile
import requests
import gdown
import numpy as np
import cv2
from pathlib import Path
from tqdm import tqdm

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "raw"
PROCESSED_DIR = BASE_DIR / "processed"

for d in [DATA_DIR, PROCESSED_DIR]:
    d.mkdir(parents=True, exist_ok=True)


# ─── Dataset Info ────────────────────────────────────────────────────────────

DATASETS = {
    "CEW": {
        "description": "Closed Eyes in the Wild - blink detection",
        "gdrive_id": "1iN5kDFDMDMGQFMFGBxMFJqPBHBFMFGBx",  # placeholder
        "manual_url": "http://parnec.nuaa.edu.cn/datasets/ClosedEyeDatabases.rar",
        "local_dir": DATA_DIR / "CEW",
    },
    "MPIIGaze": {
        "description": "MPIIGaze - gaze estimation dataset",
        "manual_url": "https://www.mpi-inf.mpg.de/departments/computer-vision-and-machine-learning/research/gaze-based-human-computer-interaction/appearance-based-gaze-estimation-in-the-wild",
        "local_dir": DATA_DIR / "MPIIGaze",
    },
    "300W": {
        "description": "300-W facial landmark dataset",
        "manual_url": "https://ibug.doc.ic.ac.uk/resources/300-W/",
        "local_dir": DATA_DIR / "300W",
    },
}


def download_file(url: str, dest: Path, desc: str = "Downloading"):
    """Stream download with progress bar."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    response = requests.get(url, stream=True, timeout=60)
    total = int(response.headers.get("content-length", 0))
    with open(dest, "wb") as f, tqdm(total=total, unit="B", unit_scale=True, desc=desc) as bar:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
            bar.update(len(chunk))


def print_manual_download_instructions():
    """Print instructions for datasets requiring manual download."""
    print("\n" + "="*60)
    print("MANUAL DOWNLOAD REQUIRED FOR SOME DATASETS")
    print("="*60)
    print("""
1. MPIIGaze Dataset:
   URL: https://www.mpi-inf.mpg.de/departments/computer-vision-and-machine-learning/research/gaze-based-human-computer-interaction/appearance-based-gaze-estimation-in-the-wild
   → Download 'MPIIGaze.tar.gz' and place in datasets/raw/MPIIGaze/

2. 300-W Dataset:
   URL: https://ibug.doc.ic.ac.uk/resources/300-W/
   → Download all zip files and place in datasets/raw/300W/

3. CEW Dataset:
   URL: http://parnec.nuaa.edu.cn/datasets/ClosedEyeDatabases.rar
   → Extract and place in datasets/raw/CEW/
   → Should contain: closedLeftEyes/, closedRightEyes/, openLeftEyes/, openRightEyes/

4. GazeCapture (optional, large ~130GB):
   URL: https://gazecapture.csail.mit.edu/
   → Requires registration

After downloading, run: python datasets/preprocess.py
""")


if __name__ == "__main__":
    print_manual_download_instructions()
    # Create placeholder dirs
    for name, info in DATASETS.items():
        info["local_dir"].mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {info['local_dir']}")
    print("\nDirectories created. Please download datasets manually as instructed above.")
