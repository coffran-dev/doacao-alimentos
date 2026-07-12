/**
 * compromissos.js
 */
const CompromissosView = (function () {
  let cache = [];
  let doadores = [];

  async function render(root) {
    [cache, doadores] = await Promise.all([Api.get('getCompromissos'), Api.get('getDoadores')]);
    root.innerHTML = `
      <div class="page-header">
        <div>
          <p class="eyebrow">${cache.length} compromisso(s)</p>
          <h1>Compromissos de doação</h1>
          <p>Doações recorrentes assumidas pelos doadores, com lembretes automáticos por WhatsApp.</p>
        </div>
        <button class="btn btn-primary" id="btnNovo" ${doadores.length ? '' : 'disabled'}>+ Novo compromisso</button>
      </div>
      <div class="card">
        ${cache.length ? listHtml_() : UI.emptyState(doadores.length ? 'Nenhum compromisso cadastrado ainda.' : 'Cadastre um doador antes de criar um compromisso.')}
      </div>
    `;
    root.querySelector('#btnNovo')?.addEventListener('click', () => openForm_());
    root.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openForm_(findById_(btn.dataset.edit))));
    root.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => confirmDelete_(btn.dataset.del)));
  }

  function findById_(id) { return cache.find(c => c.ID === id); }

  function listHtml_() {
    return `<div class="table-wrap"><table><thead><tr>
      <th>Doador</th><th>Alimento</th><th>Frequência</th><th>Próxima entrega</th><th>Status</th><th></th>
    </tr></thead><tbody>
      ${cache.map(c => `<tr>
        <td>${UI.escapeHtml(c.DoadorNome)}</td>
        <td>${UI.escapeHtml(c.Quantidade)} ${UI.escapeHtml(c.Unidade)} de ${UI.escapeHtml(c.Alimento)}</td>
        <td>${UI.escapeHtml(c.Frequencia)}</td>
        <td>${UI.formatDateBR(c.ProximaData)}</td>
        <td>${UI.badge(c.Status)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" data-edit="${c.ID}">Editar</button>
          <button class="btn btn-ghost btn-sm" data-del="${c.ID}">Excluir</button>
        </td>
      </tr>`).join('')}
    </tbody></table></div>`;
  }

  function openForm_(compromisso) {
    const isEdit = !!compromisso;
    const unidades = APP_CONFIG.unidadesPadrao;
    const freqs = APP_CONFIG.frequencias;
    UI.openModal(`
      <div class="modal-header"><h3>${isEdit ? 'Editar compromisso' : 'Novo compromisso'}</h3>
        <button class="modal-close" id="mClose">&times;</button></div>
      <form id="fCompromisso">
        <div class="field"><label>Doador *</label>
          <select name="DoadorID" required ${isEdit ? 'disabled' : ''}>
            ${doadores.map(d => `<option value="${d.ID}" ${compromisso?.DoadorID === d.ID ? 'selected' : ''}>${UI.escapeHtml(d.Nome)}</option>`).join('')}
          </select>
        </div>
        <div class="field-row">
          <div class="field"><label>Alimento *</label><input required name="Alimento" value="${UI.escapeHtml(compromisso?.Alimento)}"></div>
          <div class="field"><label>Quantidade *</label><input required type="number" step="0.01" min="0" name="Quantidade" value="${compromisso?.Quantidade ?? ''}"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Unidade *</label>
            <select name="Unidade" required>${unidades.map(u => `<option ${compromisso?.Unidade === u ? 'selected' : ''}>${u}</option>`).join('')}</select>
          </div>
          <div class="field"><label>Frequência *</label>
            <select name="Frequencia" id="selFreq" required>${freqs.map(f => `<option ${compromisso?.Frequencia === f ? 'selected' : ''}>${f}</option>`).join('')}</select>
          </div>
        </div>
        <div class="field-row" id="rowPersonalizada" style="${compromisso?.Frequencia === 'Personalizada' ? '' : 'display:none;'}">
          <div class="field"><label>Intervalo (dias)</label><input type="number" min="1" name="IntervaloDias" value="${compromisso?.IntervaloDias ?? ''}"></div>
          <div class="field"><label>Dia da entrega (referência)</label><input name="DiaEntrega" placeholder="ex: sábado" value="${UI.escapeHtml(compromisso?.DiaEntrega)}"></div>
        </div>
        <div class="field-row" id="rowDiaEntrega" style="${compromisso?.Frequencia === 'Personalizada' ? 'display:none;' : ''}">
          <div class="field"><label>Dia da entrega</label><input name="DiaEntrega2" placeholder="ex: sábado" value="${UI.escapeHtml(compromisso?.DiaEntrega)}"></div>
          <div class="field"><label>Data de início *</label><input required type="date" name="DataInicio" ${isEdit ? 'disabled' : ''} value="${compromisso?.DataInicio ? compromisso.DataInicio.slice(0,10) : ''}"></div>
        </div>
        ${isEdit ? `
        <div class="field-row">
          <div class="field"><label>Status</label>
            <select name="Status">
              <option ${compromisso.Status === 'Ativo' ? 'selected' : ''}>Ativo</option>
              <option ${compromisso.Status === 'Pausado' ? 'selected' : ''}>Pausado</option>
              <option ${compromisso.Status === 'Encerrado' ? 'selected' : ''}>Encerrado</option>
            </select>
          </div>
          <div class="field"><label>Próxima data</label><input type="date" name="ProximaData" value="${compromisso.ProximaData ? compromisso.ProximaData.slice(0,10) : ''}"></div>
        </div>` : ''}
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
          <button type="button" class="btn btn-secondary" id="mCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar' : 'Criar compromisso'}</button>
        </div>
      </form>
    `, (root) => {
      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      const selFreq = root.querySelector('#selFreq');
      selFreq.addEventListener('change', () => {
        const isPersonalizada = selFreq.value === 'Personalizada';
        root.querySelector('#rowPersonalizada').style.display = isPersonalizada ? '' : 'none';
        root.querySelector('#rowDiaEntrega').style.display = isPersonalizada ? 'none' : '';
      });
      root.querySelector('#fCompromisso').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        payload.DiaEntrega = payload.DiaEntrega || payload.DiaEntrega2 || '';
        delete payload.DiaEntrega2;
        try {
          if (isEdit) {
            payload.ID = compromisso.ID;
            await Api.post('updateCompromisso', payload);
            UI.toast('Compromisso atualizado.', 'success');
          } else {
            await Api.post('addCompromisso', payload);
            UI.toast('Compromisso criado.', 'success');
          }
          UI.closeModal();
          render(document.getElementById('viewRoot'));
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  function confirmDelete_(id) {
    const c = findById_(id);
    UI.openModal(`
      <div class="modal-header"><h3>Excluir compromisso</h3><button class="modal-close" id="mClose">&times;</button></div>
      <p>Excluir o compromisso de <strong>${UI.escapeHtml(c.DoadorNome)}</strong> (${UI.escapeHtml(c.Alimento)})?</p>
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
        <button class="btn btn-secondary" id="mCancel">Cancelar</button>
        <button class="btn btn-danger" id="mConfirm">Excluir</button>
      </div>
    `, (root) => {
      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      root.querySelector('#mConfirm').addEventListener('click', async () => {
        try {
          await Api.post('deleteCompromisso', { ID: id });
          UI.toast('Compromisso excluído.', 'success');
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
