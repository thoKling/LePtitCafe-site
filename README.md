# Le P'tit Café — site

Refonte du site [le-ptit-cafe.fr](http://le-ptit-cafe.fr/). Site statique Jekyll publié sur GitHub Pages par GitHub Actions (`.github/workflows/pages.yml`) à chaque push sur `main`.

## Mettre à jour le contenu

| Quoi | Où |
| --- | --- |
| Ardoise du jour (carte sur place) | `_data/carte.yml` |
| Formules à emporter et tarifs | `_data/formules.yml` |
| Adresse, téléphone, horaires, réseaux | `cafe:` dans `_config.yml` |
| Bandeau d'annonce (ex. fermeture pour congés) | `announcement:` dans `_config.yml` |

Les formulaires de réservation et de commande ouvrent la messagerie du visiteur avec un e-mail pré-rempli. Le site étant statique, il n'y a pas de serveur pour les envoyer.

## Prévisualiser en local

```bash
docker run --rm -p 4000:4000 -v "$PWD":/srv/jekyll -w /srv/jekyll ruby:3.3 \
  sh -c "gem install jekyll -N && jekyll serve --host 0.0.0.0"
```

Puis ouvrir http://localhost:4000/LePtitCafe-site/

## Publier sur IONOS (le-ptit-cafe.fr)

```bash
scripts/deploy-ionos.sh
```

Le script construit le site avec `_config.ionos.yml` et remplace les fichiers du dossier `app620338136` sur l'hébergement IONOS. Il faut Docker et un fichier `password.txt` à la racine du projet contenant le mot de passe SFTP (ce fichier est ignoré par git et exclu du site).

## Domaine personnalisé

Pour servir le site sur `le-ptit-cafe.fr` : mettre `baseurl: ""` et `url: "https://le-ptit-cafe.fr"` dans `_config.yml`, puis configurer le domaine dans *Settings → Pages*.
