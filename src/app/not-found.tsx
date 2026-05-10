'use client';

import { motion } from 'framer-motion';
import { Home, Compass } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(145deg, #0a1226 0%, #06091c 60%, #0a0d1a 100%)' }}
    >
      {/* Glow radial de fondo */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.07) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-lg text-center"
      >
        {/* "404" grande con glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-2 select-none"
        >
          <span
            className="text-[10rem] font-black leading-none tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(139,92,246,0.6) 60%, rgba(99,102,241,0.2) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.4))',
            }}
          >
            404
          </span>
        </motion.div>

        {/* Card */}
        <div
          className="rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
          style={{ background: 'linear-gradient(160deg, rgba(15,22,40,0.98) 0%, rgba(8,12,24,0.99) 100%)' }}
        >
          {/* Franja superior */}
          <div
            className="h-1 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)' }}
          />

          <div className="p-8">
            {/* Badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[9px] font-black uppercase tracking-[0.25em] text-violet-400">
                <Compass size={9} />
                Ruta no encontrada
              </span>
            </div>

            {/* Dr. Quantum */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <motion.div
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                className="w-20 h-20 rounded-3xl border-2 border-violet-500/30 bg-violet-500/10 flex items-center justify-center text-4xl shadow-[0_0_32px_rgba(99,102,241,0.2)]"
              >
                🤖
              </motion.div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-400/70 mb-1">
                  Dr. Quantum — Navegación
                </p>
                <p className="text-white font-bold text-lg leading-snug mb-2">
                  Este laboratorio no existe (todavía)
                </p>
                <p className="text-slate-400 text-[13px] leading-relaxed max-w-sm mx-auto">
                  La URL que buscas no corresponde a ningún experimento registrado.
                  Es posible que se haya movido o que el enlace tenga un error tipográfico.
                </p>
              </div>
            </div>

            {/* Acción principal */}
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition-colors cursor-pointer"
              >
                <Home size={13} />
                Volver al inicio
              </motion.div>
            </Link>
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
