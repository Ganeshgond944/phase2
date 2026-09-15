from pathlib import Path

p = Path(r".\frontend\app.js")
s = p.read_text(encoding="utf-8")

old = 'const $btnCopy      = document.getElementById("btn-copy");'
new = old + '\nconst $btnPaste     = document.getElementById("btn-paste");'

if old not in s:
    raise SystemExit("Copy variable not found. No changes made.")

s = s.replace(old, new, 1)

old2 = '$btnCopy.addEventListener("click",      copyText);'
new2 = old2 + '\n$btnPaste.addEventListener("click",     pasteText);'

if old2 not in s:
    raise SystemExit("Copy listener not found. No changes made.")

s = s.replace(old2, new2, 1)

marker = 'function copyText() {'

paste = '''async function pasteText() {
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

'''

if marker not in s:
    raise SystemExit("copyText function not found. No changes made.")

s = s.replace(marker, paste + marker, 1)

p.write_text(s, encoding="utf-8")

print("PASTE FUNCTION ADDED")
