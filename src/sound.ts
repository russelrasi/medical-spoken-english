// Tiny synthesized answer sounds (no audio files). Respect the browser's autoplay rules: created on first use.
let ctx: AudioContext | null = null

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  const t0 = ctx.currentTime + start
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(ctx.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

function ready(): boolean {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return false
    ctx = ctx ?? new AC()
    void ctx.resume()
    return true
  } catch { return false }
}

/** Soft rising two-note chime. */
export function playCorrect() {
  if (!ready()) return
  tone(660, 0, 0.18, 'sine', 0.18)
  tone(880, 0.12, 0.28, 'sine', 0.18)
}

/** Low, short, gentle buzz (not harsh). */
export function playWrong() {
  if (!ready()) return
  tone(220, 0, 0.22, 'triangle', 0.2)
  tone(165, 0.16, 0.3, 'triangle', 0.2)
}
