'use client';

/**
 * src/labs/_loader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Spinner de carga compartido para los `next/dynamic` de Piloto/Bitácora.
 * Cada `src/labs/<id>/components.ts` lo importa como `{ loading: Loader }`.
 * Es idéntico al que vivía inline en LabRegistry.tsx (UI transitoria de carga).
 */
export const Loader = () => (
  <div className="flex h-full w-full items-center justify-center bg-slate-50/50 animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#219EBC] border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando...</span>
    </div>
  </div>
);
