import type { ClassUnit } from './types'
import { canSpeak, speak } from './speech'
import { GOOGLE_FORM_URL } from './config'

/** Manual speaking practice: listen, record a voice note on the phone, send it to the teacher. */
export function Speaking({ unit, onBack }: { unit: ClassUnit; onBack: () => void }) {
  const items = unit.speaking
  const can = canSpeak()

  return (
    <div className="screen page">
      <header className="topbar">
        <button className="icon-btn" aria-label="Back" onClick={onBack}>←</button>
        <div>
          <div className="eyebrow">Speaking practice · Class {unit.no}</div>
          <h1 className="title">{unit.title.en}</h1>
        </div>
      </header>
      <section className="card">
        <ol className="steps">
          <li>Listen to each sentence and repeat it aloud.</li>
          <li>Record one voice message reading all the sentences.</li>
          <li>Send the voice message to your teacher on WhatsApp.</li>
        </ol>
        <p className="bn">প্রতিটি বাক্য শুনে জোরে বলো। সবগুলো বাক্য একটি ভয়েস মেসেজে রেকর্ড করে হোয়াটসঅ্যাপে শিক্ষককে পাঠাও।</p>
      </section>
      {items.map((s, i) => (
        <section className="card" key={i}>
          <div className="vrow">
            <button className={`say ${can ? '' : 'off'}`} onClick={() => speak(s.text)} aria-label={`Play: ${s.text}`}>🔊</button>
            <button className={`say ${can ? '' : 'off'}`} onClick={() => speak(s.text, 0.7)} aria-label="Play slowly">🐢</button>
            <div><b>{i + 1}. {s.text}</b>{s.bn && <div className="bn">{s.bn}</div>}</div>
          </div>
        </section>
      ))}
      <p className="note wa-note">🎙️ Record your voice message, then send the audio to your teacher on WhatsApp.</p>
      {GOOGLE_FORM_URL && (
        <a className="btn ghost linkbtn" href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">Open Google Form</a>
      )}
    </div>
  )
}
