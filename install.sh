#!/usr/bin/env bash
set -e

# ==============================================================================
# TokenWatcher TopBar & Astra Monitor - Installation Script
# Real-Time AI Metrics & AMD GPU Monitor for GNOME Shell 45-50+
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_UUID="tokenwatcher@thomas.local"
ASTRA_UUID="monitor@astraext.github.io"
EXT_DEST="$HOME/.local/share/gnome-shell/extensions/$EXT_UUID"
BIN_DEST="$HOME/.local/bin"
SYSTEMD_DEST="$HOME/.config/systemd/user"

echo "=== Installation de TokenWatcher TopBar & Astra Monitor ==="

# 1. Installation de l'extension Astra Monitor (metrics système CPU/GPU/RAM)
echo "[-] Installation/Mise à jour d'Astra Monitor via gnome-extensions-cli..."
python3 -m pip install --user --break-system-packages gnome-extensions-cli &>/dev/null || true
export PATH="${HOME}/.local/bin:${PATH}"
gext install "$ASTRA_UUID" &>/dev/null || echo "⚠️ Note: Astra Monitor déjà présent ou gext indisponible."

# 2. Déploiement de l'extension GNOME TokenWatcher
echo "[-] Installation de l'extension GNOME Shell TokenWatcher TopBar..."
mkdir -p "$EXT_DEST"
cp "$SCRIPT_DIR/extension/extension.js" "$EXT_DEST/"
cp "$SCRIPT_DIR/extension/metadata.json" "$EXT_DEST/"
cp "$SCRIPT_DIR/extension/stylesheet.css" "$EXT_DEST/"

# 3. Déploiement du daemon Python
echo "[-] Installation du daemon de métriques AI & VRAM..."
mkdir -p "$BIN_DEST"
cp "$SCRIPT_DIR/daemon/tokenwatcher-daemon" "$BIN_DEST/"
chmod +x "$BIN_DEST/tokenwatcher-daemon"

# 4. Déploiement et démarrage du service systemd
echo "[-] Configuration du service systemd utilisateur..."
mkdir -p "$SYSTEMD_DEST"
cp "$SCRIPT_DIR/systemd/tokenwatcher.service" "$SYSTEMD_DEST/"

systemctl --user daemon-reload
systemctl --user enable tokenwatcher.service
systemctl --user restart tokenwatcher.service

# 5. Activation des extensions GNOME
echo "[-] Activation des extensions GNOME Shell..."
gsettings set org.gnome.shell disable-user-extensions false 2>/dev/null || true

python3 -c "
import subprocess, ast

try:
    res = subprocess.check_output(['gsettings', 'get', 'org.gnome.shell', 'enabled-extensions']).decode('utf-8').strip()
    exts = ast.literal_eval(res) if res.startswith('[') else []
except Exception:
    exts = []

for ext in ['$EXT_UUID', '$ASTRA_UUID']:
    if ext not in exts:
        exts.append(ext)

formatted = '[' + ', '.join([f\"'{x}'\" for x in exts]) + ']'
subprocess.run(['gsettings', 'set', 'org.gnome.shell', 'enabled-extensions', formatted])
" 2>/dev/null || true

gnome-extensions enable "$EXT_UUID" 2>/dev/null || true
gnome-extensions enable "$ASTRA_UUID" 2>/dev/null || true

echo ""
echo "=== Installation terminée avec succès ==="
echo "Note : Si les indicateurs n'apparaissent pas immédiatement sous Wayland,"
echo "veuillez fermer et rouvrir votre session utilisateur GNOME (Log Out / Log In)."
