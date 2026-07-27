'use strict';

const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

// La base de données fonctionne de deux façons, sans changer le code :
//
//  - EN LIGNE (gratuit) : base de données Turso / libSQL persistante.
//    Définissez TURSO_DATABASE_URL (et TURSO_AUTH_TOKEN) chez l'hébergeur.
//    Les données restent conservées en permanence, gratuitement.
//
//  - EN LOCAL : simple fichier SQLite dans le dossier de données
//    (./data par défaut, ou le dossier indiqué par DATA_DIR).
//
// Turso utilise le même langage que SQLite : le schéma et les requêtes
// ci-dessous sont identiques quel que soit le mode.

let url = process.env.TURSO_DATABASE_URL;
let authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  const dataDir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  url = 'file:' + path.join(dataDir, 'preinscriptions.db');
  authToken = undefined;
}

const client = createClient({ url, authToken });

// Création / mise à jour du schéma.
async function init() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS preinscriptions (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      nom               TEXT NOT NULL,
      prenom            TEXT NOT NULL,
      date_naissance    TEXT NOT NULL,
      lieu_naissance    TEXT NOT NULL,
      piece_identite    TEXT,
      niveau_etude      TEXT,
      dernier_diplome   TEXT,
      ecole_bac         TEXT,
      niveau_sollicite  TEXT,
      formation         TEXT NOT NULL,
      whatsapp          TEXT NOT NULL,
      email             TEXT,
      adresse           TEXT,
      message           TEXT,
      consentement      INTEGER NOT NULL DEFAULT 0,
      date_soumission   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration additive : ajoute les colonnes manquantes sur une base existante.
  const info = await client.execute('PRAGMA table_info(preinscriptions);');
  const existing = new Set(info.rows.map((r) => r.name));
  const toAdd = [
    ['piece_identite', 'TEXT'],
    ['ecole_bac', 'TEXT'],
    ['niveau_sollicite', 'TEXT'],
  ];
  for (const [col, type] of toAdd) {
    if (!existing.has(col)) {
      await client.execute(`ALTER TABLE preinscriptions ADD COLUMN ${col} ${type};`);
    }
  }

  // Table des documents déposés (fichiers stockés directement dans la base).
  await client.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      preinscription_id INTEGER NOT NULL,
      libelle           TEXT NOT NULL,
      nom_fichier       TEXT NOT NULL,
      type_mime         TEXT NOT NULL,
      taille            INTEGER NOT NULL,
      contenu           BLOB NOT NULL,
      date_ajout        TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await client.execute(
    'CREATE INDEX IF NOT EXISTS idx_documents_preinscription ON documents(preinscription_id);'
  );
}

module.exports = { client, init };
