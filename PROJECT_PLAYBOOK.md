# Project playbook: Medical Student Spoken English app

Everything needed to continue this project without the original chat. Written 2026-10-17.

## 1. What this is

A static, backend-free Duolingo-style lesson app for **Samira** (she/her), a Bangladeshi first-year medical student in Egypt, for a 36-class spoken English course (3 months x 12 classes, bilingual English and Bangla). Vite 5 + React 18 + TypeScript. Progress lives in the browser (`localStorage`).

- **Live site:** https://russelrasi.github.io/medical-spoken-english/
- **Repo (public):** https://github.com/russelrasi/medical-spoken-english (GitHub account `russelrasi`)
- **Local folder:** `/Users/russelrasi/projects/Personal/medical-english-app-polish`
- **Original untouched prototype:** `/Users/russelrasi/projects/Personal/medical-english-app` (keep as is; it also holds the Python venv `.venv` used by the audio scripts)
- **Course source for Month 1 (original):** `/Users/russelrasi/projects/Personal/medical-english-course` (`STRUCTURE.md`, `m1_classes_*.py`)

Hosting: GitHub Pages via `.github/workflows/pages.yml` (builds on every push to `main`, about 1 to 2 minutes). Pages from a private repo needs a paid plan, so the repo is public.

## 2. Standing rules (apply to everything)

1. **No em dashes or en dashes** anywhere (UI, code, docs, narration, Bangla). Use commas, colons, full stops. Ranges use a plain hyphen. Scripts replace stray dashes with commas.
2. The student is **Samira, she/her**. Peer: **Mariam**; male classmate: **Ahmed**. Settings are Egypt and the medical college.
3. Bangla renders in **Noto Sans Bengali**. Must work at **375px wide** with no horizontal scroll.
4. Explainer videos: **English voice only** (never narrate Bangla; Bangla appears only as the translation under examples and in titles), about **60 to 90 seconds**, slower pace, pause before each line, **highlight key words not whole sentences**, no logo, themed colours, preloaded audio.
5. Sober, soothing branding (Sage default, Slate, Night). No loud colours.
6. Do not deploy elsewhere or create accounts without being asked. (GitHub repo and Pages were done at the owner's explicit request.)
7. Teacher codes (`teacher/`) are private: never commit them or post them.

## 3. Features in the app

- Dashboard: 36 classes by month and week, XP, streak, progress bar, 3 themes, voice picker (4 Azure neural voices), "Reset all progress" (header) and "Reset week".
- Lesson: about 10 exercises (vocab select, match, fill blank, order, listen), "Question n of N", per-question Reset, synthesized correct/wrong sounds, confetti, auto-advance about 1.8s after a correct answer, retry of missed items at the end.
- End-of-lesson report: celebration clip (Remotion), "Took a while" (per-question timer; targets 10s choice, 15s listen/fill, 25s match, 30s order) and "Mistakes to review" with matching vocabulary and best-fitting guidebook rule (text matching heuristic in `src/review.ts`).
- Homework: 100 mixed, non-repeating, freshly generated exercises per class (`src/homework.ts`), no tracking or XP. Month revision classes draw from the whole month.
- Guidebook per class; speaking practice (listen, record a voice note, send the audio to the teacher on WhatsApp; no WhatsApp link).
- Explainer video per class (Remotion Player, in-browser; narration mp3 per line, all preloaded before play).
- **Class gate:** Class 1 open; other classes need a per-class teacher unlock code (see section 9).

## 4. Repo map

| Path | What |
|---|---|
| `src/` | App: `App.tsx` (dashboard, routing, gate UI), `Lesson.tsx`, `Exercises.tsx`, `Guidebook.tsx`, `Speaking.tsx`, `gate.ts`, `homework.ts`, `review.ts`, `sound.ts`, `speech.ts`, `fx.ts`, `theme.ts`, `storage.ts`, `clips/` (Remotion compositions: `Explainer.tsx`, `Celebrate.tsx`, `ClipPlayer.tsx`, `lazy.tsx`, `Root.tsx`) |
| `public/course.json` | The whole course (generated; do not hand edit) |
| `public/audio/<voice>/<sha1>.mp3` + `manifest.json` | Pre-generated English audio (about 118 MB) |
| `public/explainers/<classId>.json` + `<classId>/lNNN.mp3` + `index.json` | Explainer timings and narration (about 17 MB) |
| `public/gates.json` | Salted SHA-256 hashes of unlock codes (public, hashes only) |
| `curriculum/month2.py`, `month3.py` | English source for Classes 13-36 |
| `explainers/<classId>.script.json` | Explainer scripts (class 1 hand written; others generated) |
| `revised/` | `course.original.json` (pristine Month 1 export), `bn_cache.json` (Month 1 Bangla, teacher corrected), `bn_review.md`, `bn_m2m3.json` (Months 2-3 Bangla, ChatGPT draft), `bn_m2m3_en.json`, `bn_review_m2m3*.md` |
| `teacher/` | PRIVATE, git-ignored: `unlock_codes.json` and `unlock_codes.md` |
| `LESSON_PLAN.md`, `CURRICULUM_REVIEW.md`, `POLISH.md`, `TEACHER_GUIDE.md`, `README.md`, `CHECKPOINT.md` | Documents |

## 5. Build pipeline (run from the project folder)

Python scripts that call edge-tts use the original project's venv: `../medical-english-app/.venv/bin/python`. Plain scripts use `python3`.

```bash
# 0. install and run the app
npm install && npm run dev          # http://localhost:5173
npm run build                        # outputs dist/

# 1. Month 1 content (restores from revised/course.original.json, applies the revised curriculum and corrected Bangla)
python3 build_curriculum.py

# 2. Months 2 and 3 (reads curriculum/month2.py, month3.py and revised/bn_m2m3.json)
python3 build_months23.py            # add --strings to write the English-lines-to-translate sheet instead

# 3. Audio for any new English text, then pad new clips with 0.3s of lead-in silence
../medical-english-app/.venv/bin/python generate_audio.py
./pad_audio.sh                       # tracked by .audio-padded-list; run after every audio generation

# 4. Explainer videos
python3 make_explainer_scripts.py 13 14 15 ...     # generates scripts for classes 2-36 (Class 1 is hand written); pass class numbers to limit
../medical-english-app/.venv/bin/python build_explainer.py <classId>   # e.g. m2w5c13; writes narration mp3 + timings, updates index.json
#   after adding explainers, regenerate src/clips/Root.tsx (it imports each explainer json) so `npm run clips:studio` lists them

# 5. Lesson plan and unlock codes
python3 build_lesson_plan.py         # writes LESSON_PLAN.md
python3 make_unlock_codes.py         # creates codes if missing; `show N` prints one; `--rotate` makes new ones

# 6. Optional mp4 exports for sharing
npm run clips:studio                 # live preview
npm run clips:render                 # writes out/*.mp4 (out/ is git-ignored)
```

**Important:** re-running `export_course.py` (the original export) discards everything above. If you ever do, re-run steps 1 and 2.

Class IDs: `m<month>w<week>c<class>`, for example `m1w1c1`, `m2w5c13`, `m3w12c36`. Weeks are numbered 1 to 12 across the course.

Deploy: `git add -A && git commit && git push` (workflow publishes `dist/`). Commit messages and PR text carry the `Co-Authored-By: Claude` / "Generated with Claude Code" lines used in this project.

## 6. Content design (decisions made)

- Month 1 original course had 12 classes (be, have, present simple, continuous, likes, WH questions, past, irregular past, future, requests, description, revision). The curriculum review (`CURRICULUM_REVIEW.md`) recommended pronunciation work, medical vocabulary from week 1, one new idea per class, recycling, more listening, writing, weekly checks.
- **Applied so far:** Class 1 fully rebuilt as a Starter Pack (classroom phrases, v/w/th sound corner, 12 college/hospital words, 80 exercises). Classes 2 to 12 each gained a **Medical corner** (6 words) and a **Sound corner** block with exercises.
- **Month 2 (13-24) "Daily Life Conversation in Egypt"** and **Month 3 (25-36) "Medical College English and Fluency"** were written fresh (class list in `LESSON_PLAN.md`). Each class: 2 rules, 8 words with pronunciation, sound corner, 6-line dialogue, 4 speaking lines, about 50 generated exercises.
- **Not yet done:** grammar resequencing for Classes 3-5 and 8 (see review), weekly writing tasks, recycling warm-ups, recording self-check checklist, explainers hand-tuned beyond Class 1 (others are script-generated and plainer), hand-written quality pass on generated fill-in-the-blank options.

## 7. Bangla workflow

- **Month 1 Bangla:** machine pass with Google Translate endpoint, then **teacher-corrected sheet** `revised/bn_review.md` (loaded into `revised/bn_cache.json`; the cache wins over Google). The original Classes 2-12 Bangla (written when the course was first created) has **not** been teacher reviewed: `revised/bn_review_2.md` lists 599 lines for review (same table format; send back corrected and load).
- **Months 2 and 3 Bangla:** `revised/bn_review_m2m3.md` (empty English-only sheet, 1,186 lines). A **ChatGPT draft** (`revised/bn_m2m3.json`, readable copy `revised/bn_review_m2m3_draft.md`) is currently used. When the teacher's corrected sheet arrives:

```bash
python3 import_bn_sheet.py path/to/corrected_sheet.md    # same | English | Bangla | table
python3 build_curriculum.py && python3 build_months23.py
git add -A && git commit && git push
```

- How the ChatGPT draft was made (ego-browser, signed-in ChatGPT): batches of about 90 English lines pasted into a new chat with instructions (natural Bangladeshi Bengali, keep taught English words in English, no dashes, JSON array of exactly N strings in one code block); read the code block back, validate the length matches, split any batch that comes back with a dropped/merged line. `merge_bn.py` merges the replies. Smaller batches (15) fixed a dropped-line problem.
- Fill-in-the-blank and exercise Bangla derive from the same English-to-Bangla map, so correcting one string corrects it everywhere.

## 8. Audio and video details

- English voices (edge-tts, no key): Jenny US (default), Guy US, Sonia UK, Neerja Indian English. Rate about -8% for lesson audio, -4% for explainer narration.
- Files are named by `sha1(text)[:12]`; `manifest.json` maps text to id.
- `pad_audio.sh` adds 0.3s silence to every clip (fixes first-syllable cut-off when headphones or speakers wake up). The app also waits for `canplaythrough` and adds a 250 ms lead-in. Explainer clips are fully prefetched before play (first-run cut-off was network loading, not the pause).
- "Live" (verb /lɪv/): the voice rejects IPA/SAPI phoneme tags, so `generate_audio.py` has a `SPOKEN` respelling map (`Live` to `liv`). Listen after any change.
- Explainer sizes: about 70 to 95 seconds each; narration about 400 to 480 KB per class.
- Remotion Player needs `acknowledgeRemotionLicense`; check remotion.dev/license for commercial use. The Celebrate clip must stay on its last frame when it ends (handled in `ClipPlayer.tsx`).

## 9. Class gate (teacher unlock codes)

- Class 1 always open. Every other class needs the code the teacher sends (WhatsApp). Nothing opens automatically.
- `public/gates.json` holds `sha256("medspoken:<classId>:<CODE>")` per class; plain codes live only in `teacher/unlock_codes.md` (private; not in git or on the site). Hash check runs in the browser (`src/gate.ts`).
- Unlocks are stored in `localStorage` key `med-english-unlocked-v1`; "Reset all progress" does not re-lock. A class already started stays open (grandfathering). Locked deep links (`#/lesson/...`) redirect home. If `gates.json` is missing the gate is off.
- Rotate codes: `python3 make_unlock_codes.py --rotate`, commit and push `public/gates.json`.
- **Limit:** this is a pacing gate, not security. Repo and lesson files are public. Real protection needs a private host with a login or a small server.
- Teacher steps are in `TEACHER_GUIDE.md`.

## 10. Revision history (short)

1. Copied the prototype, added Framer Motion, canvas-confetti, Remotion Player (lazy loaded); decided **not** to use Hyperframes (it would only add pre-rendered mp4s; Player keeps clips data-driven).
2. Removed the welcome intro; added reset all and reset week; Class 1 explainer sample (voice, key-word highlights).
3. Calm palettes and theme toggle; Reset button to header; explainer cleanup (no logo, no Bangla narration, audio lead-in).
4. Fixes: "Live" pronunciation, WhatsApp link removed, XP clip holds final value.
5. Answer sounds, auto-advance, question numbers, audio lead-in, timing and mistakes report, 100-question homework, curriculum review.
6. Audio preloading (explainer and lesson); revised Class 1 side by side with the original.
7. Revised curriculum applied to all classes; Bangla from Google Translate; sheet review.
8. Teacher-corrected Bangla loaded; explainers for Classes 2-12; month lesson plan.
9. GitHub repo and Pages deployment.
10. Months 2 and 3 (24 classes): English source, ChatGPT Bangla draft, generated exercises, audio, 24 explainers, lesson plan.
11. Teacher unlock-code gate.

## 11. Gotchas and lessons learned

- **ego-browser (screenshots):** `page.screenshot` can time out when the browser window lacks focus. Use `page.evaluate` to read state, or the built-in Claude Browser pane for screenshots. Emulated mobile width does not survive navigation in ego-browser; set it again.
- **ChatGPT driving:** the composer is a contenteditable: set text with `document.execCommand('insertText')`, click `[data-testid="send-button"]`, wait until the stop button disappears and the code block length stops changing, then read the largest `<pre>`. Long batches can drop or merge lines; always length-check and split.
- **Remotion props** must be `type` aliases (not `interface`) to satisfy `Record<string, unknown>`.
- **Remotion entry** must call `registerRoot` (`src/clips/Root.tsx`); `npm run clips:*` point at it.
- **Google Translate** output is literal for short spoken phrases (for example "Could you repeat that, please?"); the build supports paraphrase requests (`VIA` map) and teacher corrections override.
- **sed on macOS** (BSD) needs `-i ''`; long patterns sometimes fail, use Python edits.
- Autoplay: Remotion `autoPlay` is unreliable; the code calls `play()` with retries and starts muted for silent clips.
- Keep `.audio-padded-list` committed so `pad_audio.sh` only pads new files.
- Pages deploy warns about Node 20 and Ubuntu 26 migration; harmless for now.

## 12. Suggested next steps

1. Teacher reviews `revised/bn_review_m2m3.md` and `revised/bn_review_2.md`; import and push.
2. Listen to a sample of new audio and explainers (especially Months 2 and 3, and "Live").
3. Decide on grammar resequencing for Classes 3-5 and 8, weekly writing tasks, recycling warm-ups.
4. Hand-polish the generated explainers and fill-in-the-blank distractors for Months 2-3.
5. If real protection is needed: private hosting with login, or a small backend for unlock state and student progress across devices.
6. Consider backing up progress (it lives only in the student's browser) and a per-device progress export.
