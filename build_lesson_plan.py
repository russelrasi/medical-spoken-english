#!/usr/bin/env python3
"""Write MONTH1_LESSON_PLAN.md from public/course.json and public/explainers/*.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
course = json.loads((ROOT / "public" / "course.json").read_text(encoding="utf-8"))["course"]
EXP = ROOT / "public" / "explainers"

def mmss(f): s = round(f / 30); return f"{s // 60}:{s % 60:02d}"

L = ["# Lesson Plan: Medical Student Spoken English (Months 1 to 3)", "",
     f"Learner: {course['learner']}. Thirty-six classes over twelve weeks (three classes a week). Each class is about 60 minutes of guided work plus 15 minutes of daily homework.", "",
     "## How each class runs", "",
     "| Minutes | Activity | In the app |", "|---|---|---|",
     "| 0 to 5 | Warm-up: say three sentences from the previous class aloud | Speaking practice (listen, repeat) |",
     "| 5 to 12 | Watch the explainer once, then pause and repeat the key sentences | Class sheet, Watch explainer |",
     "| 12 to 20 | Read the guidebook: rules, examples, mistakes | Guidebook |",
     "| 20 to 40 | Lesson: 10 mixed questions, then review the report | Start lesson |",
     "| 40 to 50 | Sound corner and Medical corner words, said aloud | Guidebook, Sound corner and vocabulary |",
     "| 50 to 60 | Record one voice message of the speaking sentences and send it to the teacher on WhatsApp | Speaking practice |",
     "| Homework | 15 minutes: the 100 mixed exercises, 20 to 30 per day, plus 5 minutes of speaking | Homework button |", "",
     "Use the end-of-lesson report as the teacher's checklist: slow questions show hesitation, mistakes link to the guidebook rule.", ""]
for m in course["months"]:
    L += [f"# Month {m['month']}: {m['title']['en']}", ""]
    for w in m["weeks"]:
        L += [f"## Week {w['week']}", ""]
        for u in w["classes"]:
            g = u["guidebook"]
            e = EXP / f"{u['id']}.json"
            ev = mmss(json.loads(e.read_text(encoding="utf-8"))["totalFrames"]) if e.exists() else "not built"
            vocab = g["vocab"]
            core, med = (vocab[:-6], vocab[-6:]) if 2 <= u["no"] <= 12 else (vocab, [])
            L += [f"### Class {u['no']}: {u['title']['en']}", "",
                  f"- **Focus:** {u['grammar']['en']}",
                  "- **Goals:** " + " ".join(o["en"] for o in g["objectives"]),
                  f"- **Words:** {', '.join(v['en'] for v in core)}" if core else "- **Words:** revision of the month",
                  f"- **Medical corner:** {', '.join(v['en'] for v in med)}" if med else ("- **Medical corner:** built into the word list (anatomy, patient, ward, stethoscope)" if u["no"] == 1 else ""),
                  "- **Sound corner:** " + g["grammar"][-1]["rule"]["en"].replace("Sound corner: ", ""),
                  f"- **Dialogue:** {g['dialogue']['setting']['en']}" if g["dialogue"]["lines"] else "",
                  f"- **Speaking:** {len(u['speaking'])} sentences to record",
                  f"- **In the app:** explainer {ev}, {len(u['exercises'])} exercises in the pool, homework of 100 mixed items.", ""]
            if u["no"] % 3 == 0 and not u["revision"]:
                L += [f"- **Week check (10 minutes):** after this class, do a speaking round of 5 questions covering Classes {u['no'] - 2} to {u['no']}; note slow answers.", ""]
            if u["revision"]:
                L += [f"- **Evaluation (end of Month {u['month']}):** written test (lesson plus homework items), a listening test (use listening exercises with new speakers), and a 2 minute speaking test: introduce yourself, describe your day, ask two questions, make one polite request.", ""]
L += ["## Not yet built", "",
      "- Grammar resequencing for Classes 3 to 5 and 8 (see CURRICULUM_REVIEW.md).",
      "- Weekly writing task, recycling warm-ups, recording self-check checklist.", ""]
(ROOT / "LESSON_PLAN.md").write_text("\n".join(l for l in L if l is not None), encoding="utf-8")
print("written")
