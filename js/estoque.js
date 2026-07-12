/**
 * estoque.js
 */
const EstoqueView = (function () {
  let historico = [];
  let atual = [];
  let doadores = [];

  async function render(root) {
    [historico, atual, doadores] = await Promise.all([
      Api.get('getEstoqueHistorico'), Api.get('getEstoqueAtual'), Api.get('getDoadores')
    ]);
    root.innerHTML = `
      <div class="page-header">
        <div>
          <p class="eyebrow">Estoque</p>
          <h1>Controle de estoque</h1>
          <p>Registre entradas de alimentos a qualquer momento — não é preciso confirmar um compromisso, as entregas podem acontecer em datas diferentes.</p>
        </div>
        <button class="btn btn-primary" id="btnNovo">+ Registrar entrada</button>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="section-title"><h3>Estoque atual por produto</h3></div>
        ${atual.length ? `<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Quantidade</th></tr></thead><tbody>
          ${atual.map(a => `<tr><td>${UI.escapeHtml(a.produto)}</td><td class="num-cell">${a.quantidade}</td></tr>`).join('')}
        </tbody></table></div>` : UI.emptyState('Nenhum lançamento de estoque ainda.')}
      </div>

      <div class="card">
        <div class="section-title"><h3>Histórico de movimentações</h3></div>
        ${historico.length ? `<div class="table-wrap"><table><thead><tr>
          <th>Data</th><th>Produto</th><th>Qtd.</th><th>Tipo</th><th>Origem</th>
        </tr></thead><tbody>
          ${historico.slice(0, 200).map(h => `<tr>
            <td>${UI.formatDateBR(h.Data)}</td>
            <td>${UI.escapeHtml(h.Produto)}</td>
            <td class="num-cell" style="color:${Number(h.Quantidade) < 0 ? 'var(--brick)' : 'var(--leaf)'}">${h.Quantidade > 0 ? '+' : ''}${h.Quantidade} ${UI.escapeHtml(h.Unidade)}</td>
            <td>${h.Tipo}</td>
            <td class="muted">${UI.escapeHtml(h.Origem)}</td>
          </tr>`).join('')}
        </tbody></table></div>` : UI.emptyState('Nenhuma movimentação registrada ainda.')}
      </div>
    `;
    root.querySelector('#btnNovo').addEventListener('click', openForm_);
  }

  function openForm_() {
    UI.openModal(`
      <div class="modal-header"><h3>Registrar entrada de alimento</h3><button class="modal-close" id="mClose">&times;</button></div>
      <form id="fEstoque">
        <div class="field-row">
          <div class="field"><label>Produto *</label><input required name="Produto" placeholder="ex: Arroz"></div>
          <div class="field"><label>Quantidade *</label><input required type="number" step="0.01" min="0" name="Quantidade"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Unidade *</label>
            <select name="Unidade" required>${APP_CONFIG.unidadesPadrao.map(u => `<option>${u}</option>`).join('')}</select>
          </div>
          <div class="field"><label>Data</label><input type="date" name="Data" value="${new Date().toISOString().slice(0,10)}"></div>
        </div>
        <div class="field"><label>Origem *</label>
          <select name="Origem" id="selOrigem" required>
            <option value="Doador">Doador</option>
            <option value="Campanha">Campanha</option>
          </select>
        </div>
        <div class="field" id="fieldDoador">
          <label>Doador</label>
          <select name="ReferenciaID">
            <option value="">— Selecione —</option>
            ${doadores.map(d => `<option value="${d.ID}">${UI.escapeHtml(d.Nome)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Observação</label><input name="Observacao"></div>
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
          <button type="button" class="btn btn-secondary" id="mCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar</button>
        </div>
      </form>
    `, (root) => {
      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      root.querySelector('#selOrigem').addEventListener('change', (e) => {
        root.querySelector('#fieldDoador').style.display = e.target.value === 'Doador' ? '' : 'none';
      });
      root.querySelector('#fEstoque').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        try {
          await Api.post('addEstoqueEntrada', payload);
          UI.toast('Entrada registrada!', 'success');
          UI.closeModal();
          render(document.getElementById('viewRoot'));
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  return { render };
})();
