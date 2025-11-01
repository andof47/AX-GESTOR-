// A versão do cache foi atualizada para 'v2' para garantir que o service worker seja reinstalado com os novos arquivos.
const CACHE_NAME = 'axe-gestor-v2';

// Lista de arquivos e recursos essenciais para o aplicativo funcionar offline.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json', // Adicionado para cache
  '/app-icon.png',  // Adicionado novo ícone
  '/index.tsx',
  '/App.tsx',
  '/constants.ts',
  '/contexts.tsx',
  '/pontosData.ts',
  '/types.ts',
  // CDNs e recursos externos
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js',
  'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf-autotable.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-router-dom@^6.23.1',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/@google/genai@^0.14.0'
];

// Evento de 'install': É disparado quando o Service Worker é instalado pela primeira vez.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  // O Service Worker espera até que o cache seja completamente preenchido.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto. Adicionando arquivos essenciais.');
        // Adiciona todos os arquivos da lista 'urlsToCache' ao cache.
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Falha ao fazer cache dos arquivos na instalação.', error);
      })
  );
});

// Evento de 'fetch': É disparado toda vez que o aplicativo faz uma requisição de rede (ex: buscar um arquivo, uma imagem).
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta encontrar o recurso no cache primeiro.
    caches.match(event.request)
      .then(response => {
        // Se o recurso for encontrado no cache, retorna ele.
        if (response) {
          return response;
        }
        // Se não for encontrado no cache, faz a requisição à rede.
        return fetch(event.request);
      })
  );
});

// Evento de 'activate': É disparado quando um novo Service Worker é ativado.
// Útil para limpar caches antigos.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Se o nome do cache não estiver na lista de permissões, ele é excluído.
            console.log('Service Worker: Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});