# Architecture & Overview (EN)

TokenWatcher consists of two main components:

1. **Python Daemon (`tokenwatcher-daemon`)** :
   - Collects LLM usage metrics (Hermes Agent, OpenCode, OpenWebUI, Lemonade).
   - Monitors VRAM usage (AMD APU/GPU via `amdgpu_top`).
   - Writes consolidated state into a JSON file (`/tmp/tokenwatcher_state.json`).

2. **GNOME Shell Extension (`extension.js`)** :
   - Periodically reads the state file.
   - Displays icon, active model, token count, VRAM, and active source in the Top Bar.
