from pathlib import Path

p = Path(r".\frontend\app.js")
s = p.read_text(encoding="utf-8")

old = '''      gazeVX = Math.max(
        0,
        Math.min(
          window.innerWidth - 1,
          ((normalizedX - 0.5) * GAZE_GAIN_X + 0.5) * window.innerWidth
        )
      );

      gazeVY = Math.max(
        0,
        Math.min(
          window.innerHeight - 1,
          ((normalizedY - 0.5) * GAZE_GAIN_Y + 0.5) * window.innerHeight
        )
      );'''

new = '''      targetGazeVX = Math.max(
        0,
        Math.min(
          window.innerWidth - 1,
          ((normalizedX - 0.5) * GAZE_GAIN_X + 0.5) * window.innerWidth
        )
      );

      targetGazeVY = Math.max(
        0,
        Math.min(
          window.innerHeight - 1,
          ((normalizedY - 0.5) * GAZE_GAIN_Y + 0.5) * window.innerHeight
        )
      );

      if (gazeVX < 0 || gazeVY < 0) {
        gazeVX = targetGazeVX;
        gazeVY = targetGazeVY;
      } else {
        gazeVX += (targetGazeVX - gazeVX) * CURSOR_SMOOTHING;
        gazeVY += (targetGazeVY - gazeVY) * CURSOR_SMOOTHING;
      }'''

if old not in s:
    raise SystemExit("Target cursor code not found. No changes made.")

s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")

print("CURSOR SMOOTHING FIXED")
