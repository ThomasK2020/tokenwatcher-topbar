# TokenWatcher TopBar

> **Real-time LLM activity monitor (Hermes multi-profile, OpenCode, OpenWebUI, Lemonade) and AMD Radeon / Strix Halo GPU VRAM & thermal telemetry tracker in the GNOME Top Bar.**

---

## 📖 About

**TokenWatcher TopBar** is a high-performance GNOME Shell extension (GNOME 45–50+, Wayland & X11) and companion Python daemon designed for AI engineers running local and hybrid LLM workflows. It delivers unified, non-blocking real-time observability over AI agent sessions, token consumption (including KV Cache accounting), generation throughput ($t/s$), VRAM usage, and GPU/APU thermal telemetry (`Edge` & `SoC Tctl`) directly in your Linux desktop panel.

---

## 🌟 TopBar & Popover Overview

### TopBar Indicator Format
```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Terminal] Gemini 4 Argon | 2,05M | VRAM 13,4 Go | 61°C | Hermes                │
│ [Terminal] Qwen3-Coder-30B | 0,04M | 28,4 t/s | VRAM 14,6 Go | 66°C | OpenCode  │
└─────────────────────────────────────────────────────────────────────────────────┘
```
- **Dynamic Model Aliases**: Automatic Title Case formatting for all Gemini models (*Gemini 4 Argon*, *Gemini 3.8 Flash*, *Gemini 3.7 Flash*) and local GGUF models (*Qwen3-Coder-30B*, *Gemma-4-31B*, *Gemma-4-12B*).
- **Cumulative Token Volume**: Formatted in millions `#,##M` with full OpenCode KV Cache (`cache.read` + `cache.write`) accounting.
- **Thermal Color Coding (`gpu_temp_status`)**:
  - `< 65°C` (`normal`): `.tw-temp-normal` (standard panel text color)
  - `65°C – 84°C` (`warm`): `.tw-temp-warm` (`#f59e0b` amber/orange)
  - `>= 85°C` (`critical`): `.tw-temp-critical` (`#ef4444` bold red)
  - Automatically hidden if sensor value is `null`.

### Interactive Popover Menu
Clicking the indicator opens a detailed popover menu displaying:
- **Session Context**: Active source (*Hermes*, *OpenCode*, *OpenWebUI*), agent mode, session title/directory, model alias & raw ID.
- **Token Breakdown**: `Tokens: X,XXM in | Y,YYM out (Z,ZZM tot)` and live generation speed (`X.X t/s`).
- **GPU / Hardware Telemetry (3-Line Section)**:
  1. `GPU: <X>% Load | VRAM: <X,X> Go / <Y,Y> Go`
  2. `GPU Temp (Edge): <XX> °C | SoC (CPU/GPU Hottest Tctl): <YY> °C`
  3. `GPU Power: <X> W | Clock: <XXX> MHz`
- **Quick Launchers**: Open WebUI (`127.0.0.1:8080`) & Lemonade Server (`127.0.0.1:13305`).

---

## 🚀 Architecture & Technical Highlights

### 1. Multi-Source & Multi-Profile Arbitration
The background daemon polls local sources every second in read-only mode:
1. **Hermes Agent**: Dynamically discovers all profile databases (`~/.hermes/profiles/*/state.db` and `~/.hermes/state.db`) and selects the most recently active non-archived session across all profiles.
2. **OpenCode**: Tracks `~/.local/share/opencode/opencode.db` including prompt, completion, reasoning, and KV cache (`cache.read` / `cache.write`) tokens.
3. **Open WebUI**: Tracks `webui.db` chat histories and evaluation durations.
4. **Lemonade Server**: Queries `http://127.0.0.1:13305/api/v1/health` for currently loaded GGUF models in VRAM.

### 2. Zero-Hardcode AMD Strix Halo Telemetry (`sysfs` / `hwmon`)
- **Dynamic Discovery & Memory Caching (`_SENSOR_CACHE`)**: Resolves `pathlib.Path` objects at startup for the active AMD DRM device (`vendor == 0x1002`), GPU `amdgpu` hwmon (`edge` temperature, `power1_average`/`power1_input`, `freq1_input`), and APU `k10temp`/`zenpower` hwmon (`Tctl` temperature).
- **Sub-0.1ms Polling & Multi-Level Fallbacks**: Reads cached `sysfs` files directly; falls back to `sensors -j` and `amdgpu_top --dump -J` (`shell=False`, `timeout=2.0`) if needed.
- **Asynchronous GNOME Shell UI**: Uses `Gio.File.load_contents_async` with `Gio.Cancellable` so the Mutter compositor thread is never blocked.

---

## 📁 Project Structure

```text
TokenWatcher-TopBar/
├── AGENTS.md                # Strict execution contract for OpenCode AI coding agent
├── opencode.json            # Local OpenCode config (Qwen3-Coder-30B + 64k KV cache rules)
├── run_sow_topbar.sh        # Deterministic SOW execution orchestrator for OpenCode
├── SOW/
│   ├── 00_AGENT_CODING_RULES.md
│   ├── architecture/
│   │   └── AMD_STRIX_HALO_SENSORS.md
│   └── specs/
│       ├── 01_GPU_TEMP_TELEMETRY.md
│       └── 02_HERMES_PROFILES_AND_MODELS.md
├── extension/
│   ├── extension.js         # GNOME 45-50 extension (async Gio I/O, GObject ES6)
│   ├── metadata.json        # Extension metadata & GNOME Shell compatibility
│   └── stylesheet.css       # Tabular numerals & thermal status classes (.tw-temp-*)
├── daemon/
│   └── tokenwatcher-daemon  # Multi-source & cached-hwmon Python daemon
├── systemd/
│   └── tokenwatcher.service # Systemd user service unit
├── docs/                    # Multilingual documentation (EN / FR)
├── install.sh               # Automated 1-click installation script
├── uninstall.sh             # Clean uninstallation script
└── readme-setup.md          # Step-by-step setup & verification guide
```

---

## 🛠️ Installation & SOW Development Workflow

### Quick Installation
```bash
git clone https://github.com/ThomasK2020/tokenwatcher-topbar.git
cd tokenwatcher-topbar
./install.sh
```
> **Note for Wayland:** After modifying `extension/extension.js` or `stylesheet.css`, log out and log back into your GNOME session (*Log Out / Log In*) to reload the extension module in GNOME Shell.

### Spec-Driven Development with OpenCode
To implement a new SOW specification using OpenCode (`Qwen3-Coder-30B-A3B-Instruct-GGUF` on Lemonade):
```bash
./run_sow_topbar.sh SOW/specs/01_GPU_TEMP_TELEMETRY.md
```

---

## 📄 License

Distributed under the **GNU General Public License v3.0 (GPL-3.0)**. See [`LICENSE`](LICENSE) for more information.
