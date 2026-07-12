/**
 * ui.js — helpers de interface compartilhados entre as telas.
 */
const UI = (function () {
  function toast(message, type) {
    const stack = document.getElementById('toastStack');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDateBR(isoDate) {
    if (!isoDate) return '—';
    const s = String(isoDate).slice(0, 10);
    const parts = s.split('-');
    if (parts.length !== 3) return s;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function badge(status) {
    const map = {
      'Ativo': 'badge-ativo', 'Ativa': 'badge-ativo',
      'Pausado': 'badge-pausado',
      'Encerrado': 'badge-encerrado', 'Inativa': 'badge-inativa'
    };
    const cls = map[status] || 'badge-encerrado';
    return `<span class="badge ${cls}">${escapeHtml(status || '—')}</span>`;
  }

  function openModal(innerHtml, onMount) {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal-backdrop" id="modalBackdrop"><div class="modal">${innerHtml}</div></div>`;
    const backdrop = document.getElementById('modalBackdrop');
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', escListener_);
    if (onMount) onMount(root);
  }

  function escListener_(e) {
    if (e.key === 'Escape') closeModal();
  }

  function closeModal() {
    document.getElementById('modalRoot').innerHTML = '';
    document.removeEventListener('keydown', escListener_);
  }

  function loading(container) {
    container.innerHTML = '<div class="loading">Carregando…</div>';
  }

  function emptyState(text) {
    return `<div class="list-empty">${escapeHtml(text)}</div>`;
  }

  // SVG "cesta" que se enche proporcionalmente a um percentual (0–1),
  // elemento de assinatura visual do dashboard.
  function basketGaugeSvg(percent, count) {
    const p = Math.max(0, Math.min(1, percent));
    const fillY = 30 + (1 - p) * 3; // topo do "grão" dentro da cesta (viewBox 0-40)
    const clipHeight = Math.max(0, 33 - fillY + 3);
    return `
    <div class="basket-gauge">
      <svg viewBox="0 0 40 40">
        <defs>
          <clipPath id="basketClip">
            <path d="M8 17 L20 8 L32 17 L29 33 L11 33 Z" />
          </clipPath>
        </defs>
        <path d="M8 17 L20 8 L32 17 L29 33 L11 33 Z" fill="#EAE1CA" stroke="#DCD0AE" stroke-width="1"/>
        <g clip-path="url(#basketClip)">
          <rect x="6" y="${8 + (1 - p) * 25}" width="28" height="30" fill="#C98D2E" class="basket-fill-clip"/>
        </g>
        <path d="M8 17 L20 8 L32 17 L29 33 L11 33 Z" fill="none" stroke="#26301F" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M8 17 H32" stroke="#26301F" stroke-width="1.6"/>
        <path d="M13 17 L14 33 M20 17 L20 33 M27 17 L26 33" stroke="#FFFDF6" stroke-width="1" opacity=".5"/>
      </svg>
      <div class="count"><span class="num">${count}</span><span class="lbl">cestas prontas</span></div>
    </div>`;
  }

  return { toast, escapeHtml, formatDateBR, badge, openModal, closeModal, loading, emptyState, basketGaugeSvg };
})();
