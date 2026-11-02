# Architecture & Overview (EN)

TokenWatcher TopBar consists of two decoupled components communicating asynchronously via `/tmp/tokenwatcher_state.json`:

1. **Python Daemon (`daemon/tokenwatcher-daemon`)**:
   - **Multi-Source & Multi-Profile Collection**:
     - **Hermes Agent**: dynamically discovers all profile databases (`~/.hermes/profiles/*/state.db` and `~/.hermes/state.db`) and selects the most recently active session. Dynamically formats Gemini model names (*Gemini 4 Argon*, *Gemini 3.8 Flash*, etc.).
     - **OpenCode**: monitors `~/.local/share/opencode/opencode.db` and includes KV Cache tokens (`cache.read` + `cache.write`) in `prompt_tokens`.
     - **OpenWebUI** (`webui.db`) & **Lemonade Server** (`127.0.0.1:13305`).
   - **AMD Strix Halo Hardware Telemetry (Cached `sysfs` / `hwmon`)**:
     - Zero-hardcode dynamic discovery of the active AMD DRM device (`0x1002`), GPU `Edge` temperature (`amdgpu`), APU `Tctl` temperature (`k10temp`/`zenpower`), GPU power (`W`), and clock (`MHz`).
     - Safe CLI fallbacks (`shell=False`, `timeout=2.0`) using `sensors -j` and `amdgpu_top --dump -J`.

2. **GNOME Shell Extension (`extension/extension.js` & `extension/stylesheet.css`)**:
   - Non-blocking asynchronous file reads (`Gio.File.load_contents_async` + `Gio.Cancellable`).
   - **TopBar Format**: `[Icon] <Model> | <#,##M> | <X.X t/s> | VRAM <X,X Go> | <XX°C> | <Source>` with thermal CSS classes (`.tw-temp-normal`, `.tw-temp-warm`, `.tw-temp-critical`).
   - **Interactive Popover**: session context, token breakdown (`in / out / tot`), and a 3-line **GPU / Hardware Telemetry** section (`GPU Load & VRAM`, `GPU Temp (Edge) | SoC (CPU/GPU Hottest Tctl)`, `GPU Power | Clock`).
