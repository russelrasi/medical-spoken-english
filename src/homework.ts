import type { ClassUnit, Exercise, FillBlank, Match, Order, VocabSelect } from './types'
import { shuffle } from './grade'

/** Dynamic homework: N non-repeating exercises on one class, freshly built (and shuffled) every time. No tracking. */

const MIX: Record<Exercise['type'], number> = { fill_blank: 30, order: 34, vocab_select: 16, listen: 14, match: 6 }

// Class-specific focus words for generated fill-in-the-blank items.
const FOCUS: Record<string, string[]> = { m1w1c1: ['am', 'is', 'are'], m1w1c1r: ['am', 'is', 'are'] }

// Class 1: subject + be-form, and predicates that work with any subject (location or adjective).
const SUBJECTS_C1: [string, string][] = [
  ['I', 'am'], ['He', 'is'], ['She', 'is'], ['It', 'is'], ['You', 'are'], ['We', 'are'], ['They', 'are'],
  ['My friend', 'is'], ['My parents', 'are'], ['The students', 'are'], ['Samira', 'is'], ['Dr. Rahman', 'is'],
  ['My brother and I', 'are'], ['The teacher', 'is'], ['My classmates', 'are'], ['The patient', 'is'],
]
const PRED_C1 = ['in Cairo', 'from Bangladesh', 'very tired today', 'happy today', 'in the library', 'ready for the class',
  'at the hospital', 'interested in anatomy', 'late for the lecture', 'in the anatomy lab', 'busy this morning', 'new here']

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim()
let counter = 0
const id = () => `hw-${counter++}`

function sentencesOf(u: ClassUnit): { en: string; bn: string }[] {
  const g = u.guidebook
  const all = [
    ...g.grammar.flatMap((b) => b.examples),
    ...g.dialogue.lines.map((l) => ({ en: l.en, bn: l.bn })),
    ...g.vocab.map((v) => ({ en: v.example_en, bn: v.example_bn })),
    ...u.speaking.map((s) => ({ en: s.text, bn: s.bn })),
  ]
  const seen = new Set<string>()
  return all.filter((s) => {
    const k = norm(s.en)
    if (!s.en || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function orderFrom(en: string, bn: string): Order | null {
  const tokens = en.split(' ')
  if (tokens.length < 3 || tokens.length > 11) return null
  return { id: id(), type: 'order', prompt_en: 'Put the words in order', prompt_bn: 'শব্দগুলো সঠিক ক্রমে সাজাও',
    hint: bn, hint_lang: 'bn', tokens: shuffle(tokens), answer: en }
}

function fillFrom(en: string, focus: string[]): FillBlank | null {
  const words = en.split(' ')
  const i = words.findIndex((w) => focus.includes(w.replace(/[.,?!]/g, '').toLowerCase()))
  if (i < 0) return null
  const answer = words[i].replace(/[.,?!]/g, '')
  const tail = words[i].slice(answer.length)
  const sentence = [...words.slice(0, i), '______' + tail, ...words.slice(i + 1)].join(' ')
  return { id: id(), type: 'fill_blank', prompt_en: 'Fill in the blank', prompt_bn: 'শূন্যস্থান পূরণ করো', sentence,
    options: focus.map((f) => (answer[0] === answer[0].toUpperCase() ? f[0].toUpperCase() + f.slice(1) : f)), answer }
}

/** Generic cloze for classes without a focus list: blank one content word, other words from the unit as options. */
function clozeFrom(en: string, bank: string[]): FillBlank | null {
  const words = en.split(' ')
  const cand = words.map((w, i) => ({ w: w.replace(/[.,?!]/g, ''), i })).filter((x) => x.w.length > 3 && /^[a-z]+$/i.test(x.w))
  if (!cand.length) return null
  const pick = cand[Math.floor(Math.random() * cand.length)]
  const opts = shuffle(bank.filter((w) => w.toLowerCase() !== pick.w.toLowerCase())).slice(0, 2)
  if (opts.length < 2) return null
  const tail = words[pick.i].slice(pick.w.length)
  const sentence = words.map((w, i) => (i === pick.i ? '______' + tail : w)).join(' ')
  return { id: id(), type: 'fill_blank', prompt_en: 'Fill in the blank', prompt_bn: 'শূন্যস্থান পূরণ করো', sentence,
    options: shuffle([pick.w, ...opts]), answer: pick.w }
}

function vocabItems(u: ClassUnit): { vs: VocabSelect[]; mp: Match[] } {
  const v = u.guidebook.vocab
  const vs: VocabSelect[] = []
  v.forEach((w, i) => {
    const others = v.filter((_, j) => j !== i)
    const o1 = shuffle(others).slice(0, 3)
    if (o1.length === 3) {
      vs.push({ id: id(), type: 'vocab_select', prompt_en: 'Pick the English word for this meaning', prompt_bn: 'এই অর্থের ইংরেজি শব্দটি বেছে নাও',
        stem: w.bn, stem_lang: 'bn', option_lang: 'en', options: shuffle([w.en, ...o1.map((x) => x.en)]), answer: w.en, pron: w.pron })
      vs.push({ id: id(), type: 'vocab_select', prompt_en: 'Pick the meaning of this word', prompt_bn: 'শব্দটির অর্থ বেছে নাও',
        stem: w.en, stem_lang: 'en', option_lang: 'bn', options: shuffle([w.bn, ...o1.map((x) => x.bn)]), answer: w.bn, pron: w.pron, speak: w.en })
    }
  })
  const mp: Match[] = []
  const sh = shuffle(v)
  for (let i = 0; i + 4 <= sh.length; i += 2) {
    const grp = sh.slice(i, i + 4)
    mp.push({ id: id(), type: 'match', prompt_en: 'Match each word to its meaning', prompt_bn: 'প্রতিটি শব্দের সঙ্গে অর্থ মেলাও',
      pairs: grp.map((x) => ({ left: x.en, right: x.bn })), left_lang: 'en', right_lang: 'bn' })
  }
  return { vs, mp }
}

function key(e: Exercise): string {
  switch (e.type) {
    case 'vocab_select': return `v|${norm(e.stem)}|${norm(e.answer)}`
    case 'fill_blank': return `f|${norm(e.sentence)}|${norm(e.answer)}`
    case 'order': return `o|${norm(e.answer)}`
    case 'listen': return `l|${norm(e.answer)}`
    case 'match': return `m|${e.pairs.map((p) => norm(p.left)).sort().join(',')}`
  }
}

export function buildHomework(u: ClassUnit, n = 100): Exercise[] {
  const buckets: Record<Exercise['type'], Exercise[]> = { fill_blank: [], order: [], vocab_select: [], listen: [], match: [] }
  const seen = new Set<string>()
  const add = (e: Exercise | null) => {
    if (!e) return
    const k = key(e)
    if (seen.has(k)) return
    seen.add(k)
    buckets[e.type].push(e)
  }
  shuffle(u.exercises).forEach(add)
  const focus = FOCUS[u.id]
  const sents = sentencesOf(u)
  sents.forEach((s) => add(orderFrom(s.en, s.bn)))
  const bank = [...new Set(sents.flatMap((s) => s.en.split(' ').map((w) => w.replace(/[.,?!]/g, ''))).filter((w) => w.length > 3 && /^[a-z]+$/i.test(w)))]
  if (focus) {
    sents.forEach((s) => add(fillFrom(s.en, focus)))
    if (u.id === 'm1w1c1' || u.id === 'm1w1c1r') {
      for (const [s, be] of SUBJECTS_C1) for (const p of PRED_C1) {
        const en = `${s} ${be} ${p}.`
        add(fillFrom(en, focus))
        if (Math.random() < 0.25) add(orderFrom(en, ''))
      }
    }
  } else {
    sents.forEach((s) => add(clozeFrom(s.en, bank)))
  }
  const { vs, mp } = vocabItems(u)
  vs.forEach(add)
  mp.forEach(add)

  const out: Exercise[] = []
  const taken = new Set<string>()
  for (const t of Object.keys(MIX) as Exercise['type'][]) {
    for (const e of shuffle(buckets[t]).slice(0, MIX[t])) { out.push(e); taken.add(e.id) }
  }
  if (out.length < n) {
    const rest = shuffle(Object.values(buckets).flat().filter((e) => !taken.has(e.id)))
    out.push(...rest.slice(0, n - out.length))
  }
  return shuffle(out).slice(0, n)
}
