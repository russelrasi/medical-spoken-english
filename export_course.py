#!/usr/bin/env python3
"""Export the Medical Student Spoken English class dicts to public/course.json.

Shape: course -> months -> weeks -> classes -> exercises (+ guidebook, speaking).
Every exercise carries its own answer so the browser can grade without a server.

Usage:  python3 export_course.py [path/to/medical-english-course]
"""
import json
import random
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "medical-english-course"
OUT = Path(__file__).resolve().parent / "public" / "course.json"
sys.path.insert(0, str(SRC))

import m1_classes_1_6 as part1  # noqa: E402
import m1_classes_7_12 as part2  # noqa: E402

CLASSES = part1.CLASSES + part2.CLASSES
BLANK = "______"
rng = random.Random(7)  # stable output so course.json diffs stay small

THEMES = {1: "Foundation & Basic Sentence Formation"}
THEMES_BN = {1: "ভিত্তি ও মৌলিক বাক্য গঠন"}


def words(s):
    return s.split()


def strip_dashes(o):
    """Standing rule: no em or en dashes anywhere. Fail loudly instead of rewriting."""
    s = json.dumps(o, ensure_ascii=False)
    if "\u2014" in s or "\u2013" in s:
        raise SystemExit("em or en dash found in course data")


def uniq(seq):
    seen, out = set(), []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def pick_distractors(correct, pool, n):
    pool = [p for p in uniq(pool) if p != correct]
    rng.shuffle(pool)
    return pool[:n]


# ---------- builders ----------

def vocab_exercises(cid, vocab, pool_vocab):
    out = []
    for i, (en, bn, pron, ex_en, ex_bn) in enumerate(vocab):
        # Bangla meaning -> English word
        opts = pick_distractors(en, [v[0] for v in pool_vocab], 3)
        out.append({
            "id": f"c{cid}-vs-en{i}", "type": "vocab_select",
            "prompt_en": "Pick the English word for this meaning",
            "prompt_bn": "এই অর্থের ইংরেজি শব্দটি বেছে নাও",
            "stem": re.sub(r"\s*\([A-Za-z ,/]+\)", "", bn), "stem_lang": "bn", "options": [en] + opts, "answer": en,
            "option_lang": "en", "pron": pron,
        })
        # English word -> Bangla meaning
        opts = pick_distractors(bn, [v[1] for v in pool_vocab], 3)
        out.append({
            "id": f"c{cid}-vs-bn{i}", "type": "vocab_select",
            "prompt_en": "What does this word mean?",
            "prompt_bn": "শব্দটির অর্থ কী?",
            "stem": en, "stem_lang": "en", "options": [bn] + opts, "answer": bn,
            "option_lang": "bn", "speak": en,
        })
    return out


def match_exercises(cid, vocab, worksheet):
    out = []
    v = list(vocab)
    for k in range(0, len(v) - 3, 4):  # chunks of 4 vocab pairs
        chunk = v[k:k + 4]
        out.append({
            "id": f"c{cid}-mp-v{k // 4}", "type": "match",
            "prompt_en": "Match each word to its meaning",
            "prompt_bn": "প্রতিটি শব্দের সঙ্গে অর্থ মেলাও",
            "pairs": [{"left": x[0], "right": x[1]} for x in chunk],
            "left_lang": "en", "right_lang": "bn",
        })
    for wi, w in enumerate(worksheet):
        if w["kind"] != "match" or len(w["items"]) != len(w["answers"]):
            continue
        ans = w["answers"]
        # skip code answers (S/C, T/F, 1, 2) and duplicated answers: not a real pairing
        if len(set(ans)) != len(ans) or any(len(a) < 3 or a[0].isdigit() for a in ans):
            continue
        pairs = [{"left": l, "right": r} for l, r in zip(w["items"], ans)]
        rng.shuffle(pairs)
        for j in range(0, len(pairs), 5):
            chunk = pairs[j:j + 5]
            if len(chunk) < 3:
                chunk = pairs[-4:] if len(pairs) >= 4 else pairs
            out.append({
                "id": f"c{cid}-mp-w{wi}-{j // 5}", "type": "match",
                "prompt_en": w["title_en"].split(": ", 1)[-1],
                "prompt_bn": w["title_bn"].split(": ", 1)[-1] if ": " in w["title_bn"] else w["title_bn"],
                "pairs": chunk,
                "left_lang": "bn" if re.search(r"[ঀ-৿]", chunk[0]["left"]) else "en",
                "right_lang": "bn" if re.search(r"[ঀ-৿]", chunk[0]["right"]) else "en",
            })
    return out


def blank_exercises(cid, worksheet):
    out = []
    pool = []
    for w in worksheet:
        if w["kind"] == "blank" and len(w["items"]) == len(w["answers"]):
            pool += [a for a in w["answers"] if not a.isdigit()]
    for wi, w in enumerate(worksheet):
        if w["kind"] != "blank" or len(w["items"]) != len(w["answers"]):
            continue
        if any(a.isdigit() for a in w["answers"]):
            continue  # ordering-by-number items need paper, not a tap
        local = uniq(w["answers"])
        for i, (item, ans) in enumerate(zip(w["items"], w["answers"])):
            if BLANK not in item:
                continue
            # prefer other answers of the same exercise, then the class pool
            opts = pick_distractors(ans, local, 3)
            if len(opts) < 3:
                opts += pick_distractors(ans, [p for p in pool if p not in opts], 3 - len(opts))
            if len(opts) < 2:
                continue
            out.append({
                "id": f"c{cid}-fb-{wi}-{i}", "type": "fill_blank",
                "prompt_en": "Fill in the blank",
                "prompt_bn": "শূন্যস্থান পূরণ করো",
                "sentence": item, "options": [ans] + opts, "answer": ans,
                "note_en": w["title_en"].split(": ", 1)[-1],
            })
    return out


def order_exercises(cid, worksheet, dialogue, grammar_examples):
    out = []

    def add(eid, prompt_en, prompt_bn, hint, sentence, extra=None):
        toks = words(sentence)
        if not 3 <= len(toks) <= 12 or BLANK in sentence or " / " in sentence:
            return
        ex = {"id": eid, "type": "order", "prompt_en": prompt_en, "prompt_bn": prompt_bn,
              "hint": hint, "tokens": toks, "answer": sentence}
        if extra:
            ex.update(extra)
        out.append(ex)

    for wi, w in enumerate(worksheet):
        if w["kind"] != "lines" or len(w["items"]) != len(w["answers"]):
            continue
        if len(w["answers"]) == 1:
            continue  # personal writing
        for i, (item, ans) in enumerate(zip(w["items"], w["answers"])):
            if " / " in item and " / " in ans:
                continue
            if " / " in item:  # "student / a / am / I / medical" scrambled-words item
                add(f"c{cid}-or-{wi}-{i}", "Put the words in order", "শব্দগুলো সঠিক ক্রমে সাজাও",
                    "", ans)
            else:
                add(f"c{cid}-or-{wi}-{i}", "Build the correct sentence", "সঠিক বাক্যটি তৈরি করো",
                    item, ans)
    if dialogue:
        for i, (who, en, bn) in enumerate(dialogue["lines"]):
            if who.startswith("Task"):
                continue
            add(f"c{cid}-or-d{i}", "Build this sentence in English", "ইংরেজিতে বাক্যটি তৈরি করো",
                bn, en, {"hint_lang": "bn", "speak": en})
    for i, (en, bn) in enumerate(grammar_examples):
        add(f"c{cid}-or-g{i}", "Build this sentence in English", "ইংরেজিতে বাক্যটি তৈরি করো",
            bn, en, {"hint_lang": "bn", "speak": en})
    # de-duplicate by answer
    seen, res = set(), []
    for e in out:
        if e["answer"] in seen:
            continue
        seen.add(e["answer"])
        res.append(e)
    return res


def listen_exercises(cid, dialogue, vocab_examples):
    sents = []
    if dialogue:
        sents += [(en, bn) for who, en, bn in dialogue["lines"] if not who.startswith("Task")]
    sents += [(e[3], e[4]) for e in vocab_examples]
    sents = [(en, bn) for en, bn in sents if 3 <= len(words(en)) <= 14]
    sents = uniq(sents)
    out = []
    for i, (en, bn) in enumerate(sents):
        others = pick_distractors(en, [s[0] for s in sents], 3)
        if len(others) < 2:
            continue
        out.append({
            "id": f"c{cid}-ls-{i}", "type": "listen",
            "prompt_en": "Listen and choose what you hear",
            "prompt_bn": "শুনে যা শুনলে তা বেছে নাও",
            "audio_text": en, "options": [en] + others, "answer": en, "translation_bn": bn,
        })
    return out


def speaking_items(cid, dialogue, worksheet):
    """Repeat-after-me targets: Samira's lines (or any short line) with Bangla gloss."""
    if not dialogue or all(w.startswith("Task") for w, _, _ in dialogue["lines"]):
        # revision class: use correct sentences from the worksheet answer keys
        ans = [a for w in worksheet if w["kind"] == "lines" and len(w["answers"]) > 1
               for a in w["answers"] if " / " not in a and 3 <= len(words(a)) <= 14]
        return [{"text": a, "bn": ""} for a in uniq(ans)[:6]]
    lines = [(en, bn) for who, en, bn in dialogue["lines"] if not who.startswith("Task")]
    mine = [(en, bn) for who, en, bn in dialogue["lines"] if who in ("Samira", "Student")]
    chosen = [x for x in (mine or lines) if 3 <= len(words(x[0])) <= 14][:6]
    return [{"text": en, "bn": bn} for en, bn in chosen]


def guidebook(c):
    return {
        "objectives": [{"en": e, "bn": b} for e, b in c["objectives"]],
        "outcome": {"en": c["outcome_en"], "bn": c["outcome_bn"]},
        "grammar": [
            {
                "rule": {"en": g["rule_en"], "bn": g["rule_bn"]},
                "points": [{"en": e, "bn": b} for e, b in g["points"]],
                "examples": [{"en": e, "bn": b} for e, b in g["examples"]],
                "mistakes": [{"wrong": w, "right": r, "note_bn": n} for w, r, n in g["mistakes"]],
            }
            for g in c["grammar_blocks"]
        ],
        "vocab": [{"en": v[0], "bn": v[1], "pron": v[2], "example_en": v[3], "example_bn": v[4]}
                  for v in c["vocab"]],
        "dialogue": {
            "setting": {"en": c["dialogue"]["setting_en"], "bn": c["dialogue"]["setting_bn"]},
            "lines": [{"who": w, "en": e, "bn": b} for w, e, b in c["dialogue"]["lines"]],
        },
    }


def main():
    # vocabulary pool for revision (class 12 has no vocab of its own)
    all_vocab = [v for c in CLASSES for v in c["vocab"]]
    classes_out = []
    for c in CLASSES:
        cid = c["no"]
        dlg = c["dialogue"]
        revision = not c["vocab"]
        vocab = c["vocab"] or rng.sample(all_vocab, 8)
        # distractors: own class first, then neighbours so choices stay plausible
        pool_vocab = list(vocab) + [v for v in all_vocab if v not in vocab]
        ex = []
        ex += vocab_exercises(cid, vocab, pool_vocab)
        ex += match_exercises(cid, vocab, c["worksheet"])
        ex += blank_exercises(cid, c["worksheet"])
        ex += order_exercises(cid, c["worksheet"], dlg, [x for g in c["grammar_blocks"] for x in g["examples"]])
        ex += listen_exercises(cid, dlg, vocab)
        classes_out.append({
            "id": f"m{c['month']}w{c['week']}c{cid}", "no": cid,
            "month": c["month"], "week": c["week"],
            "title": {"en": c["title_en"], "bn": c["title_bn"]},
            "grammar": {"en": c["grammar_en"], "bn": c["grammar_bn"]},
            "revision": revision,
            "guidebook": guidebook(c),
            "speaking": speaking_items(cid, dlg, c["worksheet"]),
            "exercises": ex,
        })

    months = []
    for m in sorted({c["month"] for c in classes_out}):
        weeks = []
        for w in sorted({c["week"] for c in classes_out if c["month"] == m}):
            weeks.append({
                "id": f"m{m}w{w}", "week": w,
                "classes": [c for c in classes_out if c["month"] == m and c["week"] == w],
            })
        months.append({"id": f"m{m}", "month": m,
                       "title": {"en": THEMES.get(m, f"Month {m}"), "bn": THEMES_BN.get(m, "")},
                       "weeks": weeks})

    course = {
        "schema": 1,
        "course": {
            "id": "medical-spoken-english",
            "title": {"en": "Medical Student Spoken English", "bn": "মেডিকেল শিক্ষার্থীদের স্পোকেন ইংরেজি"},
            "learner": "Samira",
            "months": months,
        },
    }
    strip_dashes(course)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(course, ensure_ascii=False, indent=1), encoding="utf-8")
    for c in classes_out:
        from collections import Counter
        print(f"class {c['no']:>2}: {len(c['exercises']):>3} exercises",
              dict(Counter(e['type'] for e in c['exercises'])), f"speak={len(c['speaking'])}")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
