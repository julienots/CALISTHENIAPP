# GRAVITAS — Défie la gravité

Application mobile Android de calisthenics : coach, programmes générés à l'infini, analyse vidéo biomécanique, rangs, défis, timers, combos, préparation compétition, carte des compétitions et espace coachs. Elle fonctionne **hors ligne**, et certaines fonctions utilisent internet quand il est disponible.

## Installer l'APK

1. Récupère `GRAVITAS.apk` :
   - dans les **Releases** du dépôt (publiées automatiquement à chaque push sur `main`),
   - ou dans l'onglet **Actions** → dernier run « APK Android » → artefact `GRAVITAS-apk`.
2. Sur le téléphone, autorise l'installation depuis des sources inconnues, puis ouvre le fichier.

## Fonctionnalités

| Module | Contenu |
|---|---|
| **Spécialités** | Statique, Agilité (freestyle) ou les deux, choisies à l'onboarding et modifiables dans le profil |
| **Figures** | 180+ figures : les 124 statiques et dynamiques (planche, levers, Victorian, Hefesto, Pelican, 2 fingers, thumb planche…) + freestyle barre, acrobatie au sol et fondamentaux. Tiers F → SSS |
| **Fiche figure** | Record, statut (en cours / validé / maîtrisé / certifié), marge de progression, tendance par semaine, régularité, projection de date, courbe, notes de l'analyseur par critère, ligne de progression, points techniques |
| **Générateur de programmes** | Périodisation (accumulation, intensification, réalisation, décharge, affûtage), charges calculées sur tes records réels, progressions adaptées, matériel, durée. Nouvelle graine à chaque génération, donc des programmes illimités. Vue tableur, édition des cellules, export CSV, partage par code |
| **Séance guidée** | Le coach annonce chaque exercice à la voix, lance un compte à rebours 3-2-1, chronomètre les holds, enchaîne les repos avec bips et vibrations, enregistre chaque série puis le bilan (RPE, sommeil, douleurs) |
| **Journal** | Séances détaillées : séries, reps, secondes, lest ou assistance, RPE, ressenti, énergie, sommeil, poids, douleurs, lieu, notes |
| **Analyseur** | MediaPipe Pose (33 points) embarqué dans l'APK, 100 % local. Trois modes : vidéo (15 i/s), photo, caméra en direct (le chrono démarre seul quand la forme est valide). Il mesure les angles des coudes, l'alignement, l'horizontalité, les hanches, le lean, la verticalité et la stabilité. Il compte les répétitions (amplitude, verrouillage, tempo) et donne une note sur 10 avec un score de jury |
| **Rangs** | 12 rangs animés, de ÉVEIL à **GRAVITAS ZÉRO**. Les points croissent de façon exponentielle avec la difficulté des figures. Chaque rang exige aussi des figures précises et des certifications par l'analyseur ; l'assiduité est plafonnée |
| **Coach** | Indice de forme, ratio de charge aiguë/chronique, sommeil, douleurs, plateaux, projections, défaut technique récurrent, équilibre push/pull. Chat hors ligne, ou chat Claude en ligne avec ta clé API |
| **Timers** | Hold avec record, compétition 45/45, 1 min/1 min, etc., EMOM, Tabata |
| **Combos** | Conception d'enchaînements, score de difficulté avec bonus d'enchaînement, faisabilité, répétition guidée |
| **Prépa compétition** | Compte à rebours, plan de peaking, simulateur de passage avec un combo par round, auto-évaluation du jury, checklist |
| **Carte** | Compétitions en France et dans le monde (en direct, à venir, passées). Actualisation automatique toutes les 10 min et au retour du réseau, cache hors ligne, ajout de compétitions |
| **Coachs** | Annuaire de coachs et espace coach (profil, publication de programmes, code de partage) |
| **Défis** | Défis quotidiens, hebdomadaires (vérifiés automatiquement) et épreuves de figures |

## Données en ligne

- **Compétitions** : l'appli lit `app/public/competitions.json` sur la branche `main` de ce dépôt. Pour ajouter une compétition pour tout le monde, il suffit de modifier ce fichier : les applis installées le récupèrent à la prochaine actualisation. Les événements fournis viennent de sources vérifiées (FNSL, Calisthenics Cup, WSWCF, Saint-Priest, Kallos-Sthenos). Il n'existe pas d'API publique mondiale des compétitions de calisthenics, d'où ce flux.
- **Communauté en temps réel (optionnel)** : crée un projet Supabase, exécute `supabase/schema.sql`, puis colle l'URL et la clé publique dans *Réglages → Données en ligne*. Les compétitions et l'annuaire des coachs deviennent alors partagés entre tous les utilisateurs. Les règles d'accès sont ouvertes (sans compte) : il faudra ajouter une authentification avant une diffusion publique.
- **Coach IA** : colle une clé API Anthropic dans *Réglages*. Elle reste stockée sur le téléphone.

## Développement

```bash
cd app
npm install
npm run dev          # appli dans le navigateur
npm run apk          # APK debug (Android SDK requis)
```

Stack : React + TypeScript + Vite + Tailwind, Capacitor 8 (Android), MediaPipe Tasks Vision, Leaflet, Zustand (données persistées sur l'appareil).
