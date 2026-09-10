# TokenWatcher TopBar

> **Real-time LLM activity monitor (Hermes, OpenCode, OpenWebUI) and AMD Radeon GPU VRAM tracker in the GNOME Top Bar.**

---

## 📖 About

**TokenWatcher TopBar** is an intelligent, high-performance GNOME Shell extension and companion daemon designed for developers and AI engineers running local and hybrid LLM workflows. It delivers unified, real-time observability over your AI agent activities, streaming token consumption, generation throughput ($t/s$), and hardware acceleration metrics directly in your Linux desktop panel.

---

## 🌟 Overview

**TokenWatcher** is compatible with GNOME Shell 45 through 50+ on both Wayland and X11, paired with an ultra-lightweight Python background daemon. It provides real-time monitoring directly in your top bar:
- The **active LLM model** with cleaned aliases (*Gemini 3.7 Flash*, *Qwen3-Coder-30B*, *Gemma-4-12B*, etc.).
- The **cumulative token volume** formatted in standard millions `#,##M` (e.g., `2.37M`).
- The **live generation speed** (`X.X t/s`).
- The **GPU VRAM usage** on AMD APUs (Strix Halo / Radeon 8060S / AMD dGPUs).
- The **active execution source** (*Hermes*, *OpenCode*, *OpenWebUI*).

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Terminal] Qwen3-Coder-30B | 0.05M | 28.4 t/s | VRAM 14.4 GB | OpenCode│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Architecture & Features

### 1. Intelligent Multi-Source Arbitration
The background daemon continuously monitors local sources with zero overhead:
1. **Hermes Agent**: Real-time SQLite tracking of `~/.hermes/state.db` (sessions, models, prompt/completion tokens, tool calls).
2. **OpenCode**: Real-time SQLite monitoring of `~/.local/share/opencode/opencode.db` (sessions, messages, real-time delta calculation $\Delta t < 3\text{s}$, and tokens/s).
3. **Open WebUI**: SQLite monitoring of `webui.db` and local ports.
4. **Lemonade Server**: Monitoring of the local REST API (port 13305) and the model loaded in VRAM.

> **Dynamic Priority:** As soon as OpenCode or a specialized agent begins generating code, the top bar indicator instantly switches to the active task, then smoothly returns to the primary orchestrator once the job is finished.

### 2. AMD Hardware & VRAM Monitoring (APU / GPU)
* Direct extraction via `amdgpu_top` and `/sys/class/drm/card*/device/mem_info_vram_*`.
* Accurate detection of shared / dedicated memory allocation for the AMD Strix Halo APU (Radeon 8060S).

### 3. Interactive Popover Menu
Clicking the indicator opens a detailed popover menu displaying:
* Current session or project context and title.
* Full model name and clean aliases.
* Token breakdown (`Prompt in` vs `Completion out`) and total in millions (`#,##M`).
* Instant generation speed ($t/s$).
* GPU and VRAM utilization.
* Direct shortcuts to local Web UIs (Open WebUI: port 8080, Lemonade: port 13305).

---

## 📁 Project Structure

```text
TokenWatcher-TopBar/
├── extension/
│   ├── extension.js         # GNOME 45-50 extension code (GObject ES6)
│   ├── metadata.json        # Extension metadata & GNOME Shell compatibility
│   └── stylesheet.css       # Visual styles & popover design
├── daemon/
│   └── tokenwatcher-daemon  # Multi-source Python daemon (IPC via /tmp/tokenwatcher_state.json)
├── systemd/
│   └── tokenwatcher.service # Systemd user service unit
├── install.sh               # Automated 1-click installation script
├── uninstall.sh             # Clean uninstallation script
├── readme-setup.md          # Dedicated step-by-step setup guide
├── LICENSE                  # GNU General Public License v3.0 (GPL-3.0)
├── .gitignore
└── README.md
```

---

## 🛠️ Installation

### Quick Start (Automated)

Clone the repository and run the installation script:

```bash
git clone https://github.com/ThomasK2020/tokenwatcher-topbar.git
cd tokenwatcher-topbar
./install.sh
```

> **Note for Wayland / GNOME Shell:** Under Wayland, if the extension was just installed or updated, please log out and log back in to your GNOME user session (*Log Out / Log In*) so the Shell loads the module.

---

## 🔍 Useful Commands & Diagnostics

### Check the metrics daemon status
```bash
systemctl --user status tokenwatcher.service
```

### View live daemon logs
```bash
journalctl --user -u tokenwatcher.service -f
```

### Inspect real-time IPC output
```bash
cat /tmp/tokenwatcher_state.json | jq .
```

### Inspect the GNOME extension state
```bash
gnome-extensions info tokenwatcher@thomas.local
```

---

## 👤 Author

* **Thomas** ([@ThomasK2020](https://github.com/ThomasK2020))

---

## 📄 License

Distributed under the **GNU General Public License v3.0 (GPL-3.0)**. See [`LICENSE`](LICENSE) for more information.
