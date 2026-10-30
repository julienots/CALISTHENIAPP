import { Component, type ReactNode } from 'react'
import { snapshot } from '../lib/backup'
import { exportFile } from '../lib/share'

/** Si un écran plante, on affiche une sortie propre au lieu d'une page blanche. Les données ne sont pas touchées. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-3 px-6 text-center">
        <div className="h-display text-4xl">Oups, un écran a planté</div>
        <p className="text-sm text-white/70">Tes données sont intactes. Recharge l'appli ; si ça se reproduit, exporte ta sauvegarde par sécurité.</p>
        <pre className="max-h-32 overflow-auto rounded-xl bg-white/5 p-3 text-left text-[10px] text-white/50">{String(this.state.error?.message ?? this.state.error)}</pre>
        <button className="btn-primary !py-4" onClick={() => (window.location.hash = '#/', window.location.reload())}>
          Recharger
        </button>
        <button className="btn-ghost" onClick={() => exportFile(`gravitas-secours-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(snapshot()), 'application/json')}>
          Exporter mes données
        </button>
      </div>
    )
  }
}
