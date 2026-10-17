#!/usr/bin/env python3
"""Merge ChatGPT batch replies (/tmp/bn/rNN.txt) into revised/bn_m2m3.json (a draft for teacher review)."""
import json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
out, bad = {}, []
for i in range(0, 30):
    r, b = Path(f"/tmp/bn/r{i:02d}.txt"), Path(f"/tmp/bn/b{i:02d}.json")
    if not b.exists(): continue
    src = json.loads(b.read_text(encoding="utf-8"))
    try:
        t = re.sub(r"^\s*json\s*\n", "", r.read_text(encoding="utf-8").strip(), flags=re.I)
        arr = json.loads(t)
        assert len(arr) == len(src)
    except Exception as e:
        bad.append(i); continue
    for en, bn in zip(src, arr): out[en] = bn.replace("—", ", ").replace("–", ", ")
(ROOT / "revised" / "bn_m2m3.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
rows = ["# Bangla sheet: Months 2 and 3 (ChatGPT draft, needs teacher review)", "", "| English | Bangla |", "|---|---|"]
rows += [f"| {k.replace('|', '/')} | {v.replace('|', '/')} |" for k, v in sorted(out.items())]
(ROOT / "revised" / "bn_review_m2m3_draft.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
print(len(out), "translated; bad batches:", bad)
