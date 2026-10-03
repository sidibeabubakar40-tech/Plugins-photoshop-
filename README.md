# SIDIBE Photoshop Toolkit

## V6 — Adobe AI Backend

La V6 ajoute un backend serveur séparé pour intégrer Photoshop API v2 sans exposer les identifiants Adobe dans le plugin.

- Remove Background via `/v2/remove-background` ;
- authentification OAuth Server-to-Server côté backend ;
- interface plugin pour renseigner l'URL du backend et une URL d'image lisible par Adobe ;
- dossier `backend/` prêt à déployer ;
- aucun secret Adobe dans le dépôt.

Adobe recommande Photoshop API v2 pour les nouvelles intégrations et documente Remove Background, Generative Fill et Generative Expand.


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

## V6.1 — suivi des jobs Adobe

Le backend expose `GET /v2/status/:jobId` et relaie le statut Photoshop API v2. Le plugin interroge cet endpoint jusqu'à la fin du job Remove Background, puis affiche l'URL de résultat fournie par Adobe lorsqu'elle est disponible.

Le flux nécessite toujours une URL d'image accessible par Adobe (URL signée, stockage objet, etc.). L'envoi automatique d'un fichier local Photoshop vers un stockage public n'est pas encore inclus.
