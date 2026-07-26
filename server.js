'use strict';

const path = require('path');
const express = require('express');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Identifiants de la page d'administration (à personnaliser via variables d'environnement).
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tibiane2026';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Utilitaires ---------------------------------------------------------

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidDate(value) {
  // Format attendu : AAAA-MM-JJ (champ <input type="date">)
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

// Authentification simple (Basic Auth) pour les routes d'administration.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const index = decoded.indexOf(':');
    const user = decoded.slice(0, index);
    const pass = decoded.slice(index + 1);
    if (user === ADMIN_USER && pass === ADMIN_PASSWORD) {
      return next();
    }
  }

  res.set('WWW-Authenticate', 'Basic realm="Administration TIBIANE SERVICE"');
  return res.status(401).send('Authentification requise.');
}

// --- API : enregistrement d'une préinscription ---------------------------

app.post('/api/preinscriptions', (req, res) => {
  const data = {
    nom: clean(req.body.nom),
    prenom: clean(req.body.prenom),
    date_naissance: clean(req.body.date_naissance),
    lieu_naissance: clean(req.body.lieu_naissance),
    niveau_etude: clean(req.body.niveau_etude),
    dernier_diplome: clean(req.body.dernier_diplome),
    formation: clean(req.body.formation),
    whatsapp: clean(req.body.whatsapp),
    email: clean(req.body.email),
    adresse: clean(req.body.adresse),
    message: clean(req.body.message),
    consentement: req.body.consentement ? 1 : 0,
  };

  // Validation des champs obligatoires.
  const errors = [];
  if (!data.nom) errors.push('Le nom est obligatoire.');
  if (!data.prenom) errors.push('Le prénom est obligatoire.');
  if (!isValidDate(data.date_naissance)) errors.push('La date de naissance est invalide.');
  if (!data.lieu_naissance) errors.push('Le lieu de naissance est obligatoire.');
  if (!data.formation) errors.push('La formation souhaitée est obligatoire.');
  if (!data.whatsapp) errors.push('Le numéro WhatsApp est obligatoire.');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("L'adresse email est invalide.");
  }
  if (!data.consentement) errors.push('Vous devez accepter le traitement de vos données (RGPD).');

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO preinscriptions
        (nom, prenom, date_naissance, lieu_naissance, niveau_etude,
         dernier_diplome, formation, whatsapp, email, adresse, message, consentement)
      VALUES
        (@nom, @prenom, @date_naissance, @lieu_naissance, @niveau_etude,
         @dernier_diplome, @formation, @whatsapp, @email, @adresse, @message, @consentement)
    `);
    const info = stmt.run(data);
    return res.status(201).json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error('Erreur enregistrement préinscription:', err);
    return res.status(500).json({ ok: false, errors: ["Une erreur interne s'est produite."] });
  }
});

// --- API : liste des préinscriptions (protégée) --------------------------

app.get('/api/preinscriptions', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM preinscriptions ORDER BY date_soumission DESC').all();
  res.json({ ok: true, count: rows.length, data: rows });
});

// --- API : export CSV (protégé) ------------------------------------------

app.get('/api/preinscriptions/export', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM preinscriptions ORDER BY date_soumission DESC').all();

  const headers = [
    'id', 'nom', 'prenom', 'date_naissance', 'lieu_naissance', 'niveau_etude',
    'dernier_diplome', 'formation', 'whatsapp', 'email', 'adresse', 'message',
    'consentement', 'date_soumission',
  ];

  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const lines = [headers.join(';')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(';'));
  }

  // BOM UTF-8 pour un affichage correct des accents dans Excel.
  const csv = '﻿' + lines.join('\r\n');
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="preinscriptions.csv"');
  res.send(csv);
});

// --- Vérification d'état (utilisée par l'hébergeur) ----------------------

app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

// --- Pages ---------------------------------------------------------------

// La page d'administration est protégée par mot de passe.
app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fichiers statiques (formulaire public, CSS, JS).
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Serveur TIBIANE SERVICE démarré sur http://localhost:${PORT}`);
  console.log(`Page d'administration : http://localhost:${PORT}/admin`);
});
