#!/usr/bin/env python3
"""Build the revised Class 1 (Starter Pack & the Verb 'To Be') and insert it next to the original in
public/course.json for side-by-side comparison. Safe to re-run (replaces the previous copy).

Usage: python3 build_revised_class1.py
Then:  ../medical-english-app/.venv/bin/python generate_audio.py && ./pad_audio.sh
"""
import json, random
from pathlib import Path

ROOT = Path(__file__).resolve().parent
COURSE = ROOT / "public" / "course.json"
random.seed(11)

def bi(en, bn): return {"en": en, "bn": bn}

VOCAB = [  # en, bn, pron, example_en, example_bn
 ("Student", "শিক্ষার্থী", "STEW-dent", "I am a student.", "আমি একজন শিক্ষার্থী।"),
 ("Anatomy", "শারীরবিদ্যা", "a-NAT-o-mee", "Anatomy is my first subject.", "শারীরবিদ্যা আমার প্রথম বিষয়।"),
 ("Lecture", "লেকচার", "LEK-cher", "The lecture is at nine o'clock.", "লেকচারটি নয়টায়।"),
 ("Patient", "রোগী", "PAY-shent", "The patient is in the ward.", "রোগী ওয়ার্ডে আছেন।"),
 ("Hospital", "হাসপাতাল", "HOS-pi-tal", "The hospital is near the college.", "হাসপাতালটি কলেজের কাছে।"),
 ("Ward", "ওয়ার্ড", "WORD", "The ward is very clean.", "ওয়ার্ডটি খুব পরিষ্কার।"),
 ("Library", "লাইব্রেরি", "LY-brer-ee", "The library is quiet.", "লাইব্রেরিটি শান্ত।"),
 ("Textbook", "পাঠ্যবই", "TEKST-book", "My textbook is heavy.", "আমার পাঠ্যবইটি ভারী।"),
 ("Hostel", "হোস্টেল", "HOS-tel", "My hostel is close to the college.", "আমার হোস্টেল কলেজের কাছে।"),
 ("Teacher", "শিক্ষক", "TEE-cher", "She is our teacher.", "তিনি আমাদের শিক্ষক।"),
 ("Stethoscope", "স্টেথোস্কোপ", "STETH-o-skope", "The stethoscope is on the table.", "স্টেথোস্কোপটি টেবিলে আছে।"),
 ("Classmate", "সহপাঠী", "KLAS-mayt", "He is my classmate.", "সে আমার সহপাঠী।"),
]

SUBJ = [("I", "am"), ("He", "is"), ("She", "is"), ("It", "is"), ("You", "are"), ("We", "are"), ("They", "are"),
        ("The patient", "is"), ("My parents", "are"), ("The students", "are"), ("Samira", "is"), ("The teacher", "is")]
PRED = ["in the library", "at the hospital", "ready for the lecture", "from Bangladesh", "very tired today", "in the ward", "late for anatomy", "new here"]

GRAMMAR = [
 {"rule": bi("Rule 1: Every English sentence follows Subject + Verb + Object.", "নিয়ম ১: প্রতিটি ইংরেজি বাক্য কর্তা + ক্রিয়া + কর্ম ক্রমে চলে।"),
  "points": [bi("In English the verb sits in the middle, right after the subject. Never drop it.", "ইংরেজিতে ক্রিয়া মাঝখানে, কর্তার ঠিক পরে বসে। ক্রিয়া কখনও বাদ দেবেন না।"),
             bi("Try it with your own name: I am (your name).", "নিজের নাম দিয়ে চেষ্টা করুন: I am (আপনার নাম)।")],
  "examples": [bi("I am Samira.", "আমি সামিরা।"), bi("I am a medical student.", "আমি একজন মেডিকেল শিক্ষার্থী।"),
               bi("My college is in Cairo.", "আমার কলেজ কায়রোতে।"), bi("My parents are in Saudi Arabia.", "আমার বাবা-মা সৌদি আরবে আছেন।")],
  "mistakes": [{"wrong": "I student.", "right": "I am a student.", "note_en": "Every English sentence needs a verb. Do not drop am, is or are.", "note_bn": ""},
               {"wrong": "I am agree.", "right": "I agree.", "note_en": "Agree is already a verb, so do not put am before it.", "note_bn": ""}]},
 {"rule": bi("Rule 2: Choose am, is or are according to the subject.", "নিয়ম ২: কর্তা অনুযায়ী am, is বা are বাছাই করুন।"),
  "points": [bi("I uses am. He, she, it and one person or thing use is. You, we, they and two or more use are.", "I এর সঙ্গে am. He, she, it এবং একজন বা একটি বস্তুর সঙ্গে is. You, we, they এবং দুই বা তার বেশির সঙ্গে are."),
             bi("He is for a male and she is for a female.", "ছেলের জন্য he, মেয়ের জন্য she।")],
  "examples": [bi("She is our anatomy teacher.", "তিনি আমাদের শারীরবিদ্যার শিক্ষক।"), bi("The patient is in the ward.", "রোগী ওয়ার্ডে আছেন।"),
               bi("You are very helpful.", "আপনি খুব সহায়ক।"), bi("They are from Egypt.", "তারা মিশরের।"),
               bi("We are first-year students.", "আমরা প্রথম বর্ষের শিক্ষার্থী।"), bi("It is a difficult subject.", "এটি একটি কঠিন বিষয়।")],
  "mistakes": [{"wrong": "He is my sister.", "right": "She is my sister.", "note_en": "For a girl or woman, always use she.", "note_bn": ""},
               {"wrong": "My parents is in Saudi Arabia.", "right": "My parents are in Saudi Arabia.", "note_en": "Parents means two people, so use are.", "note_bn": ""}]},
 {"rule": bi("Rule 3: Classroom language. Five phrases you will use every day.", "নিয়ম ৩: ক্লাসরুমের ভাষা। প্রতিদিন কাজে লাগবে এমন পাঁচটি বাক্য।"),
  "points": [bi("Ask politely: Could you repeat that, please? Could you speak more slowly?", "ভদ্রভাবে বলুন: Could you repeat that, please? Could you speak more slowly?"),
             bi("Ask about words: What does anatomy mean? How do you spell that?", "শব্দ নিয়ে প্রশ্ন: What does anatomy mean? How do you spell that?")],
  "examples": [bi("Could you repeat that, please?", "আপনি কি দয়া করে আবার বলবেন?"), bi("Could you speak more slowly?", "আপনি কি আরেকটু ধীরে বলবেন?"),
               bi("Sorry, I did not understand.", "দুঃখিত, আমি বুঝতে পারিনি।"), bi("What does anatomy mean?", "Anatomy মানে কী?"),
               bi("How do you spell that?", "এটি কীভাবে বানান করবেন?")],
  "mistakes": [{"wrong": "What is the meaning of anatomy?", "right": "What does anatomy mean?", "note_en": "Both are correct, but in class the short, natural form is What does anatomy mean?", "note_bn": ""},
               {"wrong": "Repeat again.", "right": "Could you repeat that, please?", "note_en": "Repeat again sounds rude, and again is extra. Say Could you repeat that, please?", "note_bn": ""}]},
 {"rule": bi("Sound corner: v and w, and the th sound.", "উচ্চারণ কর্নার: v ও w, এবং th ধ্বনি।"),
  "points": [bi("For v, touch your top teeth to your bottom lip and let the voice buzz. For w, round your lips and do not touch your teeth.", "v এর জন্য ওপরের দাঁত নিচের ঠোঁটে ছোঁয়ান এবং স্বর কাঁপান। w এর জন্য ঠোঁট গোল করুন, দাঁত ছোঁয়াবেন না।"),
             bi("For th, put the tip of your tongue between your teeth and blow gently: think, this, three.", "th এর জন্য জিভের ডগা দাঁতের মাঝে রেখে আলতো করে ফুঁ দিন: think, this, three।")],
  "examples": [bi("The vein is very visible.", "শিরাটি খুব দৃশ্যমান।"), bi("We went west on Wednesday.", "আমরা বুধবার পশ্চিমে গিয়েছিলাম।"),
               bi("I think this is the third lecture.", "আমার মনে হয় এটি তৃতীয় লেকচার।"), bi("Thank you for the thick textbook.", "মোটা পাঠ্যবইটির জন্য ধন্যবাদ।")],
  "mistakes": [{"wrong": "I am wery well.", "right": "I am very well.", "note_en": "For very, touch your top teeth to your bottom lip. It is not a w sound.", "note_bn": ""},
               {"wrong": "I tink so.", "right": "I think so.", "note_en": "For think, put your tongue between your teeth. It is not a t or d sound.", "note_bn": ""}]},
]

DIALOGUE = {"setting": bi("Samira meets her anatomy teacher before the first lecture.", "প্রথম লেকচারের আগে সামিরা তার শারীরবিদ্যার শিক্ষকের সঙ্গে দেখা করে।"),
 "lines": [
  {"who": "Teacher", "en": "Good morning. Are you a new student?", "bn": "সুপ্রভাত। তুমি কি নতুন শিক্ষার্থী?"},
  {"who": "Samira", "en": "Good morning, sir. Yes, I am. My name is Samira.", "bn": "সুপ্রভাত, স্যার। জি, আমি। আমার নাম সামিরা।"},
  {"who": "Teacher", "en": "Welcome, Samira. I am your anatomy teacher.", "bn": "স্বাগতম, সামিরা। আমি তোমার শারীরবিদ্যার শিক্ষক।"},
  {"who": "Samira", "en": "Sorry, sir. Could you repeat that, please?", "bn": "দুঃখিত, স্যার। আপনি কি দয়া করে আবার বলবেন?"},
  {"who": "Teacher", "en": "Of course. I am your anatomy teacher.", "bn": "অবশ্যই। আমি তোমার শারীরবিদ্যার শিক্ষক।"},
  {"who": "Samira", "en": "Thank you, sir. I am happy to meet you.", "bn": "ধন্যবাদ, স্যার। আপনার সাথে পরিচিত হয়ে আমি খুশি।"}]}

SPEAKING = [
 ("Good morning, sir. Yes, I am. I am new here.", "সুপ্রভাত, স্যার। জি, আমি। আমি এখানে নতুন।"),
 ("My name is Samira. I am a first-year medical student.", "আমার নাম সামিরা। আমি প্রথম বর্ষের মেডিকেল শিক্ষার্থী।"),
 ("Sorry, sir. Could you repeat that, please?", "দুঃখিত, স্যার। আপনি কি দয়া করে আবার বলবেন?"),
 ("The vein is very visible.", "শিরাটি খুব দৃশ্যমান।"),
 ("Thank you, sir. I am happy to meet you.", "ধন্যবাদ, স্যার। আপনার সাথে পরিচিত হয়ে আমি খুশি।"),
]

_n = [0]
def eid(p): _n[0] += 1; return f"r1-{p}-{_n[0]}"
def shuf(x): x = list(x); random.shuffle(x); return x

def ex_vocab():
    out = []
    for i, v in enumerate(VOCAB):
        others = [w for j, w in enumerate(VOCAB) if j != i]
        o = random.sample(others, 3)
        out.append({"id": eid("vs"), "type": "vocab_select", "prompt_en": "Pick the English word for this meaning", "prompt_bn": "এই অর্থের ইংরেজি শব্দটি বেছে নাও",
                    "stem": v[1], "stem_lang": "bn", "option_lang": "en", "options": shuf([v[0]] + [x[0] for x in o]), "answer": v[0], "pron": v[2]})
        out.append({"id": eid("vs"), "type": "vocab_select", "prompt_en": "Pick the meaning of this word", "prompt_bn": "শব্দটির অর্থ বেছে নাও",
                    "stem": v[0], "stem_lang": "en", "option_lang": "bn", "options": shuf([v[1]] + [x[1] for x in o]), "answer": v[1], "pron": v[2], "speak": v[0]})
    return out

def ex_match():
    out = []
    for k in range(3):
        grp = VOCAB[k * 4:(k + 1) * 4]
        out.append({"id": eid("mp"), "type": "match", "prompt_en": "Match each word to its meaning", "prompt_bn": "প্রতিটি শব্দের সঙ্গে অর্থ মেলাও",
                    "pairs": [{"left": g[0], "right": g[1]} for g in grp], "left_lang": "en", "right_lang": "bn"})
    return out

def ex_fill():
    out = []
    combos = [(s, b, p) for s, b in SUBJ for p in PRED]
    for s, b, p in random.sample(combos, 18):
        out.append({"id": eid("fb"), "type": "fill_blank", "prompt_en": "Fill in the blank", "prompt_bn": "শূন্যস্থান পূরণ করো",
                    "sentence": f"{s} ______ {p}.", "options": ["am", "is", "are"], "answer": b, "note_en": "Choose am, is or are"})
    cl = [("Could you ______ that, please?", ["repeat", "say", "tell"], "repeat"), ("Could you speak more ______?", ["slowly", "slow", "slower"], "slowly"),
          ("What ______ anatomy mean?", ["does", "do", "is"], "does"), ("How do you ______ that?", ["spell", "spelling", "spells"], "spell")]
    for s, o, a in cl:
        out.append({"id": eid("fb"), "type": "fill_blank", "prompt_en": "Fill in the blank", "prompt_bn": "শূন্যস্থান পূরণ করো", "sentence": s, "options": o, "answer": a})
    return out

def ex_order():
    sents = [(e["en"], e["bn"]) for b in GRAMMAR for e in b["examples"]][:]
    sents = [x for x in sents if 3 <= len(x[0].split()) <= 9]
    out = []
    for en, bn in random.sample(sents, 14):
        t = en.split(" ")
        while True:
            s = shuf(t)
            if s != t: break
        out.append({"id": eid("or"), "type": "order", "prompt_en": "Put the words in order", "prompt_bn": "শব্দগুলো সঠিক ক্রমে সাজাও", "hint": bn, "hint_lang": "bn", "tokens": s, "answer": en})
    return out

def ex_listen():
    pool = [l["en"] for l in DIALOGUE["lines"]] + [s[0] for s in SPEAKING]
    out = []
    for l in DIALOGUE["lines"]:
        d = random.sample([x for x in pool if x != l["en"]], 3)
        out.append({"id": eid("ls"), "type": "listen", "prompt_en": "Listen and choose what you hear", "prompt_bn": "শুনে যা শুনলে তা বেছে নাও",
                    "audio_text": l["en"], "options": shuf([l["en"]] + d), "answer": l["en"], "translation_bn": l["bn"]})
    # sound contrasts and numbers: the classic confusions for Bangla speakers
    pairs = [("Thirteen", ["Thirteen", "Thirty", "Third"], "তেরো"), ("Fifteen", ["Fifteen", "Fifty", "Fifth"], "পনেরো"),
             ("Sixteen", ["Sixteen", "Sixty", "Sixth"], "ষোলো"), ("Eighteen", ["Eighteen", "Eighty", "Eight"], "আঠারো"),
             ("West", ["West", "Vest", "Rest"], "পশ্চিম"), ("Very", ["Very", "Wary", "Berry"], "খুব"),
             ("Think", ["Think", "Sink", "Tink"], "মনে করা")]
    for a, o, bn in pairs:
        out.append({"id": eid("ls"), "type": "listen", "prompt_en": "Listen and choose what you hear", "prompt_bn": "শুনে যা শুনলে তা বেছে নাও",
                    "audio_text": a, "options": shuf(o), "answer": a, "translation_bn": bn})
    return out

def ex_sound():
    q = [("Which word has the v sound?", ["vest", "west", "rest"], "vest"), ("Which word has the w sound?", ["very", "west", "vein"], "west"),
         ("Which word has the th sound?", ["think", "sink", "tank"], "think"), ("Which word starts with the v sound?", ["wine", "vine", "line"], "vine")]
    return [{"id": eid("vs"), "type": "vocab_select", "prompt_en": s, "prompt_bn": "ধ্বনি চেনো", "stem": {"vest": "v", "west": "w", "think": "th", "vine": "v"}[a] + " sound", "stem_lang": "en", "option_lang": "en",
             "options": o, "answer": a, "pron": ""} for s, o, a in q]

def build():
    exs = ex_vocab() + ex_match() + ex_fill() + ex_order() + ex_listen() + ex_sound()
    return {
        "id": "m1w1c1", "no": 1, "month": 1, "week": 1,
        "title": bi("Starter Pack & the Verb 'To Be' (revised)", "শুরুর প্যাক ও 'To Be' ক্রিয়া (সংশোধিত)"),
        "grammar": bi("am / is / are; classroom phrases; sounds v, w, th", "am / is / are; ক্লাসরুমের বাক্য; v, w, th ধ্বনি"),
        "revision": False,
        "guidebook": {
            "objectives": [bi("Introduce yourself with am, is and are.", "am, is ও are দিয়ে নিজের পরিচয় দেবে।"),
                           bi("Use five classroom phrases to ask for help.", "সাহায্য চাইতে পাঁচটি ক্লাসরুমের বাক্য ব্যবহার করবে।"),
                           bi("Say the sounds v, w and th more clearly.", "v, w ও th ধ্বনি আরও স্পষ্ট বলবে।"),
                           bi("Use twelve first-week college and hospital words.", "কলেজ ও হাসপাতালের প্রথম সপ্তাহের বারোটি শব্দ ব্যবহার করবে।")],
            "outcome": bi("By the end of this class you can introduce yourself, say where things and people are, ask a teacher to repeat, and pronounce v, w and th.",
                          "এই ক্লাস শেষে তুমি নিজের পরিচয় দিতে, কে বা কী কোথায় তা বলতে, শিক্ষককে আবার বলতে অনুরোধ করতে এবং v, w ও th উচ্চারণ করতে পারবে।"),
            "grammar": GRAMMAR,
            "vocab": [{"en": v[0], "bn": v[1], "pron": v[2], "example_en": v[3], "example_bn": v[4]} for v in VOCAB],
            "dialogue": DIALOGUE,
        },
        "speaking": [{"text": t, "bn": b} for t, b in SPEAKING],
        "exercises": exs,
    }

if __name__ == '__main__':
    raise SystemExit('import build() from build_curriculum.py')
