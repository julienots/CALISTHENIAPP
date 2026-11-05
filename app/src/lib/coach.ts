// Le coach : moteur de règles hors ligne (charge, récupération, plateaux,
// technique, équilibre push/pull, rang) + conversation Claude en ligne.
import { ADVICE, QUALITY_LABEL, weakest } from './bilan'
import type { Bilan } from './types'
import Anthropic from '@anthropic-ai/sdk'
import { SKILL_BY_ID, CUES } from '../data/skills'
import { computeRank, LEVEL_NAMES, skillStatuses, type SkillStatus } from './scoring'
import { acwr, DAY, projection, streak } from './stats'
import { useStore } from './store'
import { EX_BY_ID } from '../data/exercises'

export interface Insight {
  tone: 'good' | 'warn' | 'info' | 'alert'
  title: string
  text: string
  to?: string
  cta?: string
}

type S = ReturnType<typeof useStore.getState>

export function readiness(s: S) {
  const last = [...s.sessions].sort((a, b) => b.date.localeCompare(a.date))[0]
  const { ratio } = acwr(s.sessions)
  let score = 75
  if (last) {
    const hours = (Date.now() - new Date(last.date).getTime()) / 3600000
    if (hours < 20) score -= (last.rpe - 5) * 4
    else if (hours > 48) score += 8
    if (last.sleepHours) score += (last.sleepHours - 7.5) * 5
    if (last.feeling) score += (last.feeling - 3) * 3
    if (last.pain?.length) score -= 10 * last.pain.length
    if (last.fatigue && hours < 36) score -= (last.fatigue - 2) * 7
  }
  if (ratio > 1.5) score -= 18
  else if (ratio > 1.3) score -= 8
  return Math.max(5, Math.min(100, Math.round(score)))
}

export function nextProgramDay(s: S) {
  const p = s.programs.find((x) => x.id === s.activeProgramId)
  if (!p) return null
  const done = s.completedDays[p.id] ?? []
  const day = p.days.find((d) => !done.includes(d.key))
  return day ? { program: p, day, done: done.length, total: p.days.length } : { program: p, day: null, done: done.length, total: p.days.length }
}

const PAIN_TIPS: Record<string, string> = {
  Poignets: 'Ajoute 5 min de préparation des poignets (rotations, pompes dos de main) et utilise des parallettes pour réduire l\'extension.',
  Coudes: 'Réduis le volume bras tendus (planche / lever) de 30 % cette semaine. Les tendons s\'adaptent plus lentement que les muscles.',
  Épaules: 'Évite les positions extrêmes (back lever, german hang) et privilégie scapula push/pull + rotations externes élastiques.',
  'Bas du dos': 'Renforce le hollow body et vérifie la rétroversion du bassin sur les leviers.',
  Genoux: 'Diminue les réceptions de sauts / dismounts et travaille l\'atterrissage amorti.',
  Doigts: 'Pas de fingertip / 2 fingers cette semaine. Les tendons fléchisseurs ont besoin de repos.',
}

export function coachInsights(s: S): Insight[] {
  const out: Insight[] = []
  const statuses = skillStatuses(s.records, s.analyses)
  const rank = computeRank(statuses, s.sessions, s.bonusXp)
  const sessions = [...s.sessions].sort((a, b) => b.date.localeCompare(a.date))
  const last = sessions[0]
  const { ratio, acute, chronic } = acwr(s.sessions)

  const np = nextProgramDay(s)
  if (np?.day) out.push({ tone: 'info', title: `Séance du jour : ${np.day.title}`, text: `${np.program.name} · semaine ${np.day.week} · ~${np.day.estMinutes} min. ${np.day.focus}.`, to: `/workout/${np.program.id}/${np.day.key}`, cta: 'Lancer la séance guidée' })
  else if (!np) out.push({ tone: 'info', title: 'Aucun programme actif', text: 'Génère un programme sur mesure : je l\'adapte à tes records réels, ton niveau et tes objectifs.', to: '/programs', cta: 'Générer un programme' })
  else out.push({ tone: 'good', title: 'Programme terminé 🏁', text: 'Teste tes max (holds, reps) puis génère le cycle suivant : il repartira de tes nouveaux records.', to: '/programs', cta: 'Nouveau cycle' })

  if (!last) out.push({ tone: 'info', title: 'Première séance', text: 'Enregistre ta première séance ou fais un test de max sur tes figures pour calibrer le coach.', to: '/log', cta: 'Noter une séance' })
  else {
    const days = (Date.now() - new Date(last.date).getTime()) / DAY
    if (days > 4) out.push({ tone: 'warn', title: `${Math.floor(days)} jours sans entraînement`, text: 'Reprends avec une séance à 70 % : la constance bat l\'intensité. Ton tendon perd son adaptation après ~10 jours.', to: '/log', cta: 'Noter une séance' })
  }

  if (chronic > 0 && ratio > 1.5) out.push({ tone: 'alert', title: 'Surcharge détectée', text: `Ratio charge aiguë/chronique à ${ratio.toFixed(2)} (zone de risque > 1.5). Fais une semaine de décharge : −40 % de volume, même intensité.` })
  else if (chronic > 0 && ratio > 1.3) out.push({ tone: 'warn', title: 'Charge en forte hausse', text: `Ratio ${ratio.toFixed(2)}. Tu peux continuer mais surveille sommeil et articulations.` })
  else if (chronic > 0 && ratio < 0.7 && acute > 0) out.push({ tone: 'info', title: 'Charge en baisse', text: `Ratio ${ratio.toFixed(2)} : tu t'entraînes moins que ta moyenne. Idéal en décharge, sinon remonte progressivement.` })

  for (const p of last?.pain ?? []) if (PAIN_TIPS[p]) out.push({ tone: 'alert', title: `Douleur signalée : ${p.toLowerCase()}`, text: PAIN_TIPS[p] + ' Si la douleur persiste > 1 semaine, consulte un professionnel de santé.' })

  const recentSleep = sessions.slice(0, 4).map((x) => x.sleepHours).filter((x): x is number => !!x)
  if (recentSleep.length >= 2) {
    const avg = recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length
    if (avg < 6.5) out.push({ tone: 'warn', title: `Sommeil moyen : ${avg.toFixed(1)} h`, text: 'Sous 7 h, la synthèse protéique et la récupération nerveuse chutent. Les figures statiques en souffrent en premier.' })
  }

  // Objectifs : projection et plateau
  for (const g of s.profile?.goalSkills ?? []) {
    const sk = SKILL_BY_ID[g.skillId]
    if (!sk) continue
    const recs = s.records.filter((r) => r.skillId === sk.id)
    const st = statuses[sk.id]
    if (st.mastery >= 2) {
      out.push({ tone: 'good', title: `${sk.name} validé ✅`, text: `Record : ${st.best}${sk.kind === 'hold' ? ' s' : ''}. Vise la maîtrise (${sk.standard * 2}) puis la certification par l'analyseur.`, to: `/skill/${sk.id}`, cta: 'Voir la fiche' })
      continue
    }
    const proj = projection(recs, sk.standard)
    if (!recs.length) out.push({ tone: 'info', title: `Objectif ${sk.name}`, text: `Pas encore de données. Fais un test : ${CUES[sk.profile][0].toLowerCase()}.`, to: `/skill/${sk.id}`, cta: 'Fiche figure' })
    else if (proj && proj.weeks !== Infinity && proj.date)
      out.push({ tone: 'good', title: `${sk.name} : ~${Math.max(1, Math.round(proj.weeks))} semaine(s)`, text: `Progression de ${proj.perWeek >= 0 ? '+' : ''}${proj.perWeek.toFixed(1)}/sem. Date estimée : ${proj.date.toLocaleDateString('fr-FR')} (fiabilité ${Math.round(proj.r2 * 100)} %).`, to: `/skill/${sk.id}`, cta: 'Statistiques' })
    else if (recs.length >= 4)
      out.push({ tone: 'warn', title: `Plateau sur ${sk.name}`, text: 'Aucun progrès récent. Change de stimulus : négatives lentes, holds assistés élastique, ou bascule 3 semaines sur la force (lesté).', to: '/programs', cta: 'Régénérer le programme' })
  }

  // Technique : pire critère récurrent de l'analyseur
  const recentAn = s.analyses.slice(-6)
  if (recentAn.length) {
    const tally = new Map<string, { n: number; tip: string }>()
    for (const a of recentAn) {
      const w = [...a.criteria].sort((x, y) => x.score - y.score)[0]
      if (w && w.score < 7) tally.set(w.label, { n: (tally.get(w.label)?.n ?? 0) + 1, tip: w.tip })
    }
    const top = [...tally.entries()].sort((a, b) => b[1].n - a[1].n)[0]
    if (top) out.push({ tone: 'warn', title: `Point technique n°1 : ${top[0].toLowerCase()}`, text: `Revient dans ${top[1].n} analyse(s). ${top[1].tip}`, to: '/analyzer', cta: 'Nouvelle analyse' })
  }

  // Fatigue répétée : 3 dernières séances notées fatigué ou épuisé
  const lastFat = sessions.slice(0, 3).map((x) => x.fatigue ?? 0)
  if (lastFat.length === 3 && lastFat.every((f) => f >= 3))
    out.push({ tone: 'alert', title: 'Fatigue accumulée', text: 'Tes 3 dernières séances ont démarré fatigué. Prends 2 jours de repos ou une séance légère (technique, mobilité) avant de reprendre le lourd.' })

  // Élastique : si une figure objectif n'est travaillée qu'assistée depuis longtemps
  for (const g of s.profile?.goalSkills ?? []) {
    const banded = s.sessions.filter((x) => x.exercises.some((e) => e.skillId === g.skillId && e.band))
    const free = s.sessions.filter((x) => x.exercises.some((e) => e.skillId === g.skillId && !e.band && !e.variants?.length))
    if (banded.length >= 6 && free.length === 0)
      out.push({ tone: 'warn', title: `Sors de l'élastique sur ${SKILL_BY_ID[g.skillId]?.name ?? 'ta figure'}`, text: '6 séances assistées et aucune sans aide : garde l\'élastique en fin de séance, mais commence par 3-5 tentatives libres ou des négatives lentes.' })
  }

  // Équilibre push / pull sur 14 jours
  let push = 0
  let pull = 0
  for (const sess of s.sessions.filter((x) => Date.now() - new Date(x.date).getTime() < 14 * DAY))
    for (const ex of sess.exercises) {
      const pat = ex.exerciseId ? EX_BY_ID[ex.exerciseId]?.pattern : undefined
      const cat = ex.skillId ? SKILL_BY_ID[ex.skillId]?.category : undefined
      const isPush = pat === 'push' || (cat && /push|Équilibres|Assis/.test(cat))
      const isPull = pat === 'pull' || (cat && /pull/.test(cat))
      if (isPush) push += ex.sets.length
      if (isPull) pull += ex.sets.length
    }
  if (push + pull > 20 && (push / (pull || 1) > 1.8 || pull / (push || 1) > 1.8))
    out.push({ tone: 'warn', title: 'Déséquilibre push / pull', text: `${push} séries de poussée vs ${pull} de tirage sur 14 jours. Rééquilibre pour protéger les épaules.` })

  if (rank.next && rank.missing.length) out.push({ tone: 'info', title: `Vers ${rank.next.name}`, text: rank.missing.join(' · '), to: '/ranks', cta: 'Voir les rangs' })
  const st = streak(s.sessions)
  if (st >= 3) out.push({ tone: 'good', title: `Série de ${st} jours 🔥`, text: 'La régularité est ton arme. Garde au moins 1 jour de repos complet par semaine.' })

  // Bilan de forme : le calibrer, le refaire, et travailler le maillon faible.
  const bil: Bilan[] = s.bilans ?? []
  const lastB = bil.at(-1)
  if (!lastB) {
    if (s.sessions.length >= 2) out.push({ tone: 'info', title: 'Fais ton bilan de forme', text: '8 tests guidés (15 min) pour connaître ton vrai niveau en poussée, tirage, gainage, équilibre et mobilité.', to: '/bilan', cta: 'Passer le bilan' })
  } else {
    const age = (Date.now() - new Date(lastB.date).getTime()) / DAY
    if (age > 42) out.push({ tone: 'info', title: 'Nouveau bilan conseillé', text: `Ton dernier bilan date de ${Math.floor(age)} jours (${lastB.global}/100). Refais-le pour mesurer tes progrès et recaler ton programme.`, to: '/bilan', cta: 'Refaire le bilan' })
    const [w] = weakest(lastB, 1)
    if (w && lastB.scores[w] < 50) out.push({ tone: 'warn', title: `Maillon faible : ${QUALITY_LABEL[w]} (${lastB.scores[w]}/100)`, text: ADVICE[w].low, to: `/exercices?id=${ADVICE[w].ex[0]}`, cta: 'Voir les exercices' })
  }
  return out
}

// ---------- Réponses hors ligne ----------
const KB: { k: RegExp; a: string }[] = [
  { k: /planche/i, a: 'Planche : 1) lean et protraction maximale, 2) tuck → adv tuck → straddle → full, 3) 3-4×/sem en holds de 5-10 s à 70-85 % de ton max, 4) pseudo planche push-ups et dips lestés en assistance. Coudes verrouillés, bassin en rétroversion, épaules loin devant les poignets. Compte 1-3 ans pour une full planche selon ton gabarit.' },
  { k: /front ?lever|\bfl\b/i, a: 'Front lever : tuck → adv tuck → one leg / straddle → full. Holds 5-8 s, front lever raises, rows et négatives. Indispensable : dépression scapulaire et rétroversion. 3×/sem max sur les holds lourds, tractions lestées à côté.' },
  { k: /back ?lever/i, a: 'Back lever : commence par le german hang et le skin the cat pour la mobilité d\'épaule. Progresse lentement (biceps et épaules en extension sont sensibles). Holds de 8-10 s en tuck puis progression.' },
  { k: /handstand|\bhs\b|équilibre/i, a: 'Handstand : 10-15 min PAR JOUR valent mieux qu\'1 h par semaine. Face au mur (ligne), puis kick-ups au milieu de la pièce, sorties de secours. Pousse le sol, épaules ouvertes, corrige avec les doigts.' },
  { k: /muscle.?up|\bmu\b/i, a: 'Muscle-up : 10+ tractions strictes et 15+ dips d\'abord. Travaille les tractions explosives poitrine à la barre, les transitions sur barre basse, et le faux grip pour les anneaux.' },
  { k: /poignet/i, a: 'Poignets : échauffement systématique (rotations, appuis doigts avant/arrière, pompes dos de main). Parallettes pour les holds longs. Une douleur aiguë = stop.' },
  { k: /coude|tendin/i, a: 'Coudes : les figures bras tendus stressent les tendons. Augmente le volume de 10 %/semaine max, évite d\'enchaîner planche lourde et front lever lourd le même jour, et garde des semaines de décharge.' },
  { k: /récup|repos|courbature|fatigu/i, a: 'Récupération : 7-9 h de sommeil, 1.6-2.2 g/kg de protéines, 48 h entre deux séances lourdes sur le même pattern. Une décharge toutes les 4-6 semaines.' },
  { k: /nutri|manger|protéin|poids|sèche/i, a: 'Nutrition : le ratio force/poids est roi en calisthenics. Protéines 1.6-2.2 g/kg, léger déficit (−300 kcal) si tu veux gagner en relatif, sans sacrifier la récupération.' },
  { k: /compét|battle|freestyle|jury|juge/i, a: 'Compétition : prépare 2-3 routines fixes, simule-les au timer (45 s/45 s ou 1 min/1 min) 2×/sem dans les 6 dernières semaines, et affûte la dernière semaine (−50 % de volume). Les juges notent difficulté, exécution, créativité et enchaînements.' },
  { k: /échauff/i, a: 'Échauffement type (8-10 min) : mobilisation articulaire, poignets, dislocations, scapula pull/push-ups, puis 2 séries faciles de la figure du jour.' },
  { k: /l.?sit|v.?sit|manna|compression/i, a: 'Compression : pike stretch + pancake chaque jour, pulses jambes tendues, L-sit sur parallettes. Pour V-sit/manna, la souplesse ischios et la force des fléchisseurs de hanche sont la clé.' },
  { k: /hspu|pompe.*renvers/i, a: 'HSPU : pike push-ups → pieds surélevés → au mur → déficit → freestanding. Coudes à 45°, tête qui forme un triangle avec les mains.' },
  { k: /flag|drapeau/i, a: 'Human flag : bras du haut tire, bras du bas pousse, épaules verrouillées. Commence en tuck, puis straddle, avec des holds courts de 3-5 s.' },
  { k: /swing|360|540|giant|géant|lâcher|release/i, a: 'Freestyle barre : maîtrise d\'abord le balancier creux/cambré (hollow/arch), puis le 180, le 360. Toujours sur tapis, avec parade si possible. Prise ferme et poignets échauffés.' },
]

export function localAnswer(q: string, s: S) {
  const hit = KB.filter((e) => e.k.test(q)).map((e) => e.a)
  const ins = coachInsights(s).slice(0, 3).map((i) => `• ${i.title} — ${i.text}`)
  if (hit.length) return hit.join('\n\n') + (ins.length ? `\n\nPour toi en ce moment :\n${ins.join('\n')}` : '')
  return `Je suis en mode hors ligne. Voici ce que je vois dans tes données :\n${ins.join('\n') || '• Pas encore assez de données : enregistre quelques séances.'}\n\nPose-moi une question sur une figure (planche, front lever, handstand…), la récupération, la nutrition ou la compétition. Ajoute une clé API Claude dans Réglages pour un coaching conversationnel complet.`
}

// ---------- Claude ----------
function athleteContext(s: S) {
  const p = s.profile
  const statuses = skillStatuses(s.records, s.analyses)
  const rank = computeRank(statuses, s.sessions, s.bonusXp)
  const top = Object.values(statuses)
    .filter((x: SkillStatus) => x.best > 0)
    .sort((a, b) => b.skill.tier - a.skill.tier)
    .slice(0, 20)
    .map((x) => `${x.skill.name} (tier ${x.skill.tier}) record ${x.best}${x.skill.kind === 'hold' ? 's' : ' reps'}${x.certified ? ' [certifié]' : ''}${x.bestScore ? ` note analyse ${x.bestScore}/10` : ''}`)
  const recent = [...s.sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((x) => `${x.date.slice(0, 10)} ${x.title} ${x.durationMin}min RPE${x.rpe}${x.pain?.length ? ' douleurs:' + x.pain.join(',') : ''} — ${x.exercises.map((e) => `${e.name} ${e.sets.map((st) => st.seconds ? st.seconds + 's' : (st.reps ?? '') + 'r').join('/')}`).join('; ')}`)
  return [
    p ? `Athlète : ${p.name}, spécialité ${p.specialty}, niveau ${LEVEL_NAMES[p.level]}, ${p.daysPerWeek} séances/sem de ${p.sessionMinutes} min, matériel : ${p.equipment.join(', ') || 'sol'}${p.bodyweight ? `, ${p.bodyweight} kg` : ''}.` : '',
    p?.goalSkills.length ? `Objectifs : ${p.goalSkills.map((g) => SKILL_BY_ID[g.skillId]?.name).join(', ')}.` : '',
    `Rang : ${rank.rank.name} (${rank.rp} PR).`,
    top.length ? `Figures : ${top.join(' | ')}` : 'Aucune figure enregistrée.',
    recent.length ? `Dernières séances :\n${recent.join('\n')}` : '',
    `Analyse du coach : ${coachInsights(s).map((i) => i.title + ' — ' + i.text).join(' / ')}`,
  ].filter(Boolean).join('\n')
}

export async function askClaude(history: { role: 'user' | 'assistant'; content: string }[], onText: (t: string) => void) {
  const s = useStore.getState()
  const client = new Anthropic({ apiKey: s.settings.anthropicKey, dangerouslyAllowBrowser: true })
  const system =
    'Tu es GRAVITAS Coach, entraîneur de calisthenics de niveau mondial (statique : planche, levers, handstand, anneaux ; freestyle : swings, rotations, lâchers ; préparation compétition FIF/WSWCF). ' +
    'Tu réponds en français, de façon concrète et chiffrée (séries, reps, durées, repos, RPE, fréquence), en t\'appuyant sur les données de l\'athlète ci-dessous. ' +
    'Tu priorises la sécurité des tendons et articulations et tu recommandes un professionnel de santé en cas de douleur persistante. Pas de blabla.\n\n' +
    athleteContext(s)
  const stream = client.beta.messages.stream({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    system,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  })
  stream.on('text', (t) => onText(t))
  const final = await stream.finalMessage()
  if (final.stop_reason === 'refusal') onText('\n\n(Réponse refusée par le modèle — reformule ta question.)')
  return final
}
