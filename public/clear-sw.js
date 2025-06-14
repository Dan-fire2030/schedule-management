// Script to clear old service worker registrations
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
registration.unregister();
    }
// Clear all caches
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
return caches.delete(cacheName);
        })
      );
    }).then(function() {
window.location.reload();
    });
  });
}