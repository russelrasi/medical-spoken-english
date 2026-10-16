#!/usr/bin/env python3
"""Pre-generate neural voice audio (Microsoft Azure neural voices via edge-tts, no key needed).

Reads public/course.json, writes public/audio/<voice>/<id>.mp3 and public/audio/manifest.json.
Existing files are skipped, so re-running only generates new sentences.

Usage: .venv/bin/python generate_audio.py
"""
import asyncio
import hashlib
import json
from pathlib import Path

import edge_tts

# Words the neural voice reads wrongly when spoken alone: spoken respelling by text.
# 'Live' as a verb rhymes with 'give' (/lɪv/); the voice defaults to the adjective /laɪv/.
# (The service rejects IPA/SAPI phoneme tags, so a plain respelling is used.)
SPOKEN = {"Live": "liv", "live": "liv"}

ROOT = Path(__file__).resolve().parent
COURSE = ROOT / "public" / "course.json"
AUDIO = ROOT / "public" / "audio"

VOICES = [
    {"id": "en-US-JennyNeural", "label": "Jenny (US, female)"},
    {"id": "en-US-GuyNeural", "label": "Guy (US, male)"},
    {"id": "en-GB-SoniaNeural", "label": "Sonia (UK, female)"},
    {"id": "en-IN-NeerjaNeural", "label": "Neerja (Indian English, female)"},
]


def collect_texts(course):
    texts = set()
    for m in course["course"]["months"]:
        for w in m["weeks"]:
            for u in w["classes"]:
                g = u["guidebook"]
                for e in u["exercises"]:
                    for k in ("audio_text", "speak"):
                        if e.get(k):
                            texts.add(e[k])
                    if e["type"] == "vocab_select" and e["stem_lang"] == "en":
                        texts.add(e["stem"])
                for v in g["vocab"]:
                    texts.update([v["en"], v["example_en"]])
                for l in g["dialogue"]["lines"]:
                    texts.add(l["en"])
                for b in g["grammar"]:
                    texts.update(x["en"] for x in b["examples"])
                texts.update(s["text"] for s in u["speaking"])
    return sorted(t for t in texts if t.strip())


def tid(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


async def one(sem, voice, text, path):
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(SPOKEN.get(text, text), voice, rate="-8%").save(str(path))
                return
            except Exception as e:  # network hiccup: retry
                if attempt == 3:
                    print("FAILED", voice, text[:40], e)
                await asyncio.sleep(1 + attempt)


async def main():
    course = json.loads(COURSE.read_text(encoding="utf-8"))
    texts = collect_texts(course)
    sem = asyncio.Semaphore(8)
    jobs = []
    for v in VOICES:
        d = AUDIO / v["id"]
        d.mkdir(parents=True, exist_ok=True)
        for t in texts:
            p = d / f"{tid(t)}.mp3"
            if not p.exists() or p.stat().st_size == 0:
                jobs.append(one(sem, v["id"], t, p))
    print(f"{len(texts)} texts, {len(jobs)} files to generate")
    await asyncio.gather(*jobs)
    manifest = {"voices": VOICES, "texts": {t: tid(t) for t in texts}}
    (AUDIO / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")
    print("wrote manifest")


if __name__ == "__main__":
    asyncio.run(main())
