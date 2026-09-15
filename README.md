# 👁 EyeType — AI-Driven Eye-Tracking Virtual Keyboard

> Assistive technology for mobility-impaired individuals. Type text and control your PC using only your eyes and blinks — no hands required.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.21-orange)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10-green)
![Flask](https://img.shields.io/badge/Flask-3.x-lightgrey)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎯 What is EyeType?

EyeType is a real-time eye-tracking keyboard that uses a standard webcam to:
- Track where your eyes are looking (gaze estimation)
- Detect intentional blinks (blink detection)
- Type characters on a virtual keyboard
- Control the PC mouse cursor with your gaze
- Open/close windows, click, scroll — all hands-free

**Target users:** People with ALS, quadriplegia, cerebral palsy, or any condition limiting hand mobility.

---

## ✨ Features

| Feature | Description |
|---|---|
| 👁 Gaze Tracking | Real-time iris tracking via MediaPipe |
| 😑 Blink to Type | Hold blink 0.35s to select a key |
| ◑ Left Eye | Left-eye-only blink = Backspace |
| ◐ Right Eye | Right-eye-only blink = Space |
| ⏱ Long Blink | Hold 1.5s = Speak text aloud |
| 💬 Word Prediction | 3 word suggestions as you type |
| 🔊 Text-to-Speech | Reads typed text aloud |
| 💾 Save to File | Saves text to Desktop |
| 🖥️ PC Mouse Control | Gaze moves real mouse cursor |
| ⊕ 9-Point Calibration | Improves gaze accuracy |
| 🔥 Gaze Heatmap | Visualises where you looked |
| 📊 Session Stats | Keys, words, WPM, blinks |
| 🌙 Dark/Light Mode | Toggle theme |
| ⌨️ 3 Keyboard Modes | Letters, Numbers, Emoji |

---

## 🏗️ Architecture

```
Webcam → OpenCV → MediaPipe FaceLandmarker
                        ↓
              478 Face Landmarks
                        ↓
         ┌──────────────┴──────────────┐
         ↓                             ↓
   Iris Position                  EAR Formula
   (landmarks 468, 473)      (6 points per eye)
         ↓                             ↓
   Gaze Coordinates              Blink Detection
         ↓                             ↓
         └──────────────┬──────────────┘
                        ↓
              Flask-SocketIO Server
                        ↓
              Browser (localhost:5000)
                        ↓
              Virtual Keyboard UI
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Webcam
- Windows / Linux / macOS

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/eyetype.git
cd eyetype/eye-tracking-keyboard

# Install dependencies
pip install -r requirements.txt

# Run the project
py run.py
```

Open your browser at **http://localhost:5000**

---

## 📁 Project Structure

```
eye-tracking-keyboard/
├── run.py                      # Entry point
├── requirements.txt            # Python dependencies
├── backend/
│   ├── app.py                  # Flask + SocketIO server
│   ├── gaze_engine.py          # Core: iris tracking + EAR blink detection
│   ├── word_predictor.py       # Word completion suggestions
│   ├── system_control.py       # PC mouse/window control (PyAutoGUI)
│   └── calibration_eval.py    # Calibration accuracy evaluation
├── frontend/
│   ├── index.html              # Dashboard UI
│   ├── style.css               # Professional warm-theme styling
│   ├── keyboard.js             # Virtual keyboard (QWERTY/Numbers/Emoji)
│   └── app.js                  # Frontend logic + SocketIO client
├── models/
│   ├── train_all.py            # Train all 3 CNN models
│   ├── eye_detection_model.py  # 300-W landmark detection CNN
│   ├── gaze_estimation_model.py# MPIIGaze gaze angle CNN
│   └── blink_detection_model.py# CEW open/closed eye CNN
├── datasets/
│   ├── download_datasets.py    # Dataset download instructions
│   └── preprocess.py          # Data preprocessing pipeline
└── saved_models/               # Trained model weights (generate with train_all.py)
```

---

## 🧠 AI Models

### 1. Eye Detection Model (300-W Dataset)
- **Input:** 224×224×3 face image
- **Output:** 136 values (68 landmark coordinates)
- **Architecture:** MobileNetV2 + regression head
- **Loss:** MSE

### 2. Gaze Estimation Model (MPIIGaze Dataset)
- **Input:** 60×36×1 grayscale eye image
- **Output:** (pitch, yaw) gaze angles in radians
- **Architecture:** 3× Conv2D + GlobalAvgPool + Dense
- **Loss:** MSE

### 3. Blink Detection Model (CEW Dataset)
- **Input:** 64×64×1 grayscale eye image
- **Output:** Sigmoid probability (0=open, 1=closed)
- **Architecture:** 3× Conv2D + Dense + Sigmoid
- **Loss:** Binary Cross-Entropy

> **Note:** The primary gaze method uses MediaPipe iris landmarks directly (no CNN needed). The CNN models serve as enhancement layers when real datasets are used.

### Train models (optional)
```bash
py models/train_all.py
```

---

## 🎮 How to Use

| Action | How |
|---|---|
| Start camera | Click ▶ Start Camera |
| Type a key | Look at key → blink and hold ~0.4s |
| Backspace | Blink left eye only |
| Space | Blink right eye only |
| Word suggestion | Look at suggestion → blink |
| Speak text | 🔊 button or hold blink 1.5s |
| PC mouse | Sidebar → 🖥️ PC Control → Enable |
| Calibrate | Sidebar → ⊕ Calibrate |

---

## 🔧 Configuration

Adjust in the UI sidebar:
- **Blink Hold Time:** 0.2s – 1.5s (default 0.35s)
- **Dwell Time:** 0.5s – 4.0s (default 1.0s)
- **EAR Threshold:** 0.10 – 0.40 (auto-calibrated)
- **Text Size:** 0.9 – 2.5rem

---

## 📊 Performance

| Metric | Value |
|---|---|
| Gaze update rate | 30 FPS |
| Cursor latency | <16ms (requestAnimationFrame) |
| EAR calibration | 2 seconds (60 frames) |
| Blink detection accuracy | ~95% (EAR-based) |
| Word prediction | <120ms |

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask, Flask-SocketIO, OpenCV, MediaPipe
- **AI/ML:** TensorFlow 2.21, Keras 3, scikit-learn
- **PC Control:** PyAutoGUI, pygetwindow
- **NLP:** pyspellchecker
- **TTS:** pyttsx3
- **Frontend:** HTML5, CSS3, Vanilla JavaScript, Socket.IO

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Acknowledgements

- [MediaPipe](https://mediapipe.dev/) — Face landmark detection
- [MPIIGaze Dataset](https://www.mpi-inf.mpg.de/) — Gaze estimation research
- [300-W Dataset](https://ibug.doc.ic.ac.uk/resources/300-W/) — Facial landmarks
- [CEW Dataset](http://parnec.nuaa.edu.cn/) — Closed eye detection
