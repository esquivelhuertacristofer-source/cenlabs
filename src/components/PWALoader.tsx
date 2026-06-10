'use client';

import { useEffect } from 'react';

export default function PWALoader() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.debug('CEN Labs PWA Registered:', registration.scope);
          })
          .catch((err) => {
            console.warn('CEN Labs PWA Registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
