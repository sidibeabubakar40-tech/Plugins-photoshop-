# SIDIBE Photoshop Toolkit

Plugin UXP pour Adobe Photoshop.

## V1

- Affichage du document actif
- Affichage du calque actif
- Création d'un calque
- Duplication du calque actif
- Affichage / masquage du calque
- Renommage du calque
- Retourner horizontalement
- Interface sombre avec accent doré

## Installation pour développement

1. Installer Photoshop et **Adobe UXP Developer Tool**.
2. Ouvrir UXP Developer Tool.
3. Ajouter le fichier `manifest.json` du dépôt.
4. Charger le plugin.
5. Dans Photoshop : **Plugins → SIDIBE Photoshop Toolkit**.

Le plugin utilise UXP Manifest v5 et cible Photoshop 23.3+.

## Architecture

```
manifest.json
index.html
index.js
styles.css
README.md
```

La V1 est volontairement légère afin de fournir une base stable avant d'ajouter les fonctions avancées : IA, presets, export, automatisations et connexions API.
