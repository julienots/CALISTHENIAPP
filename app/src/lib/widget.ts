// Pont avec le widget Android de l'écran d'accueil (aucun serveur : stockage local du téléphone).
// Le widget calcule lui-même la semaine en cours à partir des jours envoyés, pour rester juste
// même si l'appli n'est pas rouverte. Ses boutons « Valider » / « Repos » agissent sans ouvrir
// l'appli : les actions sont mises en attente côté natif puis appliquées ici au prochain lancement.
import { App as CapApp } from '@capacitor/app'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { nextProgramDay } from './coach'
import { quickRest, quickValidate } from './quick'
import { dayKey } from './stats'
import { useStore } from './store'
import { toast } from './toast'

interface WidgetPlugin {
  update(o: { data: string }): Promise<void>
  consume(): Promise<{ done: string[]; rest: string[] }>
}
const Native = registerPlugin<WidgetPlugin>('GravitasWidget')

const DAY = 86400000

export function widgetPayload() {
  const s = useStore.getState()
  const since = dayKey(new Date(Date.now() - 400 * DAY))
  const done = [...new Set(s.sessions.map((x) => dayKey(x.date)))].filter((k) => k >= since).sort()
  const rest = s.restDays.filter((k) => k >= since).sort()
  const np = nextProgramDay(s)
  return { next: np?.day ? np.day.title : 'Séance libre', minutes: np?.day?.estMinutes ?? 0, done, rest }
}

let last = ''
export async function syncWidget() {
  if (!Capacitor.isNativePlatform()) return
  const data = JSON.stringify(widgetPayload())
  if (data === last) return
  last = data
  try {
    await Native.update({ data })
  } catch {
    /* widget non disponible */
  }
}

/** Applique les validations faites depuis le widget pendant que l'appli était fermée. */
export async function consumeWidgetActions() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { done = [], rest = [] } = await Native.consume()
    for (const k of rest) quickRest(k)
    for (const k of done) quickValidate(k)
    const n = done.length
    if (n) toast(n === 1 ? 'Séance validée depuis le widget' : `${n} séances validées depuis le widget`, { label: 'Calendrier', to: '/calendar' })
    else if (rest.length) toast('Repos noté depuis le widget')
    last = ''
    syncWidget()
  } catch {
    /* rien en attente */
  }
}

/** Écoute le retour au premier plan pour reprendre les actions du widget. */
export function listenWidget() {
  if (!Capacitor.isNativePlatform()) return () => {}
  consumeWidgetActions()
  const h = CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      consumeWidgetActions()
      last = ''
      syncWidget() // le jour a pu changer
    }
  })
  return () => {
    h.then((x) => x.remove())
  }
}
