'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #0a1226 0%, #06091c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Outfit, system-ui, sans-serif',
          color: '#fff',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🤖</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Error Crítico del Sistema
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            Ocurrió un error fatal en la aplicación.
            {error.digest && (
              <span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                #{error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 16,
              color: '#fff',
              fontSize: 12,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Reiniciar Aplicación
          </button>
        </div>
      </body>
    </html>
  );
}
