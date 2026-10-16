import { useEffect, useMemo, useRef, useState } from 'react'
import type { ClassUnit, Exercise } from './types'
import { buildSession, grade, type Grade, type Value } from './grade'
import { ExerciseView } from './Exercises'
import { speak } from './speech'
import { CelebrateClip } from './clips/lazy'
import { burst, MILESTONES } from './fx'
import { playCorrect, playWrong } from './sound'
import { buildHomework } from './homework'
import { describe, findRefs } from './review'

interface Props {
  unit: ClassUnit
  seen: string[]
  streak: number
  homework?: boolean
  onFinish: (r: { correct: number; total: number; xp: number; ids: string[] }) => void
  onExit: () => void
}

interface QItem { ex: Exercise; retry: boolean }

// A question is "slow" when the first attempt took longer than this (seconds).
const SLOW_S: Record<Exercise['type'], number> = { vocab_select: 10, listen: 15, fill_blank: 15, match: 25, order: 30 }
const AUTO_NEXT_MS = 1800

interface LogItem { ex: Exercise; ms: number; slow: boolean; correct: boolean; given: string }
const fmt = (v: Value) => (Array.isArray(v) ? v.join(' ') : typeof v === 'string' ? v : '')

export function Lesson({ unit, seen, streak, homework, onFinish, onExit }: Props) {
  const initial = useMemo(
    () => (homework ? buildHomework(unit) : buildSession(unit.exercises, seen)).map((ex) => ({ ex, retry: false })),
    [unit, seen, homework])
  const [queue, setQueue] = useState<QItem[]>(initial)
  const [idx, setIdx] = useState(0)
  const [value, setValue] = useState<Value>(null)
  const [result, setResult] = useState<Grade | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [log, setLog] = useState<LogItem[]>([])
  const started = useRef(Date.now())
  const total = initial.length

  const cur = queue[idx]
  const done = idx >= queue.length
  useEffect(() => { if (done) burst(true, { x: 0.5, y: 0.4 }) }, [done])

  const check = () => {
    if (!cur || value === null) return
    const g = grade(cur.ex, value)
    setResult(g)
    if (!cur.retry) {
      const ms = Date.now() - started.current
      setLog((l) => [...l, { ex: cur.ex, ms, slow: ms > SLOW_S[cur.ex.type] * 1000, correct: g.correct, given: fmt(value) }])
    }
    if (g.correct) {
      playCorrect()
      if (!cur.retry) setCorrect((c) => c + 1)
      burst(false)
      if (cur.ex.type === 'order') speak(cur.ex.answer)
    } else {
      playWrong()
    }
    if (!g.correct && !cur.retry) {
      setQueue((q) => [...q, { ex: cur.ex, retry: true }]) // one more try at the end
    }
  }

  const next = () => {
    setResult(null)
    setValue(null)
    setIdx((i) => i + 1)
  }
  const nextRef = useRef(next)
  nextRef.current = next
  useEffect(() => { started.current = Date.now() }, [idx])
  // Right answer: sound and confetti, a short pause, then on to the next question.
  useEffect(() => {
    if (!result?.correct) return
    const t = setTimeout(() => nextRef.current(), cur?.ex.type === 'order' ? AUTO_NEXT_MS + 800 : AUTO_NEXT_MS)
    return () => clearTimeout(t)
  }, [result, cur])

  if (done) {
    const pct = Math.round((correct / total) * 100)
    const xp = homework ? 0 : correct * 10 + 10
    const slow = log.filter((l) => l.slow)
    const missed = log.filter((l) => !l.correct)
    return (
      <div className="screen done-screen">
        <div className="celebrate">
          {homework
            ? <div className="hw-done">📚 Homework complete!</div>
            : <CelebrateClip pct={pct} xp={xp} correct={correct} total={total} streak={streak} autoPlay controls={false} label="Lesson complete celebration" />}
        </div>
        {!homework && MILESTONES.includes(streak) && <div className="milestone">🔥 {streak} day streak milestone!</div>}
        <div className="stats">
          <div className="stat"><b>{correct}/{total}</b><span>first try</span></div>
          <div className="stat"><b>{pct}%</b><span>accuracy</span></div>
          {!homework && <div className="stat"><b>+{xp}</b><span>XP</span></div>}
        </div>

        {slow.length > 0 && (
          <section className="report">
            <h2>⏱ Took a while</h2>
            <p className="sub">These questions took longer than usual. Practise them until they feel quick.</p>
            {slow.map((l, i) => (
              <div className="rep-item slow" key={i}>
                <div className="rep-q">{describe(l.ex)}</div>
                <div className="rep-meta">{Math.round(l.ms / 1000)}s (target {SLOW_S[l.ex.type]}s){l.correct ? '' : ' · missed'}</div>
              </div>
            ))}
          </section>
        )}

        <section className="report">
          <h2>✏️ Mistakes to review</h2>
          {missed.length === 0 && <p className="sub">No mistakes on the first try. Excellent!</p>}
          {missed.map((l, i) => {
            const refs = findRefs(unit, l.ex)
            const ans = grade(l.ex, null).answerText
            return (
              <div className="rep-item bad" key={i}>
                <div className="rep-q">{describe(l.ex)}</div>
                {l.given && <div className="rep-meta">You answered: <span className="wrong">{l.given}</span></div>}
                <div className="rep-meta">Correct: <b className="right">{ans}</b></div>
                {refs.vocab.map((v, j) => (
                  <div className="rep-ref" key={j}><b>📘 {v.title}</b><div>{v.en}</div><div className="bn">{v.bn}</div></div>
                ))}
                {refs.rule && (
                  <div className="rep-ref">
                    <b>📖 Guidebook: {refs.rule.title}</b>
                    {refs.rule.points.slice(0, 2).map((p, j) => <div key={j}>{p.en}<div className="bn">{p.bn}</div></div>)}
                    {refs.rule.mistakes.slice(0, 2).map((m, j) => (
                      <div className="rep-mistake" key={j}><span className="wrong">✕ {m.wrong}</span> <span className="right">✓ {m.right}</span><div className="bn">{m.note_bn}</div></div>
                    ))}
                  </div>
                )}
                <a className="rep-link" href={`#/guide/${unit.id}`} onClick={(e) => { e.preventDefault(); window.open(`${location.pathname}#/guide/${unit.id}`, '_blank') }}>Open the guidebook</a>
              </div>
            )
          })}
        </section>

        <button className="btn primary" onClick={() => onFinish({ correct, total, xp, ids: initial.map((i) => i.ex.id) })}>
          Continue
        </button>
      </div>
    )
  }

  const progress = (Math.min(idx, total) / total) * 100
  const isCorrect = result?.correct

  return (
    <div className="screen lesson">
      <header className="lesson-top">
        <button className="icon-btn" aria-label="Quit lesson" onClick={() => { if (confirm(homework ? 'Quit this homework?' : 'Quit this lesson? Progress in it will be lost.')) onExit() }}>✕</button>
        <div className="bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>
      </header>
      <main className="lesson-body">
        <div className="body-top">
          {cur.retry ? <span className="retry-tag">Try again</span> : <span className="qno">Question {Math.min(idx + 1, total)} of {total}</span>}
          {!result && (
            <button type="button" className="reset-btn" onClick={() => { setValue(null); setResetKey((k) => k + 1) }}>
              ↺ Reset
            </button>
          )}
        </div>
        <ExerciseView key={`${idx}-${cur.ex.id}-${resetKey}`} ex={cur.ex} locked={!!result} onChange={setValue} />
      </main>
      <footer className={`lesson-foot ${result ? (isCorrect ? 'good' : 'bad') : ''}`}>
        {result && (
          <div className="feedback" role="status">
            <div className="fb-title">{isCorrect ? 'Correct!' : 'Not quite'}{isCorrect ? <span className="bn"> সঠিক!</span> : <span className="bn"> ভুল হয়েছে</span>}</div>
            {!isCorrect && (
              <div className="fb-answer"><span>Correct answer:</span><pre>{result.answerText}</pre></div>
            )}
            {cur.ex.type === 'listen' && <div className="fb-answer bn">{cur.ex.translation_bn}</div>}
          </div>
        )}
        {!result ? (
          <button className="btn primary" disabled={value === null} onClick={check}>Check</button>
        ) : (
          <button className={`btn ${isCorrect ? 'primary' : 'danger'}`} onClick={next} autoFocus>Continue</button>
        )}
      </footer>
    </div>
  )
}
