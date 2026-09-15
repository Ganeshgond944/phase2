from pathlib import Path

p = Path(r".\frontend\app.js")
s = p.read_text(encoding="utf-8")

old = "body: JSON.stringify({text: typedText}),"
new = 'body: JSON.stringify({text: typedText, language: document.getElementById("language-select")?.value || "english"}),'

assert old in s, "Speak payload not found"

p.write_text(s.replace(old, new, 1), encoding="utf-8")
print("LANGUAGE SENT TO TTS")
