'use strict';

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('preinscription-form');
const errorsBox = document.getElementById('form-errors');
const successBox = document.getElementById('success-message');
const submitBtn = form.querySelector('.btn-submit');

function showErrors(messages) {
  errorsBox.innerHTML =
    '<strong>Veuillez corriger les points suivants :</strong>' +
    '<ul>' + messages.map((m) => `<li>${m}</li>`).join('') + '</ul>';
  errorsBox.hidden = false;
  errorsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorsBox.hidden = true;

  const payload = {
    nom: form.nom.value,
    prenom: form.prenom.value,
    date_naissance: form.date_naissance.value,
    lieu_naissance: form.lieu_naissance.value,
    niveau_etude: form.niveau_etude.value,
    dernier_diplome: form.dernier_diplome.value,
    formation: form.formation.value,
    whatsapp: form.whatsapp.value,
    email: form.email.value,
    adresse: form.adresse.value,
    message: form.message.value,
    consentement: form.consentement.checked,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours…';

  try {
    const response = await fetch('/api/preinscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
  form.hidden = false;
  successBox.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
