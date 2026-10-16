import type { ClassUnit } from './types'
import { canSpeak, speak } from './speech'

export function Guidebook({ unit, onBack }: { unit: ClassUnit; onBack: () => void }) {
  const g = unit.guidebook
  const can = canSpeak()
  const say = (t: string) => (can ? speak(t) : undefined)
  return (
    <div className="screen page">
      <header className="topbar">
        <button className="icon-btn" aria-label="Back" onClick={onBack}>←</button>
        <div>
          <div className="eyebrow">Guidebook · Class {unit.no}</div>
          <h1 className="title">{unit.title.en}</h1>
          <p className="bn sub">{unit.title.bn}</p>
        </div>
      </header>

      <section className="card">
        <h2>Goal</h2>
        <p>{g.outcome.en}</p>
        <p className="bn">{g.outcome.bn}</p>
      </section>

      <h2 className="sec">Grammar</h2>
      {g.grammar.map((b, i) => (
        <section className="card" key={i}>
          <h3>{b.rule.en}</h3>
          <p className="bn">{b.rule.bn}</p>
          {b.points.map((p, j) => (
            <div className="pt" key={j}><p>{p.en}</p><p className="bn">{p.bn}</p></div>
          ))}
          <h4>Examples</h4>
          <ul className="ex">
            {b.examples.map((e, j) => (
              <li key={j}>
                <button className={`say ${can ? '' : 'off'}`} onClick={() => say(e.en)} aria-label={`Play: ${e.en}`}>🔊</button>
                <div><b>{e.en}</b><div className="bn">{e.bn}</div></div>
              </li>
            ))}
          </ul>
          {b.mistakes.length > 0 && <h4>Common mistakes</h4>}
          {b.mistakes.map((m, j) => (
            <div className="mistake" key={j}>
              <div className="wrong">✗ {m.wrong}</div>
              <div className="right">✓ {m.right}</div>
              <div className="bn note">{m.note_bn}</div>
            </div>
          ))}
        </section>
      ))}

      {g.vocab.length > 0 && <h2 className="sec">Vocabulary</h2>}
      {g.vocab.map((v, i) => (
        <section className="card vocab" key={i}>
          <div className="vrow">
            <button className={`say ${can ? '' : 'off'}`} onClick={() => say(v.en)} aria-label={`Play: ${v.en}`}>🔊</button>
            <div>
              <b>{v.en}</b> <span className="pron">{v.pron}</span>
              <div className="bn">{v.bn}</div>
            </div>
          </div>
          <p className="vex">{v.example_en}</p>
          <p className="bn vex">{v.example_bn}</p>
        </section>
      ))}

      {g.dialogue.lines.length > 0 && !g.dialogue.lines[0].who.startsWith('Task') && (
        <>
          <h2 className="sec">Model dialogue</h2>
          <p className="setting">{g.dialogue.setting.en}</p>
          <p className="setting bn">{g.dialogue.setting.bn}</p>
          <section className="card">
            {g.dialogue.lines.map((l, i) => (
              <div className="dl" key={i}>
                <div className="who">{l.who}</div>
                <div>
                  <button className="line-btn" onClick={() => say(l.en)}>{can ? '🔊 ' : ''}{l.en}</button>
                  <div className="bn">{l.bn}</div>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
