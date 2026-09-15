from pathlib import Path

p = Path(r".\frontend\index.html")
s = p.read_text(encoding="utf-8")

old = '<button id="btn-copy"       class="icon-btn" title="Copy">📋</button>'
new = old + '\n              <button id="btn-paste"      class="icon-btn" title="Paste">📥</button>'

if old not in s:
    raise SystemExit("Copy button not found. No changes made.")

s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")

print("PASTE BUTTON ADDED")
