'use client';

const SERVICE_WORKER_PATH = '/sw.js';
const CACHE_PREFIX = 'erilog-';
const DEV_CLEANUP_KEY = 'erilog-dev-sw-cleaned';

function isErilogWorker(registration: ServiceWorkerRegistration): boolean {
  return [registration.active, registration.waiting, registration.installing]
    .filter((worker): worker is ServiceWorker => worker !== null)
    .some((worker) => {
      const scriptUrl = new URL(worker.scriptURL);
      return scriptUrl.origin === window.location.origin && scriptUrl.pathname === SERVICE_WORKER_PATH;
    });
}

async function removeDevelopmentWorker(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  const erilogRegistrations = registrations.filter(isErilogWorker);
  const controlledByErilog = navigator.serviceWorker.controller
    ? new URL(navigator.serviceWorker.controller.scriptURL).pathname === SERVICE_WORKER_PATH
    : false;

  await Promise.all(erilogRegistrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
        .map((cacheName) => caches.delete(cacheName)),
    );
  }

  // An unregistered worker can control the current tab until the next navigation.
  // Reload once so Next development requests immediately return to the network.
  if (controlledByErilog && sessionStorage.getItem(DEV_CLEANUP_KEY) !== 'true') {
    sessionStorage.setItem(DEV_CLEANUP_KEY, 'true');
    window.location.reload();
  }
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (process.env.NODE_ENV !== 'production') {
    void removeDevelopmentWorker();
    return;
  }

  const register = () => {
    navigator.serviceWorker.register(SERVICE_WORKER_PATH).catch((error: unknown) => {
      console.warn('Service worker registration failed:', error);
    });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
