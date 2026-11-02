# SOW-02 : Support Multi-Profils Hermes, Alias Dynamiques Gemini & Tokens Cache OpenCode
**Statut** : READY FOR DEV
**Cible** : `daemon/tokenwatcher-daemon` & `extension/extension.js`

---

## Lot 1 : Spécifications Fonctionnelles

### 1.1 Découverte Dynamique Multi-Profils Hermes (`fetch_metrics_hermes`)
- Hermes Agent stocke ses sessions SQLite par profil dans `~/.hermes/profiles/*/state.db` ainsi qu'à la racine `~/.hermes/state.db`.
- `fetch_metrics_hermes()` ne doit plus lire uniquement `~/.hermes/state.db`, mais parcourir dynamiquement tous les fichiers existants correspondant à `~/.hermes/profiles/*/state.db` et `~/.hermes/state.db`.
- Pour chaque base `state.db` valide, récupérer la session non archivée et non masquée (`WHERE archived = 0 AND hidden = 0`) ayant le `COALESCE(last_activity_at, started_at)` maximal.
- Parmi toutes les bases trouvées, retenir la session dont l'activité (`float(last_activity or started_at or 0)`) est la plus récente.

### 1.2 Formatage Dynamique des Modèles Gemini (`clean_model_name` & `getModelAlias`)
- Supprimer le hardcoding limitant Gemini aux seules versions `3.7`, `3.6` et `2.5`.
- Dans `clean_model_name(raw_name)` (`daemon/tokenwatcher-daemon`) et `getModelAlias(rawName)` (`extension/extension.js`) :
  - Si le nom du modèle (après suppression d'un éventuel préfixe `provider/`) commence par `gemini` (insensible à la casse), formater dynamiquement chaque segment séparé par `-` ou espace en `Title Case` (ex: `"gemini-4-argon"` -> `"Gemini 4 Argon"`, `"gemini-3.8-flash"` -> `"Gemini 3.8 Flash"`, `"gemini-3.7-flash"` -> `"Gemini 3.7 Flash"`).
  - Conserver tel quel le nettoyage des autres familles de modèles (`Qwen3-Coder-30B`, `Gemma-4-12B`, `Gemma-4-31B`, `Claude`, `GPT-4o`, suffixes `-GGUF`, `-Instruct`, `-it`, `:latest`, `-A3B`).

### 1.3 Comptabilisation du KV Cache dans `prompt_tokens` OpenCode (`fetch_metrics_opencode`)
- Dans `fetch_metrics_opencode()`, OpenCode enregistre les tokens d'entrée hors cache dans `toks.get("input", 0)` et les tokens lus/écrits dans le KV cache sous `toks.get("cache", {}).get("read", 0)` et `toks.get("cache", {}).get("write", 0)`.
- Calculer :
  ```python
  cache_obj = toks.get("cache", {}) if isinstance(toks.get("cache"), dict) else {}
  cache_tokens = (cache_obj.get("read", 0) or 0) + (cache_obj.get("write", 0) or 0)
  prompt_tokens = (toks.get("input", 0) or 0) + cache_tokens
  ```
  afin que `prompt_tokens` reflète fidèlement le contexte entrant total affiché dans `Tokens: X,XXM in | Y,YYM out (Z,ZZM tot)`.

---

## Lot 2 : Contraintes Techniques
- **Zéro Régression SOW-01** : Ne modifier AUCUNE fonction de télémétrie GPU/APU (`TELEMETRY_CONFIG`, `_SENSOR_CACHE`, `discover_hardware_sensors`, `get_gpu_metrics`, etc.).
- Utiliser exclusivement l'outil `edit` de façon chirurgicale sur `clean_model_name`, `fetch_metrics_hermes`, `fetch_metrics_opencode` dans `daemon/tokenwatcher-daemon` et `getModelAlias` dans `extension/extension.js`.

---

## Lot 3 : Plan de Validation & Critères d'Acceptation
1. **Syntaxe Python** : `python3 -m py_compile daemon/tokenwatcher-daemon`
2. **Test Unitaire CLI Python** :
   - Vérifier que `clean_model_name("gemini-4-argon") == "Gemini 4 Argon"` et `clean_model_name("gemini-3.8-flash") == "Gemini 3.8 Flash"`.
   - Vérifier que `fetch_metrics_hermes()` retourne un dictionnaire non nul avec `"model": "Gemini 4 Argon"` et `"total_tokens" > 1000000`.
3. **Syntaxe GJS** : `node --check extension/extension.js`
4. **Déploiement & Service** :
   - Copier `daemon/tokenwatcher-daemon` vers `~/.local/bin/tokenwatcher-daemon` et `extension/extension.js` vers `~/.local/share/gnome-shell/extensions/tokenwatcher@thomas.local/extension.js`.
   - Redémarrer `systemctl --user restart tokenwatcher.service` et vérifier `/tmp/tokenwatcher_state.json`.
