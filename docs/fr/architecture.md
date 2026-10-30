# Architecture & Fonctionnement (FR)

TokenWatcher se compose de deux éléments principaux :

1. **Le Démon Python (`tokenwatcher-daemon`)** :
   - Collecte les métriques d'utilisation des LLM (Hermes Agent, OpenCode, OpenWebUI, Lemonade).
   - Surveille l'utilisation VRAM (AMD APU/GPU via `amdgpu_top`).
   - Écrit l'état consolidé dans un fichier JSON (`/tmp/tokenwatcher_state.json`).

2. **L'Extension GNOME Shell (`extension.js`)** :
   - Lit périodiquement le fichier d'état.
   - Affiche dans la barre supérieure l'icône, le modèle actif, le nombre de tokens, la VRAM et la source active.
