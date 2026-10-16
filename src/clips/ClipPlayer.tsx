import { useEffect, useRef, useState } from 'react'
import { prefetch } from 'remotion'
import { Player, type PlayerRef } from '@remotion/player'
import { Explainer, type ExplainerProps } from './Explainer'
import { Celebrate, CELEBRATE_FRAMES, type CelebrateProps } from './Celebrate'
import { FPS, H, W } from './theme'

type Common = { autoPlay?: boolean; loop?: boolean; controls?: boolean; label: string }
// Explicit play() is more reliable than the autoPlay prop across browsers.
function usePlay(auto?: boolean, lastFrame = 0) {
  const ref = useRef<PlayerRef>(null)
  useEffect(() => {
    if (!auto) return
    let tries = 0
    // Hold on the final frame when playback ends (so the end state, e.g. the XP total, stays on screen).
    const hold = () => { const pl = ref.current; if (pl && lastFrame) { pl.pause(); setTimeout(() => pl.seekTo(lastFrame), 30) } }
    const attach = setInterval(() => { if (ref.current) { ref.current.addEventListener('ended', hold); clearInterval(attach) } }, 50)
    const t = setInterval(() => {
      const pl = ref.current
      if (pl && (pl.isPlaying() || pl.getCurrentFrame() > 0 || ++tries > 12)) return clearInterval(t)
      pl?.play()
    }, 250)
    return () => { clearInterval(t); clearInterval(attach); ref.current?.removeEventListener('ended', hold) }
  }, [auto, lastFrame])
  return ref
}
const box = { width: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,.15)' } as const

/** Downloads every narration line before the clip can start, so the first play is never cut off by loading. */
function useAudioReady(urls: string[]) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let off = false
    setReady(false)
    const jobs = urls.map((u) => prefetch(u, { method: 'blob-url' }))
    Promise.all(jobs.map((j) => j.waitUntilDone())).catch(() => undefined).then(() => { if (!off) setReady(true) })
    return () => { off = true; jobs.forEach((j) => j.free()) }
  }, [urls.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
  return ready
}

export function ExplainerClip(p: ExplainerProps & { label: string }) {
  const urls = p.script.scenes.flatMap((sc) => sc.lines.map((l) => p.audioBase + l.audio))
  const ready = useAudioReady(urls)
  if (!ready) return <div className="clip-skel loading" role="status" aria-label="Loading narration"><span>Loading narration...</span></div>
  return <Player component={Explainer} inputProps={{ script: p.script, audioBase: p.audioBase, palette: p.palette }} durationInFrames={p.script.totalFrames} fps={FPS}
    compositionWidth={W} compositionHeight={H} style={box} controls initialFrame={40} showPosterWhenUnplayed clickToPlay
    acknowledgeRemotionLicense aria-label={p.label} />
}
export function CelebrateClip(p: CelebrateProps & Common) {
  const ref = usePlay(p.autoPlay, CELEBRATE_FRAMES - 1)
  return <Player ref={ref} initiallyMuted component={Celebrate} inputProps={p} durationInFrames={CELEBRATE_FRAMES} fps={FPS} compositionWidth={W} compositionHeight={H}
    style={box} loop={p.loop} controls={p.controls} acknowledgeRemotionLicense aria-label={p.label} />
}
