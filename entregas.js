/**
 * entregas.js
 */
const EntregasView = (function () {
  let entregas = [];
  let familias = [];
  let modelos = [];
  let calculo = [];

  async function render(root) {
    [entregas, familias, modelos, calculo] = await Promise.all([
      Api.get('getEntregas'), Api.get('getFamilias'), Api.get('getModelosCesta'), Api.get('getCalculoCestas')
    ]);
    root.innerHTML = `
      <div class="page-header">
        <div>
          <p class="eyebrow">${entregas.length} entrega(s) registrada(s)</p>
          <h1>Entrega de cestas</h1>
          <p>Ao confirmar, os itens do modelo escolhido são descontados automaticamente do estoque.</p>
        </div>
        <button class="btn btn-primary" id="btnNovo" ${familias.length && modelos.length ? '' : 'disabled'}>+ Registrar entrega</button>
      </div>
      <div class="card">
        ${entregas.length ? listHtml_() : UI.emptyState('Nenhuma entrega registrada ainda.')}
      </div>
    `;
    root.querySelector('#btnNovo')?.addEventListener('click', openForm_);
  }

  function listHtml_() {
    return `<div class="table-wrap"><table><thead><tr>
      <th>Data</th><th>Família</th><th>Modelo</th><th>Responsável</th>
    </tr></thead><tbody>
      ${entregas.map(e => `<tr>
        <td>${UI.formatDateBR(e.Data)}</td>
        <td>${UI.escapeHtml(e.FamiliaNome)}</td>
        <td>${UI.escapeHtml(e.ModeloNome)}</td>
        <td class="muted">${UI.escapeHtml(e.ResponsavelEntrega)}</td>
      </tr>`).join('')}
    </tbody></table></div>`;
  }

  function openForm_() {
    const calculoPorId = Object.fromEntries(calculo.map(c => [c.modeloId, c]));
    UI.openModal(`
      <div class="modal-header"><h3>Registrar entrega de cesta</h3><button class="modal-close" id="mClose">&times;</button></div>
      <form id="fEntrega">
        <div class="field"><label>Família *</label>
          <select name="FamiliaID" required>
            ${familias.map(f => `<option value="${f.ID}">${UI.escapeHtml(f.Nome)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Modelo de cesta *</label>
          <select name="ModeloID" id="selModelo" required>
            ${modelos.map(m => `<option value="${m.ID}">${UI.escapeHtml(m.Nome)} — ${calculoPorId[m.ID] ? calculoPorId[m.ID].cestasPossiveis : 0} disponível(is)</option>`).join('')}
          </select>
        </div>
        <div class="field-row">
          <div class="field"><label>Data</label><input type="date" name="Data" value="${new Date().toISOString().slice(0,10)}"></div>
          <div class="field"><label>Responsável pela entrega *</label><input required name="ResponsavelEntrega"></div>
        </div>
        <div class="field"><label>Observação</label><input name="Observacao"></div>
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
          <button type="button" class="btn btn-secondary" id="mCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Confirmar entrega</button>
        </div>
      </form>
    `, (root) => {
      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      root.querySelector('#fEntrega').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        try {
          await Api.post('registrarEntrega', payload);
          UI.toast('Entrega registrada e estoque atualizado!', 'success');
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
