// Consultrasporto — common utilities shared across all app pages

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    'valido': '<span class="badge badge-success">Valido</span>',
    'in-scadenza': '<span class="badge badge-warning">In scadenza</span>',
    'scaduto': '<span class="badge badge-danger">Scaduto</span>',
  };
  return map[status] || '';
}

function tipoBadge(tipo) {
  if (tipo === 'corso') return '<span class="badge badge-info">Corso</span>';
  return '<span class="badge badge-purple">Visita</span>';
}

function giudizioBadge(giudizio) {
  if (!giudizio) return '—';
  if (giudizio === 'Idoneo') return '<span class="badge badge-success">Idoneo</span>';
  if (giudizio.includes('prescrizioni')) return '<span class="badge badge-warning">Con prescrizioni</span>';
  if (giudizio.includes('limitazioni')) return '<span class="badge badge-warning">Con limitazioni</span>';
  if (giudizio.includes('Non idoneo')) return '<span class="badge badge-danger">' + giudizio + '</span>';
  return '<span class="badge badge-secondary">' + giudizio + '</span>';
}

function daysLabel(days) {
  if (days < 0) return `Scaduto ${Math.abs(days)} gg fa`;
  if (days === 0) return 'Scade oggi';
  return `Scade in ${days} gg`;
}

// ─── Modal management ─────────────────────────────────────────────────────────

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal.active').forEach(m => {
    m.classList.remove('active');
    document.body.style.overflow = '';
  });
}

// Close modal clicking outside
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) closeAllModals();
});

// ─── Toast notifications ──────────────────────────────────────────────────────

let toastTimeout;
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ─── Sidebar navigation ───────────────────────────────────────────────────────

function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Mark active nav link
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === current) link.classList.add('active');
  });
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function confirmDelete(message) {
  return window.confirm(message || 'Confermi l\'eliminazione?');
}

// ─── Table search / filter ────────────────────────────────────────────────────

function filterTable(tableId, query) {
  const q = query.toLowerCase();
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ─── Populate <select> with lavoratori ───────────────────────────────────────

function populateLavoratoriSelect(selectId, selectedId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const lavoratori = DB.getLavoratori().filter(l => l.attivo);
  sel.innerHTML = '<option value="">— Seleziona lavoratore —</option>' +
    lavoratori.map(l => `<option value="${l.id}" ${l.id === selectedId ? 'selected' : ''}>${l.cognome} ${l.nome} — ${l.mansione}</option>`).join('');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  initSidebar();
});
