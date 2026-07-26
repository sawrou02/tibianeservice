'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Le fichier de base de données est stocké dans le dossier /data (ignoré par git).
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'preinscriptions.db'));
db.pragma('journal_mode = WAL');

// Création de la table si elle n'existe pas encore.
db.exec(`
  CREATE TABLE IF NOT EXISTS preinscriptions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    nom               TEXT NOT NULL,
    prenom            TEXT NOT NULL,
    date_naissance    TEXT NOT NULL,
    lieu_naissance    TEXT NOT NULL,
    niveau_etude      TEXT,
    dernier_diplome   TEXT,
    formation         TEXT NOT NULL,
    whatsapp          TEXT NOT NULL,
    email             TEXT,
    adresse           TEXT,
    message           TEXT,
    consentement      INTEGER NOT NULL DEFAULT 0,
    date_soumission   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
