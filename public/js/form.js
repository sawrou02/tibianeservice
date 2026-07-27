'use strict';

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('preinscription-form');
const errorsBox = document.getElementById('form-errors');
const successBox = document.getElementById('success-message');
const submitBtn = form.querySelector('.btn-submit');

const niveauSelect = document.getElementById('niveau_sollicite');
const docsFieldset = document.getElementById('documents-fieldset');
const docsContainer = document.getElementById('documents-container');

let requirements = null;
const DEFAULT_FORMATS = ['pdf', 'jpg', 'jpeg', 'png'];
const DEFAULT_MAX_BYTES = 500 * 1024;

function showErrors(messages) {
  errorsBox.innerHTML =
    '<strong>Veuillez corriger les points suivants :</strong>' +
    '<ul>' + messages.map((m) => `<li>${m}</li>`).join('') + '</ul>';
  errorsBox.hidden = false;
  errorsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function fileExt(name) {
  const m = /\.([^.]+)$/.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

// Vérifie un fichier choisi et met à jour l'affichage de la ligne.
function checkFile(input) {
  const item = input.closest('.doc-item');
  const status = item.querySelector('.doc-status');
  const file = input.files && input.files[0];

  const formats = (input.dataset.formats || DEFAULT_FORMATS.join(',')).split(',');
  const maxBytes = Number(input.dataset.maxbytes) || DEFAULT_MAX_BYTES;
  const maxKo = Math.round(maxBytes / 1024);

  item.classList.remove('filled', 'invalid');
  status.className = 'doc-status';
  status.textContent = '';

  if (!file) return;

  if (!formats.includes(fileExt(file.name))) {
    item.classList.add('invalid');
    status.classList.add('err');
    status.textContent = `Format non accepté (${formats.join(', ').toUpperCase()} uniquement).`;
    input.value = '';
    return;
  }
  if (file.size > maxBytes) {
    item.classList.add('invalid');
    status.classList.add('err');
    status.textContent = `Fichier trop lourd (${Math.round(file.size / 1024)} Ko). Maximum ${maxKo} Ko.`;
    input.value = '';
    return;
  }
  item.classList.add('filled');
  status.classList.add('ok');
  status.textContent = `✓ ${file.name} (${Math.round(file.size / 1024)} Ko)`;
}

function docItem(fieldName, doc) {
  const required = !!doc.required;
  const formats = doc.formats && doc.formats.length ? doc.formats : DEFAULT_FORMATS;
  const maxBytes = doc.maxBytes || DEFAULT_MAX_BYTES;
  const maxKo = Math.round(maxBytes / 1024);
  const accept = formats.map((f) => '.' + f).join(',');

  const wrap = document.createElement('div');
  wrap.className = 'doc-item';
  const reqTag = required
    ? '<span class="doc-req">Obligatoire</span>'
    : '<span class="doc-opt">Facultatif</span>';
  wrap.innerHTML = `
    <div class="doc-head">
      <span class="doc-label">${doc.label}</span>
      ${reqTag}
    </div>
    <input type="file" name="${fieldName}" accept="${accept}" data-formats="${formats.join(',')}" data-maxbytes="${maxBytes}"${required ? ' data-required="1"' : ''}>
    <span class="doc-hint">${formats.join(', ').toUpperCase()} • max ${maxKo} Ko</span>
    <span class="doc-status"></span>
  `;
  wrap.querySelector('input').addEventListener('change', (e) => checkFile(e.target));
  return wrap;
}

function renderDocuments(niveau) {
  docsContainer.innerHTML = '';
  const list = requirements && requirements.documentsByLevel[niveau];
  if (!list) {
    docsFieldset.hidden = true;
    return;
  }
  list.forEach((doc, i) => {
    docsContainer.appendChild(docItem(`doc_${i}`, doc));
  });

  const extra = (requirements && requirements.optionalExtra) || 0;
  if (extra > 0) {
    const title = document.createElement('div');
    title.className = 'docs-extra-title';
    title.textContent = 'Documents supplémentaires (facultatif)';
    docsContainer.appendChild(title);
    const hint = document.createElement('p');
    hint.className = 'docs-intro';
    hint.textContent = 'Ex : attestation de stage, certificat de travail, test d\'anglais, score IAE…';
    docsContainer.appendChild(hint);
    for (let i = 0; i < extra; i += 1) {
      docsContainer.appendChild(docItem(`extra_${i}`, { label: `Document supplémentaire ${i + 1}`, required: false }));
    }
  }
  docsFieldset.hidden = false;
}

// Chargement de la configuration des pièces à fournir.
fetch('/api/documents-requirements')
  .then((r) => r.json())
  .then((json) => {
    requirements = json;
    niveauSelect.innerHTML = '<option value="">— Sélectionnez —</option>' +
      json.niveaux.map((n) => `<option value="${n}">${n}</option>`).join('');
  })
  .catch(() => {
    niveauSelect.innerHTML = '<option value="">(indisponible, réessayez)</option>';
  });

niveauSelect.addEventListener('change', () => renderDocuments(niveauSelect.value));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorsBox.hidden = true;

  // Vérification des documents obligatoires côté client.
  const missing = [];
  docsContainer.querySelectorAll('input[type="file"][data-required="1"]').forEach((input) => {
    if (!input.files || input.files.length === 0) {
      const label = input.closest('.doc-item').querySelector('.doc-label').textContent;
      missing.push(`Le document « ${label} » est obligatoire.`);
    }
  });
  if (!niveauSelect.value) {
    missing.unshift('Veuillez choisir le niveau sollicité.');
  }
  if (missing.length > 0) {
    showErrors(missing);
    return;
  }

  const formData = new FormData(form);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours…';

  try {
    const response = await fetch('/api/preinscriptions', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();

    if (response.ok && result.ok) {
      form.hidden = true;
      successBox.hidden = false;
      successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      showErrors(result.errors || ["Une erreur s'est produite. Veuillez réessayer."]);
    }
  } catch (err) {
    showErrors(['Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.']);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Envoyer ma préinscription';
  }
});

document.getElementById('new-form').addEventListener('click', () => {
  form.reset();
  docsContainer.innerHTML = '';
  docsFieldset.hidden = true;
  form.hidden = false;
  successBox.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
