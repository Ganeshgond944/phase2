from pathlib import Path

p = Path(r".\frontend\app.js")
s = p.read_text(encoding="utf-8")

old = "body: JSON.stringify({text}),"
new = 'body: JSON.stringify({text, language: document.getElementById("language-select").value || "english"}),'

count = s.count(old)
print("MATCHES FOUND:", count)

if count != 1:
    raise SystemExit("Stopped: expected exactly 1 match")

s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")

print("SPEAK LANGUAGE FIXED")
