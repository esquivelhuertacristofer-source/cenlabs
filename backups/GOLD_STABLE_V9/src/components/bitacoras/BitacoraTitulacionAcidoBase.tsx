"use client";

import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function BitacoraTitulacionAcidoBase() {
  const { titulacion, validarP7 } = useSimuladorStore();

  const handleValidar = () => {
    const val = (document.getElementById('ans-ca') as HTMLInputElement)?.value;
    const ansVal = parseFloat(val);
    if (isNaN(ansVal)) return alert("Por favor ingresa un valor numérico.");
    
    if (!titulacion.purgada) return alert("¡Atención! No has purgado la bureta. El volumen leído no será exacto.");
    if (!titulacion.indicador) return alert("¡Atención! No has añadido el indicador (Fenolftaleína). No podrás ver el punto final.");
    
    const ok = validarP7(ansVal);
    if (!ok) alert("Concentración incorrecta. Verifica tus cálculos: Ma = (Mb * Vb) / Va");
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <FlaskConical size={20} className="text-pink-500" />
          <h4 className="text-sm font-black text-white uppercase tracking-tighter">Bitácora de Titulación</h4>
        </div>
        
        {/* DASHBOARD DE ESTADO P7 */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className={`p-3 rounded-2xl border ${titulacion.purgada ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-900 border-slate-800'} transition-all`}>
            <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Bureta</span>
            <span className={`text-[10px] font-black uppercase ${titulacion.purgada ? 'text-blue-400' : 'text-slate-600'}`}>
              {titulacion.purgada ? '✓ Purgada' : '⚠ Aire'}
            </span>
          </div>
          <div className={`p-3 rounded-2xl border ${titulacion.indicador ? 'bg-pink-500/10 border-pink-500/30' : 'bg-slate-900 border-slate-800'} transition-all`}>
            <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Indicador</span>
            <span className={`text-[10px] font-black uppercase ${titulacion.indicador ? 'text-pink-400' : 'text-slate-600'}`}>
              {titulacion.indicador ? '✓ Añadido' : '⚠ Falta'}
            </span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lectura Menisco Inicial (mL)</label>
            <input type="number" placeholder="0.00" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-[#219EBC]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Volumen NaOH Añadido (Vb)</label>
            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-lg font-black text-[#219EBC] font-mono flex items-center justify-between">
              <span>{titulacion.volumenBase.toFixed(2)}</span>
              <span className="text-[10px] text-slate-600">mL</span>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Molaridad del HCl (Ma)</label>
            <div className="relative">
              <input 
                id="ans-ca"
                type="number" step="0.001" placeholder="0.000" 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xl font-black text-white outline-none focus:border-pink-500 transition-all font-mono" 
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">M</div>
            </div>
          </div>
          <button 
            onClick={handleValidar}
            disabled={titulacion.status === 'success'}
            className="w-full py-4 bg-white text-[#023047] rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Validar Datos Analíticos
          </button>
        </div>
      </div>
    </div>
  );
}
