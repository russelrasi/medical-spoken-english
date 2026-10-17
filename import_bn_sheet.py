#!/usr/bin/env python3
"""Load a corrected Bangla sheet (markdown table: | English | Bangla |) into revised/bn_m2m3.json.

Usage: python3 import_bn_sheet.py path/to/bn_review_m2m3.md
Then:  python3 build_curriculum.py && python3 build_months23.py   (rebuilds course.json)
Lines missing from the sheet keep their current Bangla. Em and en dashes are replaced with commas.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
target = ROOT / "revised" / "bn_m2m3.json"
cur = json.loads(target.read_text(encoding="utf-8")) if target.exists() else {}
keys = {k.replace("|", "/"): k for k in json.loads((ROOT / "revised" / "bn_m2m3_en.json").read_text(encoding="utf-8"))}
n = 0
for line in Path(sys.argv[1]).read_text(encoding="utf-8").splitlines():
    m = re.match(r"^\| (.+?) \| (.*) \|$", line)
    if not m or m.group(1) in ("English", "---"): continue
    en, bn = m.group(1), m.group(2).strip()
    if en in keys and bn:
        cur[keys[en]] = bn.replace("—", ", ").replace("–", ", "); n += 1
target.write_text(json.dumps(cur, ensure_ascii=False, indent=1), encoding="utf-8")
print(n, "lines loaded;", len([k for k in keys.values() if k not in cur]), "still missing")
