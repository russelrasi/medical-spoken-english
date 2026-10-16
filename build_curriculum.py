#!/usr/bin/env python3
"""Apply the revised curriculum to public/course.json.

- Class 1 is replaced by the revised Starter Pack class (build_revised_class1.build()).
- Classes 2 to 12 keep their content and gain a Medical corner (6 words) and a Sound corner (pronunciation).
- All new Bangla comes from Google Translate (translate.googleapis.com), cached in revised/bn_cache.json.
  revised/bn_review.md is the teacher-corrected sheet; its wording is loaded into the cache (the cache wins over Google).

Start from the pristine export in revised/course.original.json, so the script is safe to re-run.
Usage: python3 build_curriculum.py
Then:  ../medical-english-app/.venv/bin/python generate_audio.py && ./pad_audio.sh
"""
import json, random, re, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import build_revised_class1 as r1

ROOT = Path(__file__).resolve().parent
REV = ROOT / "revised"
CACHE_FILE = REV / "bn_cache.json"
random.seed(23)

# (en, pron, example) per class: the Medical corner.
MEDICAL = {
 2: [("Head", "HED", "My head hurts."), ("Chest", "CHEST", "The pain is in my chest."), ("Arm", "ARM", "He broke his arm."),
     ("Leg", "LEG", "My leg is swollen."), ("Heart", "HART", "The heart is in the chest."), ("Lungs", "LUNGZ", "The lungs help us breathe.")],
 3: [("Pulse", "PULS", "The nurse checks the pulse."), ("Temperature", "TEM-per-a-cher", "My temperature is normal."), ("Blood pressure", "BLUD PRESH-er", "The doctor checks the blood pressure."),
     ("Dose", "DOHS", "Take one dose every morning."), ("Tablet", "TAB-let", "I take a tablet after breakfast."), ("Rest", "REST", "The patient needs rest.")],
 4: [("Breathing", "BREE-thing", "The patient is breathing normally."), ("Coughing", "KOF-ing", "She is coughing at night."), ("Bleeding", "BLEE-ding", "The wound is bleeding."),
     ("Sleeping", "SLEE-ping", "The baby is sleeping."), ("Healing", "HEE-ling", "The wound is healing well."), ("Recovering", "ri-KUV-er-ing", "He is recovering after surgery.")],
 5: [("Appetite", "AP-e-tyt", "I have a good appetite."), ("Exercise", "EK-ser-syz", "Exercise is good for the heart."), ("Diet", "DY-et", "A healthy diet is important."),
     ("Sleep", "SLEEP", "Sleep helps the body heal."), ("Stress", "STRES", "Stress can affect your health."), ("Healthy", "HEL-thee", "She likes healthy food.")],
 6: [("Clinic", "KLIN-ik", "Where is the clinic?"), ("Laboratory", "la-BOR-a-tree", "The laboratory opens at eight."), ("Pharmacy", "FAR-ma-see", "The pharmacy is on the ground floor."),
     ("Emergency room", "i-MER-jen-see ROOM", "The emergency room is open all night."), ("Reception", "ri-SEP-shen", "Please wait at the reception."), ("Appointment", "a-POINT-ment", "When is your appointment?")],
 7: [("Admitted", "ad-MIT-id", "The patient was admitted yesterday."), ("Discharged", "dis-CHARJD", "He was discharged on Friday."), ("Examined", "eg-ZAM-ind", "The doctor examined the patient."),
     ("Operated", "OP-er-ay-tid", "The surgeon operated last night."), ("Prescribed", "pri-SKRYBD", "She prescribed an antibiotic."), ("Recovered", "ri-KUV-erd", "The patient recovered quickly.")],
 8: [("Felt", "FELT", "I felt dizzy yesterday."), ("Broke", "BROHK", "He broke his arm."), ("Hurt", "HERT", "She hurt her back."),
     ("Caught", "KAWT", "I caught a cold last week."), ("Lost weight", "LOST WAYT", "He lost weight last month."), ("Took medicine", "TUK MED-i-sin", "She took medicine and slept.")],
 9: [("Surgery", "SER-jer-ee", "The surgery will be tomorrow."), ("Follow-up", "FOL-oh-up", "I have a follow-up next week."), ("Test result", "TEST ri-ZULT", "The test result will come on Monday."),
     ("Vaccination", "vak-si-NAY-shen", "I will get a vaccination next month."), ("Check-up", "CHEK-up", "I am going to have a check-up."), ("Referral", "ri-FER-al", "The doctor will write a referral.")],
 10: [("Pain", "PAYN", "Do you have any pain?"), ("Fever", "FEE-ver", "Do you have a fever?"), ("Cough", "KOF", "How long have you had the cough?"),
      ("Rash", "RASH", "Could you show me the rash?"), ("Allergy", "AL-er-jee", "Do you have any allergies?"), ("Medicine", "MED-i-sin", "Could you take this medicine twice a day?")],
 11: [("Sharp", "SHARP", "The pain is sharp."), ("Dull", "DUL", "There is a dull ache in my back."), ("Mild", "MYLD", "The fever is mild."),
      ("Severe", "se-VEER", "The pain is severe."), ("Swollen", "SWOH-len", "His ankle is swollen."), ("Painful", "PAYN-ful", "The injection is painful.")],
 12: [("Nurse", "NERS", "The nurse is very kind."), ("Surgeon", "SER-jen", "The surgeon is in the theatre."), ("Specialist", "SPESH-a-list", "She is a heart specialist."),
      ("Ambulance", "AM-byoo-lens", "The ambulance is outside."), ("Prescription", "pri-SKRIP-shen", "Here is your prescription."), ("Symptom", "SIMP-tem", "Fever is a common symptom.")],
}

# Sound corner per class: rule, 2 points, 3 examples, 1 mistake.
SOUND = {
 2: ("Sound corner: the h in have and has.", ["Start have and has with a breath of air, like fogging a mirror. Do not drop the h.", "In mother, father and brother, the th is soft, with your tongue between your teeth."],
     ["I have two brothers.", "She has a younger sister.", "My mother and father are doctors."], ("I ave a sister.", "I have a sister.", "Say the h at the start of have.")),
 3: ("Sound corner: the three sounds of the -s ending.", ["After soft sounds the s says s: works, sleeps. After voiced sounds it says z: studies, reads.", "After s, sh and ch sounds it adds a syllable: watches, washes."],
     ["She works in the hospital.", "He studies every night.", "My roommate watches videos."], ("She watch TV.", "She watches TV.", "Add es and say the extra syllable.")),
 4: ("Sound corner: the -ing ending.", ["End -ing with the back of your tongue, as one sound. Do not add a hard g after it.", "Keep the vowel in -ing short: reading, studying."],
     ["I am reading my notes.", "She is studying anatomy.", "They are waiting outside."], ("I am readin.", "I am reading.", "Do not drop the -ing ending.")),
 5: ("Sound corner: word stress.", ["In English one syllable is stronger, longer and louder. Hobby is HOB-by. Enjoy is en-JOY.", "Wrong stress can make a word hard to understand."],
     ["My hobby is reading.", "I enjoy cooking.", "My favourite cuisine is Bengali food."], ("My hob-BY is reading.", "My HOB-by is reading.", "Stress the first syllable of hobby.")),
 6: ("Sound corner: question intonation.", ["Wh-questions usually fall at the end: Where do you live? Yes or no questions usually rise: Do you live here?", "Rising and falling voice shows your meaning and sounds polite."],
     ["Where do you live?", "Do you live in the hostel?", "When is the lecture?"], ("Where do you live? (voice goes up)", "Where do you live? (voice goes down)", "Let your voice fall at the end of a wh-question.")),
 7: ("Sound corner: three sounds of -ed.", ["After t or d, say an extra syllable: wanted, needed. After soft sounds say t: worked, stopped.", "After voiced sounds say d: played, studied."],
     ["I wanted a break.", "She worked all night.", "We studied anatomy yesterday."], ("I want a break yesterday.", "I wanted a break yesterday.", "Say the -ed ending. Wanted has two syllables.")),
 8: ("Sound corner: linking words.", ["In fast speech words join together: went to sounds like wen-tu.", "Link a final consonant to the next vowel: took a break sounds like too-ka break."],
     ["I went to the market.", "She took a break.", "We got up early."], ("I went. To. The. Market.", "I went to the market.", "Say the words as one smooth group, not one at a time.")),
 9: ("Sound corner: I'll and won't.", ["I'll sounds like aisle. Won't has a clear t at the end.", "Will is short in speech: She'll come tomorrow."],
     ["I'll call you tomorrow.", "She'll join us next week.", "I won't be late."], ("I want be late.", "I won't be late.", "Won't rhymes with don't. Want is a different word.")),
 10: ("Sound corner: polite intonation.", ["Polite requests start a little higher and end with a gentle rise: Could you help me, please?", "A flat, falling voice can sound rude even with the right words."],
      ["Could you help me, please?", "May I ask a question?", "Would you mind repeating that?"], ("Help me. (flat voice)", "Could you help me, please? (soft, rising voice)", "Use polite words and a soft, rising voice.")),
 11: ("Sound corner: stressing adjectives.", ["Stress the adjective to carry the meaning: a SPA-cious room, a QUI-et street.", "In There is a, the words there is are weak and fast."],
      ["There is a spacious room.", "The hostel is clean and quiet.", "It is a very crowded ward."], ("Spacious (stress on cious)", "Spacious (stress on SPA)", "Stress the first syllable: SPA-cious.")),
 12: ("Sound corner: review of v, w and th.", ["Say v with your top teeth on your lip. Say w with round lips. Say th with your tongue between your teeth.", "Record yourself and listen for these three sounds."],
      ["The vein is very visible.", "We went west on Wednesday.", "I think this is the third lecture."], ("I tink so.", "I think so.", "Put your tongue between your teeth for th.")),
}

def bi(en): return {"en": en, "bn": ""}

def pieces(no):
    """New content for a class 2 to 12: vocab entries, one grammar block, extra exercises."""
    vocab = [{"en": e, "bn": "", "pron": p, "example_en": ex, "example_bn": ""} for e, p, ex in MEDICAL[no]]
    rule, pts, exs, (w, rt, note) = SOUND[no]
    block = {"rule": bi(rule), "points": [bi(x) for x in pts], "examples": [bi(x) for x in exs],
             "mistakes": [{"wrong": w, "right": rt, "note_en": note, "note_bn": ""}]}
    return vocab, block

def exercises(no, vocab, block):
    out, n = [], [0]
    def eid(p): n[0] += 1; return f"r{no}-{p}-{n[0]}"
    sh = lambda x: random.sample(list(x), len(x))
    for i, v in enumerate(vocab):
        o = random.sample([w for j, w in enumerate(vocab) if j != i], 3)
        out.append({"id": eid("vs"), "type": "vocab_select", "prompt_en": "Pick the English word for this meaning", "prompt_bn": "এই অর্থের ইংরেজি শব্দটি বেছে নাও",
                    "stem": v["bn"], "stem_lang": "bn", "option_lang": "en", "options": sh([v["en"]] + [x["en"] for x in o]), "answer": v["en"], "pron": v["pron"]})
        out.append({"id": eid("vs"), "type": "vocab_select", "prompt_en": "Pick the meaning of this word", "prompt_bn": "শব্দটির অর্থ বেছে নাও",
                    "stem": v["en"], "stem_lang": "en", "option_lang": "bn", "options": sh([v["bn"]] + [x["bn"] for x in o]), "answer": v["bn"], "pron": v["pron"], "speak": v["en"]})
    out.append({"id": eid("mp"), "type": "match", "prompt_en": "Match each word to its meaning", "prompt_bn": "প্রতিটি শব্দের সঙ্গে অর্থ মেলাও",
                "pairs": [{"left": v["en"], "right": v["bn"]} for v in vocab[:4]], "left_lang": "en", "right_lang": "bn"})
    sents = [(v["example_en"], v["example_bn"]) for v in vocab[:3]] + [(e["en"], e["bn"]) for e in block["examples"]]
    for en, bn in sents:
        d = random.sample([s[0] for s in sents if s[0] != en], 3)
        out.append({"id": eid("ls"), "type": "listen", "prompt_en": "Listen and choose what you hear", "prompt_bn": "শুনে যা শুনলে তা বেছে নাও",
                    "audio_text": en, "options": sh([en] + d), "answer": en, "translation_bn": bn})
    for en, bn in sents[3:5]:
        t = en.split(" ")
        if len(t) >= 3:
            s = sh(t)
            if s == t: s = t[::-1]
            out.append({"id": eid("or"), "type": "order", "prompt_en": "Put the words in order", "prompt_bn": "শব্দগুলো সঠিক ক্রমে সাজাও", "hint": bn, "hint_lang": "bn", "tokens": s, "answer": en})
    return out

# ---- Bangla via Google Translate ---------------------------------------------------------------
def load_cache(): return json.loads(CACHE_FILE.read_text(encoding="utf-8")) if CACHE_FILE.exists() else {}

# A few short phrases come out literal or wrong from Google; ask Google for a more natural English paraphrase instead.
VIA = {"Could you repeat that, please?": "Could you please say that again?", "Would you mind repeating that?": "Could you please say that again?"}

def google(text):
    asked = VIA.get(text, text)
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=" + urllib.parse.quote(asked)
    for _ in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
                data = json.loads(r.read().decode("utf-8"))
            out = "".join(seg[0] for seg in data[0] if seg[0]).strip().replace("—", ", ").replace("–", ", ")
            return out[:-1] + "।" if out.endswith(".") else out
        except Exception:
            pass
    raise RuntimeError("translate failed: " + text)

def walk(o, fn):
    """Call fn(en_text) for every English string that needs a Bangla counterpart, and fill the bn slot."""
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
    course = json.loads((REV / "course.original.json").read_text(encoding="utf-8"))
    units = {u["id"]: u for m in course["course"]["months"] for w in m["weeks"] for u in w["classes"]}
    new_class1 = r1.build()
    # Exercises must be built from translated vocab, so translate vocab and blocks first.
    adds = {}
    for u in units.values():
        if u["no"] >= 2:
            v, b = pieces(u["no"])
            adds[u["no"]] = (v, b)
    cache = load_cache()
    need = set()
    def collect(s): need.add(s); return cache.get(s, "")
    walk(new_class1, collect)
    for v, b in adds.values():
        walk(v, collect); walk(b, collect)
        # vocab word and its Bangla (en/bn pair handled above); examples used by exercises
    need -= set(cache)
    if need:
        print("translating", len(need), "strings with Google ...")
        with ThreadPoolExecutor(8) as ex:
            for s, t in zip(sorted(need), ex.map(google, sorted(need))): cache[s] = t
        CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")
    fn = lambda s: cache[s]
    walk(new_class1, fn)
    # Keep the original course title and grammar line (with their original Bangla): mixed English/Bangla headings translate badly.
    new_class1["title"], new_class1["grammar"] = units["m1w1c1"]["title"], units["m1w1c1"]["grammar"]
    # class 1 exercise hints/translations derive from the (now translated) strings
    for u in units.values():
        if u["no"] >= 2:
            v, b = adds[u["no"]]
            walk(v, fn); walk(b, fn)
            ex = exercises(u["no"], v, b)
            walk(ex, fn)
            u["guidebook"]["vocab"] = u["guidebook"]["vocab"] + v
            u["guidebook"]["grammar"] = u["guidebook"]["grammar"] + [b]
            u["exercises"] = u["exercises"] + ex
    for m in course["course"]["months"]:
        for w in m["weeks"]:
            w["classes"] = [new_class1 if c["id"] == "m1w1c1" else c for c in w["classes"]]
    (ROOT / "public" / "course.json").write_text(json.dumps(course, ensure_ascii=False, indent=1), encoding="utf-8")
    print("done:", sum(len(u["exercises"]) for m in course["course"]["months"] for w in m["weeks"] for u in w["classes"]), "exercises total")

main()
