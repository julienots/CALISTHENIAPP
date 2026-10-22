import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/ui'
import { askClaude, localAnswer } from '../lib/coach'
import { useStore } from '../lib/store'

const SUGGESTIONS = ['Comment débloquer la full planche ?', 'Analyse ma dernière semaine', 'J\'ai mal aux poignets, que faire ?', 'Prépare-moi pour une compétition dans 6 semaines', 'Pourquoi je stagne sur le front lever ?']

export default function CoachChat() {
  const s = useStore()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [msgs, setMsgs] = useState(s.chat)
  const end = useRef<HTMLDivElement>(null)
  const online = !!s.settings.anthropicKey && navigator.onLine

  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs])
  useEffect(() => s.setChat(msgs.slice(-40)), [msgs]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (text: string) => {
    if (!text.trim() || busy) return
    const hist = [...msgs, { role: 'user' as const, content: text.trim() }]
    setMsgs([...hist, { role: 'assistant', content: '' }])
    setInput('')
    if (!online) {
      setMsgs([...hist, { role: 'assistant', content: localAnswer(text, useStore.getState()) }])
      return
    }
    setBusy(true)
    let acc = ''
    try {
      await askClaude(hist.slice(-20), (t) => {
        acc += t
        setMsgs([...hist, { role: 'assistant', content: acc }])
      })
    } catch (e) {
      setMsgs([...hist, { role: 'assistant', content: `⚠️ ${(e as Error).message}\n\n${localAnswer(text, useStore.getState())}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-xl flex-col px-4">
      <Header title="Coach" sub={online ? '🟢 Coach IA Claude — connaît toutes tes données' : '🟠 Mode hors ligne — moteur d\'analyse local'} back right={<button className="chip" onClick={() => setMsgs([])}>Effacer</button>} />
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {!msgs.length && (
          <div className="space-y-2">
            <p className="text-sm text-white/55">Pose n'importe quelle question : technique, programmation, douleurs, nutrition, compétition. Je m'appuie sur tes séances, records et analyses.</p>
            {!s.settings.anthropicKey && <Link to="/settings" className="block text-xs text-volt">Ajouter une clé API pour le coach IA complet →</Link>}
            {SUGGESTIONS.map((q) => (
              <button key={q} className="chip !block w-full !py-2.5 text-left" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-volt text-ink-950' : 'border border-white/10 bg-ink-800'}`}>
            {m.content || <span className="animate-pulse text-white/40">…</span>}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="flex gap-2 pt-2" style={{ paddingBottom: 'calc(var(--safe-bottom) + 90px)' }} onSubmit={(e) => (e.preventDefault(), send(input))}>
        <input className="input" placeholder="Ta question…" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-primary" disabled={busy}>➤</button>
      </form>
    </div>
  )
}
