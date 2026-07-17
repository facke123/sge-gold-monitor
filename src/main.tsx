// Safeguard for environments where window.fetch is a read-only getter.
// Implementing both a getter and setter prevents TypeErrors if any library, extension, or environment code attempts to assign to it.
try {
  const targets: any[] = [];
  if (typeof window !== 'undefined') targets.push(window);
  if (typeof globalThis !== 'undefined') targets.push(globalThis);
  if (typeof self !== 'undefined') targets.push(self);

  const uniqueTargets = Array.from(new Set(targets));

  uniqueTargets.forEach((target) => {
    if (target && target.fetch) {
      let currentFetch = target.fetch;
      try {
        Object.defineProperty(target, 'fetch', {
          get() {
            return currentFetch;
          },
          set(val) {
            currentFetch = val;
          },
          configurable: true,
          enumerable: true,
        });
      } catch (e) {
        console.warn('Redefining fetch failed on target:', e);
      }
    }
  });

  if (typeof Window !== 'undefined' && Window.prototype) {
    try {
      const proto = Window.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'fetch');
      if (desc && desc.configurable) {
        let protoFetch = proto.fetch;
        Object.defineProperty(proto, 'fetch', {
          get() {
            return protoFetch;
          },
          set(val) {
            protoFetch = val;
          },
          configurable: true,
          enumerable: true,
        });
      }
    } catch (e) {
      // ignore prototype redefine errors
    }
  }
} catch (e) {
  console.warn('Fetch safeguard initialization error:', e);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

