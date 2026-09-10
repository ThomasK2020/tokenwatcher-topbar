#!/usr/bin/env bash
set -e

# ==============================================================================
# TokenWatcher TopBar - Uninstallation Script
# ==============================================================================

EXT_UUID="tokenwatcher@thomas.local"
EXT_DEST="$HOME/.local/share/gnome-shell/extensions/$EXT_UUID"
BIN_DEST="$HOME/.local/bin/tokenwatcher-daemon"
SERVICE_DEST="$HOME/.config/systemd/user/tokenwatcher.service"

echo "=== Désinstallation de TokenWatcher TopBar ==="

# 1. Arrêt et suppression du service systemd
echo "[-] Arrêt du service systemd..."
systemctl --user stop tokenwatcher.service 2>/dev/null || true
systemctl --user disable tokenwatcher.service 2>/dev/null || true
rm -f "$SERVICE_DEST"
systemctl --user daemon-reload

# 2. Désactivation et suppression de l'extension GNOME
echo "[-] Suppression de l'extension GNOME..."
gnome-extensions disable "$EXT_UUID" 2>/dev/null || true
rm -rf "$EXT_DEST"

# 3. Suppression du daemon et fichier temporaire
echo "[-] Suppression du binaire daemon et IPC..."
rm -f "$BIN_DEST"
rm -f /tmp/tokenwatcher_state.json

echo "=== Désinstallation terminée ==="
