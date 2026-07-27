'use strict';

const path = require('path');
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { client: db, init: initDb } = require('./db/database');
const docsConfig = require('./documents-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Réception des fichiers en mémoire (stockés ensuite dans la base de données).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: docsConfig.MAX_FILE_BYTES, files: 40 },
});

// Identifiants de la page d'administration (à personnaliser via variables d'environnement).
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tibiane2026';

// --- Notification email (facultatif) -------------------------------------
// Activée si SMTP_USER et SMTP_PASS sont définis (ex. Gmail + mot de passe
// d'application). Un email est envoyé à NOTIFY_EMAIL à chaque préinscription.
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || SMTP_USER;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

let mailer = null;
if (SMTP_USER && SMTP_PASS) {
  mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// Envoi non bloquant : une préinscription réussit même si l'email échoue.
function notifyNewPreinscription(data, nbDocuments) {
  if (!mailer || !NOTIFY_EMAIL) return;
  const lignes = [
    `Nom : ${data.nom}`,
    `Prénom : ${data.prenom}`,
    `Date de naissance : ${data.date_naissance}`,
    `Lieu de naissance : ${data.lieu_naissance}`,
    `N° pièce d'identité : ${data.piece_identite || '—'}`,
    `Niveau d'étude : ${data.niveau_etude || '—'}`,
    `Dernier diplôme : ${data.dernier_diplome || '—'}`,
    `École du BAC : ${data.ecole_bac || '—'}`,
    `Niveau sollicité : ${data.niveau_sollicite || '—'}`,
    `Formation souhaitée : ${data.formation}`,
    `WhatsApp : ${data.whatsapp}`,
    `Email : ${data.email || '—'}`,
    `Adresse : ${data.adresse || '—'}`,
    `Message : ${data.message || '—'}`,
    `Documents joints : ${nbDocuments}`,
  ];
  mailer
    .sendMail({
      from: `"TIBIANE SERVICE" <${SMTP_USER}>`,
      to: NOTIFY_EMAIL,
      replyTo: data.email || undefined,
      subject: `Nouvelle préinscription : ${data.prenom} ${data.nom} — ${data.niveau_sollicite || data.formation}`,
      text:
        'Une nouvelle préinscription vient d\'être enregistrée :\n\n' +
        lignes.join('\n') +
        '\n\nConsultez le dossier et les documents sur votre page /admin.',
    })
    .catch((err) => console.error('Échec de l\'envoi de la notification email:', err.message));
}

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

// --- API : pièces à fournir selon le niveau (public) ---------------------

app.get('/api/documents-requirements', (req, res) => {
  res.json({
    ok: true,
    niveaux: docsConfig.NIVEAUX,
    documentsByLevel: docsConfig.DOCUMENTS_BY_LEVEL,
    optionalExtra: docsConfig.OPTIONAL_EXTRA,
    maxFileBytes: docsConfig.MAX_FILE_BYTES,
    allowedExtensions: docsConfig.ALLOWED_EXTENSIONS,
  });
});

// --- API : enregistrement d'une préinscription (formulaire + documents) --

app.post('/api/preinscriptions', upload.any(), async (req, res) => {
  const data = {
    nom: clean(req.body.nom),
    prenom: clean(req.body.prenom),
    date_naissance: clean(req.body.date_naissance),
    lieu_naissance: clean(req.body.lieu_naissance),
    piece_identite: clean(req.body.piece_identite),
    niveau_etude: clean(req.body.niveau_etude),
    dernier_diplome: clean(req.body.dernier_diplome),
    ecole_bac: clean(req.body.ecole_bac),
    niveau_sollicite: clean(req.body.niveau_sollicite),
    formation: clean(req.body.formation),
    whatsapp: clean(req.body.whatsapp),
    email: clean(req.body.email),
    adresse: clean(req.body.adresse),
    message: clean(req.body.message),
    consentement: req.body.consentement ? 1 : 0,
  };

  const files = Array.isArray(req.files) ? req.files : [];
  const fileByField = {};
  for (const f of files) fileByField[f.fieldname] = f;

  // Validation des champs obligatoires.
  const errors = [];
  if (!data.nom) errors.push('Le nom est obligatoire.');
  if (!data.prenom) errors.push('Le prénom est obligatoire.');
  if (!isValidDate(data.date_naissance)) errors.push('La date de naissance est invalide.');
  if (!data.lieu_naissance) errors.push('Le lieu de naissance est obligatoire.');
  if (!data.piece_identite) errors.push("Le numéro de pièce d'identité est obligatoire.");
  if (!data.formation) errors.push('La formation souhaitée est obligatoire.');
  if (!data.niveau_sollicite || !docsConfig.NIVEAUX.includes(data.niveau_sollicite)) {
    errors.push('Le niveau sollicité est obligatoire (Licence 1/2/3, Master 1/2).');
  }
  if (!data.whatsapp) errors.push('Le numéro WhatsApp est obligatoire.');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("L'adresse email est invalide.");
  }
  if (!data.consentement) errors.push('Vous devez accepter le traitement de vos données (RGPD).');

  // Liste des documents attendus pour le niveau choisi.
  const expected = docsConfig.DOCUMENTS_BY_LEVEL[data.niveau_sollicite] || [];

  // Construction de la liste des documents à enregistrer (+ validations).
  const toStore = [];
  const validateFile = (f, libelle) => {
    if (!docsConfig.ALLOWED_MIME.includes(f.mimetype)) {
      errors.push(`Le document « ${libelle} » doit être au format PDF, JPG ou PNG.`);
      return false;
    }
    if (f.size > docsConfig.MAX_FILE_BYTES) {
      errors.push(`Le document « ${libelle} » dépasse 500 Ko.`);
      return false;
    }
    return true;
  };

  if (errors.length === 0 || data.niveau_sollicite) {
    expected.forEach((doc, i) => {
      const f = fileByField[`doc_${i}`];
      if (!f) {
        if (doc.required) errors.push(`Le document « ${doc.label} » est obligatoire.`);
        return;
      }
      if (validateFile(f, doc.label)) {
        toStore.push({ libelle: doc.label, file: f });
      }
    });
    // Documents supplémentaires facultatifs.
    for (let i = 0; i < docsConfig.OPTIONAL_EXTRA; i += 1) {
      const f = fileByField[`extra_${i}`];
      if (f && validateFile(f, 'Document supplémentaire')) {
        toStore.push({ libelle: 'Document supplémentaire', file: f });
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  try {
    const info = await db.execute({
      sql: `
        INSERT INTO preinscriptions
          (nom, prenom, date_naissance, lieu_naissance, piece_identite, niveau_etude,
           dernier_diplome, ecole_bac, niveau_sollicite, formation, whatsapp, email,
           adresse, message, consentement)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        data.nom, data.prenom, data.date_naissance, data.lieu_naissance,
        data.piece_identite, data.niveau_etude, data.dernier_diplome, data.ecole_bac,
        data.niveau_sollicite, data.formation, data.whatsapp, data.email,
        data.adresse, data.message, data.consentement,
      ],
    });
    const preinscriptionId = Number(info.lastInsertRowid);

    for (const item of toStore) {
      await db.execute({
        sql: `
          INSERT INTO documents
            (preinscription_id, libelle, nom_fichier, type_mime, taille, contenu)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          preinscriptionId,
          item.libelle,
          item.file.originalname || 'document',
          item.file.mimetype,
          item.file.size,
          new Uint8Array(item.file.buffer),
        ],
      });
    }

    notifyNewPreinscription(data, toStore.length);
    return res.status(201).json({ ok: true, id: preinscriptionId });
  } catch (err) {
    console.error('Erreur enregistrement préinscription:', err);
    return res.status(500).json({ ok: false, errors: ["Une erreur interne s'est produite."] });
  }
});

// --- API : liste des préinscriptions (protégée) --------------------------

app.get('/api/preinscriptions', requireAuth, async (req, res) => {
  const result = await db.execute(`
    SELECT p.*,
      (SELECT COUNT(*) FROM documents d WHERE d.preinscription_id = p.id) AS nb_documents
    FROM preinscriptions p
    ORDER BY p.date_soumission DESC
  `);
  const rows = result.rows;
  res.json({ ok: true, count: rows.length, data: rows });
});

// --- API : export CSV (protégé) ------------------------------------------

app.get('/api/preinscriptions/export', requireAuth, async (req, res) => {
  const result = await db.execute('SELECT * FROM preinscriptions ORDER BY date_soumission DESC');
  const rows = result.rows;

  const headers = [
    'id', 'nom', 'prenom', 'date_naissance', 'lieu_naissance', 'piece_identite',
    'niveau_etude', 'dernier_diplome', 'ecole_bac', 'niveau_sollicite', 'formation',
    'whatsapp', 'email', 'adresse', 'message', 'consentement', 'date_soumission',
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

// --- API : suppression d'une préinscription (protégée) -------------------

app.delete('/api/preinscriptions/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, errors: ['Identifiant invalide.'] });
  }
  try {
    await db.execute({ sql: 'DELETE FROM documents WHERE preinscription_id = ?', args: [id] });
    const result = await db.execute({
      sql: 'DELETE FROM preinscriptions WHERE id = ?',
      args: [id],
    });
    return res.json({ ok: true, deleted: result.rowsAffected });
  } catch (err) {
    console.error('Erreur suppression préinscription:', err);
    return res.status(500).json({ ok: false, errors: ["Une erreur interne s'est produite."] });
  }
});

// --- API : documents d'une préinscription (protégée) ---------------------

app.get('/api/preinscriptions/:id/documents', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, errors: ['Identifiant invalide.'] });
  }
  const result = await db.execute({
    sql: 'SELECT id, libelle, nom_fichier, type_mime, taille, date_ajout FROM documents WHERE preinscription_id = ? ORDER BY id',
    args: [id],
  });
  res.json({ ok: true, data: result.rows });
});

// Téléchargement / affichage d'un document (protégé).
app.get('/api/documents/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).send('Identifiant invalide.');
  }
  const result = await db.execute({
    sql: 'SELECT libelle, nom_fichier, type_mime, contenu FROM documents WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) {
    return res.status(404).send('Document introuvable.');
  }
  const row = result.rows[0];
  const buffer = Buffer.from(row.contenu);
  res.set('Content-Type', row.type_mime);
  res.set('Content-Disposition', `inline; filename="${encodeURIComponent(row.nom_fichier || 'document')}"`);
  return res.send(buffer);
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

// Gestion des erreurs d'envoi de fichiers (taille, nombre…).
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let msg = "Erreur lors de l'envoi des fichiers.";
    if (err.code === 'LIMIT_FILE_SIZE') {
      msg = 'Un document dépasse la taille maximale de 500 Ko. Réduisez-le puis réessayez.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      msg = 'Trop de fichiers envoyés en une seule fois.';
    }
    return res.status(400).json({ ok: false, errors: [msg] });
  }
  if (err) {
    console.error('Erreur serveur:', err);
    return res.status(500).json({ ok: false, errors: ["Une erreur interne s'est produite."] });
  }
  return next();
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur TIBIANE SERVICE démarré sur http://localhost:${PORT}`);
      console.log(`Page d'administration : http://localhost:${PORT}/admin`);
    });
  })
  .catch((err) => {
    console.error('Impossible d\'initialiser la base de données :', err);
    process.exit(1);
  });
