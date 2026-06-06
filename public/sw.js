/**
 * Service worker do Procura-Vaga — PWA instalável + fallback offline do app shell.
 * Conservador de propósito: NÃO intercepta /api nem cacheia dados privados; só faz
 * network-first na navegação, usando "/" cacheada como tela offline.
 */
const CACHE = "procura-vaga-v1";
const SHELL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Só navegação GET: HTML sempre fresco (network-first); cache só como rede offline.
  if (request.method !== "GET" || request.mode !== "navigate") return;
  event.respondWith(
    fetch(request).catch(() => caches.match(SHELL).then((cached) => cached ?? Response.error())),
  );
});
