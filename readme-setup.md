# TokenWatcher TopBar — Installation & Setup Guide

This guide provides step-by-step instructions to install, configure, verify, and troubleshoot **TokenWatcher TopBar** on GNOME Shell (versions 45 through 50+ on both Wayland and X11).

---

## 📋 System Requirements

- **Desktop Environment:** GNOME Shell 45, 46, 47, 48, 49, 50 or 50.1 (Wayland or X11)
- **Python:** Python 3.10+ (Standard library with SQLite3)
- **Supported AI Sources (Auto-detected):**
  - **Hermes Agent** (`~/.hermes/state.db`)
  - **OpenCode** (`~/.local/share/opencode/opencode.db`)
  - **Open WebUI** (Local SQLite `webui.db` / port 8080)
  - **Lemonade Server** (Local REST API / port 13305)
- **Hardware Acceleration (Optional):**
  - AMD Radeon GPU / Strix Halo APU (uses `amdgpu_top` / sysfs for real-time VRAM allocation tracking)

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
> When installing for the first time, GNOME Shell needs to load the new JS module. Please **Log Out** and **Log Back In** to your desktop session (`System Menu` $\rightarrow$ `Log Out`).

---

## 🛠️ Option 2: Manual Installation Step-by-Step

If you prefer deploying components manually without the script:

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

### 2. Inspect Real-Time IPC Output
```bash
cat /tmp/tokenwatcher_state.json | jq .
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

## 🧪 Testing OpenCode & Live Resource Tracking

To see the TopBar automatically switch to OpenCode and track tokens/s, VRAM, and model usage in real time, run a prompt using your local Lemonade model:

```bash
opencode run -m lemonade/Qwen3-Coder-30B-A3B-Instruct-GGUF "Generate a quicksort implementation in Python with unit tests"
```

* **TopBar indicator format:** `[Terminal] Qwen3-Coder-30B | 0,05M | 28,4 t/s | VRAM 14,4 Go | OpenCode`
* Click on the indicator to open the interactive popover with detailed token breakdown (`Prompt in`, `Completion out`, total, GPU usage).

---

## 🗑️ Clean Uninstallation

To completely remove TokenWatcher from your system:

```bash
cd tokenwatcher-topbar
./uninstall.sh
```
