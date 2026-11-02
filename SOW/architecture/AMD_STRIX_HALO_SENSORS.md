# Référence Matérielle : Capteurs AMD Strix Halo (`gfx1151` / Radeon 8060S)

## 1. Architecture & Topologie Sysfs / Hwmon
- **SoC / APU** : AMD Ryzen AI Max+ 395 (Strix Halo) avec iGPU Radeon 8060S (RDNA 3.5 `gfx1151`).
- **Identification DRM AMD** :
  - Parcourir `/sys/class/drm/card*/device/`.
  - `vendor` = `0x1002`.
  - La carte active expose `gpu_busy_percent`, `mem_info_vram_used` et `mem_info_vram_total`.
- **Nœud `hwmon` GPU (`amdgpu`)** :
  - Chemin : `/sys/class/drm/card*/device/hwmon/hwmon*/` (le numéro `card*` et `hwmon*` varie au boot — ne jamais coder en dur).
  - `name` : `amdgpu`
  - **Température Edge** : `temp*_label` contenant `"edge"` (insensible à la casse) -> fichier `temp*_input` correspondant (en millidegrés Celsius, diviser par `1000`). À défaut de label, repli sur `temp1_input`.
  - **Puissance GPU (PPT / GFX Power)** : `power1_average` (ou à défaut `power1_input`), exprimé en microwatts ($\mu\text{W}$). Diviser par `1_000_000` pour obtenir des Watts entiers (`round(val / 1_000_000)`).
  - **Fréquence GPU (`sclk`)** : `freq1_input`, exprimée en Hertz ($\text{Hz}$). Diviser par `1_000_000` pour obtenir des MHz entiers (`round(val / 1_000_000)`).
- **Nœud `hwmon` APU/CPU (`k10temp` / `zenpower`)** :
  - Chemin : `/sys/class/hwmon/hwmon*/`.
  - `name` : `"k10temp"` ou `"zenpower"`.
  - **Température Tctl** : `temp*_label` contenant `"tctl"` (insensible à la casse) -> fichier `temp*_input` correspondant (en millidegrés Celsius, diviser par `1000`). À défaut, `temp1_input`.

## 2. Bornes & Seuils Thermiques
- **Plage de validité physique** : `[5, 125]` °C (toute valeur hors plage est rejetée et retourne `None`).
- **Seuils de statut (`gpu_temp_status`)** :
  - `< 65°C` : `"normal"`
  - `65°C <= T < 85°C` : `"warm"`
  - `>= 85°C` : `"critical"`
  - Si `None` : `None`
