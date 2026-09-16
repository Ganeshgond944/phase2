/**
 * EyeType Ã¢â‚¬â€ Full featured eye-tracking keyboard.
 */
let SERVER = localStorage.getItem("eyetype_server_url") || (window.location.hostname.endsWith("vercel.app") ? "" : window.location.origin);

// Ã¢â€â‚¬Ã¢â€â‚¬ State Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
let socket        = null;
let typedText     = "";
let isStreaming   = false;
let isCalibrating = false;
let calPointIdx   = 0;
let lastPitch     = 0;
let lastYaw       = 0;
let gazeVX        = -100;
let gazeVY        = -100;
let targetGazeVX  = -100;
let targetGazeVY  = -100;
const CURSOR_SMOOTHING = 0.24;
let predictions   = ["","",""];
let phrases       = [];
let keyHistory    = [];
let _frameCount   = 0;
let _longBlinkStart = null;
let _longBlinkTriggered = false;
let _lastSpeakTime = 0;
let _earReady     = false;

const CAL_POINTS = [
  [.1,.1],[.5,.1],[.9,.1],
  [.1,.5],[.5,.5],[.9,.5],
  [.1,.9],[.5,.9],[.9,.9],
];

// Ã¢â€â‚¬Ã¢â€â‚¬ DOM Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const $connLabel    = document.getElementById("conn-label");
const $earPill      = document.getElementById("ear-badge");
const $earLabel     = document.getElementById("ear-label");
const $earDotEl     = document.getElementById("ear-dot");
const $textOut      = document.getElementById("text-output");
const $btnStart     = document.getElementById("btn-start");
const $btnStop      = document.getElementById("btn-stop");
const $btnCal       = document.getElementById("nav-calibrate");
const $btnPhrases   = document.getElementById("nav-phrases");
const $btnTheme     = document.getElementById("btn-theme");
const $btnClearText = document.getElementById("btn-clear-text");
const $btnUndoWord  = document.getElementById("btn-undo-word");
const $btnCopy      = document.getElementById("btn-copy");
const $btnPaste     = document.getElementById("btn-paste");

const $btnVoice = document.getElementById("btn-voice");

let voiceRecognition = null;
let voiceListening = false;

function startVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast("Speech recognition is not supported in this browser");
    return;
  }

  if (voiceListening) {
    if (voiceRecognition) voiceRecognition.stop();
    return;
  }

  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = false;

  const languageSelect = document.getElementById("language-select");
  const selectedLanguage = languageSelect ? languageSelect.value : "english";

  const voiceLanguages = {
    english: "en-IN",
    kannada: "kn-IN",
    telugu: "te-IN",
    hindi: "hi-IN",
    tamil: "ta-IN",
    malayalam: "ml-IN"
  };

  voiceRecognition.lang = voiceLanguages[selectedLanguage] || "en-IN";

  voiceRecognition.onstart = () => {
    voiceListening = true;
    if ($btnVoice) {
      $btnVoice.classList.add("accent-btn");
      $btnVoice.title = "Stop speaking";
    }
    showToast("Listening...");
  };

  voiceRecognition.onresult = (event) => {
    let spokenText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        spokenText += event.results[i][0].transcript;
      }
    }

    spokenText = spokenText.trim();

    if (spokenText) {
      if (typedText && !typedText.endsWith(" ")) {
        typedText += " ";
      }

      typedText += spokenText;
      updateTextDisplay();
      updatePredictions();
      showToast("Speech typed");
    }
  };

  voiceRecognition.onerror = (event) => {
    console.log("Speech recognition error:", event.error);

    if (event.error === "not-allowed") {
      showToast("Microphone permission denied");
    } else if (event.error === "no-speech") {
      showToast("No speech detected");
    } else {
      showToast("Speech recognition error");
    }
  };

  voiceRecognition.onend = () => {
    voiceListening = false;

    if ($btnVoice) {
      $btnVoice.classList.remove("accent-btn");
      $btnVoice.title = "Speak to type";
    }
  };

  voiceRecognition.start();
}
const $btnSaveText  = document.getElementById("btn-save-text");
const $btnSpeakText = document.getElementById("btn-speak-text");
const $btnHeatmap   = document.getElementById("btn-heatmap");
const $btnResetHeat = document.getElementById("btn-reset-heatmap");
const $btnResetStat = document.getElementById("btn-reset-stats");
const $camFeed      = document.getElementById("camera-feed");
const $noCam        = document.getElementById("no-camera");
const $camBlink     = document.getElementById("cam-blink-overlay");
const $cursor       = document.getElementById("gaze-cursor");
const $blinkFlash   = document.getElementById("blink-flash");
const $toast        = document.getElementById("toast");
const $calOverlay   = document.getElementById("calibration-overlay");
const $calDot       = document.getElementById("cal-dot");
const $calProg      = document.getElementById("cal-progress");
const $calFill      = document.getElementById("cal-progress-fill");
const $phrasesPanel = document.getElementById("phrases-panel");
const $phrasesList  = document.getElementById("phrases-list");
const $blinkSlider  = document.getElementById("blink-slider");
const $blinkVal     = document.getElementById("blink-val");
const $dwellSlider  = document.getElementById("dwell-slider");
const $dwellVal     = document.getElementById("dwell-val");
const $earSlider    = document.getElementById("ear-slider");
const $earVal       = document.getElementById("ear-val");
const $fontSlider   = document.getElementById("font-slider");
const $fontVal      = document.getElementById("font-val");
const $fixLog       = document.getElementById("fixation-log");
const $heatCanvas   = document.getElementById("heatmap-canvas");
const $predBtns     = document.querySelectorAll(".pred-btn");
const $keyHistory   = document.getElementById("key-history");
const $warmup       = document.getElementById("warmup-banner");
const $blinkArcSvg  = document.getElementById("blink-arc-svg");
const $blinkArc     = document.getElementById("blink-arc");
const $camStatusDot = document.getElementById("cam-status-dot");

// Ã¢â€â‚¬Ã¢â€â‚¬ Cursor animation loop Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
(function loop() {
  $cursor.style.left = gazeVX + "px";
  $cursor.style.top  = gazeVY + "px";
  requestAnimationFrame(loop);
})();

// Ã¢â€â‚¬Ã¢â€â‚¬ Keyboard Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// ── Language management & shortcuts ─────────────────────────────────────────
const LANGUAGES = [
  { code: "english",   name: "English",   native: "English",  voice: "en-IN" },
  { code: "kannada",   name: "Kannada",   native: "ಕನ್ನಡ",    voice: "kn-IN" },
  { code: "telugu",    name: "Telugu",    native: "తెలుగు",   voice: "te-IN" },
  { code: "hindi",     name: "Hindi",     native: "हिन्दी",    voice: "hi-IN" },
  { code: "tamil",     name: "Tamil",     native: "தமிழ்",    voice: "ta-IN" },
  { code: "malayalam", name: "Malayalam", native: "മലയാളം",  voice: "ml-IN" }
];

function setLanguage(langCode, showNotification = true) {
  const select = document.getElementById("language-select");
  const langObj = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];

  if (select && select.value !== langObj.code) {
    select.value = langObj.code;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const btn = document.getElementById("language-gaze-button");
  if (btn && btn.childNodes[0]) {
    btn.childNodes[0].nodeValue = langObj.native + " ";
  }

  if (typeof voiceRecognition !== "undefined" && voiceRecognition) {
    voiceRecognition.lang = langObj.voice;
  }

  if (typeof keyboard !== "undefined" && keyboard && keyboard.setLanguage) {
    keyboard.setLanguage(langObj.code);
  }

  if (typeof updatePredictions === "function") {
    updatePredictions();
  }

  if (showNotification) {
    showToast(`🌐 Language: ${langObj.name} (${langObj.native}) [Alt+L]`);
  }
}

function cycleLanguage(showNotification = true) {
  const select = document.getElementById("language-select");
  const current = (select ? select.value : (typeof keyboard !== "undefined" && keyboard ? keyboard.language : "english")) || "english";
  const currentIndex = LANGUAGES.findIndex(l => l.code === current);
  const nextIndex = (currentIndex + 1) % LANGUAGES.length;
  const nextLang = LANGUAGES[nextIndex];
  setLanguage(nextLang.code, showNotification);
  return nextLang;
}

const keyboard = new VirtualKeyboard("keyboard", handleKeyAction);

async function handleKeyAction(action) {
  if (action === 'lang') {
    cycleLanguage();
    return;
  }
  if (action === 'paste') {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        typedText += clip;
        updateTextDisplay();
        updatePredictions();
        showToast('Text pasted');
      }
    } catch (e) {
      showToast('Clipboard access denied');
    }
    return;
  }

  let isSpace = false;
  if      (action === "clear")     { typedText = ""; keyHistory = []; }
  else if (action === "backspace") { typedText = typedText.slice(0,-1); }
  else if (action === "enter")     { typedText += "\n"; }
  else if (action === "space")     { typedText += " "; isSpace = true; }
  else                             { typedText += action; addKeyHistory(action); }

  updateTextDisplay();
  updatePredictions();
  playClick();

  fetch(`${SERVER}/api/stats/key`,{
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({is_space: isSpace}),
  }).catch(()=>{});
}

function addKeyHistory(ch) {
  keyHistory.push(ch);
  if (keyHistory.length > 8) keyHistory.shift();
  $keyHistory.innerHTML = keyHistory
    .map(c => `<span>${c === " " ? "Ã‚Â·" : c}</span>`).join("");
}

function updateTextDisplay() {
  $textOut.textContent = typedText;
  $textOut.scrollTop   = $textOut.scrollHeight;
  $textOut.classList.toggle("has-text", typedText.length > 0);
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Keyboard mode tabs Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
document.querySelectorAll(".mode-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    keyboard.setMode(tab.dataset.mode);
  });
});

// ?? Gaze control for keyboard mode tabs ??????????????????????????????????????
let _modeGazeHovered = null;
let _modeGazeTimer = null;

function updateModeTabGaze(vx, vy) {
  let target = null;

  document.querySelectorAll(".mode-tab").forEach(tab => {
    const r = tab.getBoundingClientRect();
    const over =
      vx >= r.left && vx <= r.right &&
      vy >= r.top  && vy <= r.bottom;

    tab.classList.toggle("gaze-hover", over);

    if (over) target = tab;
  });

  if (target === _modeGazeHovered) return;

  if (_modeGazeTimer) {
    clearTimeout(_modeGazeTimer);
    _modeGazeTimer = null;
  }

  _modeGazeHovered = target;

  if (!target) return;

  _modeGazeTimer = setTimeout(() => {
    if (_modeGazeHovered === target) {
      document.querySelectorAll(".mode-tab").forEach(t => {
        t.classList.remove("active");
      });

      target.classList.add("active");
      keyboard.setMode(target.dataset.mode);
    }

    _modeGazeTimer = null;
  }, keyboard.dwellDuration);
}

// Sidebar gaze control
let _sidebarHovered = null;
let _sidebarDwellTimer = null;

function updateSidebarGaze(vx, vy) {
  const languageMenu = document.getElementById("language-gaze-menu");
  const languageButton = document.getElementById("language-gaze-button");

  const menuOpen =
    languageMenu &&
    languageMenu.style.display !== "none";

  const items = document.querySelectorAll(
    '[id^="nav-"], #language-gaze-button, .language-option, #btn-theme'
  );

  let target = null;

  items.forEach(item => {
    const r = item.getBoundingClientRect();

    const over =
      vx >= r.left && vx <= r.right &&
      vy >= r.top  && vy <= r.bottom;

    item.classList.toggle("gaze-hover", over);

    if (over) target = item;
  });

  if (target === _sidebarHovered) return;

  if (_sidebarDwellTimer) {
    clearTimeout(_sidebarDwellTimer);
    _sidebarDwellTimer = null;
  }

  _sidebarHovered = target;

  if (!target) return;

  _sidebarDwellTimer = setTimeout(() => {
    if (_sidebarHovered === target) {

      target.classList.add("gaze-selected");
      setTimeout(() => target.classList.remove("gaze-selected"), 260);

      if (target.id === "language-gaze-button") {
        languageMenu.style.display =
          languageMenu.style.display === "none" ? "block" : "none";

      } else if (target.classList.contains("language-option")) {
        const language = target.getAttribute("data-language");
        if (language) {
          setLanguage(language);
        }
        languageMenu.style.display = "none";
      } else {
        target.click();
      }
    }

    _sidebarDwellTimer = null;
  }, keyboard.dwellDuration);
}

// ── Language selector click & shortcut handlers ─────────────────────────────
const $langGazeBtn = document.getElementById("language-gaze-button");
const $langGazeMenu = document.getElementById("language-gaze-menu");

if ($langGazeBtn && $langGazeMenu) {
  $langGazeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    $langGazeMenu.style.display = $langGazeMenu.style.display === "none" ? "block" : "none";
  });

  document.querySelectorAll(".language-option").forEach(opt => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const language = opt.getAttribute("data-language");
      if (language) {
        setLanguage(language);
      }
      $langGazeMenu.style.display = "none";
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#language-gaze-selector")) {
      $langGazeMenu.style.display = "none";
    }
  });
}

// Global hotkey: Alt + L to cycle languages
window.addEventListener("keydown", (e) => {
  if (
    (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "l" || e.key === "L" || e.code === "KeyL")) ||
    (e.altKey && e.ctrlKey && (e.key === "l" || e.key === "L" || e.code === "KeyL"))
  ) {
    e.preventDefault();
    cycleLanguage();
  }
});



// Ã¢â€â‚¬Ã¢â€â‚¬ Word predictions Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
let _predTimer = null;
function updatePredictions() {
  clearTimeout(_predTimer);
  _predTimer = setTimeout(async () => {
    try {
      const res  = await fetch(`${SERVER}/api/predict`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({text: typedText, language: document.getElementById("language-select")?.value || "english"}),
      });
      const data = await res.json();
      predictions = data.suggestions || ["","",""];
      $predBtns.forEach((btn,i) => {
        btn.textContent = predictions[i] || "";
        btn.title       = predictions[i] || "";
      });
    } catch(e) {}
  }, 120);
}

$predBtns.forEach((btn,i) => btn.addEventListener("click", () => applyPrediction(i)));

function applyPrediction(idx) {
  const word = predictions[idx];
  if (!word) return;
  const parts = typedText.split(/(\s+)/);
  if (parts.length > 0 && !/\s/.test(parts[parts.length-1]))
    parts[parts.length-1] = word;
  else parts.push(word);
  typedText = parts.join("") + " ";
  updateTextDisplay();
  updatePredictions();
  playClick();
}

// Ã¢â€ â‚¬Ã¢â€ â‚¬ Socket Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬
function initSocket() {
  if (!SERVER) {
    setStatus("disconnected", "Set Backend URL");
    return;
  }
  try {
    socket = io(SERVER, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 20
    });
  } catch (err) {
    console.error("Socket init error:", err);
    setStatus("disconnected", "Init Error");
    return;
  }

  socket.on("connect", () => { console.log("SOCKET CONNECTED:", socket.id);
    setStatus("connected","Connected");
    fetch(`${SERVER}/api/screen_size`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({width:screen.width, height:screen.height}),
    }).catch(()=>{});
  });

  socket.on("disconnect", () => {
    setStatus("disconnected","Disconnected");
    isStreaming = false;
    $btnStart.disabled = false;
    $btnStop.disabled  = true;
  });

  socket.on("connect_error", () => setStatus("disconnected","No Server"));
  socket.on("camera_ready",  () => { $noCam.style.display = "none"; });
  socket.on("camera_stopped",() => {
    $camFeed.classList.remove("active");
    $noCam.style.display = "";
    $noCam.textContent   = "Camera stopped";
  });

  socket.on("frame", data => {
    $camFeed.src = "data:image/jpeg;base64," + data.data;
    $camFeed.style.display = "block";
    $noCam.style.display   = "none";
    $camFeed.classList.add("active");
  });

  socket.on("gaze", data => {
    if (!isStreaming) return;
    _frameCount++;

    // Eyes ready indicator
    if (data.ear_ready && !_earReady) {
      _earReady = true;
      if ($earPill)  $earPill.className  = "ear-badge ready";
      if ($earLabel) $earLabel.textContent = "Eyes Ready ✓";
      $warmup.classList.add("hidden");
    }

    if (!data.face) {
      if (_frameCount % 20 === 0)
        document.getElementById("stat-face").textContent = "✗";
      return;
    }

    // Map gaze Ã¢â€ â€™ viewport
    // Expand gaze range so cursor can reach the full page.
      const GAZE_GAIN_X = 1.8;
      const GAZE_GAIN_Y = 1.8;

      const normalizedX = data.x / screen.width;
      const normalizedY = data.y / screen.height;

      targetGazeVX = Math.max(
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
        const dx = targetGazeVX - gazeVX;
        const dy = targetGazeVY - gazeVY;
        const distance = Math.hypot(dx, dy);
        const adaptiveSmoothing = distance > 120 ? 0.28 : distance > 60 ? 0.20 : CURSOR_SMOOTHING;
        gazeVX += dx * adaptiveSmoothing;
        gazeVY += dy * adaptiveSmoothing;
      }
    $cursor.style.display = "block";

    // Keyboard + prediction hover
    keyboard.updateGaze(gazeVX, gazeVY);
          updateSidebarGaze(gazeVX, gazeVY);
      updateUniversalGaze(gazeVX, gazeVY);
updateModeTabGaze(gazeVX, gazeVY);
    updatePredHover(gazeVX, gazeVY);
    updatePhraseHover(gazeVX, gazeVY);

    // Blink progress arc
    updateBlinkArc(data.blink_prob);

    // Stats every 20 frames
    if (_frameCount % 20 === 0) {
      document.getElementById("stat-lear").textContent  = data.left_ear.toFixed(3);
      document.getElementById("stat-rear").textContent  = data.right_ear.toFixed(3);
      document.getElementById("stat-blink").textContent = (data.blink_prob*100).toFixed(0)+"%";
      document.getElementById("stat-gx").textContent    = data.x;
      document.getElementById("stat-gy").textContent    = data.y;
      document.getElementById("stat-face").textContent  = "✓";
    }

    lastPitch = data.pitch || 0;
    lastYaw   = data.yaw   || 0;

    // Long blink (1.5s) Ã¢â€ â€™ speak text
    if (data.blink_prob > 0.8) {
      if (!_longBlinkStart) _longBlinkStart = Date.now();
      if (!_longBlinkTriggered && (Date.now() - _longBlinkStart > 1500)) {
        speakText();
        _longBlinkTriggered = true;
      }
    } else {
      _longBlinkStart = null;
      _longBlinkTriggered = false;
    }

    // Both-eye blink Ã¢â€ â€™ type key
    if (data.blink) {
      const predIdx = getHoveredPrediction();
      const phraseIdx = getHoveredPhrase();
      if (predIdx >= 0)   applyPrediction(predIdx);
      else if (phraseIdx >= 0) applyPhrase(phraseIdx);
      else                keyboard.triggerBlink();
      showBlinkFlash();
      showCamBlink();
      if (isCalibrating) recordCalPoint();
    }

    // Left-eye-only blink Ã¢â€ â€™ backspace
    if (false) {
      handleKeyAction("backspace");
      showToast("Ã¢â€ Â Backspace");
    }

    // Right-eye-only blink Ã¢â€ â€™ space
    if (data.right_blink) {
      handleKeyAction("space");
      showToast("Space Ã¢â€ â€™");
    }
  });

  socket.on("error", data => {
    $noCam.textContent   = "Ã¢Å¡Â  " + data.message;
    $noCam.style.display = "";
  });
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Blink arc Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function updateBlinkArc(prob) {
  if (prob > 0.3) {
    $blinkArcSvg.classList.remove("hidden");
    const circumference = 163;
    const offset = circumference * (1 - prob);
    $blinkArc.style.strokeDashoffset = offset;
  } else {
    $blinkArcSvg.classList.add("hidden");
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Camera Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
let clientStream   = null;
let clientInterval = null;

async function startCamera() {
  if (!SERVER) {
    alert("Please enter your Backend Server URL in Settings and click Connect.");
    return;
  }
  try {
    setStatus("streaming","Startingâ€¦");
    isStreaming        = true;
    $btnStart.disabled = true;
    $btnStop.disabled  = false;
    setStatus("streaming","Streaming");
    $noCam.textContent = "Opening cameraâ€¦";
    if ($camStatusDot) $camStatusDot.className = "cam-status-dot live";

    const clientVideo  = document.getElementById("client-webcam");
    const clientCanvas = document.getElementById("client-canvas");
    let usingClientCam = false;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        clientStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
        });
        if (clientVideo && clientStream) {
          clientVideo.srcObject = clientStream;
          await clientVideo.play();
          usingClientCam = true;
          startClientStreamingLoop(clientVideo, clientCanvas);
        }
      } catch (camErr) {
        console.warn("Browser webcam fallback to server:", camErr);
      }
    }

    if (!usingClientCam) {
      await fetch(`${SERVER}/api/start`,{method:"POST"});
    }

    $warmup.classList.remove("hidden");
    setTimeout(() => $warmup.classList.add("hidden"), 4000);
  } catch(e) {
    setStatus("disconnected","Error");
    alert("Cannot reach server at " + (SERVER || "backend URL"));
    isStreaming        = false;
    $btnStart.disabled = false;
    $btnStop.disabled  = true;
  }
}

function startClientStreamingLoop(videoEl, canvasEl) {
  if (clientInterval) clearInterval(clientInterval);
  if (!videoEl || !canvasEl) return;
  const ctx = canvasEl.getContext("2d");
  canvasEl.width  = 640;
  canvasEl.height = 480;

  clientInterval = setInterval(() => {
    if (!isStreaming || !socket || !socket.connected) return;
    if (videoEl.readyState >= 2) {
      ctx.drawImage(videoEl, 0, 0, 640, 480);
      const frameData = canvasEl.toDataURL("image/jpeg", 0.5);
      socket.emit("client_frame", { data: frameData, flip: true });
    }
  }, 66);
}

async function stopCamera() {
  if (clientInterval) {
    clearInterval(clientInterval);
    clientInterval = null;
  }
  if (clientStream) {
    clientStream.getTracks().forEach(track => track.stop());
    clientStream = null;
  }
  if (SERVER) {
    await fetch(`${SERVER}/api/stop`,{method:"POST"}).catch(()=>{});
  }
  isStreaming        = false;
  $btnStart.disabled = false;
  $btnStop.disabled  = true;
  $cursor.style.display = "none";
  if ($camStatusDot) $camStatusDot.className = "cam-status-dot";
  $camFeed.classList.remove("active");
  $noCam.style.display = "";
  $noCam.textContent   = "Camera stopped";
  setStatus("connected","Connected");
}

$btnStart.addEventListener("click", startCamera);
$btnStop.addEventListener("click",  stopCamera);

// Sidebar nav
document.getElementById("nav-calibrate").addEventListener("click", () => {
  calPointIdx = 0; isCalibrating = true;
  $calOverlay.classList.remove("hidden");
  fetch(`${SERVER}/api/calibrate/reset`,{method:"POST"}).catch(()=>{});
  showCalPoint();
});
document.getElementById("nav-phrases").addEventListener("click", openPhrases);
document.getElementById("nav-heatmap").addEventListener("click", () => {
  const panel = document.getElementById("heatmap-panel");
  if (panel) panel.scrollIntoView({behavior:"smooth", block:"start"});
  fetchHeatmap();
});
document.getElementById("nav-settings").addEventListener("click", () => {
  const p = document.getElementById("settings-panel");
  if (p) p.scrollIntoView({behavior:"smooth", block:"start"});
});
document.getElementById("nav-sysctl").addEventListener("click", openSysCtl);

// Eye Mouse
let _eyeMouseRunning = false;
document.getElementById("nav-eyemouse").addEventListener("click", async () => {
  if (!_eyeMouseRunning) {
    try {
      const res  = await fetch(`${SERVER}/api/eye_mouse/start`, {method:"POST"});
      const data = await res.json();
      _eyeMouseRunning = true;
      document.getElementById("nav-eyemouse").style.color = "var(--accent2)";
      document.getElementById("nav-eyemouse").querySelector("span:last-child").textContent = "Eye Mouse Ã¢Å“â€œ";
      showToast("Ã°Å¸â€“Â±Ã¯Â¸Â  Eye Mouse started! Blink to click.");
    } catch(e) { showToast("Failed to start Eye Mouse"); }
  } else {
    try {
      await fetch(`${SERVER}/api/eye_mouse/stop`, {method:"POST"});
      _eyeMouseRunning = false;
      document.getElementById("nav-eyemouse").style.color = "";
      document.getElementById("nav-eyemouse").querySelector("span:last-child").textContent = "Eye Mouse";
      showToast("Ã°Å¸â€“Â±Ã¯Â¸Â  Eye Mouse stopped.");
    } catch(e) {}
  }
});

// Ã¢â€â‚¬Ã¢â€â‚¬ Text actions Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
$btnClearText.addEventListener("click", () => {
  typedText = ""; keyHistory = [];
  updateTextDisplay(); updatePredictions();
  $keyHistory.innerHTML = "";
});

$btnUndoWord.addEventListener("click", undoLastWord);
function undoLastWord() {
  // Remove trailing spaces then last word
  typedText = typedText.replace(/\s*\S+\s*$/, "");
  updateTextDisplay(); updatePredictions();
}

$btnCopy.addEventListener("click",      copyText);
$btnPaste.addEventListener("click",     pasteText);

$btnSpeakText.addEventListener("click", speakText);

async function pasteText() {
  try {
    const clip = await navigator.clipboard.readText();
    if (!clip) return;
    typedText += clip;
    updateTextDisplay();
    updatePredictions();
    showToast("Pasted!");
  } catch (e) {
    showToast("Clipboard access denied");
  }
}

function copyText() {
  if (!typedText.trim()) return;
  navigator.clipboard.writeText(typedText)
    .then(() => showToast("Ã°Å¸â€œâ€¹ Copied!"))
    .catch(() => {
      const ta = document.createElement("textarea");
      ta.value = typedText;
      document.body.appendChild(ta);
      ta.select(); document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Ã°Å¸â€œâ€¹ Copied!");
    });
}

async function saveText() {
  if (!typedText.trim()) return;
  try {
    const res  = await fetch(`${SERVER}/api/save_text`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({text: typedText}),
    });
    const data = await res.json();
    showToast(data.status === "saved" ? "Ã°Å¸â€™Â¾ Saved to Desktop!" : "Save failed");
  } catch(e) { showToast("Save error"); }
}

async function speakText() {
  const text = typedText.trim();
  if (!text) return;

  const now = Date.now();
  if (now - _lastSpeakTime < 800) return; // Prevent duplicate rapid triggers
  _lastSpeakTime = now;

  const lang = (document.getElementById("language-select") ? document.getElementById("language-select").value : "english").toLowerCase();

  showToast("🔊 Speaking…");

  // Single audio channel: Send to backend /api/speak (unified Google TTS tone for all languages)
  if (SERVER) {
    try {
      await fetch(`${SERVER}/api/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang }),
      });
      return; // Handled exclusively by server, do NOT play in browser!
    } catch (err) {
      console.warn("Backend TTS failed, falling back to browser Web Speech:", err);
    }
  }

  // Fallback to browser SpeechSynthesis ONLY if backend is completely unreachable
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = {
        english: 'en-IN',
        kannada: 'kn-IN',
        telugu: 'te-IN',
        hindi: 'hi-IN',
        tamil: 'ta-IN',
        malayalam: 'ml-IN'
      };
      utterance.lang = langMap[lang] || 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (speechErr) {
      console.warn("Browser speech synthesis error:", speechErr);
    }
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Sliders Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
$blinkSlider.addEventListener("input", () => {
  $blinkVal.textContent = parseFloat($blinkSlider.value).toFixed(2);
  sendThreshold();
});
$dwellSlider.addEventListener("input", () => {
  const v = parseFloat($dwellSlider.value);
  $dwellVal.textContent = v.toFixed(1);
  keyboard.setDwellDuration(v * 1000);
});
$earSlider.addEventListener("input", () => {
  $earVal.textContent = parseFloat($earSlider.value).toFixed(2);
  sendThreshold();
});
$fontSlider.addEventListener("input", () => {
  const v = parseFloat($fontSlider.value);
  $fontVal.textContent = v.toFixed(1);
  $textOut.style.fontSize = v + "rem";
});

function sendThreshold() {
  fetch(`${SERVER}/api/blink_threshold`,{
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      duration:      parseFloat($blinkSlider.value),
      ear_threshold: parseFloat($earSlider.value),
    }),
  }).catch(()=>{});
}

// Ã¢â€ â‚¬Ã¢â€ â‚¬ Theme Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬
function initTheme() {
  const saved = localStorage.getItem("eyetype_theme") || "dark";
  if (saved === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
  updateThemeUI();
}

function updateThemeUI() {
  const isDark = document.body.classList.contains("dark");
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.textContent = isDark ? "☀️" : "🌙";
  } else if ($btnTheme) {
    $btnTheme.textContent = isDark ? "☀️" : "🌙";
  }
  if ($btnTheme) {
    $btnTheme.title = isDark ? "Switch to light mode" : "Switch to dark mode";
  }
}

if ($btnTheme) {
  $btnTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("eyetype_theme", isDark ? "dark" : "light");
    updateThemeUI();
    showToast(isDark ? "🌙 Dark mode enabled" : "☀️ Light mode enabled");
  });
}

initTheme();

// Ã¢â€ â‚¬Ã¢â€ â‚¬ System Control Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬Ã¢â€ â‚¬
const $sysctlPanel = document.getElementById("sysctl-panel");
const $mouseToggle = document.getElementById("btn-mouse-toggle");
const $mouseBadge  = document.getElementById("mouse-status-badge");
let   mouseEnabled = false;

async function openSysCtl() {
  $sysctlPanel.classList.remove("hidden");
  await refreshWindows();
}

document.getElementById("btn-close-sysctl").addEventListener("click", () => {
  $sysctlPanel.classList.add("hidden");
});

$mouseToggle.addEventListener("click", async () => {
  const res  = await fetch(`${SERVER}/api/system/mouse/toggle`, {method:"POST"}).catch(()=>null);
  if (!res) return;
  const data = await res.json();
  mouseEnabled = data.mouse_enabled;
  updateMouseBadge();
  showToast(mouseEnabled ? "Ã°Å¸â€“Â¥ Eye Mouse ON Ã¢â‚¬â€ blink to click!" : "Ã°Å¸â€“Â¥ Eye Mouse OFF");
});

function updateMouseBadge() {
  $mouseBadge.textContent = mouseEnabled ? "Ã¢â€”Â Mouse ON" : "Ã¢â€”Â Mouse OFF";
  $mouseBadge.className   = "mouse-badge " + (mouseEnabled ? "on" : "off");
  $mouseToggle.textContent = mouseEnabled ? "Disable" : "Enable";
  $mouseToggle.className   = "pill-btn " + (mouseEnabled ? "pill-red" : "pill-green");
}

// Window action buttons
document.querySelectorAll(".sysctl-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const action = btn.dataset.action;
    await fetch(`${SERVER}/api/system/window/${action}`, {method:"POST"}).catch(()=>{});
    showToast(`Ã¢Å“â€œ ${btn.textContent.trim()}`);
  });
});

// App open buttons
document.querySelectorAll(".sysctl-app-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    await fetch(`${SERVER}/api/system/open`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({app: btn.dataset.app}),
    }).catch(()=>{});
    showToast(`Opening ${btn.textContent.trim()}Ã¢â‚¬Â¦`);
  });
});

// Refresh windows list
document.getElementById("btn-refresh-windows").addEventListener("click", refreshWindows);

async function refreshWindows() {
  try {
    const res  = await fetch(`${SERVER}/api/system/windows`);
    const data = await res.json();
    const list = document.getElementById("windows-list");
    list.innerHTML = data.windows.slice(0, 15).map(w =>
      `<div class="window-item" title="${w}">${w}</div>`
    ).join("");
    list.querySelectorAll(".window-item").forEach(item => {
      item.addEventListener("click", async () => {
        await fetch(`${SERVER}/api/system/focus`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({title: item.title}),
        }).catch(()=>{});
        showToast(`Focused: ${item.textContent}`);
      });
    });
  } catch(e) {}
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Calibration Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function showCalPoint() {
  if (calPointIdx >= CAL_POINTS.length) { finishCalibration(); return; }
  const [xr,yr] = CAL_POINTS[calPointIdx];
  $calDot.style.left = (xr*100)+"%";
  $calDot.style.top  = (yr*100)+"%";
  $calProg.textContent = `Point ${calPointIdx+1} / ${CAL_POINTS.length}`;
}

function recordCalPoint() {
  const [xr,yr] = CAL_POINTS[calPointIdx];
  fetch(`${SERVER}/api/calibrate/add`,{
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      screen_x: Math.round(xr*screen.width),
      screen_y: Math.round(yr*screen.height),
      pitch: lastPitch, yaw: lastYaw,
    }),
  }).catch(()=>{});
  calPointIdx++;
  showCalPoint();
}

async function finishCalibration() {
  isCalibrating = false;
  $calOverlay.classList.add("hidden");
  try {
    const res  = await fetch(`${SERVER}/api/calibrate/compute`,{method:"POST"});
    const data = await res.json();
    document.getElementById("stat-cal").textContent = data.calibrated ? "Yes Ã¢Å“â€œ" : "Failed";
    showToast(data.calibrated ? "Ã¢Å â€¢ Calibrated!" : "Calibration failed");
  } catch(e) {}
}

document.getElementById("btn-skip-cal").addEventListener("click", () => {
  isCalibrating = false;
  $calOverlay.classList.add("hidden");
});

document.addEventListener("keydown", e => {
  if (isCalibrating && (e.code==="Space"||e.code==="Enter")) {
    e.preventDefault(); recordCalPoint();
  }
});

// Ã¢â€â‚¬Ã¢â€â‚¬ Phrases Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
$btnPhrases.addEventListener("click", openPhrases);
document.getElementById("btn-close-phrases").addEventListener("click", () => {
  $phrasesPanel.classList.add("hidden");
});

async function openPhrases() {
  try {
    const res  = await fetch(`${SERVER}/api/phrases`);
    const data = await res.json();
    phrases = data.phrases || [];
    renderPhrases();
    $phrasesPanel.classList.remove("hidden");
  } catch(e) {}
}

function renderPhrases() {
  $phrasesList.innerHTML = phrases.map((p,i) =>
    `<button class="phrase-item" data-idx="${i}">${p}</button>`
  ).join("");
  $phrasesList.querySelectorAll(".phrase-item").forEach(btn => {
    btn.addEventListener("click", () => {
      typedText += (typedText && !typedText.endsWith(" ") ? " " : "") + btn.textContent + " ";
      updateTextDisplay(); updatePredictions();
      $phrasesPanel.classList.add("hidden");
      playClick();
    });
  });
}

function applyPhrase(idx) {
  if (idx < 0 || idx >= phrases.length) return;
  typedText += (typedText && !typedText.endsWith(" ") ? " " : "") + phrases[idx] + " ";
  updateTextDisplay(); updatePredictions();
  playClick();
}

function updatePhraseHover(vx, vy) {
  if ($phrasesPanel.classList.contains("hidden")) return;
  $phrasesList.querySelectorAll(".phrase-item").forEach(btn => {
    const r = btn.getBoundingClientRect();
    const over = vx>=r.left && vx<=r.right && vy>=r.top && vy<=r.bottom;
    btn.classList.toggle("gaze-hover", over);
  });
}

function getHoveredPhrase() {
  if ($phrasesPanel.classList.contains("hidden")) return -1;
  const items = [...$phrasesList.querySelectorAll(".phrase-item")];
  return items.findIndex(b => b.classList.contains("gaze-hover"));
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Prediction hover Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
let _predHovered = null;
let _predDwellTimer = null;

function updatePredHover(vx, vy) {
  let target = null;

  $predBtns.forEach(btn => {
    const r = btn.getBoundingClientRect();
    const over = vx>=r.left && vx<=r.right && vy>=r.top && vy<=r.bottom;
    const active = over && btn.textContent.trim() !== "";

    btn.classList.toggle("gaze-hover", active);

    if (active) target = btn;
  });

  if (target === _predHovered) return;

  if (_predDwellTimer) {
    clearTimeout(_predDwellTimer);
    _predDwellTimer = null;
  }

  _predHovered = target;

  if (!target) return;

  _predDwellTimer = setTimeout(() => {
    if (_predHovered === target && target.textContent.trim() !== "") {
      const idx = Array.from($predBtns).indexOf(target);

      if (idx >= 0) {
        applyPrediction(idx);
        target.classList.remove("gaze-hover");
        _predHovered = null;
      }
    }

    _predDwellTimer = null;
  }, keyboard.dwellDuration);
}

function getHoveredPrediction() {
  for (let i=0; i<$predBtns.length; i++)
    if ($predBtns[i].classList.contains("gaze-hover")) return i;
  return -1;
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Heatmap Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

// ?? Universal gaze control ????????????????????????????????????????????????????
// Allows the gaze cursor to select normal interactive controls across the page.
let _universalGazeTarget = null;
let _universalGazeTimer = null;

function updateUniversalGaze(vx, vy) {
  const elements = document.querySelectorAll(
    'button, [role="button"], input[type="range"], input[type="checkbox"], input[type="radio"]'
  );

  let target = null;

  elements.forEach(el => {
    // These already have their own gaze-control systems.
    if (
      el.classList.contains("key") ||
      el.classList.contains("pred-btn") ||
      el.classList.contains("mode-tab") ||
      el.id.startsWith("nav-") ||
      el.id === "gaze-cursor" ||
      el.disabled ||
      el.offsetParent === null
    ) {
      return;
    }

    const r = el.getBoundingClientRect();

    const over =
      vx >= r.left && vx <= r.right &&
      vy >= r.top  && vy <= r.bottom;

    el.classList.toggle("gaze-hover", over);

    if (over) target = el;
  });

  if (target === _universalGazeTarget) {
    // For sliders, continuously map gaze position to slider value.
    if (target && target.type === "range") {
      updateGazeSlider(target, vx);
    }
    return;
  }

  if (_universalGazeTimer) {
    clearTimeout(_universalGazeTimer);
    _universalGazeTimer = null;
  }

  _universalGazeTarget = target;

  if (!target) return;

  // Range sliders follow horizontal gaze movement.
  if (target.type === "range") {
    updateGazeSlider(target, vx);
  }

  _universalGazeTimer = setTimeout(() => {
    if (_universalGazeTarget === target) {

      if (target.type === "range") {
        updateGazeSlider(target, vx);
        target.dispatchEvent(new Event("change", {bubbles:true}));
      } else {
        target.classList.add("gaze-selected"); setTimeout(() => target.classList.remove("gaze-selected"), 260); target.click();
      }

      target.classList.remove("gaze-hover");
    }

    _universalGazeTimer = null;
  }, keyboard.dwellDuration);
}

function updateGazeSlider(slider, vx) {
  const r = slider.getBoundingClientRect();

  if (r.width <= 0) return;

  const ratio = Math.max(
    0,
    Math.min(1, (vx - r.left) / r.width)
  );

  const min = parseFloat(slider.min || 0);
  const max = parseFloat(slider.max || 100);
  const step = parseFloat(slider.step || 1);

  let value = min + ratio * (max - min);

  if (step > 0) {
    value = Math.round((value - min) / step) * step + min;
  }

  slider.value = Math.max(min, Math.min(max, value));
  slider.dispatchEvent(new Event("input", {bubbles:true}));
}


function drawHeatmap(matrix, w, h) {
  const ctx = $heatCanvas.getContext("2d");

  $heatCanvas.width = w;
  $heatCanvas.height = h;

  // Smooth the raw gaze points so the heatmap becomes visible
  // as continuous areas instead of tiny individual pixels.
  const smooth = Array.from({length:h}, () => Array(w).fill(0));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let total = 0;
      let weightTotal = 0;

      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const yy = y + dy;
          const xx = x + dx;

          if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;

          const dist = Math.sqrt(dx * dx + dy * dy);
          const weight = Math.exp(-(dist * dist) / 8);

          total += (matrix[yy][xx] || 0) * weight;
          weightTotal += weight;
        }
      }

      smooth[y][x] = weightTotal > 0 ? total / weightTotal : 0;
    }
  }

  let maxValue = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (smooth[y][x] > maxValue) maxValue = smooth[y][x];
    }
  }

  const img = ctx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = maxValue > 0 ? smooth[y][x] / maxValue : 0;

      // Boost weak gaze areas so they remain visible.
      v = Math.pow(Math.min(1, Math.max(0, v)), 0.55);

      const i = (y * w + x) * 4;

      // Blue -> cyan -> green -> yellow -> red
      if (v < 0.2) {
        img.data[i]     = 0;
        img.data[i + 1] = Math.round(v / 0.2 * 180);
        img.data[i + 2] = 255;
      }
      else if (v < 0.4) {
        const t = (v - 0.2) / 0.2;
        img.data[i]     = 0;
        img.data[i + 1] = Math.round(180 + t * 75);
        img.data[i + 2] = Math.round(255 - t * 255);
      }
      else if (v < 0.6) {
        const t = (v - 0.4) / 0.2;
        img.data[i]     = Math.round(t * 255);
        img.data[i + 1] = 255;
        img.data[i + 2] = 0;
      }
      else if (v < 0.8) {
        const t = (v - 0.6) / 0.2;
        img.data[i]     = 255;
        img.data[i + 1] = 255;
        img.data[i + 2] = Math.round((1 - t) * 255);
      }
      else {
        const t = (v - 0.8) / 0.2;
        img.data[i]     = 255;
        img.data[i + 1] = Math.round((1 - t) * 255);
        img.data[i + 2] = 0;
      }

      img.data[i + 3] = v > 0.005 ? Math.round(80 + v * 175) : 0;
    }
  }

  ctx.putImageData(img, 0, 0);
}

async function fetchHeatmap() {
  try {
    const res  = await fetch(`${SERVER}/api/heatmap`);
    const data = await res.json();
    drawHeatmap(data.heatmap, data.w, data.h);
  } catch(e) {}
}

$btnHeatmap.addEventListener("click", fetchHeatmap);
$btnResetHeat.addEventListener("click", async () => {
  await fetch(`${SERVER}/api/heatmap/reset`,{method:"POST"}).catch(()=>{});
  const ctx = $heatCanvas.getContext("2d");
  ctx.clearRect(0,0,$heatCanvas.width,$heatCanvas.height);
});
setInterval(() => { if (isStreaming) fetchHeatmap(); }, 3000);

// Ã¢â€â‚¬Ã¢â€â‚¬ Session stats Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
setInterval(async () => {
  if (!isStreaming) return;
  try {
    const res  = await fetch(`${SERVER}/api/stats`);
    const data = await res.json();
    document.getElementById("sess-keys").textContent   = data.keys_typed;
    document.getElementById("sess-words").textContent  = data.words;
    document.getElementById("sess-wpm").textContent    = data.wpm;
    document.getElementById("sess-blinks").textContent = data.blinks;
  } catch(e) {}
}, 2000);

$btnResetStat.addEventListener("click", async () => {
  await fetch(`${SERVER}/api/stats/reset`,{method:"POST"}).catch(()=>{});
  ["sess-keys","sess-words","sess-wpm","sess-blinks"]
    .forEach(id => document.getElementById(id).textContent = "0");
});

// Ã¢â€â‚¬Ã¢â€â‚¬ Fixation log Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
setInterval(async () => {
  if (!isStreaming) return;
  try {
    const res  = await fetch(`${SERVER}/api/fixations`);
    const data = await res.json();
    $fixLog.innerHTML = data.fixations.slice(-8).reverse()
      .map(f => `<div>${f.blink?"Ã°Å¸â€˜Â ":"Ã‚Â· "}(${f.x},${f.y})</div>`).join("");
  } catch(e) {}
}, 2000);

// Ã¢â€â‚¬Ã¢â€â‚¬ Sound feedback Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
let _audioCtx = null;
function playClick() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const osc  = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.connect(gain); gain.connect(_audioCtx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(.12, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, _audioCtx.currentTime+.07);
    osc.start(_audioCtx.currentTime);
    osc.stop(_audioCtx.currentTime+.07);
  } catch(e) {}
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function setStatus(cls, text) {
  if ($connLabel) $connLabel.textContent = text;
}
function showBlinkFlash() {
  $blinkFlash.classList.remove("hidden");
  setTimeout(() => $blinkFlash.classList.add("hidden"), 380);
}
function showCamBlink() {
  $camBlink.classList.remove("hidden");
  setTimeout(() => $camBlink.classList.add("hidden"), 380);
}
function showToast(msg) {
  $toast.textContent = msg;
  $toast.classList.remove("hidden");
  setTimeout(() => $toast.classList.add("hidden"), 1800);
}

function setupServerConfig() {
  const $serverInput = document.getElementById("server-url-input");
  const $btnSave     = document.getElementById("btn-save-server");
  const $serverPill  = document.getElementById("server-status-pill");

  if ($serverInput && SERVER) {
    $serverInput.value = SERVER;
  }

  if ($serverPill) {
    if (localStorage.getItem("eyetype_server_url")) {
      $serverPill.textContent = "Custom";
      $serverPill.style.color = "#10b981";
    } else if (window.location.hostname.endsWith("vercel.app")) {
      $serverPill.textContent = "Needs URL";
      $serverPill.style.color = "#f59e0b";
    } else {
      $serverPill.textContent = "Local";
      $serverPill.style.color = "#3b82f6";
    }
  }

  if ($btnSave && $serverInput) {
    $btnSave.addEventListener("click", () => {
      const val = $serverInput.value.trim().replace(/\/+$/, "");
      if (!val) {
        localStorage.removeItem("eyetype_server_url");
        SERVER = window.location.hostname.endsWith("vercel.app") ? "" : window.location.origin;
        showToast("Reset server URL");
      } else {
        localStorage.setItem("eyetype_server_url", val);
        SERVER = val;
        showToast("Connecting to: " + val);
      }
      if ($serverPill) {
        $serverPill.textContent = val ? "Custom" : (window.location.hostname.endsWith("vercel.app") ? "Needs URL" : "Local");
        $serverPill.style.color = val ? "#10b981" : "#3b82f6";
      }
      if (socket) {
        try { socket.disconnect(); } catch(e){}
      }
      initSocket();
    });
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Boot Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
$cursor.style.display = "none";
$btnStop.disabled     = true;
setupServerConfig();
updatePredictions();
initSocket();


if ($btnVoice) $btnVoice.addEventListener("click", startVoiceInput);

