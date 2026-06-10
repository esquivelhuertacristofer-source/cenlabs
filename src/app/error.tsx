'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(145deg, #0a1226 0%, #06091c 60%, #0a0d1a 100%)' }}
    >
      {/* Glow radial de fondo */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(239,68,68,0.08) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-lg"
      >
        {/* Card principal */}
        <div
          className="rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
          style={{ background: 'linear-gradient(160deg, rgba(15,22,40,0.98) 0%, rgba(8,12,24,0.99) 100%)' }}
        >
          {/* Franja superior */}
          <div
            className="h-1 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.8), transparent)' }}
          />

          <div className="p-8">
            {/* Cabecera — badge de estado */}
            <div className="flex items-center gap-2 mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase tracking-[0.25em] text-red-400">
                <AlertTriangle size={9} />
                Error de Sistema
              </span>
              {error.digest && (
                <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-mono text-white/30">
                  #{error.digest.slice(0, 8)}
                </span>
              )}
            </div>

            {/* Dr. Quantum */}
            <div className="flex items-start gap-5 mb-6">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="shrink-0 w-16 h-16 rounded-2xl border-2 border-red-500/30 bg-red-500/10 flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(239,68,68,0.2)]"
              >
                🤖
              </motion.div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-400/70 mb-1">
                  Dr. Quantum — Diagnóstico
                </p>
                <p className="text-white font-bold text-base leading-snug mb-1">
                  Colisión cuántica inesperada
                </p>
                <p className="text-slate-400 text-[13px] leading-relaxed">
                  Uno de mis electrones se escapó del orbital.
                  No es un error tuyo — ocurrió algo inesperado en el servidor.
                  El sistema está listo para reintentar el experimento.
                </p>
              </div>
            </div>

            {/* Detalle técnico (solo en dev) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-red-500/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-red-400/50 mb-2">
                  Detalle técnico
                </p>
                <code className="text-[11px] text-red-300/70 font-mono leading-relaxed break-all">
                  {error.message}
                </code>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                <RefreshCw size={13} />
                Reintentar
              </motion.button>

              <Link href="/" className="flex-1">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white/60 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Home size={13} />
                  Inicio
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Franja inferior */}
          <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
              CEN Labs
            </span>
            <span className="text-[9px] text-white/20 font-mono">
              v{process.env.NEXT_PUBLIC_APP_VERSION ?? '5.2'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
