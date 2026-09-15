"""
Calibration & Evaluation Framework
Measures gaze prediction accuracy across all screen regions.
Computes MSE, MAE, and per-region accuracy.
"""

import numpy as np
import cv2
import time
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Tuple
import json

SAVED_DIR = Path(__file__).parent.parent / "saved_models"


@dataclass
class GazeSample:
    target_x: float
    target_y: float
    predicted_x: float
    predicted_y: float
    timestamp: float = field(default_factory=time.time)

    @property
    def error(self) -> float:
        return np.sqrt((self.target_x - self.predicted_x)**2 +
                       (self.target_y - self.predicted_y)**2)

    @property
    def mse(self) -> float:
        return ((self.target_x - self.predicted_x)**2 +
                (self.target_y - self.predicted_y)**2) / 2

    @property
    def mae(self) -> float:
        return (abs(self.target_x - self.predicted_x) +
                abs(self.target_y - self.predicted_y)) / 2


class GazeEvaluator:
    """
    Trajectory-based calibration evaluator.
    Moves a target across the screen and measures prediction accuracy.
    """

    def __init__(self, screen_w: int = 1920, screen_h: int = 1080):
        self.screen_w = screen_w
        self.screen_h = screen_h
        self.samples: List[GazeSample] = []

        # 9-point grid for evaluation
        self.eval_points = self._generate_grid(3, 3)
        # 25-point grid for thorough evaluation
        self.eval_points_full = self._generate_grid(5, 5)

    def _generate_grid(self, cols: int, rows: int) -> List[Tuple[float, float]]:
        """Generate evenly spaced grid points (normalized 0–1)."""
        xs = np.linspace(0.1, 0.9, cols)
        ys = np.linspace(0.1, 0.9, rows)
        return [(x, y) for y in ys for x in xs]

    def add_sample(self, target_x: float, target_y: float,
                   pred_x: float, pred_y: float):
        self.samples.append(GazeSample(target_x, target_y, pred_x, pred_y))

    def compute_metrics(self) -> dict:
        if not self.samples:
            return {}

        errors = [s.error for s in self.samples]
        mses   = [s.mse   for s in self.samples]
        maes   = [s.mae   for s in self.samples]

        # Accuracy: % of predictions within 50px of target
        threshold_px = 50
        within_thresh = sum(1 for e in errors if e <= threshold_px)
        accuracy = within_thresh / len(errors) * 100

        metrics = {
            "n_samples":    len(self.samples),
            "mse":          float(np.mean(mses)),
            "mae":          float(np.mean(maes)),
            "rmse":         float(np.sqrt(np.mean([e**2 for e in errors]))),
            "mean_error_px":float(np.mean(errors)),
            "std_error_px": float(np.std(errors)),
            "max_error_px": float(np.max(errors)),
            "accuracy_50px":float(accuracy),
        }

        # Per-region accuracy (divide screen into 3x3 grid)
        region_metrics = self._per_region_metrics()
        metrics["per_region"] = region_metrics

        return metrics

    def _per_region_metrics(self) -> dict:
        """Compute accuracy per screen region (3x3 grid)."""
        regions = {}
        for i in range(3):
            for j in range(3):
                key = f"region_{i}_{j}"
                x_min, x_max = j / 3, (j + 1) / 3
                y_min, y_max = i / 3, (i + 1) / 3
                region_samples = [
                    s for s in self.samples
                    if x_min <= s.target_x / self.screen_w < x_max
                    and y_min <= s.target_y / self.screen_h < y_max
                ]
                if region_samples:
                    errs = [s.error for s in region_samples]
                    regions[key] = {
                        "n": len(region_samples),
                        "mean_error": float(np.mean(errs)),
                        "accuracy":   float(sum(1 for e in errs if e <= 50) / len(errs) * 100),
                    }
        return regions

    def plot_accuracy_map(self, save_path: str = None):
        """Visualize prediction accuracy across screen regions."""
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))

        # Scatter: targets vs predictions
        ax = axes[0]
        targets = np.array([(s.target_x, s.target_y) for s in self.samples])
        preds   = np.array([(s.predicted_x, s.predicted_y) for s in self.samples])
        errors  = [s.error for s in self.samples]

        sc = ax.scatter(preds[:, 0], preds[:, 1], c=errors,
                        cmap="RdYlGn_r", s=20, alpha=0.6, label="Predicted")
        ax.scatter(targets[:, 0], targets[:, 1], c="blue",
                   marker="+", s=80, label="Target")
        plt.colorbar(sc, ax=ax, label="Error (px)")
        ax.set_xlim(0, self.screen_w)
        ax.set_ylim(self.screen_h, 0)
        ax.set_title("Gaze Prediction Accuracy Map")
        ax.legend()
        ax.set_xlabel("Screen X (px)")
        ax.set_ylabel("Screen Y (px)")

        # Error distribution
        ax2 = axes[1]
        ax2.hist(errors, bins=30, color="#6c63ff", edgecolor="white", alpha=0.8)
        ax2.axvline(np.mean(errors), color="red", linestyle="--", label=f"Mean: {np.mean(errors):.1f}px")
        ax2.axvline(50, color="green", linestyle="--", label="50px threshold")
        ax2.set_title("Error Distribution")
        ax2.set_xlabel("Error (pixels)")
        ax2.set_ylabel("Count")
        ax2.legend()

        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=150)
            print(f"Accuracy map saved: {save_path}")
        plt.show()

    def run_trajectory_evaluation(self, gaze_engine, cap: cv2.VideoCapture,
                                   n_points: int = 9, dwell_time: float = 2.0):
        """
        Interactive evaluation: show target points, collect gaze predictions.
        Requires a running GazeEngine and webcam.
        """
        points = self.eval_points[:n_points]
        print(f"\nStarting trajectory evaluation with {n_points} points...")
        print("Look at each target dot for 2 seconds.")

        for i, (xr, yr) in enumerate(points):
            target_x = int(xr * self.screen_w)
            target_y = int(yr * self.screen_h)
            print(f"Point {i+1}/{n_points}: ({target_x}, {target_y})")

            # Collect samples for dwell_time seconds
            start = time.time()
            point_samples = []
            while time.time() - start < dwell_time:
                ret, frame = cap.read()
                if not ret:
                    continue
                frame = cv2.flip(frame, 1)
                result = gaze_engine.process_frame(frame)
                if result["face_detected"]:
                    point_samples.append((result["gaze_x"], result["gaze_y"]))
                time.sleep(1 / 30)

            if point_samples:
                # Use median prediction for robustness
                pred_x = int(np.median([p[0] for p in point_samples]))
                pred_y = int(np.median([p[1] for p in point_samples]))
                self.add_sample(target_x, target_y, pred_x, pred_y)
                err = np.sqrt((target_x - pred_x)**2 + (target_y - pred_y)**2)
                print(f"  → Predicted: ({pred_x}, {pred_y}), Error: {err:.1f}px")

        metrics = self.compute_metrics()
        print("\n=== Evaluation Results ===")
        for k, v in metrics.items():
            if k != "per_region":
                print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")
        print(f"  Accuracy (≤50px): {metrics.get('accuracy_50px', 0):.1f}%")

        return metrics

    def save_results(self, path: str):
        metrics = self.compute_metrics()
        with open(path, "w") as f:
            json.dump(metrics, f, indent=2)
        print(f"Results saved: {path}")


if __name__ == "__main__":
    # Demo: generate synthetic evaluation data
    evaluator = GazeEvaluator(1920, 1080)
    np.random.seed(42)
    for _ in range(200):
        tx = np.random.uniform(100, 1820)
        ty = np.random.uniform(100, 980)
        # Simulate predictions with ~40px error
        px = tx + np.random.normal(0, 30)
        py = ty + np.random.normal(0, 30)
        evaluator.add_sample(tx, ty, px, py)

    metrics = evaluator.compute_metrics()
    print("Demo Evaluation Metrics:")
    for k, v in metrics.items():
        if k != "per_region":
            print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")

    evaluator.plot_accuracy_map(str(SAVED_DIR / "accuracy_map.png"))
