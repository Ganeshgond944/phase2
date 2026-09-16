"""
System-wide eye control — moves mouse, clicks, opens/closes windows.
Runs as a background thread alongside the gaze engine.
"""
import threading
import time
import subprocess
import os

try:
    import pyautogui
    import pygetwindow as gw
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE    = 0.0   # no delay between actions
    SCREEN_W, SCREEN_H = pyautogui.size()
    DESKTOP_CONTROL_AVAILABLE = True
except Exception as _e:
    pyautogui = None
    gw = None
    SCREEN_W, SCREEN_H = 1920, 1080
    DESKTOP_CONTROL_AVAILABLE = False


class SystemController:
    """
    Controls the PC mouse/windows using gaze coordinates.
    Modes:
      - 'mouse'   : gaze moves mouse cursor
      - 'keyboard': gaze stays in browser keyboard (default)
    """

    def __init__(self):
        self.mode            = "keyboard"   # "keyboard" or "mouse"
        self.mouse_enabled   = False
        self.smooth_factor   = 0.25         # lower = smoother but slower
        self._mouse_x        = SCREEN_W // 2
        self._mouse_y        = SCREEN_H // 2
        self._last_click     = 0.0
        self._click_cooldown = 1.0          # seconds between clicks
        self._dwell_start    = None
        self._dwell_duration = 1.0          # seconds to dwell for click
        self._lock           = threading.Lock()

        # Window gesture state
        self._left_blink_count  = 0
        self._right_blink_count = 0
        self._last_gesture_time = 0.0

    # ── Mouse control ─────────────────────────────────────────────────────────

    def update_gaze(self, gaze_x: int, gaze_y: int):
        """Call every frame with gaze coordinates to move mouse."""
        if not self.mouse_enabled:
            return
        with self._lock:
            # Smooth interpolation
            self._mouse_x += (gaze_x - self._mouse_x) * self.smooth_factor
            self._mouse_y += (gaze_y - self._mouse_y) * self.smooth_factor
            mx = int(max(0, min(SCREEN_W - 1, self._mouse_x)))
            my = int(max(0, min(SCREEN_H - 1, self._mouse_y)))
            try:
                pyautogui.moveTo(mx, my, _pause=False)
            except Exception:
                pass

    def blink_click(self):
        """Perform a left mouse click at current gaze position."""
        if not self.mouse_enabled:
            return
        now = time.time()
        if now - self._last_click < self._click_cooldown:
            return
        self._last_click = now
        try:
            pyautogui.click(_pause=False)
        except Exception:
            pass

    def right_click(self):
        """Right-click at current gaze position."""
        if not self.mouse_enabled:
            return
        try:
            pyautogui.rightClick(_pause=False)
        except Exception:
            pass

    def double_click(self):
        """Double-click (open file/app)."""
        if not self.mouse_enabled:
            return
        try:
            pyautogui.doubleClick(_pause=False)
        except Exception:
            pass

    def scroll(self, direction: str = "down", amount: int = 3):
        """Scroll up or down."""
        if not self.mouse_enabled:
            return
        try:
            pyautogui.scroll(-amount if direction == "down" else amount, _pause=False)
        except Exception:
            pass

    # ── Window control ────────────────────────────────────────────────────────

    def minimize_active_window(self):
        """Minimize the currently focused window."""
        try:
            pyautogui.hotkey("win", "down")
        except Exception:
            pass

    def maximize_active_window(self):
        """Maximize the currently focused window."""
        try:
            pyautogui.hotkey("win", "up")
        except Exception:
            pass

    def close_active_window(self):
        """Close the currently focused window (Alt+F4)."""
        try:
            pyautogui.hotkey("alt", "f4")
        except Exception:
            pass

    def switch_window(self):
        """Alt+Tab to switch windows."""
        try:
            pyautogui.hotkey("alt", "tab")
        except Exception:
            pass

    def show_desktop(self):
        """Win+D to show desktop."""
        try:
            pyautogui.hotkey("win", "d")
        except Exception:
            pass

    def open_app(self, app_name: str):
        """Open an application by name."""
        apps = {
            "notepad":   "notepad.exe",
            "calculator":"calc.exe",
            "browser":   "start chrome",
            "explorer":  "explorer.exe",
            "paint":     "mspaint.exe",
        }
        cmd = apps.get(app_name.lower())
        if cmd:
            try:
                os.system(f"start {cmd}" if not cmd.startswith("start") else cmd)
            except Exception:
                pass

    def list_windows(self) -> list:
        """Return list of open window titles."""
        try:
            return [w.title for w in gw.getAllWindows() if w.title.strip()]
        except Exception:
            return []

    def focus_window(self, title: str):
        """Bring a window to front by title."""
        try:
            wins = gw.getWindowsWithTitle(title)
            if wins:
                wins[0].activate()
        except Exception:
            pass

    # ── Gesture processing ────────────────────────────────────────────────────

    def process_gesture(self, blink: bool, left_blink: bool, right_blink: bool,
                        gaze_x: int, gaze_y: int) -> dict:
        """
        Process blink gestures for system control.
        Returns dict of actions taken.
        """
        actions = {}
        now = time.time()

        if self.mouse_enabled:
            self.update_gaze(gaze_x, gaze_y)

            if blink:
                self.blink_click()
                actions["click"] = True

            if left_blink:
                # Left-only blink = scroll down
                self.scroll("down")
                actions["scroll_down"] = True

            if right_blink:
                # Right-only blink = scroll up
                self.scroll("up")
                actions["scroll_up"] = True

        return actions

    # ── Mode toggle ───────────────────────────────────────────────────────────

    def enable_mouse(self):
        self.mouse_enabled = True
        self.mode = "mouse"
        print("System mouse control ENABLED")

    def disable_mouse(self):
        self.mouse_enabled = False
        self.mode = "keyboard"
        print("System mouse control DISABLED")

    def toggle_mouse(self):
        if self.mouse_enabled:
            self.disable_mouse()
        else:
            self.enable_mouse()
        return self.mouse_enabled


# Global instance
controller = SystemController()
