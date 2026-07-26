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

## Mettre le site en ligne — GRATUITEMENT

Le site se met en ligne **gratuitement** avec deux services gratuits :

- **Turso** (https://turso.tech) — la base de données gratuite et persistante
  (vos préinscriptions y sont conservées en permanence) ;
- **Render** (https://render.com) — l'hébergement du site (plan gratuit).

### Étape 1 — Créer la base de données gratuite (Turso)

1. Créez un compte gratuit sur https://turso.tech.
2. Créez une base de données (bouton **Create Database**) ; donnez-lui un nom,
   par exemple `tibiane`.
3. Ouvrez cette base, puis récupérez **deux informations** :
   - l'**URL** de la base (elle commence par `libsql://…`) ;
   - un **jeton d'accès** (*token*) : bouton **Create Token** / **Generate
     Token**. Copiez le long code affiché.

Gardez ces deux valeurs de côté pour l'étape suivante.

### Étape 2 — Mettre le site en ligne (Render)

1. Créez un compte gratuit sur https://render.com et connectez votre compte
   GitHub.
2. Cliquez sur **New → Blueprint**, puis choisissez le dépôt
   `sawrou02/tibianeservice` (branche **main**).
3. Render détecte le fichier `render.yaml`. Au moment de la création, il vous
   demande de renseigner :
   - `TURSO_DATABASE_URL` → l'URL `libsql://…` de l'étape 1 ;
   - `TURSO_AUTH_TOKEN` → le jeton d'accès de l'étape 1 ;
   - `ADMIN_PASSWORD` → un mot de passe d'administration solide (à vous).
4. Cliquez sur **Apply**. Après quelques minutes, votre site est en ligne à une
   adresse du type `https://tibiane-preinscription.onrender.com`.

- **Formulaire public** (à partager avec vos clients) : `https://<votre-adresse>.onrender.com`
- **Administration** : `https://<votre-adresse>.onrender.com/admin`

> 💡 **100 % gratuit.** Sur le plan gratuit de Render, le site se met en veille
> après quelques minutes sans visite et se réveille en ~30 secondes à la
> visite suivante — sans aucune perte de données, puisque celles-ci sont
> stockées dans Turso.

## Où sont stockées les données ?

- **En ligne** : dans votre base de données **Turso**, conservées en
  permanence (indiquée par `TURSO_DATABASE_URL`).
- **En local** : dans le fichier `data/preinscriptions.db` (dossier ignoré par
  git, voir `.gitignore`, pour ne jamais publier les données personnelles).

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
