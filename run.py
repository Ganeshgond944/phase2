"""
Entry point — starts Flask server and opens browser.
"""

import sys
import os
import threading
import webbrowser
import time
from pathlib import Path

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    print("=" * 50)
    print("  👁 EyeType — Eye-Tracking Keyboard")
    print("=" * 50)
    print("  URL: http://localhost:5000")
    print("=" * 50)

    from backend.app import app, socketio, init_engine
    init_engine()

    def open_browser():
        time.sleep(3)
        import subprocess, shutil
        url = "http://localhost:5000"
        chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        edge   = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        for path in [chrome, edge]:
            if os.path.exists(path):
                subprocess.Popen([path, "--new-window",
                                  "--disable-cache", url])
                print(f"Opened browser: {url}")
                return
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    socketio.run(app, host="0.0.0.0", port=5000,
                 debug=False, use_reloader=False,
                 allow_unsafe_werkzeug=True)
