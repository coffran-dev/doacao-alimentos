/**
 * app.js — inicialização e navegação entre telas.
 */
(function () {
  const VIEWS = {
    dashboard: { render: DashboardView.render, title: 'Dashboard' },
    doadores: { render: DoadoresView.render, title: 'Doadores' },
    compromissos: { render: CompromissosView.render, title: 'Compromissos' },
    estoque: { render: EstoqueView.render, title: 'Estoque' },
    cestas: { render: CestasView.render, title: 'Modelos de Cesta' },
    familias: { render: FamiliasView.render, title: 'Famílias' },
    entregas: { render: EntregasView.render, title: 'Entregas' }
  };

  function setActiveNav(viewName) {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    document.getElementById('mobileTitle').textContent = VIEWS[viewName].title;
  }

  async function navigate(viewName) {
    if (!VIEWS[viewName]) viewName = 'dashboard';
    setActiveNav(viewName);
    window.location.hash = viewName;
    const root = document.getElementById('viewRoot');
    UI.loading(root);
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
    try {
      await VIEWS[viewName].render(root);
    } catch (err) {
      root.innerHTML = `<div class="card"><strong>Não foi possível carregar esta tela.</strong>
        <p class="muted">${UI.escapeHtml(err.message)}</p>
        <p class="muted">Verifique se a <code>API_URL</code> em <code>js/config.js</code> aponta para a implantação do seu Apps Script.</p></div>`;
    }
  }

  document.getElementById('navList').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (btn) navigate(btn.dataset.view);
  });

  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
  });

  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  });

  window.addEventListener('hashchange', () => navigate(window.location.hash.slice(1)));

  navigate(window.location.hash.slice(1) || 'dashboard');
})();
