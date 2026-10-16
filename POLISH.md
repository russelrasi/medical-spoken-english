# Polish pass

Copy of the prototype. The original folder is untouched.

## Decision: what video is for, and what it is not

Remotion and Hyperframes render video. They do not animate buttons. So the mix is:

| Need | Tool | Why |
|---|---|---|
| Welcome intro, per-class grammar explainer, lesson-complete celebration | **Remotion** (`@remotion/player`, in the browser) | Data-driven: the explainer is built from each class's `course.json` rule and examples, with English and Bangla. Zero video files shipped, nothing to re-render when the course changes. |
| Page transitions, sheet spring, stat stagger, progress bar, tap feedback | **Framer Motion** (LazyMotion, `domAnimation`) | Real UI interactivity. |
| Correct-answer and lesson-end confetti | **canvas-confetti** (about 6 KB) | Cheap and lively. |
| Answer pop and shake, press states, skeleton, reduced-motion | **CSS** | No JS cost. |

**Hyperframes was not used.** It would add pre-rendered mp4 files for the same three clips, with no gain over the Player: the clips are small motion graphics, not footage. It is a good fit later if you want narrated, voiced explainers.

## What was added

- `src/clips/` Remotion compositions: `Welcome`, `Explainer`, `Celebrate`, plus `ClipPlayer` (Player wrapper) and `lazy.tsx` (code-split, so the Remotion chunk loads only when a clip first shows).
- Home: staggered stats, animated progress bar, spring bottom sheet.
- Class sheet: "Watch explainer with voice" (only classes that have one; currently Class 1).
- Lesson: confetti on each correct answer, celebration clip on completion, streak milestone badge at 3, 7, 14, 30, 60, 100 days.
- Page transitions between routes.
- `prefers-reduced-motion` disables CSS animation and confetti.

## Size

- Web app main JS: 248 KB (83 KB gzip). Remotion Player chunk: 355 KB (112 KB gzip), lazy.
- Video assets: none shipped. The optional mp4 renders (below) total about 650 KB.

## Re-render videos (optional, for sharing on WhatsApp etc.)

```bash
npm run clips:studio   # live preview and editing of the compositions
npm run clips:render   # writes out/welcome.mp4, explainer-class1.mp4, celebrate.mp4
```

First render downloads a headless Chrome. Explainer props for other classes: edit defaults in `src/clips/Root.tsx`, or render with `npx remotion render src/clips/Root.tsx Explainer out/x.mp4 --props='{...}'`.

## Trade-offs

- Remotion has a company licence for larger commercial teams; check remotion.dev/license before commercial use. The Player is run with `acknowledgeRemotionLicense`.
- Extra 112 KB gzip, only when a clip is shown.
- Clips are silent (the app already has neural voice audio). In the rendered mp4 the Bangla font depends on Noto Sans Bengali being available on the render machine.
- Checked in a browser at desktop and 375px: no horizontal scroll. The full celebrate screen was seen at desktop width; at 375px the home, explainer sheet and lesson were checked.

## Revision 2

- **Intro removed** (no welcome clip, no gate, no replay link).
- **Resets:** "Reset week" next to each week (clears that week's lesson scores; XP and streak kept) and "Reset all progress" at the bottom (clears XP, streak, lessons). Both ask for confirmation.
- **Themes:** Classic (green), Clinical (blue/teal), Night (dark). Swatch toggle in the dashboard header, remembered in localStorage. The explainer takes its colours from the active theme.
- **Class 1 explainer (review sample, about 1:31):** English-only neural voice (Jenny, via edge-tts), slower pace, key words highlighted per example (subject in blue, verb in gold) instead of whole sentences, resolved from `public/course.json`.
  - Script: `explainers/m1w1c1.script.json` (hand-written narration, beats, focus words; example sentences come from course.json by reference).
  - Build audio and timings: `../medical-english-app/.venv/bin/python build_explainer.py m1w1c1` (writes `public/explainers/`, about 760 KB total).
  - Preview: `npm run clips:studio`; render mp4: `npm run clips:render`.
  - Other classes: add `explainers/<id>.script.json` and run the build; the app lists any explainer found in `public/explainers/index.json`. Not generated yet, pending review.
- Not browser-tested: the reset buttons (type-checked and built only).

## Revision 3

- "Reset all progress" is now a button in the dashboard header.
- Calmer palettes: Sage (default), Slate, Night. Softer confetti and celebration clip to match.
- Explainer: stethoscope logo removed; all narration and visuals that explained things in Bangla removed (Bangla stays only as the translation under each example and the title). Each line now starts after a 0.4s gap plus 0.35s of silence baked into the audio, so the first syllable is not clipped. Length 1:29.

## Revision 4

- "Live" audio respelled to "liv" (verb /lɪv/) in generate_audio.py (SPOKEN map; the service rejects phoneme tags). Regenerated for all 4 voices. Listen to confirm.
- Speaking page: WhatsApp link removed, replaced with an instruction to send the voice message on WhatsApp.
- Celebration clip holds the final XP total instead of resetting to 0.

## Revision 5

- Explainer: the verb ("is") is highlighted in the second mistake.
- Lessons: synthesized correct and wrong sounds; right answers auto-advance after about 1.8s (2.6s for sentence building); "Question n of N" label; 250ms lead-in before any audio plus 0.3s of silence baked into every mp3 (`pad_audio.sh`, run once; `.audio-padded-list` tracks done files).
- End-of-lesson report: slow questions (timer per question; targets 10s choice, 15s listen and fill, 25s match, 30s order) and a Mistakes section with matching vocabulary and the best-fitting guidebook rule, found by text matching (heuristic, not hand-authored).
- Homework: "Homework: 100 mixed exercises" in each class sheet. Built fresh each time from the class pool plus generated items (class 1 gets 30 am/is/are fill-ins from a subject by predicate grid), deduplicated, no tracking, no XP. Class 12 draws from all of Month 1. Other classes use generic cloze and word-order items, so quality is best for class 1.
- `CURRICULUM_REVIEW.md`: coach's recommendations for Month 1.

## Revision 6

- Explainer narration is fully downloaded before the clip can start (the first-run cut-off was loading, not the pause). Lesson audio now waits until it is buffered before playing.
- Revised Class 1 added next to the original for comparison: see CLASS1_COMPARISON.md.

## Revision 7: revised curriculum for every class

- `python3 build_curriculum.py` rebuilds `public/course.json` from the pristine export (`revised/course.original.json`).
  - Class 1 is now the revised Starter Pack class (classroom language, sound corner, 12 college and hospital words, 80 exercises).
  - Classes 2 to 12 keep their content and gain a Medical corner (6 words, with exercises) and a Sound corner (pronunciation block with listening items). New course total: 1,116 exercises.
- All new Bangla comes from Google Translate (`revised/bn_cache.json`). `revised/bn_review.md` lists every English line with its Google Bangla for a teacher to check. Two phrases are asked in a paraphrased form because Google's literal output was wrong (see the sheet). The class 1 title keeps its original Bangla.
- Class 1 explainer rebuilt for the new content (1:32, English voice only, key-word highlights, KEY SOUND highlights in the sound corner).
- After changing content run `generate_audio.py` then `pad_audio.sh` for new clips.
- Not done (needs full re-authoring, see CURRICULUM_REVIEW.md): the grammar resequencing (classes 3 to 5, 8), writing tasks, recycling warm-ups, self-check checklist. Explainers exist for Class 1 only.

## Revision 8: corrected Bangla, all explainers, month plan

- `revised/bn_review.md` is now the teacher-corrected sheet; its wording is loaded into `revised/bn_cache.json` and into `public/course.json` (the two em dashes in the corrected sheet were replaced with commas, per the no-dash rule).
- Explainers for Classes 2 to 12 are generated from the course data by `make_explainer_scripts.py` (rule, two examples with highlighted key words, one mistake, two medical words, sound corner, recap; Class 12 adds a Month 1 skills recap). Build audio and timings with `build_explainer.py <classId>`. Class 1 stays hand-written.
- `MONTH1_LESSON_PLAN.md` (from `build_lesson_plan.py`): class by class plan with the weekly checks and evaluation.

- `revised/bn_review_2.md`: 599 original Classes 2 to 12 Bangla lines for a second teacher review.
