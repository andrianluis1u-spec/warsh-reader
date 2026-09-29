# Tarteel Warsh — récitation guidée de la riwaya Warsh

Web app inspirée de Tarteel.ai, mais pour la **riwaya Warsh ʿan Nafiʿ** :
choisissez une sourate, récitez dans le micro, et l'application suit le texte
en temps réel — mots surlignés à mesure, erreurs signalées (mot sauté / en
trop / erroné), plus un **mode mémorisation** où le texte se révèle mot à mot.

- Interface **en français**, texte coranique **RTL** (rasm Warsh authentique,
  6 214 ayat — numérotation de Nafiʿ, pas Hafs).
- ASR : Whisper-small affiné sur la récitation Warsh
  ([`benhadjermed/tahkik-small-warsh`](https://huggingface.co/benhadjermed/tahkik-small-warsh),
  Apache-2.0), servi par un backend FastAPI WebSocket.
- Le texte Warsh provient de [risan/quran-json](https://github.com/risan/quran-json)
  (édition Qur'anpedia), téléchargé au build et embarqué en JSON statique.

## Structure du dépôt

```
/                  frontend React (Vite, PWA-ready) + données Warsh dans /public/data/warsh
/backend           backend FastAPI (endpoint WebSocket /asr)
/scripts           fetch-warsh.py : télécharge le JSON Warsh
/public/data/warsh quran.json (Coran entier) + chapters/1..114.json
```

## Démarrage rapide

### 1. Données Warsh

```bash
python3 scripts/fetch-warsh.py
```

(Vérifie 6 214 ayat. Les fichiers sont déjà embarqués dans ce dépôt ; ce
script permet de les rafraîchir depuis la source.)

### 2. Backend ASR

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

La première connexion télécharge le modèle (~250 Mo) puis répond en flux.
Voir `backend/README.md` pour les détails (protocole, variables d'env).

### 3. Frontend

```bash
bun install        # ou npm install
bun run dev        # ou npm run dev
```

Ouvrez l'app, connectez-vous, choisissez une sourate et lancez la récitation.
Le frontend parle au backend via `VITE_ASR_WS` (défaut
`ws://localhost:8000/asr`) — à définir avant `bun run dev` si besoin.

### GPU (optionnel)

Sur machine CUDA : `pip install nvidia-cublas-cu12 nvidia-cudnn-cu12==9.*` puis

```bash
ASR_DEVICE=cuda ASR_COMPUTE_TYPE=float16 uvicorn app:app --port 8000
```

Sans GPU, le backend fonctionne en CPU (int8 via faster-whisper) : suffisant
pour des chunks de 4 s avec une latence de l'ordre de la seconde.

## Comment ça marche (pipeline)

1. **Micro → chunks** : Web Audio API, mono 16 kHz, chunks de 4 s avec
   1,5 s de chevauchement, envoyés en binaire sur WebSocket.
2. **ASR** : chaque chunk est transcrit (Whisper n'est pas streaming).
3. **Fusion** : les transcriptions de chunks se recouvrent ; le moteur garde
   la partie médiane de chaque chunk et supprime les doublons de bord →
   transcription stable.
4. **Normalisation** : suppression du tashkeel et des marques coraniques,
   unification alef/hamza, yaa/alef maqsura, taa marbuta.
5. **Alignement** : fenêtre glissante autour de la position courante +
   distance de Levenshtein au niveau mot → suivi de position, mots récités,
   et détection d'erreurs : `sauté` (passé sans correspondance), `en trop`
   (aucune correspondance proche), `erroné` (meilleure correspondance floue
   sous le seuil). Les correspondances incertaines restent prudentes :
   l'app n'émet **aucun** jugement de tajwid.
6. **Auto-avance** : la position attendue avance dès que les mots correspondent.

## Limites connues

- La précision dépend du micro et de la latence CPU/GPU ; le mode démo
  tolère l'absence de backend (bouton simulé) mais le suivi réel exige l'ASR.
- La numérotation affichée est celle de Warsh ; certaines sourates ont un
  nombre d'ayat différent de Hafs (ex. al-Baqara : 285 en Warsh).
- Ne juge ni le tajwid ni la prononciation : suivi de texte uniquement.

## Licences & crédits

- Texte Warsh : Qur'anpedia via risan/quran-json — voir les termes sur le dépôt.
- Modèle ASR : Apache-2.0, benhadjermed/tahkik-small-warsh.
- police arabe : [Amiri](https://fonts.google.com/specimen/Amiri) (OFL).
