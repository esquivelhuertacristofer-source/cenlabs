"use client";

import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Aviso pequeño (no modal) que aparece cuando el panel detecta el reto cumplido.
 * No navega ni abre modales propios: invita a pasar por el flujo oficial de
 * validación (`onValidate` → validarLab → quiz → registro del intento).
 */
export default function AvisoReto({ visible, texto, onValidate, className = '' }: {
  visible: boolean; texto: string; onValidate?: () => void; className?: string;
}) {
  if (!visible) return null;
  return (
    <div role="status" className={`pointer-events-auto bg-emerald-600/95 backdrop-blur-md border border-emerald-300/40 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 ${className}`}>
      <ShieldCheck size={20} className="shrink-0" />
      <span className="text-[11px] font-bold leading-snug max-w-xs">{texto}</span>
      {onValidate && (
        <button onClick={onValidate} className="shrink-0 px-4 py-2 rounded-xl bg-white text-emerald-700 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 active:scale-95 transition-all">
          Validar práctica
        </button>
      )}
    </div>
  );
}
