# SOW-01 : Telemetry Thermique GPU AMD (Strix Halo) - TokenWatcher TopBar
**Statut** : READY FOR DEV
**Cible** : `tokenwatcher.service` (Backend Python) & Extension GNOME Shell (`extension.js`, `stylesheet.css`)
**Architecture matérielle** : HP ZBook Ultra — AMD Ryzen AI Max+ 395 (Strix Halo / iGPU Radeon RDNA 3.5 `gfx1151`)

---

## Lot 1 : Spécifications Fonctionnelles

### 1.1 Acquisition des Capteurs (Backend Télémétrie)
- **Sonde Principale (GPU Edge)** : Température Edge du GPU AMD en degrés Celsius entiers (ex. `42`).
- **Sonde Secondaire / Fallback (APU Tctl)** : Température Tctl du package APU (`k10temp` ou `zenpower`, ex. `47`) affichée dans le Popover et utilisée en repli si Edge est indisponible.
- **Métriques Complémentaires** : Extraction dans le même dossier `hwmon` du GPU de la puissance (`GFX Power` en Watts via `power1_average` ou `power1_input`, divisé par `1_000_000`) et de la fréquence (`GPU Clock` en MHz via `freq1_input`, divisé par `1_000_000`).

### 1.2 Affichage dans la Barre Supérieure GNOME (TopBar)
- **Gabarit TopBar** : `... | <#,##M> | VRAM <X,X Go> | <XX°C> | <Source>`
- **Règle d'absence** : Si `gpu_temp_c` vaut `null`, omettre complètement le segment `| <XX°C>` (jamais `0°C`, `null` ou `NaN`).
- **Color Coding CSS (`gpu_temp_status`)** :
  - `"normal"` (`< 65°C`) : Classe `.tw-temp-normal` (couleur standard TopBar).
  - `"warm"` (`65°C` à `84°C`) : Classe `.tw-temp-warm` (orange/ambre `#f59e0b`).
  - `"critical"` (`>= 85°C`) : Classe `.tw-temp-critical` (rouge vif `#ef4444`, gras).

### 1.3 Affichage dans le Menu Déroulant (Popover)
Dans la section **GPU / Hardware Telemetry** :
- **Ligne 1** : `VRAM Used / Total` (conserver le format existant).
- **Ligne 2** : `GPU Temp (Edge): <XX> °C | SoC (Tctl): <YY> °C` (masquer la sous-partie si `null`).
- **Ligne 3** : `GPU Power: <X> W | Clock: <XXX> MHz` (si disponibles).

---

## Lot 2 : Spécifications Techniques & Architecture de Code

### 2.1 Algorithme de Découverte Matérielle (`sysfs` / `hwmon` — Zéro Hardcode)
1. **Identification de la carte DRM AMD active** :
   - Parcourir `/sys/class/drm/card*/device/`.
   - Vérifier que `vendor` contient `0x1002`.
   - Privilégier la carte exposant `gpu_busy_percent` ou `mem_info_vram_used`.
2. **Résolution du nœud `hwmon` GPU (Edge Temperature, Power, Clock)** :
   - Parcourir `/sys/class/drm/cardX/device/hwmon/hwmon*/`.
   - Chercher `temp*_label` égal à `"edge"` (insensible à la casse) ; à défaut `temp1_input`.
   - Résoudre dans ce même dossier `power1_average` (ou `power1_input`) et `freq1_input`.
3. **Résolution du nœud `hwmon` APU/CPU (CPU Tctl)** :
   - Parcourir `/sys/class/hwmon/hwmon*/`.
   - Vérifier que `name` vaut `"k10temp"` ou `"zenpower"`.
   - Chercher `temp*_label` égal à `"tctl"` (insensible à la casse) ou à défaut `temp1_input`.
4. **Conversion & Sanitisation** :
   - `temp_c = round(int(raw.strip()) / 1000)`.
   - Valider `5 <= temp_c <= 125` (sinon retourner `None`).
5. **Mise en Cache des Chemins Résolus** :
   - Stocker les chemins absolus résolus en mémoire à l'initialisation.
   - Lire directement les fichiers en cache à chaque cycle (`< 0.1 ms`).
   - En cas de `FileNotFoundError` ou `OSError`, invalider le cache et relancer la découverte une seule fois.

### 2.2 Chaîne de Fallback (Ordre de Priorité)
1. **Niveau 1 (Prioritaire)** : Lecture directe `sysfs` / `hwmon` mise en cache.
2. **Niveau 2 (Fallback CLI `sensors`)** : `sensors -j` (`shell=False`, `timeout=2.0`), extraction de `amdgpu-pci-* -> edge -> temp1_input` et `k10temp-pci-* -> Tctl -> temp1_input`.
3. **Niveau 3 (Fallback CLI `amdgpu_top`)** : `amdgpu_top --dump -J` (`shell=False`, `timeout=2.0`), extraction de `Sensors -> Edge Temperature`.

### 2.3 Contrat de Données JSON (Backend Python <-> Extension GNOME GJS)
Ajouter de façon rétrocompatible au payload JSON :
- `"gpu_temp_c"` : `int | None` (ex: `42`)
- `"cpu_temp_tctl_c"` : `int | None` (ex: `47`)
- `"gpu_power_w"` : `int | None` (ex: `7`)
- `"gpu_clock_mhz"` : `int | None` (ex: `603`)
- `"gpu_temp_status"` : `"normal" | "warm" | "critical" | None`

### 2.4 Contraintes Spécifiques GNOME Shell (GJS)
- **Zéro Appel Bloquant** : Lecture exclusivement asynchrone (`Gio.File.load_contents_async`).
- **Stabilité Visuelle** : `font-variant-numeric: tabular-nums;` dans `stylesheet.css` sur le label TopBar.
- **Cycle de Vie (`disable()`)** : Nettoyage strict de tous les timers et signaux.

---

## Lot 3 : Plan de Validation & Critères d'Acceptation (Definition of Done)
1. **Syntaxe Python** : `python3 -m py_compile *.py`
2. **Test Sonde Bas Niveau** : Exécuter un test rapide en CLI Python vérifiant que la sonde renvoie un entier valide dans `[5, 125]` et un statut cohérent.
3. **Syntaxe GJS** : `node --check extension.js` (si supporté) ou vérification d'intégrité syntaxique.
4. **Non-Régression Service** : `systemctl --user restart tokenwatcher.service` puis `journalctl --user -u tokenwatcher.service -n 25 --no-pager` (0 erreur).
5. **Commit Atomique** : `git commit -m "feat(gpu): Add AMD GPU Edge & Tctl temperature telemetry in TopBar and Popover"`
