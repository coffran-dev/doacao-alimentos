/**
 * service-worker.js
 * Estratégia: "app shell" (HTML/CSS/JS/ícones) fica em cache e carrega
 * instantaneamente, inclusive offline. As chamadas à API do Google Apps
 * Script sempre vão direto para a rede — dados de estoque/famílias/etc.
 * precisam estar sempre atualizados, então nunca são servidos do cache.
 *
 * IMPORTANTE: sempre que você alterar qualquer arquivo do frontend, troque
 * o número da versão abaixo (CACHE_VERSION) para forçar todo mundo a baixar
 * a versão nova — do contrário, o navegador pode continuar servindo os
 * arquivos antigos do cache por um bom tempo.
 */
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'acao-social-shell-' + CACHE_VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/api.js',
  './js/ui.js',
  './js/dashboard.js',
  './js/doadores.js',
  './js/compromissos.js',
  './js/estoque.js',
  './js/cestas.js',
  './js/familias.js',
  './js/entregas.js',
  './js/app.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Chamadas à API (Google Apps Script) — sempre direto para a rede.
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(
        JSON.stringify({ success: false, error: 'Sem conexão com a internet no momento.' }),
        { headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // Fontes do Google Fonts — cache-first, sem bloquear se não houver rede.
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return resp;
      }).catch(() => cached))
    );
    return;
  }

  // Arquivos do app shell (mesmo domínio) — cache-first, atualiza em segundo plano.
  if (event.request.method === 'GET' && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return resp;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
