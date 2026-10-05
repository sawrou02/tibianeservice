'use strict';

document.getElementById('year').textContent = new Date().getFullYear();

const authSec = document.getElementById('auth');
const dashSec = document.getElementById('dash');
const loading = document.getElementById('loading');
const authErr = document.getElementById('auth-error');

const STEPS = [
  { key: 'paye', label: 'Paiement de la 1ʳᵉ tranche' },
  { key: 'compte_ouvert', label: 'Ouverture du compte Campus France' },
  { key: 'lettre_motivation', label: 'Lettre de motivation' },
  { key: 'choix_formation', label: 'Choix des formations' },
  { key: 'dossier_valide', label: 'Dossier validé' },
  { key: 'deuxieme_tranche', label: 'Paiement de la 2ᵉ tranche' },
];

function showError(msg) {
  authErr.textContent = msg;
  authErr.hidden = false;
}

function formatRv(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderDash(d) {
  document.getElementById('d-hello').textContent = 'Bonjour ' + (d.prenom || '') + ' 👋';
  const parts = [];
  if (d.niveau_sollicite) parts.push('Niveau : ' + d.niveau_sollicite);
  if (d.formation) parts.push('Formation : ' + d.formation);
  document.getElementById('d-sub').textContent = parts.join('  •  ');

  const rv = document.getElementById('d-rv');
  if (d.rv_entretien) {
    rv.innerHTML = '📅 <strong>Votre entretien Campus France :</strong> ' + formatRv(d.rv_entretien);
    rv.hidden = false;
  } else {
    rv.hidden = true;
  }

  const done = STEPS.filter((s) => Number(d[s.key]) === 1).length;
  const pct = Math.round((done / STEPS.length) * 100);
  document.getElementById('d-pct').textContent = pct + ' %';
  document.getElementById('d-bar').style.width = pct + '%';

  document.getElementById('d-steps').innerHTML = STEPS.map((s) => {
    const ok = Number(d[s.key]) === 1;
    return `<li class="${ok ? 'done' : ''}">
      <span class="dot">${ok ? '✓' : ''}</span>
      <span class="lbl">${s.label}</span>
      <span class="state">${ok ? 'Fait' : 'En attente'}</span>
    </li>`;
  }).join('');

  authSec.hidden = true;
  loading.hidden = true;
  dashSec.hidden = false;
  loadMessages();
  startChatPolling();
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function chatTime(iso) {
  const d = new Date(String(iso || '').replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

let chatTimer = null;

async function loadMessages() {
  try {
    const res = await fetch('/api/client/messages');
    if (!res.ok) return;
    const json = await res.json();
    const box = document.getElementById('chat-box');
    const msgs = json.data || [];
    if (msgs.length === 0) {
      box.innerHTML = '<p class="chat-empty">Aucun message pour le moment. Écrivez-nous, nous vous répondrons ici.</p>';
      return;
    }
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    box.innerHTML = msgs.map((m) => {
      const who = m.expediteur === 'client' ? 'client' : 'agence';
      const label = who === 'client' ? 'Vous' : 'TIBIANE CONSULTING';
      return `<div class="bubble ${who}">${escapeHtml(m.corps)}<span class="meta">${label} · ${chatTime(m.date_envoi)}</span></div>`;
    }).join('');
    if (atBottom) box.scrollTop = box.scrollHeight;
  } catch (err) { /* ignore */ }
}

function startChatPolling() {
  if (chatTimer) clearInterval(chatTimer);
  chatTimer = setInterval(loadMessages, 15000);
}

const chatForm = document.getElementById('chat-form');
if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const corps = input.value.trim();
    if (!corps) return;
    input.value = '';
    try {
      const res = await fetch('/api/client/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ corps }),
      });
      if (res.ok) { await loadMessages(); const box = document.getElementById('chat-box'); box.scrollTop = box.scrollHeight; }
    } catch (err) { /* ignore */ }
  });
}

async function loadMe() {
  try {
    const res = await fetch('/api/client/me');
    if (res.ok) {
      const json = await res.json();
      renderDash(json.data);
      return;
    }
  } catch (err) { /* ignore */ }
  // non connecté
  loading.hidden = true;
  dashSec.hidden = true;
  authSec.hidden = false;
}

// Onglets
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
function switchTab(toRegister) {
  authErr.hidden = true;
  tabLogin.classList.toggle('active', !toRegister);
  tabRegister.classList.toggle('active', toRegister);
  loginForm.hidden = toRegister;
  registerForm.hidden = !toRegister;
}
tabLogin.addEventListener('click', () => switchTab(false));
tabRegister.addEventListener('click', () => switchTab(true));

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authErr.hidden = true;
  const btn = loginForm.querySelector('button');
  btn.disabled = true;
  try {
    const res = await fetch('/api/client/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: document.getElementById('l-wa').value, code: document.getElementById('l-code').value }),
    });
    const json = await res.json();
    if (res.ok && json.ok) { loadMe(); } else { showError((json.errors && json.errors[0]) || 'Connexion impossible.'); }
  } catch (err) { showError('Erreur de connexion. Réessayez.'); } finally { btn.disabled = false; }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authErr.hidden = true;
  const code = document.getElementById('r-code').value;
  const code2 = document.getElementById('r-code2').value;
  if (code !== code2) { showError('Les deux codes ne correspondent pas.'); return; }
  const btn = registerForm.querySelector('button');
  btn.disabled = true;
  try {
    const res = await fetch('/api/client/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: document.getElementById('r-wa').value, code }),
    });
    const json = await res.json();
    if (res.ok && json.ok) { loadMe(); } else { showError((json.errors && json.errors[0]) || 'Création impossible.'); }
  } catch (err) { showError('Erreur. Réessayez.'); } finally { btn.disabled = false; }
});

document.getElementById('logout').addEventListener('click', async () => {
  if (chatTimer) clearInterval(chatTimer);
  await fetch('/api/client/logout', { method: 'POST' });
  dashSec.hidden = true;
  authSec.hidden = false;
});

loadMe();
