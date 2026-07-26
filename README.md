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

## Où sont stockées les données ?

Dans le fichier `data/preinscriptions.db`. Ce dossier est ignoré par git
(voir `.gitignore`) afin de ne jamais publier les données personnelles de vos
clients. Pensez à sauvegarder ce fichier régulièrement.

## Structure du projet

```
tibianeservice/
├── server.js            # Serveur Express + API
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
