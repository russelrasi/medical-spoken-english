#!/usr/bin/env python3
"""Build one explainer: narration audio + resolved timing JSON for the Remotion composition.

Reads explainers/<classId>.script.json, pulls example sentences from public/course.json,
speaks each line with an English neural voice (edge-tts, no key), measures it, and writes
public/explainers/<classId>.json, public/explainers/<classId>/lNNN.mp3 and public/explainers/index.json.

Usage: ../medical-english-app/.venv/bin/python build_explainer.py m1w1c1
"""
import asyncio, json, math, subprocess, sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
FPS = 30
LEAD = 12          # frames of silence before the voice starts
PAD, PAD_KEEP, PAD_END = 14, 6, 22
RATE = "-4%"


def find_unit(course, cid):
    for m in course["course"]["months"]:
        for w in m["weeks"]:
            for u in w["classes"]:
                if u["id"] == cid:
                    return u
    raise SystemExit(f"unknown class {cid}")


def dur(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(out.decode().strip())


async def main(cid):
    script = json.load(open(ROOT / "explainers" / f"{cid}.script.json", encoding="utf-8"))
    unit = find_unit(json.load(open(ROOT / "public" / "course.json", encoding="utf-8")), cid)
    g = unit["guidebook"]["grammar"]
    out = ROOT / "public" / "explainers"
    adir = out / cid
    adir.mkdir(parents=True, exist_ok=True)
    voice = script.get("voice", "en-US-JennyNeural")
    frame, n, scenes = 0, 0, []
    for sc in script["scenes"]:
        lines = []
        s0 = frame
        for li, ln in enumerate(sc["lines"]):
            show = dict(ln["show"])
            if show["kind"] == "example" and "ref" in show:
                e = g[show["ref"][0]]["examples"][show["ref"][1]]
                show["text"], show["bn"] = e["en"], e["bn"]
            if show["kind"] == "mistake":
                mk = g[show["ref"][0]]["mistakes"][show["ref"][1]]
                show["wrong"], show["right"] = mk["wrong"], mk["right"]
            name = f"l{n:03d}.mp3"
            path = adir / name
            await edge_tts.Communicate(ln["say"], voice, rate=RATE).save(str(path))
            tmp = path.with_suffix(".tmp.mp3")  # 0.35s of silence up front so the first syllable is never clipped
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(path), "-af", "adelay=350:all=1", "-b:a", "48k", str(tmp)], check=True)
            tmp.replace(path)
            d = dur(path)
            last = li == len(sc["lines"]) - 1
            frames = LEAD + math.ceil(d * FPS) + (PAD_END if last else PAD_KEEP if sc["lines"][li + 1]["show"].get("keep") else PAD)
            lines.append({"say": ln["say"], "audio": f"{cid}/{name}", "from": frame - s0, "frames": frames, "lead": LEAD, "show": show})
            frame += frames
            n += 1
        scenes.append({"type": sc["type"], "heading": sc["heading"], "from": s0, "frames": frame - s0, "lines": lines})
    data = {"classId": cid, "classNo": unit["no"], "title": unit["title"]["en"], "titleBn": unit["title"]["bn"],
            "fps": FPS, "totalFrames": frame, "scenes": scenes}
    json.dump(data, open(out / f"{cid}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    idx = sorted(p.stem.removesuffix(".script") for p in out.glob("*.json") if p.name != "index.json")
    json.dump(idx, open(out / "index.json", "w"))
    size = sum(p.stat().st_size for p in adir.glob("*.mp3"))
    print(f"{cid}: {frame / FPS:.1f}s, {n} audio lines, {size / 1024:.0f} KB audio")


asyncio.run(main(sys.argv[1]))
