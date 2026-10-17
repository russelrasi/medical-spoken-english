#!/usr/bin/env python3
"""Add Month 2 and Month 3 (curriculum/month2.py, month3.py) to public/course.json.

  python3 build_months23.py --strings   write revised/bn_m2m3_en.json (English lines needing Bangla)
                                        and revised/bn_review_m2m3.md (English | Bangla table to fill in)
  python3 build_months23.py             build the months, using Bangla from revised/bn_m2m3.json
                                        (English -> Bangla map) and revised/bn_cache.json.
Run build_curriculum.py first (it restores Month 1). Then generate_audio.py and pad_audio.sh for new audio.
"""
import json, random, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "curriculum"))
from month2 import MONTH2  # noqa: E402
from month3 import MONTH3  # noqa: E402

ROOT = Path(__file__).resolve().parent
REV = ROOT / "revised"
random.seed(31)
MONTHS = {2: ("Daily Life Conversation in Egypt", MONTH2), 3: ("Medical College English and Fluency", MONTH3)}
STAGE_FILE = REV / "bn_m2m3.json"

def bi(en): return {"en": en, "bn": ""}
sh = lambda x: random.sample(list(x), len(x))

def ex_item(kind, **kw): return {"type": kind, **kw}

def build_unit(month, c):
    uid = f"m{month}w{c['week']}c{c['no']}"
    G = []
    for rule, point, examples, (w, r, note) in c["rules"]:
        G.append({"rule": bi(rule), "points": [bi(point)], "examples": [bi(e) for e in examples], "mistakes": [{"wrong": w, "right": r, "note_en": note, "note_bn": ""}]})
    srule, spoint, sex, (sw, sr, sn) = c["sound"]
    G.append({"rule": bi(srule), "points": [bi(spoint)], "examples": [bi(e) for e in sex], "mistakes": [{"wrong": sw, "right": sr, "note_en": sn, "note_bn": ""}]})
    setting, lines = c["dialogue"]
    vocab = [{"en": e, "bn": "", "pron": p, "example_en": ex, "example_bn": ""} for e, p, ex in c["vocab"]]
    unit = {
        "id": uid, "no": c["no"], "month": month, "week": c["week"], "title": bi(c["title"]), "grammar": bi(c["grammar"]), "revision": bool(c.get("revision")),
        "guidebook": {"objectives": [bi(o) for o in c["obj"]], "outcome": bi(c["outcome"]), "grammar": G, "vocab": vocab,
                      "dialogue": {"setting": bi(setting), "lines": [{"who": w, "en": t, "bn": ""} for w, t in lines]}},
        "speaking": [{"text": t, "bn": ""} for t in c["speaking"]],
    }
    unit["exercises"] = exercises(c, unit)
    return unit

def blank(sentence, options):
    """Blank the first option found in the sentence (whole words). Returns (sentence_with_blank, answer) or None."""
    for o in sorted(options, key=len, reverse=True):
        m = re.search(r"(?<![A-Za-z'])" + re.escape(o) + r"(?![A-Za-z'])", sentence, flags=re.I)
        if m:
            return sentence[:m.start()] + "______" + sentence[m.end():], m.group(0)
    return None

def exercises(c, u):
    n = [0]
    def eid(p): n[0] += 1; return f"{u['id']}-{p}-{n[0]}"
    V, G = u["guidebook"]["vocab"], u["guidebook"]["grammar"]
    out = []
    for i, v in enumerate(V):
        o = random.sample([w for j, w in enumerate(V) if j != i], 3)
        out.append(ex_item("vocab_select", id=eid("vs"), prompt_en="Pick the English word for this meaning", prompt_bn="এই অর্থের ইংরেজি শব্দটি বেছে নাও", stem=v["bn"], stem_lang="bn",
                           option_lang="en", options=sh([v["en"]] + [x["en"] for x in o]), answer=v["en"], pron=v["pron"]))
        out.append(ex_item("vocab_select", id=eid("vs"), prompt_en="Pick the meaning of this word", prompt_bn="শব্দটির অর্থ বেছে নাও", stem=v["en"], stem_lang="en",
                           option_lang="bn", options=sh([v["bn"]] + [x["bn"] for x in o]), answer=v["bn"], pron=v["pron"], speak=v["en"]))
    for k in range(2):
        grp = V[k * 4:(k + 1) * 4]
        out.append(ex_item("match", id=eid("mp"), prompt_en="Match each word to its meaning", prompt_bn="প্রতিটি শব্দের সঙ্গে অর্থ মেলাও",
                           pairs=[{"left": g["en"], "right": g["bn"]} for g in grp], left_lang="en", right_lang="bn"))
    ex_all = [e for b in G for e in b["examples"]]
    # fill in the blank: grammar examples (focus words) and vocabulary examples (vocab words)
    opts = c["focus"]
    for e in ex_all:
        b = blank(e["en"], opts)
        if b:
            answer = b[1]
            cap = answer[0].isupper()
            options = [o[0].upper() + o[1:] if cap else o for o in opts]
            if answer not in options: continue
            out.append(ex_item("fill_blank", id=eid("fb"), prompt_en="Fill in the blank", prompt_bn="শূন্যস্থান পূরণ করো", sentence=b[0], options=options, answer=answer))
    for i, v in enumerate(V):
        b = blank(v["example_en"], [v["en"]])
        if b:
            o = random.sample([w["en"] for j, w in enumerate(V) if j != i], 2)
            out.append(ex_item("fill_blank", id=eid("fb"), prompt_en="Fill in the blank", prompt_bn="শূন্যস্থান পূরণ করো", sentence=b[0], options=sh([b[1]] + o), answer=b[1]))
    for e in sh(ex_all)[:10]:
        t = e["en"].split(" ")
        if 3 <= len(t) <= 10:
            s = sh(t)
            if s == t: s = t[::-1]
            out.append(ex_item("order", id=eid("or"), prompt_en="Put the words in order", prompt_bn="শব্দগুলো সঠিক ক্রমে সাজাও", hint=e["bn"], hint_lang="bn", tokens=s, answer=e["en"]))
    lines = u["guidebook"]["dialogue"]["lines"]
    pool = [l["en"] for l in lines] + [s["text"] for s in u["speaking"]]
    for l in lines + [{"en": s["text"], "bn": s["bn"]} for s in u["speaking"][:3]]:
        d = random.sample([x for x in pool if x != l["en"]], 3)
        out.append(ex_item("listen", id=eid("ls"), prompt_en="Listen and choose what you hear", prompt_bn="শুনে যা শুনলে তা বেছে নাও", audio_text=l["en"], options=sh([l["en"]] + d), answer=l["en"], translation_bn=l["bn"]))
    return out

def walk(o, fn):
    if isinstance(o, list):
        for x in o: walk(x, fn)
    elif isinstance(o, dict):
        if "en" in o and "bn" in o and isinstance(o["en"], str): o["bn"] = fn(o["en"])
        if "example_en" in o: o["example_bn"] = fn(o["example_en"])
        if "note_en" in o: o["note_bn"] = fn(o["note_en"])
        if o.get("type") == "listen": o["translation_bn"] = fn(o["audio_text"])
        if o.get("type") == "order" and o.get("hint_lang") == "bn": o["hint"] = fn(o["answer"])
        if "text" in o and "bn" in o and "en" not in o: o["bn"] = fn(o["text"])
        for k, v in o.items():
            if isinstance(v, (list, dict)): walk(v, fn)

def main():
    course = json.loads((ROOT / "public" / "course.json").read_text(encoding="utf-8"))
    course["course"]["months"] = [m for m in course["course"]["months"] if m["month"] == 1]
    months = []
    for mno, (title, classes) in MONTHS.items():
        weeks = {}
        for c in classes:
            weeks.setdefault(c["week"], []).append(build_unit(mno, c))
        months.append({"id": f"m{mno}", "month": mno, "title": bi(title), "weeks": [{"id": f"m{mno}w{w}", "week": w, "classes": u} for w, u in sorted(weeks.items())]})
    cache = json.loads((REV / "bn_cache.json").read_text(encoding="utf-8")) if (REV / "bn_cache.json").exists() else {}
    stage = json.loads(STAGE_FILE.read_text(encoding="utf-8")) if STAGE_FILE.exists() else {}
    known = {**cache, **stage}
    need = set()
    def f(s): need.add(s); return known.get(s, "")
    walk(months, f)
    if "--strings" in sys.argv:
        todo = sorted(s for s in need if s not in cache)
        (REV / "bn_m2m3_en.json").write_text(json.dumps(todo, ensure_ascii=False, indent=1), encoding="utf-8")
        rows = ["# Bangla sheet: Months 2 and 3", "", "Fill the right-hand column with natural Bangladeshi Bengali. Keep English words, sounds and example sentences in English where they are being taught. Lines already translated for Month 1 are not repeated.", "",
                "| English | Bangla |", "|---|---|"] + [f"| {s.replace('|', '/')} | {stage.get(s, '')} |" for s in todo]
        (REV / "bn_review_m2m3.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
        print(len(todo), "strings to translate")
        return
    walk(months, lambda s: known.get(s, ""))
    # rebuild exercises that depend on translated text
    for m in months:
        for w in m["weeks"]:
            for u in w["classes"]:
                random.seed(u["no"])
                c = next(x for x in (MONTH2 + MONTH3) if x["no"] == u["no"])
                u["exercises"] = exercises(c, u)
                walk(u["exercises"], lambda s: known.get(s, ""))
    course["course"]["months"] += months
    (ROOT / "public" / "course.json").write_text(json.dumps(course, ensure_ascii=False, indent=1), encoding="utf-8")
    missing = len([s for s in need if s not in known])
    print("built months 2 and 3;", sum(len(u["exercises"]) for m in months for w in m["weeks"] for u in w["classes"]), "exercises;", missing, "strings still without Bangla")

main()
