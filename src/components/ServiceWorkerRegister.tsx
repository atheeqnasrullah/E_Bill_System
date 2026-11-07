'use client';

import { useEffect } from 'react';

/** Registers /sw.js in production so the app can be installed as a PWA. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* not critical */
      });
    }
  }, []);
  return null;
}
