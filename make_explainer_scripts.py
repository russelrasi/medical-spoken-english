#!/usr/bin/env python3
"""Generate explainers/<classId>.script.json for classes 2 to 12 from public/course.json.
Class 1 is hand-written. Same rules as Class 1: English narration only, key words highlighted,
about 90 seconds. Edit a generated script by hand, then run build_explainer.py <classId>.

Usage: python3 make_explainer_scripts.py
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "curriculum"))
from month2 import MONTH2  # noqa: E402
from month3 import MONTH3  # noqa: E402
FOCUS_LATE = {c["no"]: [f.lower() for f in c["focus"]] for c in MONTH2 + MONTH3}
STOP = {"sound", "the", "and", "in", "of", "a", "is", "to", "for", "say", "with", "your", "it", "at", "are", "an", "or", "not", "do", "use", "clearly", "words", "from", "after", "before", "does", "that", "this", "has", "have"}
course = json.loads((ROOT / "public" / "course.json").read_text(encoding="utf-8"))
units = [u for m in course["course"]["months"] for w in m["weeks"] for u in w["classes"]]

PRON = {"i", "he", "she", "it", "you", "we", "they"}
BE = {"am", "is", "are", "was", "were"}
FOCUS = {  # class number -> set of key words (lowercase) for the grammar examples
 2: {"have", "has", "my", "your", "his", "her", "our", "their"},
 3: {"do", "does", "doesn't", "don't"},  # plus verbs after he/she/it, see focus_words
 4: BE,
 5: {"like", "likes", "love", "loves", "enjoy", "enjoys", "hate", "hates", "prefer", "prefers", "dislike", "dislikes"},
 6: {"what", "where", "when", "why", "who", "which", "how", "at", "in", "on"},
 7: {"was", "were", "did"},
 8: {"went", "bought", "took", "met", "slept", "forgot", "brought", "had", "saw", "did", "ate", "got", "came", "made", "said", "gave", "wrote", "didn't"},
 9: {"will", "won't", "going", "to"},
 10: {"can", "could", "may", "would", "please"},
 11: {"there", "is", "are"},
 12: BE | {"will", "can", "could", "do", "does", "did"},
}
SOUND = {  # key words for the sound corner
 2: {"have", "has", "mother", "father"}, 3: {"works", "studies", "watches"}, 4: {"reading", "studying", "waiting"},
 5: {"hobby", "enjoy", "cuisine"}, 6: {"where", "when", "live"}, 7: {"wanted", "worked", "studied"},
 8: {"went", "took", "got", "up"}, 9: {"i'll", "she'll", "won't"}, 10: {"could", "please", "may", "would"},
 11: {"spacious", "clean", "quiet", "crowded"}, 12: {"vein", "very", "went", "west", "think", "third"},
}
RECAP = {
 12: ("Month 1", [("Introduce yourself and your family", "In Month 1 you learned to introduce yourself and your family."),
                  ("Talk about your day and now", "You learned to talk about your daily routine, and what is happening now."),
                  ("Ask questions, share likes", "You learned to ask questions, and to talk about your likes and dislikes."),
                  ("Past and future", "You learned to talk about the past, and to make plans for the future."),
                  ("Polite requests and descriptions", "You learned to make polite requests, and to describe people and places.")]),
 24: ("Month 2", [("Travel, directions and shopping", "In Month 2 you learned to travel, ask for directions and shop in Egypt."),
                  ("Order food and compare things", "You learned to order food, and to compare places and prices."),
                  ("Housing, health and phone calls", "You learned to report problems, describe symptoms and use the phone."),
                  ("Plans, stories and experiences", "You learned to make plans, tell stories and talk about your experiences.")]),
 36: ("Month 3", [("Medical college English", "In Month 3 you learned the English of the medical college and the lecture hall."),
                  ("Talk with patients", "You learned to take a patient history and describe symptoms and pain."),
                  ("Explain and present", "You learned to explain procedures, present a case and give a short talk."),
                  ("Write and call professionally", "You learned to write polite emails and make professional phone calls.")]),
}
NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]

strip = lambda w: re.sub(r"[.,;:!?()\"]", "", w).lower()

def spoken(t):
    t = t.replace(" + ", " plus ").replace("&", "and").replace("/", " or ").replace("->", " becomes ").replace("→", " becomes ")
    t = re.sub(r"\s+", " ", re.sub(r"[()\"“”]", "", t)).strip()
    return t

def focus_late(no, sentence):
    toks = sentence.split()
    low = [strip(t) for t in toks]
    hit = set()
    for ph in FOCUS_LATE[no]:
        p = ph.split()
        for i in range(len(low) - len(p) + 1):
            if low[i:i + len(p)] == p: hit.update(range(i, i + len(p)))
    out = []
    for i, w in enumerate(low):
        if i in hit: out.append({"w": w, "role": "verb"})
        elif w in PRON: out.append({"w": w, "role": "subj"})
    return out if any(f["role"] == "verb" for f in out) else []

def focus_words(no, sentence, vocab):
    if no >= 13: return focus_late(no, sentence)
    toks = sentence.split()
    out, keys = [], FOCUS[no] | (vocab if no == 11 else set())
    for i, w in enumerate(toks):
        s = strip(w)
        hit = s in keys
        if no == 3 and i > 0 and strip(toks[i - 1]) in {"he", "she", "it"} and s not in BE: hit = True
        if no == 4 and s.endswith("ing"): hit = True
        if no in (7, 12) and s.endswith("ed"): hit = True
        if hit: out.append({"w": s, "role": "verb"})
        elif s in PRON: out.append({"w": s, "role": "subj"})
    return out if any(f["role"] == "verb" for f in out) else []

def rule_parts(rule_en):
    m = re.match(r"Rule (\d+):\s*(.*)", rule_en)
    n, body = (int(m.group(1)), m.group(2)) if m else (0, rule_en)
    first = re.split(r"(?<=[.])\s", body)[0]
    first = first.split(";")[0] if len(first.split()) > 18 else first
    return n, body, first.rstrip(".") + "."

def ex_beats(no, block, vocab, count=2):
    cand = [e for e in block["examples"] if 3 <= len(e["en"].split()) <= 9 and focus_words(no, e["en"], vocab)]
    lines = []
    for e in cand[:count]:
        f = focus_words(no, e["en"], vocab)
        keys = list(dict.fromkeys(x["w"] for x in f if x["role"] == "verb"))
        note = "Notice " + (", ".join(keys[:-1]) + ", and " + keys[-1] if len(keys) > 1 else keys[0]) + "."
        lines.append({"say": e["en"], "show": {"kind": "example", "text": e["en"], "bn": e["bn"], "focus": []}})
        lines.append({"say": note, "show": {"kind": "example", "text": e["en"], "bn": e["bn"], "focus": f, "keep": True}})
    return lines

def build(u):
    no, g = u["no"], u["guidebook"]
    vocab = {v["en"].lower() for v in g["vocab"]}
    blocks, sound = g["grammar"][:-1][:2], g["grammar"][-1]
    med = g["vocab"][-6:] if no <= 12 else g["vocab"][:3]
    corner = "Medical corner" if no <= 12 else "Key words"
    cn = NUM[no] if no < len(NUM) else str(no)
    scenes = [{"type": "title", "heading": "", "lines": [{"say": f"Welcome to Class {cn}. {spoken(u['title']['en'])}.", "show": {"kind": "title"}}]}]
    for bi, b in enumerate(blocks):
        n, body, first = rule_parts(b["rule"]["en"])
        say = f"Rule {NUM[bi + 1]}. {spoken(first)}"
        sc = {"type": "rule", "heading": f"Rule {bi + 1}", "lines": [{"say": say, "show": {"kind": "text", "text": first, "bn": b["rule"]["bn"]}}]}
        sc["lines"] += ex_beats(no, b, vocab, 1 if no in RECAP else 2)
        scenes.append(sc)
    mk = blocks[0]["mistakes"][0] if blocks[0]["mistakes"] else None
    if mk:
        rt, wr = set(map(strip, mk["right"].split())), set(map(strip, mk["wrong"].split()))
        diff = [w for w in mk["right"].split() if strip(w) not in wr] or [mk["right"].split()[-1]]
        scenes.append({"type": "mistakes", "heading": "Common mistake", "lines": [
            {"say": f"Not: {spoken(mk['wrong'])} Say: {spoken(mk['right'])}", "show": {"kind": "mistake", "ref": [0, 0], "focus": strip(diff[0])}}]})
    ml = []
    for v in med[:2 if no <= 12 else 2]:
        key = [{"w": strip(w), "role": "verb"} for w in v["en"].split()]
        ml += [{"say": v["example_en"], "show": {"kind": "example", "text": v["example_en"], "bn": v["example_bn"], "focus": []}},
               {"say": spoken(v["en"]) + ".", "show": {"kind": "example", "text": v["example_en"], "bn": v["example_bn"], "focus": key, "keep": True}}]
    scenes.append({"type": "examples", "heading": corner, "lines": ml})
    ex = sound["examples"][0]
    if no <= 12:
        keys = SOUND[no]
    else:
        txt = strip(sound["rule"]["en"] + " " + sound["points"][0]["en"]).replace("  ", " ")
        keys = {w for w in re.findall(r"[a-z']+", txt) if len(w) > 2 and w not in STOP}
    sk = [{"w": strip(w), "role": "key"} for w in ex["en"].split() if strip(w) in keys] or [{"w": strip(ex["en"].split()[0]), "role": "key"}]
    sline = sound["rule"]["en"].replace("Sound corner: ", "")
    scenes.append({"type": "examples", "heading": "Sound corner", "lines": [
        {"say": "Sound corner. " + spoken(sline[0].upper() + sline[1:]), "show": {"kind": "text", "text": sline, "bn": sound["rule"]["bn"]}},
        {"say": ex["en"], "show": {"kind": "example", "text": ex["en"], "bn": ex["bn"], "focus": []}},
        {"say": spoken(sound["mistakes"][0]["note_en"]), "show": {"kind": "example", "text": ex["en"], "bn": ex["bn"], "focus": sk, "keep": True}}]})
    if no in RECAP:
        mname, skills = RECAP[no]
        scenes.insert(1, {"type": "recap", "heading": f"{mname} skills", "lines": [{"say": say, "show": {"kind": "text", "text": t}} for t, say in skills]})
    scenes.append({"type": "recap", "heading": "Recap", "lines": [{"say": "Review the examples, then try the lesson!", "show": {"kind": "outro"}}]})
    return {"classId": u["id"], "voice": "en-US-JennyNeural", "scenes": scenes}

for u in units:
    if u["no"] >= 2 and (len(sys.argv) < 2 or str(u["no"]) in sys.argv[1:]):
        s = build(u)
        (ROOT / "explainers" / f"{u['id']}.script.json").write_text(json.dumps(s, indent=1, ensure_ascii=False), encoding="utf-8")
        words = sum(len(l["say"].split()) for sc in s["scenes"] for l in sc["lines"])
        print(u["id"], "lines", sum(len(sc["lines"]) for sc in s["scenes"]), "words", words)
