// Este es un "Killer Service Worker"
// Su objetivo único es instalarse inmediatamente, borrar absolutamente todos los cachés antiguos de la PWA anterior, y desregistrarse para que la web cargue fresca cada vez y no ocurra jamás la pantalla en blanco.

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Obliga al SW a activarse de inmediato saltándose el estado de espera
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Borrar todos los cachés existentes de las versiones anteriores (como 'aviva-app-v1')
          console.log(`Borrando caché antiguo: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Tomar el control de todas las pestañas abiertas y desregistrar el Service Worker a sí mismo
      self.clients.claim();
      return self.registration.unregister();
    })
  );
});

// Interceptar fetch pero dejar pasar y forzar que siempre se vaya a internet
self.addEventListener('fetch', (e) => {
  // No hacemos absolutamente nada con el caché, pasamos directo al request HTTP normal.
});
