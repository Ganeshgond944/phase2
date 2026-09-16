/**
 * Virtual keyboard â€” letters, numbers, emoji modes.
 * Supports dwell + blink selection.
 */

const KB_MODES = {
  letters: [
    ["1","2","3","4","5","6","7","8","9","0","⌫"],
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L","↵"],
    ["Z","X","C","V","B","N","M",",",".","?"],
    ["CLR","LANG","SPACE","CAPS","!"],
  ],
  numbers: [
    ["7","8","9","⌫"],
    ["4","5","6","↵"],
    ["1","2","3","SPACE"],
    ["0",".","@","CLR"],
    ["+","-","*","/","=","(",")","%","#","$"],
  ],
  emoji: [
    ["\u{1F600}","\u{1F602}","\u{1F923}","\u{1F60A}","\u{1F60D}","\u{1F618}","\u{1F622}","\u{1F62E}","\u{1F621}","\u{1F389}"],
    ["\u{1F44D}","\u{1F44B}","\u{1F64F}","\u{1F914}","\u{1F634}","\u{1F917}","\u{1F496}","\u{1F970}"],
    ["\u{2B50}","\u{1F525}","\u{1F4AF}","\u{2728}","\u{1F3AF}","\u{1F4DE}","\u{1F4E7}","\u{1F4A1}","\u{1F697}","\u{2764}"],
    ["CLR","LANG","SPACE","\u232B","\u21B5"],
  ],
};

const LANGUAGE_LAYOUTS = {
  english: [
    ["1","2","3","4","5","6","7","8","9","0","⌫"],
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L","↵"],
    ["Z","X","C","V","B","N","M",",",".","?"],
    ["CLR","LANG","SPACE","CAPS","!"],
  ],

  kannada: [
    ["1","2","3","4","5","6","7","8","9","0","⌫"],
    ["\u0C85","\u0C86","\u0C87","\u0C88","\u0C89","\u0C8A","\u0C8B","\u0C8E","\u0C8F","\u0C90"],
    ["\u0C92","\u0C93","\u0C94","\u0C95","\u0C96","\u0C97","\u0C98","\u0C99","\u0C9A","\u0C9B"],
    ["\u0C9C","\u0C9D","\u0C9E","\u0C9F","\u0CA0","\u0CA1","\u0CA2","\u0CA3","\u0CA4","\u0CA5"],
    ["\u0CA6","\u0CA7","\u0CA8","\u0CAA","\u0CAB","\u0CAC","\u0CAD","\u0CAE","\u0CAF","\u0CB0"],
    ["\u0CB2","\u0CB5","\u0CB6","\u0CB7","\u0CB8","\u0CB9","\u0CB3",",",".","?"],
    ["CLR","LANG","SPACE","!"],
  ],

  telugu: [
    ["1","2","3","4","5","6","7","8","9","0","⌫"],
    ["\u0C05","\u0C06","\u0C07","\u0C08","\u0C09","\u0C0A","\u0C0B","\u0C0E","\u0C0F","\u0C10"],
    ["\u0C12","\u0C13","\u0C14","\u0C15","\u0C16","\u0C17","\u0C18","\u0C19","\u0C1A","\u0C1B"],
    ["\u0C1C","\u0C1D","\u0C1E","\u0C1F","\u0C20","\u0C21","\u0C22","\u0C23","\u0C24","\u0C25"],
    ["\u0C26","\u0C27","\u0C28","\u0C2A","\u0C2B","\u0C2C","\u0C2D","\u0C2E","\u0C2F","\u0C30"],
    ["\u0C32","\u0C35","\u0C36","\u0C37","\u0C38","\u0C39","\u0C33",",",".","?"],
    ["CLR","LANG","SPACE","!"],
  ],

  hindi: [
    ["1","2","3","4","5","6","7","8","9","0","⌫"],
    ["\u0905","\u0906","\u0907","\u0908","\u0909","\u090A","\u090B","\u090F","\u0910","\u0913"],
    ["\u0914","\u0915","\u0916","\u0917","\u0918","\u0919","\u091A","\u091B","\u091C","\u091D"],
    ["\u091E","\u091F","\u0920","\u0921","\u0922","\u0923","\u0924","\u0925","\u0926","\u0927"],
    ["\u0928","\u092A","\u092B","\u092C","\u092D","\u092E","\u092F","\u0930","\u0932","\u0935"],
    ["\u0936","\u0937","\u0938","\u0939",",",".","?"],
    ["CLR","LANG","SPACE","!"],
  ],

  tamil: [
    ["1","2","3","4","5","6","7","8","9","0","⌫"],
    ["\u0B85","\u0B86","\u0B87","\u0B88","\u0B89","\u0B8A","\u0B8E","\u0B8F","\u0B90","\u0B92"],
    ["\u0B93","\u0B94","\u0B95","\u0B99","\u0B9A","\u0B9E","\u0B9F","\u0BA3","\u0BA4","\u0BA8"],
    ["\u0BA9","\u0BAA","\u0BAE","\u0BAF","\u0BB0","\u0BB2","\u0BB5","\u0BB4","\u0BB3","\u0BB1"],
    ["\u0BC0","\u0BC1","\u0BC2","\u0BC6","\u0BC7","\u0BC8","\u0BCA","\u0BCB","\u0BCC",",","."],
    ["CLR","LANG","SPACE","!"],
  ],

  malayalam: [
    ["1","2","3","4","5","6","7","8","9","0","⌫"],
    ["\u0D05","\u0D06","\u0D07","\u0D08","\u0D09","\u0D0A","\u0D0B","\u0D0E","\u0D0F","\u0D10"],
    ["\u0D12","\u0D13","\u0D14","\u0D15","\u0D16","\u0D17","\u0D18","\u0D19","\u0D1A","\u0D1B"],
    ["\u0D1C","\u0D1D","\u0D1E","\u0D1F","\u0D20","\u0D21","\u0D22","\u0D23","\u0D24","\u0D25"],
    ["\u0D26","\u0D27","\u0D28","\u0D2A","\u0D2B","\u0D2C","\u0D2D","\u0D2E","\u0D2F","\u0D30"],
    ["\u0D32","\u0D35","\u0D36","\u0D37","\u0D38","\u0D39","\u0D33",",",".","?"],
    ["CLR","LANG","SPACE","!"],
  ],
};
const SPECIAL_KEYS = {
  "⌫":    { label:"⌫",    action:"backspace", cls:"wide" },
  "↵":    { label:"↵",    action:"enter",     cls:"wide" },
  "SPACE":{ label:"SPACE",action:"space",      cls:"widest" },
  "CLR":  { label:"CLR",  action:"clear",      cls:"clr-key" },
  "CAPS": { label:"CAPS", action:"caps",        cls:"wide" },
  "LANG": { label:"🌐 LANG", action:"lang",    cls:"wide lang-key" },
};

class VirtualKeyboard {
  constructor(containerId, onKeyPress) {
    this.container     = document.getElementById(containerId);
    this.onKeyPress    = onKeyPress;
    this.keys          = [];
    this.hoveredKey    = null;
    this.dwellDuration = 1000;
    this.dwellProgress = 0;
    this.dwellInterval = null;
    this.useDwell      = true;
    this._resetUntil   = 0;
    this.mode          = "letters";
    this.language      = "english";

    const languageSelect = document.getElementById("language-select");
    if (languageSelect) {
      languageSelect.addEventListener("change", () => {
        this.language = languageSelect.value;
        this.capsOn = false;
        this._cancelDwell();
        this.hoveredKey = null;
        this._build();
      });
    }
    this.capsOn        = false;
    this._build();
  }

  setMode(mode) {
    this.mode = mode;
    this._cancelDwell();
    if (this.hoveredKey) this.hoveredKey.classList.remove("gaze-hover");
    this.hoveredKey = null;
    this._build();
  }

  _build() {
    this.container.innerHTML = "";
    this.keys = [];
    let rows;

    if (this.mode === "letters") {
      rows = LANGUAGE_LAYOUTS[this.language] || LANGUAGE_LAYOUTS.english;
    } else {
      rows = KB_MODES[this.mode] || KB_MODES.letters;
    }
    rows.forEach(row => {
      const rowEl = document.createElement("div");
      rowEl.className = "key-row";
      row.forEach(keyVal => {
        const spec = SPECIAL_KEYS[keyVal];
        const btn  = document.createElement("button");
        let label  = spec ? spec.label : keyVal;
        if (keyVal === "LANG") {
          const langDisplay = {
            english: "ENG",
            kannada: "ಕನ್ನಡ",
            telugu: "తెలుగు",
            hindi: "हिन्दी",
            tamil: "தமிழ்",
            malayalam: "മലയാളം"
          };
          label = `🌐 ${langDisplay[this.language] || "LANG"}`;
        }
        if (!spec && this.mode === "letters" && this.capsOn) label = label.toUpperCase();
        if (!spec && this.mode === "letters" && !this.capsOn && /[A-Z]/.test(label))
          label = label.toLowerCase();
        btn.className   = "key" + (spec ? ` ${spec.cls}` : "")
                        + (this.mode === "emoji" ? " emoji-key" : "");
        btn.textContent = label;
        btn.dataset.key = keyVal;
        btn.setAttribute("aria-label", spec ? (keyVal === "LANG" ? "Switch language (Alt+L)" : spec.action) : keyVal);
        if (keyVal === "LANG") {
          btn.title = "Switch Language (Shortcut: Alt + L)";
        }
        const ring = document.createElement("div");
        ring.className = "dwell-ring";
        btn.appendChild(ring);
        btn.addEventListener("click", () => this._handleKey(keyVal));
        rowEl.appendChild(btn);
        this.keys.push(btn);
      });
      this.container.appendChild(rowEl);
    });
  }

  _handleKey(keyVal) {
    const spec   = SPECIAL_KEYS[keyVal];
    let   action = spec ? spec.action : keyVal;

    if (action === "caps") {
      this.capsOn = !this.capsOn;
      this._build();
      return;
    }

    if (action === "lang") {
      this.onKeyPress("lang");
      return;
    }

    // For letter keys apply caps
    if (!spec && this.mode === "letters") {
      action = this.capsOn ? keyVal.toUpperCase() : keyVal.toLowerCase();
    }

    this.onKeyPress(action);

    const btn = this.keys.find(k => k.dataset.key === keyVal);
    if (btn) {
      btn.classList.add("selected");
      setTimeout(() => btn.classList.remove("selected"), 260);
    }
  }

  updateGaze(vx, vy) {
    if (Date.now() < this._resetUntil) {
      if (this.hoveredKey) {
        this.hoveredKey.classList.remove("gaze-hover","dwelling");
        this.hoveredKey = null;
      }
      return;
    }

    let target = null;
    for (const btn of this.keys) {
      const r = btn.getBoundingClientRect();
      if (vx >= r.left && vx <= r.right && vy >= r.top && vy <= r.bottom) {
        target = btn; break;
      }
    }

    if (target === this.hoveredKey) return;

    this._cancelDwell();
    if (this.hoveredKey) this.hoveredKey.classList.remove("gaze-hover");
    this.hoveredKey = target;

    if (target) {
      target.classList.add("gaze-hover");
      if (this.useDwell) this._startDwell(target);
    }
  }

  _startDwell(btn) {
    this.dwellProgress = 0;
    btn.classList.add("dwelling");
    const ring  = btn.querySelector(".dwell-ring");
    const steps = this.dwellDuration / 50;
    this.dwellInterval = setInterval(() => {
      this.dwellProgress++;
      const pct = (this.dwellProgress / steps) * 100;
      if (ring) ring.style.background =
        `conic-gradient(var(--accent2) ${pct}%,transparent ${pct}%)`;
      if (this.dwellProgress >= steps) {
        this._cancelDwell();
        this._handleKey(btn.dataset.key);
      }
    }, 50);
  }

  _cancelDwell() {
    if (this.dwellInterval) { clearInterval(this.dwellInterval); this.dwellInterval = null; }
    if (this.hoveredKey) {
      this.hoveredKey.classList.remove("dwelling");
      const ring = this.hoveredKey.querySelector(".dwell-ring");
      if (ring) ring.style.background = "";
    }
    this.dwellProgress = 0;
  }

  triggerBlink() {
    if (!this.hoveredKey) return;
    const key = this.hoveredKey;
    this._cancelDwell();
    this._handleKey(key.dataset.key);
    key.classList.remove("gaze-hover","dwelling");
    this.hoveredKey  = null;
    this._resetUntil = Date.now() + 600;
  }

  getHoveredKey() {
    return this.hoveredKey ? this.hoveredKey.dataset.key : null;
  }

  setDwellDuration(ms) { this.dwellDuration = ms; }

  setLanguage(lang) {
    if (this.language !== lang) {
      this.language = lang;
      this.capsOn = false;
      this._cancelDwell();
      this.hoveredKey = null;
      this._build();
    }
  }
}







