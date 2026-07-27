'use strict';

// Configuration des pièces à fournir selon le niveau sollicité (Campus France).
// Source : Termes de Référence TIBIANE SERVICE / C.T.V.P.
// Ce fichier est la SEULE source de vérité : le serveur l'utilise pour valider
// et étiqueter les documents, et le formulaire le récupère via l'API
// /api/documents-requirements pour afficher les bons champs.

const NIVEAUX = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'];

// Contraintes de fichier.
const MAX_FILE_BYTES = 500 * 1024; // 500 Ko par défaut
const PHOTO_MAX_BYTES = 50 * 1024; // 50 Ko pour la photo d'identité
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const EXT_MIME = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

// La photo d'identité doit être au format PNG et ne pas dépasser 50 Ko.
const PHOTO = {
  label: "Une photo d'identité (format PNG, 50 Ko max)",
  required: true,
  formats: ['png'],
  maxBytes: PHOTO_MAX_BYTES,
};
const PIECE = { label: "Pièce d'identité ou récépissé de dépôt de la demande", required: true };
const BAC = { label: "Relevé de notes du BAC + attestation de réussite au BAC", required: true };

// Renvoie les types MIME autorisés pour une liste de formats (extensions).
function mimesForFormats(formats) {
  return (formats || ALLOWED_EXTENSIONS).map((f) => EXT_MIME[f]).filter(Boolean);
}

const DOCUMENTS_BY_LEVEL = {
  'Licence 1': [
    PHOTO,
    PIECE,
    { label: 'Bulletins de la classe de 2nde', required: true },
    { label: 'Bulletins de la classe de 1ère', required: true },
    { label: 'Bulletins de la classe de terminale (ou certificat de scolarité si terminale en cours)', required: true },
    { label: 'Relevé de notes du BAC + attestation de réussite au BAC (si Bac déjà obtenu)', required: false },
  ],
  'Licence 2': [
    PHOTO,
    PIECE,
    { label: 'Bulletins de la classe de 1ère', required: true },
    { label: 'Bulletins de la classe de terminale', required: true },
    BAC,
    { label: 'Bulletins de la licence 1 (ou certificat de scolarité si année en cours)', required: true },
  ],
  'Licence 3': [
    PHOTO,
    PIECE,
    { label: 'Bulletins de la classe de terminale', required: true },
    BAC,
    { label: 'Bulletins de la licence 1', required: true },
    { label: 'Bulletins de la licence 2 (ou certificat de scolarité si année en cours)', required: true },
  ],
  // NB : la lettre de motivation et le projet d'étude sont rédigés par le
  // cabinet TIBIANE SERVICE — ils ne sont donc PAS demandés au candidat.
  'Master 1': [
    PHOTO,
    PIECE,
    BAC,
    { label: 'Bulletins de la licence 1', required: true },
    { label: 'Bulletins de la licence 2', required: true },
    { label: 'Bulletins et attestation de réussite de la licence 3 (ou certificat de scolarité si année en cours)', required: true },
  ],
  'Master 2': [
    PHOTO,
    PIECE,
    BAC,
    { label: 'Bulletins de la licence 1', required: true },
    { label: 'Bulletins de la licence 2', required: true },
    { label: 'Bulletins et attestation de réussite de la licence 3', required: true },
    { label: 'Bulletins de la dernière année validée (si différente du Master 1)', required: false },
  ],
};

// Message d'information affiché pour certains niveaux.
// Pour le L1, un candidat encore en terminale n'a pas encore le BAC : il dépose
// son certificat de scolarité et complète son dossier après l'obtention du BAC.
const NOTES_BY_LEVEL = {
  'Licence 1':
    "Vous êtes en classe de terminale (BAC en cours) ? Déposez votre certificat de scolarité " +
    "à la place des bulletins de terminale. Vous compléterez votre dossier avec le relevé de " +
    "notes et l'attestation de réussite du BAC dès son obtention.",
};

// Nombre de champs « document supplémentaire (facultatif) » proposés au candidat.
const OPTIONAL_EXTRA = 3;

module.exports = {
  NIVEAUX,
  DOCUMENTS_BY_LEVEL,
  NOTES_BY_LEVEL,
  OPTIONAL_EXTRA,
  MAX_FILE_BYTES,
  PHOTO_MAX_BYTES,
  ALLOWED_MIME,
  ALLOWED_EXTENSIONS,
  EXT_MIME,
  mimesForFormats,
};
