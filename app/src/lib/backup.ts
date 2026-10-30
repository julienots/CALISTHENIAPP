// Sauvegarde automatique locale : un fichier JSON dans le stockage privé de l'appli
// (survit à un vidage du cache de la WebView). Aucun serveur.
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { useStore } from './store'

const FILE = 'gravitas-auto-backup.json'
const KEYS = ['profile', 'records', 'sessions', 'analyses', 'programs', 'activeProgramId', 'completedDays', 'combos', 'userCompetitions', 'myCoach', 'importedCoaches', 'challenges', 'bonusXp', 'restDays', 'skin', 'dailyClaims', 'settings'] as const

export function snapshot() {
  const s = useStore.getState() as unknown as Record<string, unknown>
  const data: Record<string, unknown> = { app: 'GRAVITAS', version: 1, exportedAt: new Date().toISOString() }
  for (const k of KEYS) data[k] = s[k]
  return data
}

let timer: number | null = null
/** Écrit la sauvegarde (regroupée : au plus une écriture toutes les 5 s). */
export function scheduleAutoBackup() {
  if (!Capacitor.isNativePlatform()) return
  if (timer) clearTimeout(timer)
  timer = window.setTimeout(async () => {
    timer = null
    const data = snapshot()
    if (!data.profile) return
    try {
      await Filesystem.writeFile({ path: FILE, data: JSON.stringify(data), directory: Directory.Data, encoding: Encoding.UTF8 })
    } catch {
      /* stockage plein ou indisponible : on réessaiera au prochain changement */
    }
  }, 5000)
}

export async function readAutoBackup(): Promise<Record<string, unknown> | null> {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const r = await Filesystem.readFile({ path: FILE, directory: Directory.Data, encoding: Encoding.UTF8 })
    const data = JSON.parse(typeof r.data === 'string' ? r.data : await r.data.text())
    return data?.app === 'GRAVITAS' && data.profile ? data : null
  } catch {
    return null
  }
}

export function restore(data: Record<string, unknown>) {
  const clean: Record<string, unknown> = {}
  for (const k of KEYS) if (k in data) clean[k] = data[k]
  useStore.getState().importAll(clean)
}
