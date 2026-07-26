'use strict';

let allRows = [];

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return esc(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
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
      <td>${esc(r.formation)}</td>
      <td>${esc(r.whatsapp)}</td>
      <td>${esc(r.email)}</td>
      <td class="wrap">${esc(r.adresse)}</td>
      <td class="wrap">${esc(r.message)}</td>
      <td>${formatDate(r.date_soumission)}</td>
    </tr>
  `).join('');
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (!q) return render(allRows);
  const filtered = allRows.filter((r) =>
    [r.nom, r.prenom, r.formation, r.whatsapp, r.email, r.lieu_naissance]
      .some((v) => (v || '').toLowerCase().includes(q))
  );
  render(filtered);
}

async function load() {
  try {
    const res = await fetch('/api/preinscriptions');
    if (!res.ok) throw new Error('Erreur de chargement');
    const json = await res.json();
    allRows = json.data || [];
    render(allRows);
  } catch (err) {
    document.getElementById('empty').textContent = 'Erreur lors du chargement des données.';
    document.getElementById('empty').hidden = false;
  }
}

document.getElementById('search').addEventListener('input', applyFilter);
load();
