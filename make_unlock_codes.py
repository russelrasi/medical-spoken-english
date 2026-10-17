#!/usr/bin/env python3
"""Teacher unlock codes for the class gate.

  python3 make_unlock_codes.py              create codes if none exist (all classes except Class 1)
  python3 make_unlock_codes.py show 2       print the code for Class 2 (to paste into WhatsApp)
  python3 make_unlock_codes.py --rotate     make brand new codes (old codes stop working)

Writes the PRIVATE teacher/unlock_codes.json and teacher/unlock_codes.md (git-ignored: never commit them)
and the PUBLIC public/gates.json, which holds only salted SHA-256 hashes of the codes.
"""
import hashlib, json, secrets, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEACHER = ROOT / "teacher"
ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0, O, 1, I, L

def norm(code): return code.replace("-", "").replace(" ", "").upper()
def digest(class_id, code): return hashlib.sha256(f"medspoken:{class_id}:{norm(code)}".encode()).hexdigest()
def new_code():
    s = "".join(secrets.choice(ALPHABET) for _ in range(8))
    return s[:4] + "-" + s[4:]

def main():
    course = json.loads((ROOT / "public" / "course.json").read_text(encoding="utf-8"))["course"]
    units = [u for m in course["months"] for w in m["weeks"] for u in w["classes"] if u["no"] > 1]
    TEACHER.mkdir(exist_ok=True)
    store = TEACHER / "unlock_codes.json"
    codes = json.loads(store.read_text(encoding="utf-8")) if store.exists() and "--rotate" not in sys.argv else {}
    for u in units:
        codes.setdefault(u["id"], new_code())
    codes = {u["id"]: codes[u["id"]] for u in units}
    store.write_text(json.dumps(codes, indent=1), encoding="utf-8")
    (ROOT / "public" / "gates.json").write_text(json.dumps({k: digest(k, v) for k, v in codes.items()}, indent=1), encoding="utf-8")
    rows = ["# Teacher: unlock codes (private, do not share or commit)", "", "Send the code for a class on WhatsApp when the student may start it.", "", "| Class | Title | Code |", "|---|---|---|"]
    rows += [f"| {u['no']} | {u['title']['en']} | `{codes[u['id']]}` |" for u in units]
    (TEACHER / "unlock_codes.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    if len(sys.argv) > 2 and sys.argv[1] == "show":
        u = next(x for x in units if x["no"] == int(sys.argv[2]))
        print(f"Class {u['no']}: {codes[u['id']]}")
    else:
        print(f"{len(codes)} codes ready: teacher/unlock_codes.md (private) and public/gates.json (hashes)")

main()
