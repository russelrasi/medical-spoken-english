import { AbsoluteFill, Audio, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import type { Palette } from '../theme'
import { bnFont, enFont } from './theme'

export type Focus = { w: string; role: 'subj' | 'verb' | 'key' }
export type Show = {
  kind: 'title' | 'text' | 'svo' | 'order' | 'example' | 'table' | 'hesshe' | 'mistake' | 'outro'
  keep?: boolean; labels?: boolean; reveal?: number; row?: number
  text?: string; bn?: string; focus?: Focus[] | string; wrong?: string; right?: string
}
export type Line = { say: string; audio: string; from: number; frames: number; lead: number; show: Show }
export type Scene = { type: string; heading: string; from: number; frames: number; lines: Line[] }
export type Script = { classId: string; classNo: number; title: string; titleBn: string; fps: number; totalFrames: number; scenes: Scene[] }
export type ExplainerProps = { script: Script; audioBase: string; palette: Palette }

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ramp = (f: number, a: number, b = a + 14) => interpolate(f, [a, b], [0, 1], clamp)
const strip = (w: string) => w.replace(/[.,;:!?]/g, '').toLowerCase()

type Ctx = { p: Palette; dark: boolean }
const dim = (c: Ctx) => (c.dark ? 'rgba(255,255,255,.38)' : 'rgba(31,45,42,.32)')

function Words({ text, focus, c, f, size = 66 }: { text: string; focus: Focus[]; c: Ctx; f: number; size?: number }) {
  const words = text.split(' ')
  const on = focus.length > 0
  return (
    <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.45, textAlign: 'center' }}>
      {words.map((w, i) => {
        const hit = focus.find((x) => strip(x.w) === strip(w))
        const t = hit ? ramp(f, 4 + (hit.role === 'verb' ? 14 : 0), 22 + (hit.role === 'verb' ? 14 : 0)) : 0
        const col = hit?.role !== 'subj' ? c.p.gold : c.dark ? '#cfe3f3' : c.p.accent
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', margin: '0 12px', color: on && !hit ? dim(c) : undefined, transition: 'none' }}>
            {hit && <span style={{ position: 'absolute', left: -10, right: -10, top: 4, bottom: 4, borderRadius: 14, background: col, opacity: c.dark ? 0.35 : 0.28, transform: `scaleX(${t})`, transformOrigin: 'left' }} />}
            {hit && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 2, height: 8, borderRadius: 4, background: col, transform: `scaleX(${t})`, transformOrigin: 'left' }} />}
            <span style={{ position: 'relative', color: hit ? c.p.ink === '#e8eef0' ? '#fff' : undefined : undefined, transform: hit ? `scale(${1 + 0.06 * t})` : undefined, display: 'inline-block' }}>{w}</span>
            {hit && (hit.role !== 'key' || words.findIndex((x) => focus.some((f) => f.role === 'key' && strip(f.w) === strip(x))) === i) && <span style={{ position: 'absolute', left: -40, right: -40, ...(hit.role !== 'subj' ? { top: -30 } : { bottom: -32 }), textAlign: 'center', fontSize: 22, letterSpacing: '.1em', color: col, opacity: t, fontWeight: 800 }}>{hit.role === 'verb' ? 'VERB' : hit.role === 'key' ? 'KEY SOUND' : 'SUBJECT'}</span>}
          </span>
        )
      })}
    </div>
  )
}

function Chip({ children, color, f, at, big }: { children: React.ReactNode; color: string; f: number; at: number; big?: boolean }) {
  const { fps } = useVideoConfig()
  const s = spring({ frame: Math.max(0, f - at), fps, config: { damping: 14 } })
  return <div style={{ background: color, color: '#fff', borderRadius: 22, padding: big ? '22px 38px' : '14px 26px', fontSize: big ? 56 : 40, fontWeight: 800, transform: `scale(${s})`, opacity: s, boxShadow: '0 6px 0 rgba(0,0,0,.18)' }}>{children}</div>
}

function Beat({ line, c }: { line: Line; c: Ctx }) {
  const f = useCurrentFrame()
  const s = line.show
  const p = c.p
  const enter = s.keep ? 1 : ramp(f, 0, 12)
  const wrap: React.CSSProperties = { opacity: enter, transform: `translateY(${(1 - enter) * 22}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%' }

  if (s.kind === 'title') return null
  if (s.kind === 'text') {
    const words = (s.text ?? '').split(' ')
    return (
      <div style={{ ...wrap, gap: 26 }}>
        <div style={{ fontSize: words.length > 14 ? 40 : 50, fontWeight: 800, lineHeight: 1.35, textAlign: 'center', maxWidth: 820 }}>
          {words.map((w, i) => {
            const o = ramp(f, 4 + i * 3, 14 + i * 3)
            return <span key={i} style={{ display: 'inline-block', marginRight: 12, opacity: o, transform: `translateY(${(1 - o) * 14}px)`, color: i % 2 && !c.dark ? p.primaryD : undefined }}>{w}</span>
          })}
        </div>
        {s.bn && <div style={{ fontFamily: bnFont, fontSize: 28, opacity: ramp(f, 14 + words.length * 3) * 0.85, textAlign: 'center', maxWidth: 820 }}>{s.bn}</div>}
      </div>
    )
  }
  if (s.kind === 'svo') {
    const lab = ['Subject', 'Verb', 'Object']
    const hint = ['who we talk about', 'action or state', 'completes the idea']
    const ex = ['I', 'am', 'a student']
    const cols = [p.accent, p.gold, p.primary]
    return (
      <div style={wrap}>
        <div style={{ display: 'flex', gap: 22 }}>
          {lab.map((l, i) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Chip color={cols[i]} f={f} at={10 + i * 26} big>{l}</Chip>
              <div style={{ fontSize: 40, fontWeight: 800, opacity: ramp(f, 22 + i * 26) }}>{ex[i]}</div>
              {s.labels && <div style={{ fontSize: 22, opacity: ramp(f, 40 + i * 26) * 0.8 }}>{hint[i]}</div>}
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (s.kind === 'order') {
    const row = (items: string[], vi: number, label: string, font: string, at: number) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: ramp(f, at) }}>
        <div style={{ width: 120, fontSize: 24, fontWeight: 800, textAlign: 'right', opacity: 0.8 }}>{label}</div>
        {items.map((w, i) => (
          <div key={i} style={{ fontFamily: font, fontSize: 44, fontWeight: 800, padding: '12px 24px', borderRadius: 18, background: i === vi ? p.gold : p.accent, color: '#fff', boxShadow: '0 5px 0 rgba(0,0,0,.18)' }}>{w}</div>
        ))}
      </div>
    )
    return (
      <div style={{ ...wrap, gap: 40 }}>
        {row(['আমি', 'একজন ছাত্র', 'am'], 2, 'Bangla', bnFont, 8)}
        {row(['I', 'am', 'a student'], 1, 'English', enFont, 70)}
        <div style={{ fontSize: 28, fontWeight: 700, opacity: ramp(f, 100), color: c.dark ? p.gold : p.primaryD }}>The verb moves to the middle</div>
      </div>
    )
  }
  if (s.kind === 'example') {
    const focus = Array.isArray(s.focus) ? s.focus : []
    return (
      <div style={{ ...wrap, gap: 34, paddingTop: 30 }}>
        <Words text={s.text ?? ''} focus={focus} c={c} f={f} size={(s.text ?? '').length > 24 ? 54 : 66} />
        <div style={{ fontFamily: bnFont, fontSize: 30, opacity: ramp(f, 16) * 0.85 }}>{s.bn}</div>
      </div>
    )
  }
  if (s.kind === 'table') {
    const rows = [
      { subj: 'I', verb: 'am', col: p.accent },
      { subj: 'He / She / It / one thing', verb: 'is', col: p.gold },
      { subj: 'You / We / They / two or more', verb: 'are', col: p.primary },
    ]
    const hi = s.row ?? -1
    return (
      <div style={{ ...wrap, gap: 18 }}>
        {rows.map((r, i) => {
          const on = hi < 0 || hi === i
          const pulse = hi === i ? 1 + 0.03 * Math.sin(f / 5) : 1
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, width: 760, padding: '14px 26px', borderRadius: 22, background: hi === i ? `${r.col}33` : 'transparent', border: `3px solid ${hi === i ? r.col : 'transparent'}`, opacity: on ? ramp(f + (s.keep ? 99 : 0), i * 8) : 0.3, transform: `scale(${pulse})` }}>
              <div style={{ flex: 1, fontSize: 36, fontWeight: 700 }}>{r.subj}</div>
              <div style={{ fontSize: 34 }}>→</div>
              <div style={{ background: r.col, color: '#fff', borderRadius: 16, padding: '8px 30px', fontSize: 50, fontWeight: 800, minWidth: 140, textAlign: 'center' }}>{r.verb}</div>
            </div>
          )
        })}
      </div>
    )
  }
  if (s.kind === 'hesshe') {
    const split = ramp(f, 10, 40)
    return (
      <div style={{ ...wrap, gap: 26 }}>
                <div style={{ display: 'flex', gap: 60 }}>
          {[['He', '👨', 'male', p.accent], ['She', '👩', 'female', p.gold]].map(([w, e, l, col]) => (
            <div key={w} style={{ opacity: split, transform: `translateY(${(1 - split) * -30}px)`, textAlign: 'center' }}>
              <div style={{ fontSize: 64 }}>{e}</div>
              <div style={{ background: col, color: '#fff', borderRadius: 18, padding: '8px 34px', fontSize: 52, fontWeight: 800 }}>{w}</div>
              <div style={{ fontSize: 24, marginTop: 8, opacity: 0.8 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (s.kind === 'mistake') {
    const focus: Focus[] = typeof s.focus === 'string' ? [{ w: s.focus, role: 'verb' }] : []
    const second = ramp(f, Math.floor(line.frames * 0.42))
    return (
      <div style={{ ...wrap, gap: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 56, fontWeight: 800, opacity: enter }}>
          <span style={{ color: p.wrong, fontSize: 60 }}>✕</span>
          <span style={{ textDecoration: 'line-through', textDecorationColor: p.wrong, textDecorationThickness: 6, color: c.dark ? '#ffb4b4' : '#8a4a4a' }}>{s.wrong}</span>
        </div>
        <div style={{ opacity: second, transform: `translateY(${(1 - second) * 16}px)`, display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ color: p.primary, fontSize: 60 }}>✓</span>
          <Words text={s.right ?? ''} focus={focus} c={c} f={Math.max(0, f - Math.floor(line.frames * 0.42))} size={56} />
        </div>
      </div>
    )
  }
  return (
    <div style={{ ...wrap, gap: 16 }}>
      <div style={{ fontSize: 90 }}>{['🎓', '🗣️', '✅'][Math.floor(f / 18) % 3]}</div>
      <div style={{ fontSize: 56, fontWeight: 800 }}>Start the lesson</div>
      <div style={{ fontSize: 28, opacity: 0.85 }}>and say each sentence out loud</div>
    </div>
  )
}

function SceneView({ scene, c, props }: { scene: Scene; c: Ctx; props: ExplainerProps }) {
  const f = useCurrentFrame()
  const { p } = c
  const first = scene.lines[0].show
  const isTitle = first.kind === 'title'
  const fade = ramp(f, 0, 14)
  return (
    <AbsoluteFill style={{ opacity: fade, fontFamily: enFont, color: c.dark ? '#fff' : p.ink, alignItems: 'center', justifyContent: 'center' }}>
      {!isTitle && scene.heading && (
        <div style={{ position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 800, letterSpacing: '.04em', color: c.dark ? '#fff' : p.primaryD, opacity: ramp(f, 4), transform: `translateY(${(1 - ramp(f, 4)) * -12}px)` }}>{scene.heading}</div>
      )}
      {isTitle && (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <div style={{ display: 'inline-block', background: '#fff', color: p.primaryD, fontWeight: 800, borderRadius: 999, padding: '6px 26px', fontSize: 28, opacity: ramp(f, 10), transform: `scale(${spring({ frame: f, fps: 30, config: { damping: 12 } })})` }}>Class {props.script.classNo}</div>
          <div style={{ fontSize: 54, fontWeight: 800, marginTop: 20, lineHeight: 1.25, opacity: ramp(f, 22) }}>{props.script.title}</div>
          <div style={{ fontFamily: bnFont, fontSize: 30, marginTop: 10, opacity: ramp(f, 40) * 0.9 }}>{props.script.titleBn}</div>
        </div>
      )}
      <div style={{ position: 'absolute', top: 100, bottom: 70, left: 40, right: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {scene.lines.map((l, i) => (
          <Sequence key={i} from={l.from} durationInFrames={l.frames} layout="none"><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Beat line={l} c={c} /></div></Sequence>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 26, display: 'flex', gap: 10 }}>
        {scene.lines.length > 1 && scene.lines.map((l, i) => {
          const now = f >= l.from
          return <div key={i} style={{ width: now ? 26 : 10, height: 10, borderRadius: 5, background: now ? p.gold : 'rgba(128,128,128,.4)' }} />
        })}
      </div>
    </AbsoluteFill>
  )
}

const bgFor = (type: string, p: Palette): { bg: string; dark: boolean } => {
  if (type === 'title') return { bg: `linear-gradient(135deg, ${p.hero1}, ${p.hero2})`, dark: true }
  if (type === 'examples') return { bg: `linear-gradient(135deg, ${p.hero2}, ${p.hero1})`, dark: true }
  return { bg: p.page, dark: p.ink === '#e8eef0' }
}

export function Explainer(props: ExplainerProps) {
  const { script, audioBase, palette } = props
  return (
    <AbsoluteFill>
      {script.scenes.map((sc, i) => {
        const { bg, dark } = bgFor(sc.type, palette)
        return (
          <Sequence key={i} from={sc.from} durationInFrames={sc.frames}>
            <AbsoluteFill style={{ background: bg }} />
            <SceneView scene={sc} c={{ p: palette, dark }} props={props} />
          </Sequence>
        )
      })}
      {script.scenes.flatMap((sc) => sc.lines.map((l, i) => (
        <Sequence key={`${sc.from}-${i}`} from={sc.from + l.from + l.lead} durationInFrames={l.frames - l.lead}><Audio src={audioBase + l.audio} /></Sequence>
      )))}
    </AbsoluteFill>
  )
}
