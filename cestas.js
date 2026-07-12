/**
 * cestas.js
 */
const CestasView = (function () {
  let modelos = [];
  let calculo = [];
  let itemCounter = 0;

  async function render(root) {
    [modelos, calculo] = await Promise.all([Api.get('getModelosCesta'), Api.get('getCalculoCestas')]);
    const calculoPorId = Object.fromEntries(calculo.map(c => [c.modeloId, c]));

    root.innerHTML = `
      <div class="page-header">
        <div>
          <p class="eyebrow">${modelos.length} modelo(s)</p>
          <h1>Modelos de cesta</h1>
          <p>Defina a composição de cada tipo de cesta. O sistema calcula automaticamente quantas dá para montar agora.</p>
        </div>
        <button class="btn btn-primary" id="btnNovo">+ Novo modelo</button>
      </div>
      <div class="grid" style="grid-template-columns: 1fr 1fr;">
        ${modelos.length ? modelos.map(m => cardModelo_(m, calculoPorId[m.ID])).join('') : `<div class="card">${UI.emptyState('Nenhum modelo cadastrado ainda.')}</div>`}
      </div>
    `;
    root.querySelector('#btnNovo').addEventListener('click', () => openForm_());
    root.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openForm_(modelos.find(m => m.ID === btn.dataset.edit))));
    root.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => confirmDelete_(btn.dataset.del)));
  }

  function cardModelo_(modelo, calc) {
    return `<div class="card">
      <div class="section-title">
        <h3>${UI.escapeHtml(modelo.Nome)}</h3>
        <div><button class="btn btn-ghost btn-sm" data-edit="${modelo.ID}">Editar</button>
        <button class="btn btn-ghost btn-sm" data-del="${modelo.ID}">Excluir</button></div>
      </div>
      <p class="muted" style="margin-top:-6px;">Cestas possíveis agora: <strong style="color:var(--wheat-dark)">${calc ? calc.cestasPossiveis : 0}</strong></p>
      <div class="table-wrap"><table><thead><tr><th>Item</th><th>Qtd/cesta</th></tr></thead><tbody>
        ${modelo.Itens.map(i => `<tr><td>${UI.escapeHtml(i.produto)}</td><td class="num-cell">${i.quantidade} ${UI.escapeHtml(i.unidade)}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }

  function openForm_(modelo) {
    const isEdit = !!modelo;
    itemCounter = 0;
    const itensIniciais = modelo ? modelo.Itens : [{ produto: '', quantidade: '', unidade: 'kg' }];

    UI.openModal(`
      <div class="modal-header"><h3>${isEdit ? 'Editar modelo' : 'Novo modelo de cesta'}</h3>
        <button class="modal-close" id="mClose">&times;</button></div>
      <form id="fModelo">
        <div class="field"><label>Nome do modelo *</label><input required name="Nome" value="${UI.escapeHtml(modelo?.Nome)}"></div>
        <label style="font-size:.78rem; font-weight:600; color:var(--ink-soft);">Itens da cesta</label>
        <div id="itensContainer" style="margin-top:8px;"></div>
        <button type="button" class="btn btn-secondary btn-sm" id="btnAddItem" style="margin-top:4px;">+ Adicionar item</button>
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
          <button type="button" class="btn btn-secondary" id="mCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar' : 'Criar modelo'}</button>
        </div>
      </form>
    `, (root) => {
      const container = root.querySelector('#itensContainer');
      itensIniciais.forEach(item => container.appendChild(itemRow_(item)));

      root.querySelector('#btnAddItem').addEventListener('click', () => {
        container.appendChild(itemRow_({ produto: '', quantidade: '', unidade: 'kg' }));
      });

      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      root.querySelector('#fModelo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = root.querySelector('[name=Nome]').value;
        const itens = [...container.querySelectorAll('.item-row')].map(row => ({
          produto: row.querySelector('.item-produto').value.trim(),
          quantidade: Number(row.querySelector('.item-qtd').value),
          unidade: row.querySelector('.item-unidade').value
        })).filter(i => i.produto && i.quantidade > 0);

        if (!itens.length) { UI.toast('Adicione ao menos um item válido.', 'error'); return; }

        try {
          if (isEdit) {
            await Api.post('updateModeloCesta', { ID: modelo.ID, Nome: nome, Itens: itens });
            UI.toast('Modelo atualizado.', 'success');
          } else {
            await Api.post('addModeloCesta', { Nome: nome, Itens: itens });
            UI.toast('Modelo criado.', 'success');
          }
          UI.closeModal();
          render(document.getElementById('viewRoot'));
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  function itemRow_(item) {
    const id = 'item_' + (itemCounter++);
    const wrap = document.createElement('div');
    wrap.className = 'item-row';
    wrap.id = id;
    wrap.innerHTML = `
      <input class="item-produto" placeholder="Produto" value="${UI.escapeHtml(item.produto)}">
      <input class="item-qtd" type="number" step="0.01" min="0" placeholder="Qtd" value="${item.quantidade}">
      <select class="item-unidade">${APP_CONFIG.unidadesPadrao.map(u => `<option ${item.unidade === u ? 'selected' : ''}>${u}</option>`).join('')}</select>
      <button type="button" class="btn btn-ghost btn-sm" aria-label="Remover item">✕</button>
    `;
    wrap.querySelector('button').addEventListener('click', () => wrap.remove());
    return wrap;
  }

  function confirmDelete_(id) {
    const m = modelos.find(x => x.ID === id);
    UI.openModal(`
      <div class="modal-header"><h3>Excluir modelo</h3><button class="modal-close" id="mClose">&times;</button></div>
      <p>Excluir o modelo <strong>${UI.escapeHtml(m.Nome)}</strong>? Entregas já registradas não são afetadas.</p>
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:18px;">
        <button class="btn btn-secondary" id="mCancel">Cancelar</button>
        <button class="btn btn-danger" id="mConfirm">Excluir</button>
      </div>
    `, (root) => {
      root.querySelector('#mClose').addEventListener('click', UI.closeModal);
      root.querySelector('#mCancel').addEventListener('click', UI.closeModal);
      root.querySelector('#mConfirm').addEventListener('click', async () => {
        try {
          await Api.post('deleteModeloCesta', { ID: id });
          UI.toast('Modelo excluído.', 'success');
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
