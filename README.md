# L6 - Atelier

Petite application de démonstration avec création de compte, connexion et une API REST fournie par JSON Server.

## Lancer le projet

Prérequis : Node.js 22.12 ou plus récent.

```bash
npm install
npm start
```

Ouvrir ensuite [http://localhost:3000/login.html](http://localhost:3000/login.html). JSON Server sert l'interface et l'API sur le port `3000`.

## Parcours

- Le formulaire permet de se connecter ou de créer un compte.
- À la création, l'adresse e-mail est enregistrée en minuscules; le rôle auteur est facultatif.
- Après une connexion réussie, l'utilisateur arrive sur `index.html`, qui affiche « Vous êtes connecté ».
- La session de démonstration est conservée dans `sessionStorage`. Le bouton Déconnexion l'efface.

## Données

Les données sont stockées dans `db.json`. Les utilisateurs contiennent les champs suivants :

| Champ | Description |
| --- | --- |
| `email` | Adresse e-mail du compte |
| `mdp` | Empreinte MD5 du mot de passe, du poivre et du sel |
| `auteur` | Booléen indiquant si le compte est auteur |
| `poivre` | Poivre généré pour le compte |
| `sel` | Sel aléatoire généré pour le compte |

La collection `articles` est actuellement vide. Le modèle d'article reste à définir; une proposition minimale serait `titre`, `contenu`, `auteurId` et `dateCreation`.

Ressources JSON Server :

- `GET/POST /users`
- `GET/POST /articles`

## Limites de sécurité

Cette version est un prototype pédagogique, pas un système d'authentification pour la production. JSON Server expose directement les collections REST, notamment les empreintes et les sels des utilisateurs. Le hachage MD5 est trop rapide pour protéger des mots de passe; le poivre est aussi stocké dans la base et le calcul est effectué dans le navigateur. Une vraie application doit vérifier les mots de passe côté serveur avec Argon2id ou bcrypt, garder les secrets hors de la base et utiliser une session sécurisée côté serveur.

Le dossier `node_modules/` est exclu du dépôt par `.gitignore`.