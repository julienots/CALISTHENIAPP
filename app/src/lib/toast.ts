// Petites notifications en bas d'écran (ex : « Séance validée · Détailler »).
export interface ToastMsg {
  id: number
  text: string
  action?: { label: string; to: string }
}
type Listener = (t: ToastMsg) => void
const listeners = new Set<Listener>()
let n = 0
export function toast(text: string, action?: ToastMsg['action']) {
  const t = { id: ++n, text, action }
  listeners.forEach((l) => l(t))
}
export function onToast(l: Listener) {
  listeners.add(l)
  return () => void listeners.delete(l)
}
