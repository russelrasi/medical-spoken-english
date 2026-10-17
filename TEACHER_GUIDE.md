# Teacher guide: unlocking classes

Class 1 is open. Every other class stays locked until you send a code.

1. When the student has sent her recording and you are happy, open `teacher/unlock_codes.md` (private, on this computer only; it is never committed to GitHub).
2. Copy the code for the next class (for example Class 2: `XXXX-XXXX`) and send it to her on WhatsApp.
3. She opens the class on the dashboard, types the code, and the class opens. It stays open on her phone.

Useful commands (run in the project folder):

```bash
python3 make_unlock_codes.py show 5     # print the code for Class 5
python3 make_unlock_codes.py --rotate   # make all new codes (old codes stop working), then commit and push public/gates.json
```

Notes
- Codes are per class and case does not matter; the hyphen is optional.
- A class she has already started stays open.
- This is a pacing gate, not security: the lesson files are public on the website, so a very technical student could still find them. Do not share `teacher/`.
- If `public/gates.json` is missing, the gate switches off (all classes open).
