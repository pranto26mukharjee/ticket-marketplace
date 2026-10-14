// ন্যূনতম service worker (PWA ইনস্টলের জন্য দরকার)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});