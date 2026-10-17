import type { ClassUnit } from './types'
import type { Progress } from './storage'

// Teacher-controlled class gate. Class 1 is always open; every other class opens with a code the teacher
// sends. Only salted SHA-256 hashes of the codes ship in public/gates.json (see make_unlock_codes.py).
const KEY = 'med-english-unlocked-v1'
let gates: Record<string, string> = {}

export async function loadGates(): Promise<void> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}gates.json`)
    if (r.ok) gates = await r.json()
  } catch { gates = {} }
}

/** Gate is only enforced when gates.json is present, so a missing file never locks the student out. */
export const gateActive = (): boolean => Object.keys(gates).length > 0

export function loadUnlocked(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch { return [] }
}

export function saveUnlocked(ids: string[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* storage blocked: unlock lasts this session */ }
}

export const normaliseCode = (c: string): string => c.replace(/[-\s]/g, '').toUpperCase()

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** True when the code is the right one for this class. */
export async function checkCode(classId: string, code: string): Promise<boolean> {
  const want = gates[classId]
  if (!want || !normaliseCode(code)) return false
  try { return (await sha256Hex(`medspoken:${classId}:${normaliseCode(code)}`)) === want } catch { return false }
}

/** Open if: Class 1, gate not active, teacher code entered, or already started (so earlier progress is kept). */
export function isOpen(u: ClassUnit, unlocked: string[], progress: Progress): boolean {
  return u.no === 1 || !gateActive() || unlocked.includes(u.id) || !!progress.classes[u.id]
}
