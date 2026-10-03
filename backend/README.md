# SIDIBE Photoshop Backend

Backend sécurisé pour le plugin SIDIBE Photoshop Toolkit.

## V6
- authentification Adobe OAuth Server-to-Server côté serveur ;
- proxy POST /v2/remove-background ;
- aucun Client Secret dans le plugin ou dans Git ;
- endpoint GET /health pour vérifier le déploiement.

## Configuration
1. Copier backend/.env.example vers backend/.env.
2. Renseigner ADOBE_CLIENT_ID et ADOBE_CLIENT_SECRET.
3. Utiliser Node.js 20+.
4. Lancer `npm start`.
5. Déployer derrière HTTPS.

Le endpoint Remove Background reçoit une URL d'image accessible par Adobe. Adobe documente ce flux avec Photoshop API v2. Pour envoyer directement un fichier local depuis le plugin, la prochaine couche ajoutera un stockage objet et des URL signées.

## Sécurité
Les identifiants Adobe restent côté serveur. Ne jamais les placer dans index.js, manifest.json ou un dépôt public.