import type { Exercise } from './types'

export type Value = string | string[] | { mistakes: number } | null

export interface Grade { correct: boolean; answerText: string }

/** Pure client-side grading. Every exercise carries its own answer. */
export function grade(ex: Exercise, value: Value): Grade {
  switch (ex.type) {
    case 'vocab_select':
    case 'fill_blank':
    case 'listen':
      return { correct: value === ex.answer, answerText: ex.answer }
    case 'order': {
      const got = Array.isArray(value) ? value.join(' ') : ''
      return { correct: got === ex.answer, answerText: ex.answer }
    }
    case 'match': {
      const m = (value as { mistakes: number } | null)?.mistakes ?? 0
      return { correct: m === 0, answerText: ex.pairs.map((p) => `${p.left} = ${p.right}`).join('\n') }
    }
  }
}

export function shuffle<T>(arr: T[], rnd = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const MIX: Record<Exercise['type'], number> = {
  vocab_select: 3, match: 1, fill_blank: 2, order: 2, listen: 2,
}

/** Build a ~10 exercise session: a type mix, preferring items not seen recently. */
export function buildSession(pool: Exercise[], seen: string[], size = 10): Exercise[] {
  const seenSet = new Set(seen)
  const pick = (type: Exercise['type'], n: number): Exercise[] => {
    const all = pool.filter((e) => e.type === type)
    const fresh = shuffle(all.filter((e) => !seenSet.has(e.id)))
    const stale = shuffle(all.filter((e) => seenSet.has(e.id)))
    return [...fresh, ...stale].slice(0, n)
  }
  const chosen: Exercise[] = []
  for (const t of Object.keys(MIX) as Exercise['type'][]) chosen.push(...pick(t, MIX[t]))
  if (chosen.length < size) {
    const ids = new Set(chosen.map((e) => e.id))
    const rest = shuffle(pool.filter((e) => !ids.has(e.id)))
    chosen.push(...rest.slice(0, size - chosen.length))
  }
  // easy first: choice exercises, then building ones; keeps momentum like Duolingo
  const rank: Record<Exercise['type'], number> = { vocab_select: 0, match: 1, listen: 2, fill_blank: 3, order: 4 }
  return shuffle(chosen).sort((a, b) => rank[a.type] - rank[b.type] + (Math.random() - 0.5) * 2.5)
}
