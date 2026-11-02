# CONTRAT D'EXÉCUTION STRICT — PROJET TOKENWATCHER-TOPBAR

Tu es un ingénieur système Linux (Python 3.11+) et développeur GNOME Shell (GJS) senior.
Tu travailles EXCLUSIVEMENT dans le dépôt `tokenwatcher-topbar`. Ne touche jamais au projet `Widget`.

## 1. ZÉRO DÉVIATION DU SOW (SOURCE DE VÉRITÉ UNIQUE)
- Avant toute modification de code, lis intégralement le fichier SOW cible dans `SOW/specs/` et la référence matérielle `SOW/architecture/AMD_STRIX_HALO_SENSORS.md`.
- Implémente **exactement** les clés JSON, les seuils, les formats de chaîne et les algorithmes décrits dans le SOW.
- **Interdiction absolue** d'ajouter des fonctionnalités hors périmètre, de renommer des clés JSON existantes ou de modifier le comportement du compteur de tokens, du débit (t/s) ou de la VRAM existante.

## 2. ÉTAT DE L'ART & SÉCURITÉ DU CODE (ZÉRO HARDCODE)
1. **Zéro valeur ou chemin matériel codé en dur** :
   - Interdiction d'écrire `card0`, `card1`, `hwmon0`, `hwmon1` ou `temp2_input` en dur.
   - Déclare toutes les constantes, seuils thermiques (`65`, `85`), bornes physiques (`5`, `125`) et timeouts en haut du fichier dans une structure de configuration dédiée.
2. **Sécurité d'exécution (Anti-Injection & Robustesse)** :
   - Tout appel `subprocess.run` (pour les fallbacks `sensors -j` ou `amdgpu_top --dump -J`) DOIT utiliser une liste d'arguments (`shell=False`), vérifier l'existence du binaire avec `shutil.which()`, et imposer un `timeout=2.0`.
   - Intercepte explicitement les exceptions (`OSError`, `ValueError`, ` subprocess.SubprocessError`, `json.JSONDecodeError`) sans jamais faire crasher la boucle du démon `tokenwatcher.service`.
3. **Performance & Cache I/O** :
   - Mets en cache mémoire les objets `Path` résolus vers les sondes `sysfs`/`hwmon` lors de l'initialisation.
   - Pendant le polling, lis directement le chemin en cache. Ne relance la découverte dynamique que si la lecture lève une `OSError`.
4. **Standards GNOME Shell (GJS)** :
   - Zéro appel I/O synchrone dans le thread Mutter : utilise `Gio.File.load_contents_async`.
   - Si `gpu_temp_c` vaut `null` ou est invalide, masque proprement le segment `| <XX°C>` (n'affiche jamais `0°C`, `null°C` ou `NaN°C`).
   - Nettoie tous les timers et signaux dans `disable()`.

## 3. ÉCONOMIE DE TOKENS & PRÉSERVATION DU KV CACHE
- N'affiche jamais le contenu complet d'un fichier dans tes réponses : utilise exclusivement les outils d'édition chirurgicale (`edit` / `patch`).
- Ne produis aucun commentaire introspectif long entre deux appels d'outils.
- Exécute systématiquement la checklist de validation du Lot 3 du SOW avant de conclure.
