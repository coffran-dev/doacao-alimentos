/**
 * dashboard.js
 */
const DashboardView = (function () {
  async function render(root) {
    const data = await Api.get('getDashboard');

    const cestaPrincipal = data.cestaPrincipal;
    const percentParaMais1 = cestaPrincipal && cestaPrincipal.detalheItens.length
      ? mediaProgressoProximaCesta_(cestaPrincipal)
      : 0;

    root.innerHTML = `
      <div class="page-header">
        <div>
          <p class="eyebrow">Visão geral</p>
          <h1>Bom trabalho hoje 🌾</h1>
          <p>Acompanhe doações, estoque e o principal indicador: quantas cestas prontas a igreja tem agora.</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="basket-hero">
          ${UI.basketGaugeSvg(percentParaMais1, data.cestasCompletasDisponiveis)}
          <div class="basket-hero-text">
            <h2>${cestaPrincipal ? UI.escapeHtml(cestaPrincipal.nome) : 'Nenhum modelo de cesta cadastrado'}</h2>
            <p>${cestaPrincipal
              ? `Com o estoque atual dá para montar <strong>${data.cestasCompletasDisponiveis}</strong> cesta(s) completa(s) agora.`
              : 'Cadastre um modelo de cesta para começar a acompanhar este indicador.'}</p>
            ${cestaPrincipal && cestaPrincipal.itemLimitante
              ? `<span class="limitante-tag">⚠ Alimento limitante: ${UI.escapeHtml(cestaPrincipal.itemLimitante)}</span>`
              : ''}
          </div>
        </div>
      </div>

      <div class="grid grid-stats" style="margin-bottom:18px;">
        <div class="card stat-card accent-leaf">
          <span class="label">Doadores ativos</span>
          <span class="value">${data.totalDoadoresAtivos}</span>
        </div>
        <div class="card stat-card">
          <span class="label">Famílias cadastradas</span>
          <span class="value">${data.totalFamilias}</span>
        </div>
        <div class="card stat-card accent-wheat">
          <span class="label">Cestas completas</span>
          <span class="value">${data.cestasCompletasDisponiveis}</span>
        </div>
        <div class="card stat-card accent-brick">
          <span class="label">Itens em estoque baixo</span>
          <span class="value">${data.itensEstoqueBaixo.length}</span>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="section-title"><h3>Próximas doações previstas</h3></div>
          ${renderProximasDoacoes_(data.proximasDoacoes)}
        </div>
        <div class="card">
          <div class="section-title"><h3>Alimentos com estoque baixo</h3></div>
          ${renderEstoqueBaixo_(data.itensEstoqueBaixo)}
        </div>
      </div>

      <div class="card" style="margin-top:18px;">
        <div class="section-title"><h3>Arrecadação — últimos 6 meses</h3></div>
        ${renderMiniChart_(data.graficoArrecadacao)}
      </div>

      <div class="card" style="margin-top:18px;">
        <div class="section-title"><h3>Todos os modelos de cesta</h3></div>
        ${renderModelosResumo_(data.calculoCestas)}
      </div>
    `;
  }

  function mediaProgressoProximaCesta_(modelo) {
    if (!modelo.detalheItens.length) return 0;
    const progressos = modelo.detalheItens.map(function (item) {
      const necessarioParaMais1 = (modelo.cestasPossiveis + 1) * item.necessarioPorCesta;
      if (necessarioParaMais1 <= 0) return 1;
      return Math.min(1, item.disponivel / necessarioParaMais1);
    });
    return progressos.reduce((a, b) => a + b, 0) / progressos.length;
  }

  function renderProximasDoacoes_(lista) {
    if (!lista.length) return UI.emptyState('Nenhuma doação prevista para os próximos 14 dias.');
    return `<div class="table-wrap"><table><thead><tr>
      <th>Doador</th><th>Alimento</th><th>Quando</th>
    </tr></thead><tbody>
      ${lista.map(d => `<tr>
        <td>${UI.escapeHtml(d.doador)}</td>
        <td>${UI.escapeHtml(d.quantidade)} ${UI.escapeHtml(d.unidade)} de ${UI.escapeHtml(d.alimento)}</td>
        <td>${d.diasRestantes === 0 ? '<strong>Hoje</strong>' : d.diasRestantes + ' dia(s) · ' + UI.formatDateBR(d.proximaData)}</td>
      </tr>`).join('')}
    </tbody></table></div>`;
  }

  function renderEstoqueBaixo_(lista) {
    if (!lista.length) return UI.emptyState('Nenhum alimento crítico no momento. 🎉');
    return `<div class="table-wrap"><table><thead><tr>
      <th>Alimento</th><th>Disponível</th><th></th>
    </tr></thead><tbody>
      ${lista.map(i => `<tr>
        <td>${UI.escapeHtml(i.produto)}</td>
        <td class="num-cell">${i.disponivel} ${UI.escapeHtml(i.unidade)}</td>
        <td><span class="badge badge-low">baixo</span></td>
      </tr>`).join('')}
    </tbody></table></div>`;
  }

  function renderMiniChart_(dados) {
    if (!dados.length) return UI.emptyState('Sem dados de arrecadação ainda.');
    const max = Math.max(1, ...dados.map(d => d.total));
    return `<div class="mini-chart" style="margin-bottom:24px;">
      ${dados.map(d => `<div class="bar" style="height:${Math.max(4, (d.total / max) * 90)}px;" title="${d.total}">
        <span>${UI.escapeHtml(d.mes)}</span>
      </div>`).join('')}
    </div>`;
  }

  function renderModelosResumo_(modelos) {
    if (!modelos.length) return UI.emptyState('Nenhum modelo de cesta cadastrado ainda.');
    return `<div class="table-wrap"><table><thead><tr>
      <th>Modelo</th><th>Cestas possíveis</th><th>Item limitante</th><th>Falta para +1 cesta</th>
    </tr></thead><tbody>
      ${modelos.map(m => `<tr>
        <td>${UI.escapeHtml(m.nome)}</td>
        <td class="num-cell">${m.cestasPossiveis}</td>
        <td>${m.itemLimitante ? UI.escapeHtml(m.itemLimitante) : '—'}</td>
        <td>${m.itensFaltantesParaMais1.length
          ? m.itensFaltantesParaMais1.map(f => `${UI.escapeHtml(f.produto)} (${f.falta} ${UI.escapeHtml(f.unidade)})`).join(', ')
          : '<span class="muted">completo</span>'}</td>
      </tr>`).join('')}
    </tbody></table></div>`;
  }

  return { render };
})();
