# TokenWatcher TopBar — Installation & Setup Guide

This guide provides step-by-step instructions to install, configure, verify, and develop **TokenWatcher TopBar** on GNOME Shell (versions 45 through 50+ on both Wayland and X11).

---

## 📋 System Requirements

- **Desktop Environment:** GNOME Shell 45, 46, 47, 48, 49, 50 or 50.1 (Wayland or X11)
- **Python:** Python 3.11+ (Standard library with SQLite3 & `pathlib`)
- **Supported AI Sources (Auto-detected):**
  - **Hermes Agent** (`~/.hermes/profiles/*/state.db` and `~/.hermes/state.db`)
  - **OpenCode** (`~/.local/share/opencode/opencode.db` with KV cache token accounting)
  - **Open WebUI** (Local SQLite `webui.db` / port 8080)
  - **Lemonade Server** (Local REST API / port 13305)
- **Hardware Telemetry (Zero-Hardcode Dynamic Discovery):**
  - AMD Radeon GPU / Strix Halo APU (`gfx1151` Radeon 8060S): automatic discovery of DRM VRAM/Load, `amdgpu` Edge temperature, GFX power (`W`), GPU clock (`MHz`), and `k10temp`/`zenpower` SoC `Tctl` temperature via cached `sysfs`/`hwmon` paths (with `sensors -j` and `amdgpu_top --dump -J` fallbacks).

---

## ⚡ Option 1: Automatic 1-Click Installation (Recommended)

Clone the repository and run the automated installation script:

```bash
git clone https://github.com/ThomasK2020/tokenwatcher-topbar.git
cd tokenwatcher-topbar
./install.sh
```

### What `install.sh` does automatically:
1. Copies the GNOME extension to `~/.local/share/gnome-shell/extensions/tokenwatcher@thomas.local/`.
2. Installs the Python daemon into `~/.local/bin/tokenwatcher-daemon`.
3. Sets up, enables, and starts the systemd user service (`tokenwatcher.service`).
4. Enables the GNOME Shell extension.

> **Important Note for Wayland Users:**  
> When installing or updating `extension.js` / `stylesheet.css`, GNOME Shell caches ES6 modules in memory. Please **Log Out** and **Log Back In** to your desktop session (`gnome-session-quit --logout --no-prompt`) to reload the UI module.

---

## 🛠️ Option 2: Manual Installation Step-by-Step

### Step 1: Install the GNOME Shell Extension
```bash
mkdir -p ~/.local/share/gnome-shell/extensions/tokenwatcher@thomas.local
cp extension/extension.js extension/metadata.json extension/stylesheet.css ~/.local/share/gnome-shell/extensions/tokenwatcher@thomas.local/
gnome-extensions enable tokenwatcher@thomas.local
```

### Step 2: Install the Python Daemon
```bash
mkdir -p ~/.local/bin
cp daemon/tokenwatcher-daemon ~/.local/bin/
chmod +x ~/.local/bin/tokenwatcher-daemon
```

### Step 3: Configure and Start the Systemd User Service
```bash
mkdir -p ~/.config/systemd/user
cp systemd/tokenwatcher.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now tokenwatcher.service
```

---

## 🔍 Verification & Health Check

### 1. Check the Daemon Status
```bash
systemctl --user status tokenwatcher.service
```

### 2. Inspect Real-Time IPC Output (Including Thermal Telemetry)
```bash
cat /tmp/tokenwatcher_state.json | python3 -m json.tool
```

### 3. Check GNOME Extension State
```bash
gnome-extensions info tokenwatcher@thomas.local
```

### 4. Live Daemon Logs
```bash
journalctl --user -u tokenwatcher.service -f
```

---

## 🧪 Spec-Driven Development with OpenCode

To execute a Statement of Work (SOW) specification in `SOW/specs/` using OpenCode (`Qwen3-Coder-30B-A3B-Instruct-GGUF`):

```bash
./run_sow_topbar.sh SOW/specs/01_GPU_TEMP_TELEMETRY.md
./run_sow_topbar.sh SOW/specs/02_HERMES_PROFILES_AND_MODELS.md
```

---

## 🗑️ Clean Uninstallation

```bash
cd tokenwatcher-topbar
./uninstall.sh
```
