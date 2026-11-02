# Architecture & Fonctionnement (FR)

TokenWatcher TopBar repose sur deux composants découplés communiquant de façon asynchrone via `/tmp/tokenwatcher_state.json` :

1. **Le Démon Python (`daemon/tokenwatcher-daemon`)** :
   - **Collecte Multi-Sources & Multi-Profils** :
     - **Hermes Agent** : découverte dynamique de tous les profils (`~/.hermes/profiles/*/state.db` et `~/.hermes/state.db`) et sélection de la session active la plus récente. Formatage dynamique des modèles Gemini (*Gemini 4 Argon*, *Gemini 3.8 Flash*, etc.).
     - **OpenCode** : lecture de `~/.local/share/opencode/opencode.db` avec intégration des tokens du KV Cache (`cache.read` + `cache.write`) dans `prompt_tokens`.
     - **OpenWebUI** (`webui.db`) & **Lemonade Server** (`127.0.0.1:13305`).
   - **Télémétrie Matérielle AMD Strix Halo (`sysfs` / `hwmon` avec cache mémoire)** :
     - Résolution dynamique sans chemin codé en dur de la carte DRM AMD (`0x1002`), de la sonde GPU `Edge` (`amdgpu`), de la sonde APU `Tctl` (`k10temp`/`zenpower`), de la puissance (`W`) et de la fréquence (`MHz`).
     - Chaîne de repli sécurisée (`shell=False`, `timeout=2.0`) vers `sensors -j` puis `amdgpu_top --dump -J`.

2. **L'Extension GNOME Shell (`extension/extension.js` & `extension/stylesheet.css`)** :
   - Lecture 100% asynchrone non-bloquante (`Gio.File.load_contents_async` + `Gio.Cancellable`).
   - **Format TopBar** : `[Icône] <Modèle> | <#,##M> | <X.X t/s> | VRAM <X,X Go> | <XX°C> | <Source>` avec coloration thermique CSS (`.tw-temp-normal`, `.tw-temp-warm`, `.tw-temp-critical`).
   - **Popover Détaillé** : contexte de session, répartition `in / out / tot` des tokens, et section **GPU / Hardware Telemetry** sur 3 lignes (`GPU Load & VRAM`, `GPU Temp (Edge) | SoC (CPU/GPU Hottest Tctl)`, `GPU Power | Clock`).
