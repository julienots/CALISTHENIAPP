// Copie le runtime WASM de MediaPipe et télécharge le modèle de pose
// pour que l'analyseur vidéo fonctionne 100 % hors ligne dans l'APK.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'

const wasmSrc = 'node_modules/@mediapipe/tasks-vision/wasm'
const wasmDst = 'public/mediapipe'
mkdirSync(wasmDst, { recursive: true })
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  copyFileSync(`${wasmSrc}/${f}`, `${wasmDst}/${f}`)
}

const model = 'public/models/pose_landmarker_full.task'
if (!existsSync(model)) {
  mkdirSync('public/models', { recursive: true })
  const url = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Téléchargement du modèle impossible : ${res.status}`)
  writeFileSync(model, Buffer.from(await res.arrayBuffer()))
}
console.log('Assets MediaPipe prêts.')
