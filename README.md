# Spoken English for Medical Students (prototype)

A static, backend-free Duolingo-style lesson player for the Medical Student Spoken English course (Classes 1-12). Vite + React + TypeScript. Progress (XP, streak, per-class results) is kept in `localStorage`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

## What is in it

- Path of 12 classes grouped by week. Tap a class for Start lesson, Guidebook, Speaking practice.
- Lesson: about 10 exercises per session, graded in the browser, with correct/incorrect feedback and the right answer. Missed items come back once at the end.
- Exercise types: vocab select, match pairs, fill in the blank, sentence ordering, listen and choose (neural voice audio).
- Guidebook per class: grammar rule, examples, common mistakes, vocab, model dialogue.
- Speaking practice is manual: the student listens to each sentence, records a voice note, and sends the audio to the teacher on WhatsApp (the page tells her to). An optional Google Form link can be set in `src/config.ts`.
- Audio is English only, using pre-generated Azure neural voices (Jenny, Guy, Sonia, Neerja) with a voice picker on the home screen. Falls back to browser speech if a file is missing.
- Bangla uses Noto Sans Bengali from Google Fonts.

## Regenerate course.json

`public/course.json` is generated from the Python class dicts in the sibling `medical-english-course` folder:

```bash
python3 export_course.py                      # default source: ../medical-english-course
python3 export_course.py /path/to/course-dir  # or pass the folder
```

Shape: `course -> months -> weeks -> classes -> { guidebook, speaking, exercises }`. Every exercise carries its own `answer`, so grading needs no server. The script fails if an em or en dash appears in the data (standing rule). Distractors and the sample of revision vocab for Class 12 use a fixed random seed, so output is stable.

## Regenerate audio

Neural voices come from Microsoft's Azure neural voice service through `edge-tts` (no key or account). Re-run after changing course content; existing files are skipped.

```bash
python3 -m venv .venv && .venv/bin/pip install edge-tts
.venv/bin/python generate_audio.py     # writes public/audio/<voice>/*.mp3 and manifest.json
```

To add or change voices, edit `VOICES` in `generate_audio.py`.

## Deploy (not done yet)

The build is plain static files with relative paths (`base: './'`), so any static host works.

**Cloudflare Pages**: connect the repo, build command `npm run build`, output directory `dist`. Or `npx wrangler pages deploy dist`.

**Netlify**: build command `npm run build`, publish directory `dist`. Or drag the `dist` folder into the Netlify dashboard.

The app uses hash routes (`#/lesson/...`), so no redirect rules are needed.

## Later phases

Accounts, pronunciation scoring and AI feedback would move progress from `localStorage` to a backend. `storage.ts` is the only place that touches storage, and `grade.ts` is the only place that grades, so those are the seams to swap.
