from pathlib import Path

p = Path(r".\frontend\app.js")
s = p.read_text(encoding="utf-8")

wrong = 'body: JSON.stringify({text: typedText, language: document.getElementById("language-select")?.value || "english"}),'
original = 'body: JSON.stringify({text: typedText}),'

# Restore the first occurrence that was changed accidentally.
s = s.replace(wrong, original, 1)

# Change the Speak request specifically.
marker = 'function speakText() {'
start = s.index(marker)
pos = s.index(original, start)

s = s[:pos] + 'body: JSON.stringify({text: typedText, language: document.getElementById("language-select")?.value || "english"}),' + s[pos + len(original):]

p.write_text(s, encoding="utf-8")
print("TTS LANGUAGE LINE FIXED")
