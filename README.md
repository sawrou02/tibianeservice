# TIBIANE SERVICE — Site de préinscription

Application web permettant à vos clients de faire leur **préinscription en ligne** à
une formation. Les données sont enregistrées dans une **base de données** (SQLite) et
consultables depuis une page d'administration protégée par mot de passe.

## Fonctionnalités

- 📝 Formulaire de préinscription en français (responsive, mobile & ordinateur).
- 🗄️ Enregistrement des demandes dans une base de données locale (SQLite).
- 🔐 Page d'administration protégée pour consulter les préinscriptions.
- 🔎 Recherche instantanée dans la liste des préinscriptions.
- ⬇️ Export des données au format CSV (compatible Excel).

## Informations collectées

Nom, prénom, date et lieu de naissance, niveau d'étude, dernier diplôme,
formation souhaitée, numéro WhatsApp, email, adresse, message, et consentement RGPD.

## Installation

Prérequis : [Node.js](https://nodejs.org/) version 18 ou supérieure.

```bash
npm install
npm start
```

Le site est ensuite accessible :

- **Formulaire public** : http://localhost:3000
- **Administration** : http://localhost:3000/admin

## Identifiants d'administration

Par défaut :

- Utilisateur : `admin`
- Mot de passe : `tibiane2026`

> ⚠️ **Important :** changez ces identifiants avant toute mise en ligne, via des
> variables d'environnement :

```bash
ADMIN_USER="mon_utilisateur" ADMIN_PASSWORD="un_mot_de_passe_solide" PORT=3000 npm start
```

## Mettre le site en ligne (avec base de données)

Le projet est prêt à être mis en ligne sur **Render** (https://render.com). Le
fichier `render.yaml` crée automatiquement le serveur web **et** un disque de
stockage persistant : la base de données reste intacte même après un
redémarrage ou une mise à jour.

Étapes (une seule fois) :

1. Créez un compte gratuit sur https://render.com et connectez votre compte
   GitHub.
2. Cliquez sur **New → Blueprint**, puis choisissez le dépôt
   `sawrou02/tibianeservice`.
3. Render détecte le fichier `render.yaml`. Au moment de la création, il vous
   demande le **mot de passe d'administration** (`ADMIN_PASSWORD`) : saisissez
   un mot de passe solide.
4. Cliquez sur **Apply**. Après quelques minutes, votre site est en ligne à une
   adresse du type `https://tibiane-preinscription.onrender.com`.

- **Formulaire public** (à partager avec vos clients) : `https://<votre-adresse>.onrender.com`
- **Administration** : `https://<votre-adresse>.onrender.com/admin`

> 💡 Le disque persistant nécessite le plan **Starter** de Render (~7 $/mois).
> C'est ce qui garantit que les préinscriptions de vos clients ne sont jamais
> perdues. Sans disque persistant (plan gratuit), les données seraient effacées
> à chaque redémarrage.

## Où sont stockées les données ?

- **En local** : dans le fichier `data/preinscriptions.db` (dossier ignoré par
  git, voir `.gitignore`, pour ne jamais publier les données personnelles).
- **En ligne** : sur le disque persistant de l'hébergeur, dans le dossier
  indiqué par la variable d'environnement `DATA_DIR` (`/var/data` avec la
  configuration `render.yaml`).

Vous pouvez à tout moment récupérer une copie de toutes les préinscriptions
depuis la page d'administration grâce au bouton **Export CSV**.

## Structure du projet

```
tibianeservice/
├── server.js            # Serveur Express + API
├── render.yaml          # Configuration de mise en ligne (Render)
├── db/database.js       # Connexion et schéma de la base SQLite
├── public/
│   ├── index.html       # Formulaire de préinscription
│   ├── admin.html       # Page d'administration
│   ├── css/style.css    # Styles
│   └── js/              # Scripts (form.js, admin.js)
└── data/                # Base de données (créée automatiquement)
```

## Aspect légal (RGPD)

Ce formulaire collecte des données personnelles. En France, vous devez :
informer les personnes de l'usage de leurs données, obtenir leur consentement
(case à cocher présente dans le formulaire), sécuriser l'accès aux données, et
permettre leur suppression sur demande.
