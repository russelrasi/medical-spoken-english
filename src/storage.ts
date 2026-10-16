export interface ClassProgress { done: boolean; bestPct: number; sessions: number; seen: string[] }
export interface Progress {
  xp: number
  streak: number
  lastDay: string
  classes: Record<string, ClassProgress>
}

const KEY = 'med-english-progress-v1'
const empty = (): Progress => ({ xp: 0, streak: 0, lastDay: '', classes: {} })

export function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    return { ...empty(), ...JSON.parse(raw) }
  } catch {
    return empty()
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* storage blocked: the app still works for this session */
  }
}

/** Streak shown to the user: only alive if practised today or yesterday. */
export function liveStreak(p: Progress): number {
  if (!p.lastDay) return 0
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return p.lastDay === dayKey() || p.lastDay === dayKey(y) ? p.streak : 0
}

export function touchStreak(p: Progress): Progress {
  const today = dayKey()
  if (p.lastDay === today) return p
  const y = new Date()
  y.setDate(y.getDate() - 1)
  const streak = p.lastDay === dayKey(y) ? p.streak + 1 : 1
  return { ...p, streak, lastDay: today }
}

export const emptyProgress = empty

/** Clear saved lessons for the given class ids; XP and streak are kept. */
export function resetClasses(p: Progress, ids: string[]): Progress {
  const classes = { ...p.classes }
  ids.forEach((id) => delete classes[id])
  return { ...p, classes }
}
