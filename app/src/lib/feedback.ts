// Retour sonore, vocal et haptique pour les timers et le coach en séance.
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { useStore } from './store'

let ctx: AudioContext | null = null
const audio = () => (ctx ??= new AudioContext())

export function beep(freq = 880, ms = 140, vol = 0.25) {
  if (!useStore.getState().settings.beeps) return
  try {
    const a = audio()
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = 'square'
    o.frequency.value = freq
    g.gain.setValueAtTime(vol, a.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + ms / 1000)
    o.connect(g).connect(a.destination)
    o.start()
    o.stop(a.currentTime + ms / 1000)
  } catch {
    /* audio indisponible */
  }
}

export const countdownBeep = () => beep(660, 110)
export const goBeep = () => beep(1320, 380, 0.3)
export const endBeep = () => {
  beep(990, 200)
  setTimeout(() => beep(1320, 450, 0.3), 220)
}

export async function say(text: string) {
  if (!useStore.getState().settings.voice) return
  try {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.speak({ text, lang: 'fr-FR', rate: 1.05, pitch: 1, volume: 1, category: 'playback' })
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'fr-FR'
      u.rate = 1.05
      window.speechSynthesis.speak(u)
    }
  } catch {
    /* TTS indisponible */
  }
}

export async function buzz(heavy = false) {
  if (!useStore.getState().settings.haptics) return
  try {
    if (Capacitor.isNativePlatform()) await Haptics.impact({ style: heavy ? ImpactStyle.Heavy : ImpactStyle.Light })
    else navigator.vibrate?.(heavy ? 120 : 30)
  } catch {
    /* pas de vibreur */
  }
}

let wakeLock: { release: () => Promise<void> } | null = null
export async function keepAwake(on: boolean) {
  try {
    if (on && !wakeLock && 'wakeLock' in navigator) wakeLock = await (navigator as unknown as { wakeLock: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen')
    if (!on && wakeLock) {
      await wakeLock.release()
      wakeLock = null
    }
  } catch {
    /* non supporté */
  }
}
