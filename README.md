# Tarteel Warsh — récitation guidée de la riwaya Warsh

Web app inspirée de Tarteel.ai, mais pour la **riwaya Warsh ʿan Nafiʿ** :
choisissez une sourate, récitez dans le micro, et l'application suit le texte
en temps réel — mots surlignés à mesure, erreurs signalées (mot sauté / en
trop / erroné), plus un **mode mémorisation** où le texte se révèle mot à mot.

- **Aucune connexion requise** : pas de compte, pas de backend obligatoire.
  L'historique des sessions (précision, erreurs, durée) est enregistré dans
  le navigateur (localStorage).
- Interface **en français**, texte coranique **RTL** (rasm Warsh authentique,
  6 214 ayat — numérotation de Nafiʿ, pas Hafs).
- ASR : Whisper-small affiné sur la récitation Warsh
  ([`benhadjermed/tahkik-small-warsh`](https://huggingface.co/benhadjermed/tahkik-small-warsh),
  Apache-2.0), servi par un backend FastAPI WebSocket **optionnel** —
  sinon, repli automatique sur la reconnaissance vocale du navigateur
  (Chrome/Edge/Safari), ou mode démo sans micro.
- Le texte Warsh provient de [risan/quran-json](https://github.com/risan/quran-json)
  (édition Qur'anpedia), embarqué en JSON statique dans `public/data/warsh`.

## Structure du dépôt

```
/                  frontend React (Vite) + données Warsh dans /public/data/warsh
/backend           backend FastAPI optionnel (endpoint WebSocket /asr)
/scripts           fetch-warsh.py : télécharge le JSON Warsh
/public/data/warsh quran.json (Coran entier) + chapters/1..114.json
```

## Démarrage rapide (frontend seul — suffisant pour tester)

```bash
npm install
npm run dev
```

Aucune variable d'environnement n'est nécessaire. La seule variable
**optionnelle** est `VITE_ASR_WS` (ex. `ws://localhost:8000/asr`) pour
brancher le backend Whisper ; sans elle, l'app utilise la reconnaissance du
navigateur ou le mode démo.

Build de production : `npm run build`.

## Reconnaissance vocale : trois sources

| Source | Quand | Précision |
|---|---|---|
| **Auto** (défaut) | Backend détecté → Whisper ; sinon → micro navigateur | Maximale avec backend |
| **Backend Whisper** | `python3 backend/` ci-dessous + `VITE_ASR_WS` | Maximale (modèle Warsh) |
| **Démo** | Sans micro — les mots avancent seuls (~2/s) | Test de l'interface |

## Backend ASR (optionnel — le vrai modèle Warsh)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

La première connexion télécharge le modèle (~250 Mo). Puis :

```bash
echo "VITE_ASR_WS=ws://localhost:8000/asr" > .env.local
npm run dev
```

Le badge « ASR connecté » (vert) en haut de la page `/recite` confirme la
liaison. Voir `backend/README.md` pour le protocole et le GPU (CUDA).

## Données Warsh

```bash
python3 scripts/fetch-warsh.py
```

(Vérifie 6 214 ayat. Les fichiers sont déjà embarqués ; ce script permet de
les rafraîchir depuis la source.)

## Pages

- `/` — présentation
- `/recite` — session de récitation (sourate, plage d'ayat, suivi, erreurs,
  mode mémorisation, résumé de session)
- `/dashboard` — historique local des sessions (localStorage) : précision
  moyenne, meilleure précision, temps total, suppression individuelle ou
  complète

## Comment ça marche (pipeline)

1. **Micro → chunks** : Web Audio API, mono 16 kHz, chunks de 4 s avec
   1,5 s de chevauchement, envoyés en binaire sur WebSocket (backend) —
   ou reconnaissance continue du navigateur en mode repli.
2. **ASR** : transcription de chaque chunk (Whisper n'est pas streaming).
3. **Fusion** : partie médiane de chaque chunk conservée, doublons de bord
   supprimés → transcription stable.
4. **Normalisation** : suppression du tashkeel et des marques coraniques,
   unification alef/hamza, yaa/alef maqsura, taa marbuta.
5. **Alignement** : fenêtre glissante autour de la position courante +
   distance de Levenshtein au niveau mot → suivi de position, mots récités,
   erreurs (`sauté`, `en trop`, `erroné`). Aucun jugement de tajwid.
6. **Auto-avance** : la position attendue avance dès que les mots correspondent.

## Limites connues

- La reconnaissance du navigateur (repli sans backend) est approximative sur
  le texte coranique — le backend Whisper Warsh est bien plus précis.
- La numérotation affichée est celle de Warsh ; certaines sourates ont un
  nombre d'ayat différent de Hafs (ex. al-Baqara : 285 en Warsh).
- L'historique est local au navigateur : vider le stockage du site l'efface.

## Licences & crédits

- Texte Warsh : Qur'anpedia via risan/quran-json — voir les termes sur le dépôt.
- Modèle ASR : Apache-2.0, benhadjermed/tahkik-small-warsh.
- Police arabe : [Amiri](https://fonts.google.com/specimen/Amiri) (OFL).
