/**
 * doadores.js
 */
const DoadoresView = (function () {
  let cache = [];

  async function render(root) {
    cache = await Api.get('getDoadores');
    root.innerHTML = `
      <div class="page-header">
        <div>
          <p class="eyebrow">${cache.length} doador(es)</p>
          <h1>Doadores</h1>
          <p>Pessoas e famílias que contribuem regularmente ou pontualmente com alimentos.</p>
        </div>
        <button class="btn btn-primary" id="btnNovoDoador">+ Novo doador</button>
      </div>
      <div class="card">
        ${cache.length ? listHtml_() : UI.emptyState('Nenhum doador cadastrado ainda. Clique em "Novo doador" para começar.')}
      </div>
    `;
    root.querySelector('#btnNovoDoador').addEventListener('click', () => openForm_());
    root.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openForm_(findById_(btn.dataset.edit))));
    root.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => confirmDelete_(btn.dataset.del)));
  }

  function findById_(id) { return cache.find(d => d.ID === id); }

  function listHtml_() {
    return `<div class="table-wrap"><table><thead><tr>
      <th>Nome</th><th>WhatsApp</th><th>Endereço</th><th>Status</th><th></th>
    </tr></thead><tbody>
      ${cache.map(d => `<tr>
        <td>${UI.escapeHtml(d.Nome)}</td>
        <td>${UI.escapeHtml(d.Telefone)}</td>
        <td class="muted">${UI.escapeHtml(d.Endereco || '—')}</td>
        <td>${UI.badge(d.Status)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" data-edit="${d.ID}">Editar</button>
          <button class="btn btn-ghost btn-sm" data-del="${d.ID}">Excluir</button>
        </td>
      </tr>`).join('')}
    </tbody></table></div>`;
  }

  function openForm_(doador) {
    const isEdit = !!doador;
    UI.openModal(`
      <div class="modal-header"><h3>${isEdit ? 'Editar doador' : 'Novo doador'}</h3>
        <button class="modal-close" id="mClose">&times;</button></div>
      <form id="fDoador">
        <div class="field"><label>Nome completo *</label><input required name="Nome" value="${UI.escapeHtml(doador?.Nome)}"></div>
        <div class="field"><label>Telefone (WhatsApp) *</label><input required name="Telefone" placeholder="+55 73 99999-0000" value="${UI.escapeHtml(doador?.Telefone)}"></div>
        <div class="field"><label>Endereço</label><input name="Endereco" value="${UI.escapeHtml(doador?.Endereco)}"></div>
        <div class="field"><label>Observações</label><textarea name="Observacoes" rows="2">${UI.escapeHtml(doador?.Observacoes)}</textarea></div>
        ${isEdit ? `<div class="field"><label>Status</label>
          <select name="Status">
            <option ${doador.Status === 'Ativo' ? 'selected' : ''}>Ativo</option>
            <option ${doador.Status === 'Inativo' ? 'selected' : ''}>Inativo</option>
          </select></div>` : ''}
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
          <button type="button" class="btn btn-secondary" id="mCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar' : 'Cadastrar doador'}</button>
        </div>
      </form>
    `, (root) => {
      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      root.querySelector('#fDoador').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        try {
          if (isEdit) {
            payload.ID = doador.ID;
            await Api.post('updateDoador', payload);
            UI.toast('Doador atualizado.', 'success');
          } else {
            await Api.post('addDoador', payload);
            UI.toast('Doador cadastrado! Mensagem de boas-vindas enviada.', 'success');
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
    const d = findById_(id);
    UI.openModal(`
      <div class="modal-header"><h3>Excluir doador</h3><button class="modal-close" id="mClose">&times;</button></div>
      <p>Tem certeza que deseja excluir <strong>${UI.escapeHtml(d.Nome)}</strong>? Esta ação não pode ser desfeita.</p>
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
        <button class="btn btn-secondary" id="mCancel">Cancelar</button>
        <button class="btn btn-danger" id="mConfirm">Excluir</button>
      </div>
    `, (root) => {
      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      root.querySelector('#mConfirm').addEventListener('click', async () => {
        try {
          await Api.post('deleteDoador', { ID: id });
          UI.toast('Doador excluído.', 'success');
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
