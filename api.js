/**
 * api.js
 * Camada única de comunicação com o backend (Google Apps Script Web App).
 * Usamos text/plain no POST para evitar preflight CORS (Apps Script não
 * responde bem a requisições OPTIONS).
 */
const Api = (function () {
  async function get(action, params) {
    const url = new URL(API_URL);
    url.searchParams.set('action', action);
    Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { method: 'GET' });
    return parse_(res);
  }

  async function post(action, payload) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload: payload || {} })
    });
    return parse_(res);
  }

  async function parse_(res) {
    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error('Resposta inválida do servidor. Verifique se a API_URL está correta.');
    }
    if (!json.success) throw new Error(json.error || 'Erro desconhecido.');
    return json.data;
  }

  return { get, post };
})();
