import type { ClassUnit, Exercise } from './types'

export interface Ref { title: string; en: string; bn: string }
export interface MistakeNote { wrong: string; right: string; note_bn: string }
export interface Refs { vocab: Ref[]; rule: { title: string; points: Ref[]; mistakes: MistakeNote[] } | null }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim()
const toks = (s: string) => new Set(norm(s).split(' ').filter(Boolean))

/** Short human description of a question, for the end-of-lesson report. */
export function describe(ex: Exercise): string {
  switch (ex.type) {
    case 'vocab_select': return ex.stem
    case 'fill_blank': return ex.sentence
    case 'order': return ex.hint || ex.answer
    case 'listen': return `Listen: ${ex.answer}`
    case 'match': return ex.pairs.map((p) => p.left).join(', ')
  }
}

/** The text a question is "about": used to find matching guidebook material. */
function subjectText(ex: Exercise): string[] {
  switch (ex.type) {
    case 'vocab_select': return [ex.option_lang === 'en' ? ex.answer : ex.stem, ex.stem_lang === 'en' ? ex.stem : ex.answer]
    case 'match': return ex.pairs.flatMap((p) => [p.left, p.right])
    case 'fill_blank': return [ex.sentence.replace(/_+/g, ex.answer)]
    case 'order': return [ex.answer]
    case 'listen': return [ex.answer]
  }
}

/** Guidebook references for a missed question: matching vocabulary and the best-fitting grammar rule. */
export function findRefs(unit: ClassUnit, ex: Exercise): Refs {
  const g = unit.guidebook
  const subj = subjectText(ex)
  const vocab: Ref[] = g.vocab
    .filter((v) => subj.some((s) => norm(s) === norm(v.en) || norm(s) === norm(v.bn)))
    .slice(0, 4)
    .map((v) => ({ title: `${v.en} (${v.pron})`, en: v.example_en, bn: `${v.bn}: ${v.example_bn}` }))
  const isSentence = ex.type === 'fill_blank' || ex.type === 'order' || ex.type === 'listen'
  if (!isSentence) return { vocab, rule: null }

  const text = subj[0]
  const words = toks(text)
  let best = -1, bestScore = -1
  g.grammar.forEach((b, i) => {
    const sentences = [...b.examples.map((e) => e.en), ...b.mistakes.flatMap((m) => [m.wrong, m.right])]
    let score = 0
    for (const s of sentences) {
      if (norm(s) === norm(text)) score += 100
      const t = toks(s)
      let hit = 0
      words.forEach((w) => { if (t.has(w)) hit++ })
      score += hit / Math.max(words.size, 1)
    }
    const rt = toks(b.rule.en + ' ' + b.points.map((p) => p.en).join(' '))
    words.forEach((w) => { if (rt.has(w)) score += 0.3 })
    if (score > bestScore) { bestScore = score; best = i }
  })
  if (best < 0) return { vocab, rule: null }
  const b = g.grammar[best]
  return {
    vocab,
    rule: { title: b.rule.en, points: b.points.map((p) => ({ title: '', en: p.en, bn: p.bn })), mistakes: b.mistakes },
  }
}
