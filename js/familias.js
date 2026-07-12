/**
 * familias.js
 */
const FamiliasView = (function () {
  let cache = [];

  async function render(root) {
    cache = await Api.get('getFamilias');
    root.innerHTML = `
      <div class="page-header">
        <div>
          <p class="eyebrow">${cache.length} família(s)</p>
          <h1>Famílias atendidas</h1>
          <p>Cadastro das famílias acompanhadas pela ação social.</p>
        </div>
        <button class="btn btn-primary" id="btnNovo">+ Nova família</button>
      </div>
      <div class="card">
        ${cache.length ? listHtml_() : UI.emptyState('Nenhuma família cadastrada ainda.')}
      </div>
    `;
    root.querySelector('#btnNovo').addEventListener('click', () => openForm_());
    root.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openForm_(findById_(btn.dataset.edit))));
    root.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => confirmDelete_(btn.dataset.del)));
  }

  function findById_(id) { return cache.find(f => f.ID === id); }

  function listHtml_() {
    return `<div class="table-wrap"><table><thead><tr>
      <th>Família</th><th>Responsável</th><th>Telefone</th><th>Moradores</th><th>Status</th><th></th>
    </tr></thead><tbody>
      ${cache.map(f => `<tr>
        <td>${UI.escapeHtml(f.Nome)}</td>
        <td>${UI.escapeHtml(f.Responsavel)}</td>
        <td>${UI.escapeHtml(f.Telefone || '—')}</td>
        <td class="num-cell">${f.NumMoradores || '—'}</td>
        <td>${UI.badge(f.Status)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" data-edit="${f.ID}">Editar</button>
          <button class="btn btn-ghost btn-sm" data-del="${f.ID}">Excluir</button>
        </td>
      </tr>`).join('')}
    </tbody></table></div>`;
  }

  function openForm_(familia) {
    const isEdit = !!familia;
    UI.openModal(`
      <div class="modal-header"><h3>${isEdit ? 'Editar família' : 'Nova família'}</h3>
        <button class="modal-close" id="mClose">&times;</button></div>
      <form id="fFamilia">
        <div class="field"><label>Nome da família *</label><input required name="Nome" value="${UI.escapeHtml(familia?.Nome)}"></div>
        <div class="field-row">
          <div class="field"><label>Responsável *</label><input required name="Responsavel" value="${UI.escapeHtml(familia?.Responsavel)}"></div>
          <div class="field"><label>Telefone</label><input name="Telefone" value="${UI.escapeHtml(familia?.Telefone)}"></div>
        </div>
        <div class="field"><label>Endereço</label><input name="Endereco" value="${UI.escapeHtml(familia?.Endereco)}"></div>
        <div class="field"><label>Número de moradores</label><input type="number" min="1" name="NumMoradores" value="${familia?.NumMoradores ?? ''}"></div>
        <div class="field"><label>Observações</label><textarea name="Observacoes" rows="2">${UI.escapeHtml(familia?.Observacoes)}</textarea></div>
        ${isEdit ? `<div class="field"><label>Status</label>
          <select name="Status">
            <option ${familia.Status === 'Ativa' ? 'selected' : ''}>Ativa</option>
            <option ${familia.Status === 'Inativa' ? 'selected' : ''}>Inativa</option>
          </select></div>` : ''}
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
          <button type="button" class="btn btn-secondary" id="mCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar' : 'Cadastrar família'}</button>
        </div>
      </form>
    `, (root) => {
      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      root.querySelector('#fFamilia').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        try {
          if (isEdit) {
            payload.ID = familia.ID;
            await Api.post('updateFamilia', payload);
            UI.toast('Família atualizada.', 'success');
          } else {
            await Api.post('addFamilia', payload);
            UI.toast('Família cadastrada.', 'success');
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
    const f = findById_(id);
    UI.openModal(`
      <div class="modal-header"><h3>Excluir família</h3><button class="modal-close" id="mClose">&times;</button></div>
      <p>Excluir o cadastro da família <strong>${UI.escapeHtml(f.Nome)}</strong>?</p>
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
        <button class="btn btn-secondary" id="mCancel">Cancelar</button>
        <button class="btn btn-danger" id="mConfirm">Excluir</button>
      </div>
    `, (root) => {
      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      root.querySelector('#mConfirm').addEventListener('click', async () => {
        try {
          await Api.post('deleteFamilia', { ID: id });
          UI.toast('Família excluída.', 'success');
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
