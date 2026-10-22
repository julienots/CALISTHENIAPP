// Export / partage : CSV, sauvegardes JSON, codes de partage de programmes.
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export async function exportFile(name: string, content: string, mime: string) {
  if (Capacitor.isNativePlatform()) {
    const res = await Filesystem.writeFile({ path: name, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 })
    await Share.share({ title: name, url: res.uri, dialogTitle: 'Exporter' })
    return
  }
  const blob = new Blob(['﻿' + content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export async function shareText(title: string, text: string) {
  try {
    if (Capacitor.isNativePlatform()) return void (await Share.share({ title, text }))
    if (navigator.share) return void (await navigator.share({ title, text }))
  } catch {
    /* partage annulé */
  }
  await navigator.clipboard?.writeText(text)
  alert('Copié dans le presse-papiers.')
}

/** Encode un objet en code compact partageable (base64 URL-safe). */
export function encodeShare(obj: unknown) {
  const json = JSON.stringify(obj)
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return 'GRV1.' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeShare<T>(code: string): T {
  const raw = code.trim().replace(/^GRV1\./, '').replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(raw + '==='.slice((raw.length + 3) % 4))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as T
}

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((res) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => res(input.files?.[0] ?? null)
    input.click()
  })
}
