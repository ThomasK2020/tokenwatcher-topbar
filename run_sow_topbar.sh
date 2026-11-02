#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${HOME}/data/AI-workspace/TokenWatcherWidget/tokenwatcher-topbar"
SOW_FILE="${1:-SOW/specs/01_GPU_TEMP_TELEMETRY.md}"

cd "${REPO_DIR}"

if [ ! -f "${SOW_FILE}" ]; then
    echo "Erreur : Fichier SOW introuvable (${SOW_FILE})" >&2
    exit 1
fi

PROMPT="Exécute le cahier des charges '${SOW_FILE}' en respectant strictement 'AGENTS.md' et 'SOW/architecture/AMD_STRIX_HALO_SENSORS.md'.
1. Inspecte les fonctions ciblées par '${SOW_FILE}' dans 'daemon/tokenwatcher-daemon' et 'extension/extension.js' / 'extension/stylesheet.css'.
2. Implémente le Lot 1 et le Lot 2 de '${SOW_FILE}' de façon chirurgicale avec l'outil edit, sans altérer le reste du code.
3. Exécute intégralement le Lot 3 (Plan de Validation) et affiche le rapport de vérification avant tout commit."

# Lancement d'OpenCode borné au seul répertoire tokenwatcher-topbar
opencode run "${PROMPT}"
