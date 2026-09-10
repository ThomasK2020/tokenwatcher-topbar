#!/usr/bin/env bash
set -e

# ==============================================================================
# TokenWatcher TopBar - Installation Script
# Real-Time AI Metrics & AMD GPU Monitor for GNOME Shell 45-50+
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_UUID="tokenwatcher@thomas.local"
EXT_DEST="$HOME/.local/share/gnome-shell/extensions/$EXT_UUID"
BIN_DEST="$HOME/.local/bin"
SYSTEMD_DEST="$HOME/.config/systemd/user"

echo "=== Installation de TokenWatcher TopBar ==="

# 1. Déploiement de l'extension GNOME
echo "[-] Installation de l'extension GNOME Shell..."
mkdir -p "$EXT_DEST"
cp "$SCRIPT_DIR/extension/extension.js" "$EXT_DEST/"
cp "$SCRIPT_DIR/extension/metadata.json" "$EXT_DEST/"
cp "$SCRIPT_DIR/extension/stylesheet.css" "$EXT_DEST/"

# 2. Déploiement du daemon Python
echo "[-] Installation du daemon de métriques..."
mkdir -p "$BIN_DEST"
cp "$SCRIPT_DIR/daemon/tokenwatcher-daemon" "$BIN_DEST/"
chmod +x "$BIN_DEST/tokenwatcher-daemon"

# 3. Déploiement et démarrage du service systemd
echo "[-] Configuration du service systemd utilisateur..."
mkdir -p "$SYSTEMD_DEST"
cp "$SCRIPT_DIR/systemd/tokenwatcher.service" "$SYSTEMD_DEST/"

systemctl --user daemon-reload
systemctl --user enable tokenwatcher.service
systemctl --user restart tokenwatcher.service

# 4. Activation de l'extension
echo "[-] Activation de l'extension GNOME..."
gsettings set org.gnome.shell disable-user-extensions false 2>/dev/null || true
gnome-extensions enable "$EXT_UUID" 2>/dev/null || true

echo ""
echo "=== Installation terminée avec succès ==="
echo "Note : Si l'indicateur n'apparaît pas immédiatement sous Wayland,"
echo "veuillez fermer et rouvrir votre session utilisateur GNOME (Log Out / Log In)."
