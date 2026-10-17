import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import { ExplainerClip } from './clips/lazy'
import type { Script } from './clips/Explainer'
import { applyTheme, loadTheme, THEMES, themeById } from './theme'
import { checkCode, isOpen, loadGates, loadUnlocked, saveUnlocked } from './gate'
import { burst } from './fx'
import { playCorrect, playWrong } from './sound'
import type { ClassUnit, Course } from './types'
import { emptyProgress, liveStreak, loadProgress, resetClasses, saveProgress, touchStreak, type Progress } from './storage'
import { getVoice, loadAudio, setVoice, voices } from './speech'
import { Lesson } from './Lesson'
import { Guidebook } from './Guidebook'
import { Speaking } from './Speaking'

function useHash() {
  const [h, setH] = useState(window.location.hash || '#/')
  useEffect(() => {
    const f = () => setH(window.location.hash || '#/')
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return h
}
const go = (h: string) => { window.location.hash = h }

export default function App() {
  const [course, setCourse] = useState<Course | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const hash = useHash()
  const [unlocked, setUnlocked] = useState<string[]>(loadUnlocked)

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}course.json`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() }),
      loadAudio(),
      loadGates(),
    ]).then(([c]) => c)
      .then(setCourse)
      .catch((e) => setError(`Could not load the course (${e.message}).`))
  }, [])

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((p) => { const n = fn(p); saveProgress(n); return n })
  }, [])

  const units = useMemo(
    () => course?.course.months.flatMap((m) => m.weeks.flatMap((w) => w.classes)) ?? [], [course])

  const [, groute, gid] = hash.split('/')
  const lockedRoute = !!course && ['lesson', 'guide', 'speak', 'homework'].includes(groute) && (() => {
    const u = units.find((x) => x.id === gid)
    return !!u && !isOpen(u, unlocked, progress)
  })()
  useEffect(() => { if (lockedRoute) go('#/') }, [lockedRoute])
  const unlock = useCallback(async (u: ClassUnit, code: string): Promise<boolean> => {
    if (!(await checkCode(u.id, code))) return false
    setUnlocked((l) => { const n = l.includes(u.id) ? l : [...l, u.id]; saveUnlocked(n); return n })
    return true
  }, [])

  if (error) return <div className="screen center"><div className="notice">{error}</div></div>
  if (!course) return <div className="screen center"><p>Loading...</p></div>

  const [, route, id] = hash.split('/')
  const unit = units.find((u) => u.id === id)

  let view: React.ReactNode
  if (lockedRoute) {
    view = <Home course={course} progress={progress} units={units} update={update} unlocked={unlocked} unlock={unlock} />
  } else if (route === 'homework' && unit) {
    // Revision class: draw homework from every class of that month.
    const pool = unit.revision ? units.filter((x) => x.month === unit.month) : [unit]
    const hwUnit: ClassUnit = pool.length === 1 ? unit : {
      ...unit,
      exercises: pool.flatMap((x) => x.exercises),
      speaking: pool.flatMap((x) => x.speaking),
      guidebook: { ...unit.guidebook, vocab: pool.flatMap((x) => x.guidebook.vocab), grammar: pool.flatMap((x) => x.guidebook.grammar),
        dialogue: { ...unit.guidebook.dialogue, lines: pool.flatMap((x) => x.guidebook.dialogue.lines) } },
    }
    view = <Lesson key={unit.id + hash} unit={hwUnit} seen={[]} streak={0} homework onExit={() => go('#/')} onFinish={() => go('#/')} />
  } else if (route === 'lesson' && unit) {
    const cp = progress.classes[unit.id]
    view = (
      <Lesson key={unit.id + hash} unit={unit} streak={touchStreak(progress).streak} seen={cp?.seen ?? []} onExit={() => go('#/')}
        onFinish={({ correct, total, xp, ids }) => {
          const pct = Math.round((correct / total) * 100)
          update((p) => {
            const old = p.classes[unit.id] ?? { done: false, bestPct: 0, sessions: 0, seen: [] }
            let seen = [...old.seen, ...ids]
            if (seen.length > unit.exercises.length - 10) seen = ids
            const t = touchStreak(p)
            return { ...t, xp: t.xp + xp, classes: { ...t.classes, [unit.id]: {
              done: old.done || pct >= 60, bestPct: Math.max(old.bestPct, pct), sessions: old.sessions + 1, seen } } }
          })
          go('#/')
        }} />
    )
  } else if (route === 'guide' && unit) view = <Guidebook unit={unit} onBack={() => go('#/')} />
  else if (route === 'speak' && unit) view = <Speaking unit={unit} onBack={() => go('#/')} />
  else view = <Home course={course} progress={progress} units={units} update={update} unlocked={unlocked} unlock={unlock} />

  const key = unit && route ? `${route}/${unit.id}` : 'home'
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {view}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  )
}

function Home({ course, progress, units, update, unlocked, unlock }: { course: Course; progress: Progress; units: ClassUnit[]; update: (fn: (p: Progress) => Progress) => void; unlocked: string[]; unlock: (u: ClassUnit, code: string) => Promise<boolean> }) {
  const open_ = (u: ClassUnit) => isOpen(u, unlocked, progress)
  const [code, setCode] = useState('')
  const [codeMsg, setCodeMsg] = useState('')
  const [open, setOpen] = useState<ClassUnit | null>(null)
  const [explain, setExplain] = useState(false)
  const [avail, setAvail] = useState<string[]>([])
  const [script, setScript] = useState<Script | null>(null)
  const [theme, setTheme] = useState(loadTheme)
  useEffect(() => { applyTheme(theme) }, [theme])
  const base = import.meta.env.BASE_URL
  useEffect(() => {
    fetch(`${base}explainers/index.json`).then((r) => (r.ok ? r.json() : [])).then(setAvail).catch(() => setAvail([]))
  }, [base])
  useEffect(() => {
    if (!explain || !open) return
    setScript(null)
    fetch(`${base}explainers/${open.id}.json`).then((r) => r.json()).then(setScript).catch(() => setExplain(false))
  }, [explain, open, base])
  const core = units.filter((u) => !u.variant)
  const next = core.find((u) => !progress.classes[u.id]?.done && open_(u))
  const waiting = !next ? core.find((u) => !progress.classes[u.id]?.done) : undefined
  const streak = liveStreak(progress)
  const [voice, setV] = useState(getVoice())
  const doneCount = core.filter((u) => progress.classes[u.id]?.done).length
  const pct = core.length ? Math.round((doneCount / core.length) * 100) : 0
  return (
    <div className="screen home">
      <header className="hero-head">
        <div>
          <div className="eyebrow">Welcome back, {course.course.learner}</div>
          <h1>{course.course.title.en}</h1>
          <p className="bn">{course.course.title.bn}</p>
        </div>
        <div className="head-tools">
        <button className="btn reset-all" onClick={() => {
          if (confirm('Reset ALL progress? XP, streak and every completed lesson will be cleared. This cannot be undone.'))
            update(() => emptyProgress())
        }}>↺ Reset all progress</button>
        <div className="theme-pick" role="radiogroup" aria-label="Theme">
          <span>Theme</span>
          {THEMES.map((t) => (
            <button key={t.id} role="radio" aria-checked={theme === t.id} aria-label={t.label} title={t.label}
              className={`swatch ${theme === t.id ? 'on' : ''}`} style={{ background: t.swatch }} onClick={() => setTheme(t.id)} />
          ))}
        </div>
        </div>
        {voices().length > 0 && (
          <label className="voice">Voice
            <select value={voice} onChange={(e) => { setVoice(e.target.value); setV(e.target.value) }}>
              {voices().map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
        )}
      </header>

      <div className="stat-row">
        {[['🔥', streak, 'day streak'], ['⚡', progress.xp, 'total XP'], ['🎓', `${doneCount}/${core.length}`, 'classes done']].map(([ico, v, l], i) => (
          <m.div key={l as string} className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <span className="ico">{ico}</span><b>{v}</b><span>{l}</span>
          </m.div>
        ))}
      </div>
      <div className="overall" aria-label={`Course progress ${pct}%`}><m.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} /></div>

      {waiting && (
        <section className="continue waiting">
          <div>
            <div className="eyebrow light">Next up · Class {waiting.no}</div>
            <h2>{waiting.title.en}</h2>
            <p className="bn">Send your voice recording to your teacher on WhatsApp. She will give you the code to unlock this class.</p>
          </div>
        </section>
      )}
      {next && (
        <section className="continue">
          <div>
            <div className="eyebrow light">{doneCount === 0 ? 'Start here' : 'Continue learning'} · Class {next.no}</div>
            <h2>{next.title.en}</h2>
            <p className="bn">{next.title.bn}</p>
          </div>
          <button className="btn white" onClick={() => go(`#/lesson/${next.id}`)}>Start lesson</button>
        </section>
      )}

      {course.course.months.map((mo) => (
        <section key={mo.id} className="month-block">
          <h2 className="month-h">Month {mo.month}: {mo.title.en}</h2>
          <p className="bn month-bn">{mo.title.bn}</p>
          {mo.weeks.map((w) => (
            <div key={w.id}>
              <div className="week-row">
                <h3 className="week-h">Week {w.week}</h3>
                {w.classes.some((u) => progress.classes[u.id]) && (
                  <button className="reset-link" onClick={() => {
                    if (confirm(`Reset Week ${w.week}? Your lesson scores for this week will be cleared. XP and streak are kept.`))
                      update((p) => resetClasses(p, w.classes.map((u) => u.id)))
                  }}>↺ Reset week</button>
                )}
              </div>
              <div className="grid">
                {w.classes.map((u) => {
                  const cp = progress.classes[u.id]
                  const isLocked = !open_(u)
                  const state = isLocked ? 'locked' : cp?.done ? 'done' : u === next ? 'next' : ''
                  return (
                    <m.button key={u.id} className={`ccard ${state}`} onClick={() => { setExplain(false); setCode(''); setCodeMsg(''); setOpen(u) }}
                      whileTap={{ scale: 0.97 }} aria-label={`Class ${u.no}: ${u.title.en}`}>
                      <span className="badge">{isLocked ? '🔒' : cp?.done ? '✓' : u.variant ? `${u.no}R` : u.no}</span>
                      <span className="ctext">
                        <span className="ctitle">{u.title.en}</span>
                        <span className="cbn bn">{u.title.bn}</span>
                        <span className="cmeta">{isLocked ? 'Locked. Ask your teacher for the code.' : cp ? `Best ${cp.bestPct}% · ${cp.sessions} session${cp.sessions === 1 ? '' : 's'}` : u.grammar.en}</span>
                      </span>
                    </m.button>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
      {open && (
        <m.div className="sheet-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setOpen(null)}>
          <m.div className="sheet" role="dialog" aria-label={`Class ${open.no}`} onClick={(e) => e.stopPropagation()}
            initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}>
            <div className="eyebrow">Class {open.no} · Week {open.week}</div>
            <h2>{open.title.en}</h2>
            <p className="bn">{open.title.bn}</p>
            <p className="gram">{open.grammar.en}</p>
            {!open_(open) && (
              <div className="lock-box">
                <p className="lock-msg">🔒 This class is locked. After you send your recordings, your teacher will give you the code for Class {open.no}.</p>
                <form className={`code-row ${codeMsg ? 'bad' : ''}`} onSubmit={async (e) => {
                  e.preventDefault()
                  const ok = await unlock(open, code)
                  if (ok) { playCorrect(); burst(true, { x: 0.5, y: 0.6 }); setCodeMsg(''); setCode('') }
                  else { playWrong(); setCodeMsg('That code is not right. Check it with your teacher.') }
                }}>
                  <input className="code-input" value={code} onChange={(e) => { setCode(e.target.value); setCodeMsg('') }} placeholder="Enter code"
                    aria-label="Unlock code" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} maxLength={12} />
                  <button className="btn primary" type="submit" disabled={!code.trim()}>Unlock</button>
                </form>
                {codeMsg && <p className="code-err" role="alert">{codeMsg}</p>}
              </div>
            )}
            {open_(open) && progress.classes[open.id] && (
              <p className="best">Best score {progress.classes[open.id].bestPct}% · {progress.classes[open.id].sessions} sessions</p>
            )}
            {open_(open) && (<>
            {explain && (
              <div className="explain">
                {script ? <ExplainerClip script={script} audioBase={`${base}explainers/`} palette={themeById(theme).palette} label={`Class ${open.no} explainer`} /> : <div className="clip-skel" aria-hidden="true" />}
              </div>
            )}
            <button className="btn primary" onClick={() => go(`#/lesson/${open.id}`)}>Start lesson</button>
            {avail.includes(open.id) && (
              <button className="btn ghost" onClick={() => setExplain((x) => !x)}>{explain ? 'Hide explainer' : '▶ Watch explainer with voice'}</button>
            )}
            <button className="btn ghost" onClick={() => go(`#/guide/${open.id}`)}>Guidebook</button>
            <button className="btn ghost" onClick={() => go(`#/homework/${open.id}`)}>📚 Homework: 100 mixed exercises</button>
            {open.speaking.length > 0 && (
              <button className="btn ghost" onClick={() => go(`#/speak/${open.id}`)}>Speaking practice</button>
            )}
            </>)}
            <button className="link" onClick={() => setOpen(null)}>Close</button>
          </m.div>
        </m.div>
      )}
    </div>
  )
}
