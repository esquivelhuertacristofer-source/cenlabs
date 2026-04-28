"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Activity, ShieldCheck } from 'lucide-react';

export default function BitacoraColisiones1D() {
  const { bitacoraData } = useSimuladorStore();
  const validacionFinal = bitacoraData.fisica5;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ESTADO DEL PROTOCOLO */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Acelerador Magnético</h3>
        
        {validacionFinal ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-4 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-xl">
                   <ShieldCheck size={20} className="text-emerald-600" />
                </div>
                <span className="text-sm font-black text-emerald-800 uppercase">Conservación Confirmada</span>
             </div>
             <p className="text-xs font-bold text-emerald-700 leading-relaxed">
               {validacionFinal}
             </p>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 text-center">
             <Activity size={32} className="text-slate-300 mx-auto mb-2 animate-pulse" />
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Esperando telemetría de impacto...</p>
             <p className="text-[10px] text-slate-400">Complete las 4 fases del acelerador lineal para emitir el certificado de conservación de momento.</p>
          </div>
        )}
      </div>

    </div>
  );
}
