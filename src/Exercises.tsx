import { useEffect, useMemo, useState } from 'react'
import type { Exercise, FillBlank, Listen, Match, Order, VocabSelect } from './types'
import { canSpeak, speak } from './speech'
import { shuffle, type Value } from './grade'

interface Props {
  ex: Exercise
  locked: boolean
  onChange: (v: Value) => void
}

const langClass = (l?: string) => (l === 'bn' ? 'bn' : '')

function SpeakBtn({ text, slow }: { text: string; slow?: boolean }) {
  if (!canSpeak()) return null
  return (
    <button type="button" className={`speak-btn ${slow ? 'slow' : ''}`} aria-label={slow ? 'Play slowly' : 'Play audio'}
      onClick={() => speak(text, slow ? 0.7 : 1)}>
      {slow ? '🐢' : '🔊'}
    </button>
  )
}

function Choices({ options, lang, value, locked, answer, onPick }: {
  options: string[]; lang?: string; value: string | null; locked: boolean; answer: string; onPick: (o: string) => void
}) {
  return (
    <div className="choices" role="radiogroup">
      {options.map((o) => {
        const state = locked ? (o === answer ? 'right' : o === value ? 'wrong' : '') : o === value ? 'sel' : ''
        return (
          <button key={o} type="button" role="radio" aria-checked={o === value} disabled={locked}
            className={`choice ${langClass(lang)} ${state}`} onClick={() => onPick(o)}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

function Select({ ex, locked, onChange }: { ex: VocabSelect; locked: boolean; onChange: (v: Value) => void }) {
  const opts = useMemo(() => shuffle(ex.options), [ex.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [val, setVal] = useState<string | null>(null)
  return (
    <>
      <div className={`stem ${langClass(ex.stem_lang)}`}>
        {ex.stem_lang === 'en' && <SpeakBtn text={ex.speak ?? ex.stem} />}
        <span>{ex.stem}</span>
      </div>
      {ex.pron && <div className="pron">{ex.pron}</div>}
      <Choices options={opts} lang={ex.option_lang} value={val} locked={locked} answer={ex.answer}
        onPick={(o) => { setVal(o); onChange(o) }} />
    </>
  )
}

function Fill({ ex, locked, onChange }: { ex: FillBlank; locked: boolean; onChange: (v: Value) => void }) {
  const opts = useMemo(() => shuffle(ex.options), [ex.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [val, setVal] = useState<string | null>(null)
  const [before, after] = ex.sentence.split('______')
  return (
    <>
      <div className="stem sentence">
        <span>{before}</span>
        <span className={`blank ${val ? 'filled' : ''}`}>{val ?? '     '}</span>
        <span>{after}</span>
      </div>
      {ex.note_en && <div className="pron">{ex.note_en}</div>}
      <Choices options={opts} value={val} locked={locked} answer={ex.answer}
        onPick={(o) => { setVal(o); onChange(o) }} />
    </>
  )
}

function ListenEx({ ex, locked, onChange }: { ex: Listen; locked: boolean; onChange: (v: Value) => void }) {
  const opts = useMemo(() => shuffle(ex.options), [ex.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [val, setVal] = useState<string | null>(null)
  useEffect(() => { const t = setTimeout(() => speak(ex.audio_text), 350); return () => clearTimeout(t) }, [ex.id, ex.audio_text])
  return (
    <>
      {canSpeak() ? (
        <div className="listen-row">
          <SpeakBtn text={ex.audio_text} />
          <SpeakBtn text={ex.audio_text} slow />
        </div>
      ) : (
        <div className="notice">Audio is not available in this browser. Read the sentence: <b>{ex.audio_text}</b></div>
      )}
      <Choices options={opts} value={val} locked={locked} answer={ex.answer}
        onPick={(o) => { setVal(o); onChange(o) }} />
    </>
  )
}

function OrderEx({ ex, locked, onChange }: { ex: Order; locked: boolean; onChange: (v: Value) => void }) {
  const bank = useMemo(() => {
    let s = shuffle(ex.tokens.map((t, i) => ({ t, i })))
    for (let k = 0; k < 5 && s.map((x) => x.t).join(' ') === ex.answer; k++) s = shuffle(s)
    return s
  }, [ex.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [chosen, setChosen] = useState<number[]>([])
  const update = (next: number[]) => {
    setChosen(next)
    const words = next.map((i) => ex.tokens[i])
    onChange(next.length === ex.tokens.length ? words : null)
  }
  const tokenText = (i: number) => bank.find((b) => b.i === i)!.t
  return (
    <>
      {ex.hint && <div className={`stem ${langClass(ex.hint_lang)}`}>{ex.hint}</div>}
      <div className="answer-line" aria-label="Your sentence">
        {chosen.map((i) => (
          <button key={i} type="button" className="chip" disabled={locked}
            onClick={() => update(chosen.filter((c) => c !== i))}>{tokenText(i)}</button>
        ))}
      </div>
      <div className="bank">
        {bank.map((b) => (
          <button key={b.i} type="button" className={`chip ${chosen.includes(b.i) ? 'used' : ''}`}
            disabled={locked || chosen.includes(b.i)} onClick={() => update([...chosen, b.i])}>{b.t}</button>
        ))}
      </div>
    </>
  )
}

function MatchEx({ ex, locked, onChange }: { ex: Match; locked: boolean; onChange: (v: Value) => void }) {
  const rights = useMemo(() => shuffle(ex.pairs.map((p) => p.right)), [ex.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [left, setLeft] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([]) // matched left items
  const [bad, setBad] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const rightOf = (l: string) => ex.pairs.find((p) => p.left === l)!.right
  const doneRights = done.map(rightOf)

  const pickRight = (r: string) => {
    if (!left || locked) return
    if (rightOf(left) === r) {
      const next = [...done, left]
      setDone(next)
      setLeft(null)
      if (next.length === ex.pairs.length) onChange({ mistakes })
    } else {
      setMistakes((m) => m + 1)
      setBad(r)
      setTimeout(() => setBad(null), 500)
    }
  }
  return (
    <div className="match">
      <div className="col">
        {ex.pairs.map((p) => (
          <button key={p.left} type="button" disabled={locked || done.includes(p.left)}
            className={`choice ${langClass(ex.left_lang)} ${done.includes(p.left) ? 'right' : left === p.left ? 'sel' : ''}`}
            onClick={() => setLeft(p.left)}>{p.left}</button>
        ))}
      </div>
      <div className="col">
        {rights.map((r) => (
          <button key={r} type="button" disabled={locked || doneRights.includes(r)}
            className={`choice ${langClass(ex.right_lang)} ${doneRights.includes(r) ? 'right' : bad === r ? 'wrong' : ''}`}
            onClick={() => pickRight(r)}>{r}</button>
        ))}
      </div>
    </div>
  )
}

export function ExerciseView({ ex, locked, onChange }: Props) {
  return (
    <div className="exercise">
      <h2 className="prompt">{ex.prompt_en}</h2>
      <p className="prompt-bn bn">{ex.prompt_bn}</p>
      {ex.type === 'vocab_select' && <Select ex={ex} locked={locked} onChange={onChange} />}
      {ex.type === 'fill_blank' && <Fill ex={ex} locked={locked} onChange={onChange} />}
      {ex.type === 'listen' && <ListenEx ex={ex} locked={locked} onChange={onChange} />}
      {ex.type === 'order' && <OrderEx ex={ex} locked={locked} onChange={onChange} />}
      {ex.type === 'match' && <MatchEx ex={ex} locked={locked} onChange={onChange} />}
    </div>
  )
}
