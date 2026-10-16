import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, bnFont, enFont } from './theme'

export type CelebrateProps = { pct: number; xp: number; correct: number; total: number; streak: number }
export const CELEBRATE_FRAMES = 105

export function Celebrate({ pct, xp, correct, total, streak }: CelebrateProps) {
  const f = useCurrentFrame(); const { fps } = useVideoConfig()
  const pop = spring({ frame: f, fps, config: { damping: 8 } })
  const count = Math.round(interpolate(f, [25, 70], [0, xp], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const fade = (a: number) => interpolate(f, [a, a + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '🌟' : '💪'
  const msg = pct >= 80 ? 'Outstanding work, doctor!' : pct >= 50 ? 'Good progress, keep going!' : 'Every attempt builds fluency!'
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${C.green}, #2f6a6e)`, fontFamily: enFont, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      {Array.from({ length: 28 }).map((_, i) => {
        const a = (i / 28) * Math.PI * 2, t = Math.max(0, f - 4), d = 40 + t * (6 + (i % 5))
        return <div key={i} style={{ position: 'absolute', left: 480 + Math.cos(a) * d, top: 250 + Math.sin(a) * d * 0.8 + t * t * 0.03, width: 14, height: 14, borderRadius: i % 2 ? '50%' : 3, background: ['#fff', C.gold, '#9fd0bb', '#e8a29d'][i % 4], opacity: interpolate(t, [0, 12, 60], [0, 1, 0], { extrapolateRight: 'clamp' }), transform: `rotate(${t * 12}deg)` }} />
      })}
      <div style={{ fontSize: 130, transform: `scale(${pop}) rotate(${(1 - pop) * 20}deg)` }}>{emoji}</div>
      <div style={{ fontSize: 56, fontWeight: 800, color: '#fff', opacity: fade(14) }}>Lesson complete!</div>
      <div style={{ fontSize: 28, fontFamily: bnFont, color: '#e6f3ec', opacity: fade(20) }}>পাঠ সম্পন্ন!</div>
      <div style={{ fontSize: 64, fontWeight: 800, color: '#fff', marginTop: 12 }}>+{count} XP</div>
      <div style={{ fontSize: 26, color: '#fff', opacity: fade(70), marginTop: 6 }}>{correct}/{total} first try{streak > 1 ? `  ·  🔥 ${streak} day streak` : ''}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.ink, opacity: fade(80), marginTop: 10 }}>{msg}</div>
    </AbsoluteFill>
  )
}
