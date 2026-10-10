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

La collection `article` contient `titre`, `article`, `date` et `publier` (booléen). La page `articles.html` n'affiche que les articles publiés, du plus récent au plus ancien. La page `write-article.html` permet aux auteurs connectés de publier un article ou de l'enregistrer comme brouillon. La page `admin.html`, réservée aux auteurs connectés, permet de lister et supprimer les comptes et les articles, et de publier ou dépublier les articles.

Ressources JSON Server :

- `GET/POST /users`
- `GET/POST /article`
- `PATCH/DELETE /article/:id`
- `DELETE /users/:id`

## Limites de sécurité

Cette version est un prototype pédagogique, pas un système d'authentification pour la production. Les contrôles de rôle des pages sont côté navigateur et JSON Server expose directement les collections REST, notamment les opérations de suppression et de publication; ils ne constituent donc pas une autorisation sécurisée. JSON Server expose aussi les empreintes et les sels des utilisateurs. Le hachage MD5 est trop rapide pour protéger des mots de passe; le poivre est aussi stocké dans la base et le calcul est effectué dans le navigateur. Une vraie application doit vérifier les droits et mots de passe côté serveur, utiliser Argon2id ou bcrypt, garder les secrets hors de la base et utiliser une session sécurisée côté serveur.

Le dossier `node_modules/` est exclu du dépôt par `.gitignore`.