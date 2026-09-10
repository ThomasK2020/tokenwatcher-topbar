# TokenWatcher TopBar

> **Moniteur temps réel d'activité LLM (Hermes, OpenCode, OpenWebUI) et de VRAM GPU AMD Radeon dans la barre supérieure de GNOME.**

---

## 🌟 Présentation

**TokenWatcher** est une extension GNOME Shell (compatible GNOME 45 à 50+ sous Wayland/X11) couplée à un daemon ultra-léger en Python. Elle permet de suivre en temps réel dans votre barre supérieure :
- Le **modèle LLM actif** avec alias nettoyé (*Gemini 3.7 Flash*, *Qwen3-Coder-30B*, *Gemma-4-12B*, etc.).
- Le **volume cumulé de tokens** formaté au standard `#,##M` (ex: `2,37M`).
- La **vitesse de génération** en direct (`X,X t/s`).
- L'**utilisation de la VRAM GPU** sur APU AMD (Strix Halo / Radeon 8060S / dGPU AMD).
- La **source active** en cours d'exécution (*Hermes*, *OpenCode*, *OpenWebUI*).

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Terminal] Qwen3-Coder-30B | 0,05M | 28,4 t/s | VRAM 14,4 Go | OpenCode│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Architecture & Fonctionnalités

### 1. Arbitrage Multi-Source Intelligent
Le daemon surveille en parallèle et sans latence :
1. **Hermes Agent** : Lecture SQLite temps réel de `~/.hermes/state.db` (sessions, modèles, tokens prompt/completion, tool calls).
2. **OpenCode** : Surveillance SQLite de `~/.local/share/opencode/opencode.db` (sessions, messages, calcul delta temps réel $\Delta t < 3\text{s}$ et tokens/s).
3. **Open WebUI** : Surveillance SQLite de `webui.db` et ports locaux.
4. **Lemonade Server** : Surveillance de l'API locale (port 13305) et du modèle chargé en VRAM.

> **Priorité dynamique :** Dès qu'OpenCode ou un agent spécialisé commence une génération, l'indicateur bascule instantanément sur la tâche en cours, puis revient à l'orchestrateur principal une fois le travail achevé.

### 2. Surveillance Matérielle AMD (APU / GPU)
* Lecture directe via `amdgpu_top` et `/sys/class/drm/card*/device/mem_info_vram_*`.
* Détection précise de l'allocation mémoire partagée / dédiée de l'APU AMD Strix Halo (Radeon 8060S).

### 3. Popover Détaillé
Un clic sur l'indicateur ouvre un menu popover affichant :
* Le contexte/titre de la session ou du projet en cours.
* Le modèle complet et ses alias.
* La répartition `Prompt in` vs `Completion out` et le total en millions (`#,##M`).
* La vitesse de génération instantanée.
* L'occupation GPU et VRAM.
* Des raccourcis directs vers les interfaces Web (Open WebUI : 8080, Lemonade : 13305).

---

## 📁 Structure du Projet

```text
TokenWatcher-TopBar/
├── extension/
│   ├── extension.js         # Code de l'extension GNOME 45-50 (GObject ES6)
│   ├── metadata.json        # Métadonnées et compatibilité GNOME Shell
│   └── stylesheet.css       # Styles visuels et popover
├── daemon/
│   └── tokenwatcher-daemon  # Daemon multi-source Python (IPC /tmp/tokenwatcher_state.json)
├── systemd/
│   └── tokenwatcher.service # Unité systemd utilisateur
├── install.sh               # Script d'installation automatique
├── uninstall.sh             # Script de désinstallation propre
├── .gitignore
└── README.md
```

---

## 🛠️ Installation

### Installation rapide

Clonez le dépôt et lancez le script d'installation :

```bash
git clone https://github.com/ThomasK2020/tokenwatcher-topbar.git
cd tokenwatcher-topbar
./install.sh
```

> **Note Wayland / GNOME Shell :** Sous Wayland, si l'extension vient d'être installée ou mise à jour, fermez et rouvrez votre session utilisateur GNOME (*Log Out / Log In*) pour que le Shell charge le module.

---

## 🔍 Commandes Utiles & Diagnostic

### Statut du daemon de métriques
```bash
systemctl --user status tokenwatcher.service
```

### Journal du daemon
```bash
journalctl --user -u tokenwatcher.service -f
```

### Vérifier l'état IPC en direct
```bash
cat /tmp/tokenwatcher_state.json | jq .
```

### Tester l'extension sous GNOME
```bash
gnome-extensions info tokenwatcher@thomas.local
```

---

## 📄 Licence

MIT License - Conçu pour optimiser le flux de travail avec assistants IA et accélérateurs matériels locaux.
