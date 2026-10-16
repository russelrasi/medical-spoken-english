// English audio only. Pre-generated neural voices (public/audio) first, browser TTS as fallback.
interface Manifest { voices: { id: string; label: string }[]; texts: Record<string, string> }

let manifest: Manifest | null = null
const VOICE_KEY = 'med-english-voice-v1'

export async function loadAudio(): Promise<void> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
    if (r.ok) manifest = await r.json()
  } catch {
    manifest = null
  }
}

export const voices = () => manifest?.voices ?? []

export function getVoice(): string {
  let v = ''
  try { v = localStorage.getItem(VOICE_KEY) ?? '' } catch { /* ignore */ }
  const list = voices()
  return list.some((x) => x.id === v) ? v : list[0]?.id ?? ''
}

export function setVoice(id: string): void {
  try { localStorage.setItem(VOICE_KEY, id) } catch { /* ignore */ }
}

const browserTts = typeof window !== 'undefined' && 'speechSynthesis' in window
export const canSpeak = (): boolean => !!manifest || browserTts

let current: HTMLAudioElement | null = null

function fallback(text: string, rate: number) {
  if (!browserTts) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = rate
    window.speechSynthesis.speak(u)
  } catch { /* ignore */ }
}

/** rate 1 is normal speed (the files are already slightly slowed); 0.7 is the slow button. */
export function speak(text: string, rate = 1): void {
  try { current?.pause() } catch { /* ignore */ }
  const id = manifest?.texts[text]
  const voice = getVoice()
  if (!id || !voice) return fallback(text, rate)
  const a = new Audio(`${import.meta.env.BASE_URL}audio/${voice}/${id}.mp3`)
  a.preload = 'auto'
  a.playbackRate = rate
  current = a
  // Wait until enough is buffered (first play downloads the file), plus a short lead-in so the
  // device can wake up. Without this the first syllable is cut on the first, uncached play.
  let started = false
  const go = () => {
    if (started || current !== a) return
    started = true
    setTimeout(() => { if (current === a) a.play().catch(() => fallback(text, rate)) }, 250)
  }
  a.addEventListener('canplaythrough', go, { once: true })
  setTimeout(go, 2500)
  a.load()
  a.onerror = () => fallback(text, rate)
}
