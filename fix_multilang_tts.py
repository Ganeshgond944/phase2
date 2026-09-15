from pathlib import Path

p = Path(r".\backend\app.py")
s = p.read_text(encoding="utf-8")

start = s.index('@app.route("/api/speak", methods=["POST"])')
end = s.index('\n@app.route(', start + 10)

old_block = s[start:end]

new_block = '''@app.route("/api/speak", methods=["POST"])
def speak_text():
    data = request.json or {}
    text = data.get("text", "").strip()
    language = data.get("language", "english").lower()

    if not text:
        return jsonify({"status": "empty"})

    language_codes = {
        "kannada": "kn",
        "telugu": "te",
        "hindi": "hi",
        "tamil": "ta",
        "malayalam": "ml",
    }

    def _speak():
        try:
            if language == "english":
                import pyttsx3
                engine = pyttsx3.init("sapi5")
                voices = engine.getProperty("voices")

                if len(voices) > 2:
                    engine.setProperty("voice", voices[2].id)
                elif voices:
                    engine.setProperty("voice", voices[0].id)

                engine.setProperty("rate", 150)
                engine.setProperty("volume", 1.0)
                engine.say(text)
                engine.runAndWait()
                engine.stop()

            elif language in language_codes:
                from gtts import gTTS
                from playsound import playsound
                import tempfile
                import os

                fd, filename = tempfile.mkstemp(suffix=".mp3")
                os.close(fd)

                try:
                    tts = gTTS(
                        text=text,
                        lang=language_codes[language],
                        slow=False
                    )
                    tts.save(filename)
                    playsound(filename, block=True)
                finally:
                    try:
                        os.remove(filename)
                    except Exception:
                        pass

            else:
                print(f"Unsupported TTS language: {language}")

        except Exception as e:
            print(f"TTS error: {e}")

    threading.Thread(target=_speak, daemon=True).start()
    return jsonify({"status": "speaking"})
'''

s = s[:start] + new_block + s[end:]
p.write_text(s, encoding="utf-8")

print("MULTILINGUAL TTS BACKEND FIXED")
