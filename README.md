# SIDIBE Photoshop Toolkit

Plugin UXP Photoshop de productivité et d'automatisation SIDIBE STUDIO.

## V4 — AI & Creative Automation

Ajouts :
- export PNG/JPEG ;
- workflows et presets ;
- traitement batch de calques ;
- upscale 2× avec Deep Upscale ;
- Generative Upscale Firefly 2× sur Photoshop compatible ;
- rognage de transparence ;
- rotation ;
- assistant IA configurable via endpoint HTTPS ;
- exécution d'actions Photoshop renvoyées par un endpoint IA ;
- clé API saisie en session uniquement et jamais stockée dans GitHub.

Adobe documente Generative Upscale à partir de Photoshop 27.2. La V4 utilise donc Photoshop 27.2+ pour cette fonction.

## Contrat de réponse IA

Un endpoint peut retourner :
```json
{
  "actions": [
    {"type":"newLayer","name":"SIDIBE — IA"},
    {"type":"rename","name":"Visuel final"},
    {"type":"opacity","value":85},
    {"type":"visibility","value":true},
    {"type":"flipH"},
    {"type":"flipV"}
  ]
}
```

Les actions inconnues sont ignorées.

## Sécurité

Aucune clé API n'est enregistrée dans le dépôt. Le réseau UXP est explicitement déclaré dans le manifeste pour permettre la connexion à l'endpoint configuré. Utilise uniquement un endpoint HTTPS que tu contrôles ou auquel tu fais confiance.

## Installation

1. Installer Photoshop récent et Adobe UXP Developer Tool.
2. Charger ce dossier dans UXP Developer Tool.
3. Lancer le plugin dans Photoshop.
4. Pour Firefly Upscale, utiliser une version de Photoshop compatible.

## V5 — fonctionnalités ajoutées

- suppression d'arrière-plan ;
- génération/retouche IA d'images ;
- historique local des opérations ;
- batch sur les documents ouverts ;
- interface V5 pour préparer les intégrations IA avancées ;
- traitement de plusieurs documents avec export automatique ;
- interface de connexion IA sécurisée.