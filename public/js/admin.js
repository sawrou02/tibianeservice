'use strict';

let allRows = [];

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(String(iso).replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(iso) {
  const d = parseDate(iso);
  if (!d) return esc(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Lien WhatsApp cliquable (wa.me attend le numéro sans + ni espaces).
function whatsappLink(num) {
  const clean = String(num || '').replace(/[^\d]/g, '');
  if (!clean) return esc(num);
  return `<a class="whatsapp-link" href="https://wa.me/${clean}" target="_blank" rel="noopener">${esc(num)}</a>`;
}

function updateStats(rows) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(startToday.getTime() - 6 * 24 * 3600 * 1000);

  let today = 0;
  let week = 0;
  const formations = {};

  for (const r of rows) {
    const d = parseDate(r.date_soumission);
    if (d) {
      if (d >= startToday) today += 1;
      if (d >= startWeek) week += 1;
    }
    const f = (r.formation || '—').trim() || '—';
    formations[f] = (formations[f] || 0) + 1;
  }

  document.getElementById('stat-total').textContent = rows.length;
  document.getElementById('stat-today').textContent = today;
  document.getElementById('stat-week').textContent = week;

  const entries = Object.entries(formations).sort((a, b) => b[1] - a[1]);
  document.getElementById('stat-formations').textContent = entries.length;

  const panel = document.getElementById('by-formation-panel');
  const body = document.getElementById('by-formation');
  if (entries.length === 0) {
    panel.hidden = true;
  } else {
    panel.hidden = false;
    body.innerHTML = entries
      .map(([name, n]) => `<tr><td class="wrap">${esc(name)}</td><td>${n}</td></tr>`)
      .join('');
  }
}

function render(rows) {
  const tbody = document.getElementById('rows');
  const empty = document.getElementById('empty');
  document.getElementById('count').textContent = rows.length;

  if (rows.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${esc(r.id)}</td>
      <td>${esc(r.nom)}</td>
      <td>${esc(r.prenom)}</td>
      <td>${esc(r.date_naissance)}</td>
      <td>${esc(r.lieu_naissance)}</td>
      <td>${esc(r.niveau_etude)}</td>
      <td>${esc(r.dernier_diplome)}</td>
      <td class="wrap">${esc(r.formation)}</td>
      <td>${whatsappLink(r.whatsapp)}</td>
      <td>${esc(r.email)}</td>
      <td class="wrap">${esc(r.adresse)}</td>
      <td class="wrap">${esc(r.message)}</td>
      <td>${formatDate(r.date_soumission)}</td>
      <td><button type="button" class="del-btn" data-id="${esc(r.id)}">Supprimer</button></td>
    </tr>
  `).join('');
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const from = parseDate(document.getElementById('date-from').value);
  const toRaw = document.getElementById('date-to').value;
  const to = toRaw ? new Date(new Date(toRaw).getTime() + 24 * 3600 * 1000 - 1) : null;

  let filtered = allRows;

  if (from || to) {
    filtered = filtered.filter((r) => {
      const d = parseDate(r.date_soumission);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }

  if (q) {
    filtered = filtered.filter((r) =>
      [r.nom, r.prenom, r.formation, r.whatsapp, r.email, r.lieu_naissance]
        .some((v) => (v || '').toLowerCase().includes(q))
    );
  }

  render(filtered);
}

async function del(id) {
  if (!window.confirm('Supprimer définitivement cette préinscription ? Cette action est irréversible.')) {
    return;
  }
  try {
    const res = await fetch('/api/preinscriptions/' + encodeURIComponent(id), { method: 'DELETE' });
    if (!res.ok) throw new Error('Suppression impossible');
    allRows = allRows.filter((r) => String(r.id) !== String(id));
    updateStats(allRows);
    applyFilter();
  } catch (err) {
    window.alert('La suppression a échoué. Veuillez réessayer.');
  }
}

async function load() {
  try {
    const res = await fetch('/api/preinscriptions');
    if (!res.ok) throw new Error('Erreur de chargement');
    const json = await res.json();
    allRows = json.data || [];
    updateStats(allRows);
    applyFilter();
  } catch (err) {
    document.getElementById('empty').textContent = 'Erreur lors du chargement des données.';
    document.getElementById('empty').hidden = false;
  }
}

document.getElementById('search').addEventListener('input', applyFilter);
document.getElementById('date-from').addEventListener('change', applyFilter);
document.getElementById('date-to').addEventListener('change', applyFilter);
document.getElementById('reset-filters').addEventListener('click', () => {
  document.getElementById('search').value = '';
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value = '';
  applyFilter();
});
document.getElementById('rows').addEventListener('click', (e) => {
  const btn = e.target.closest('.del-btn');
  if (btn) del(btn.getAttribute('data-id'));
});

load();
