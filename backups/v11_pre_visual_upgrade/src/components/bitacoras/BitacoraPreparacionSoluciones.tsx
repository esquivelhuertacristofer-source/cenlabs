"use client";

import React from 'react';
import { Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function BitacoraPreparacionSoluciones() {
  const { soluciones, bitacoraData, validarP5 } = useSimuladorStore();

  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Scale size={20} className="text-[#219EBC]" />
          <h4 className="text-sm font-black text-white uppercase tracking-tighter">Preparación de NaCl</h4>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              <span>Masa en Matraz</span>
              <span className="text-[#219EBC]">{soluciones.matraz.polvo} g</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${Math.min(100, (soluciones.matraz.polvo / soluciones.mRequerida) * 100)}%` }} className="h-full bg-[#219EBC]" />
            </div>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              <span>Volumen Agua</span>
              <span className="text-blue-400">{soluciones.matraz.agua} mL</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${Math.min(100, (soluciones.matraz.agua / soluciones.vTarget) * 100)}%` }} className="h-full bg-blue-400" />
            </div>
          </div>
          <div className="p-5 bg-[#219EBC]/5 rounded-3xl border border-[#219EBC]/20 text-center">
            <span className="text-[10px] font-black text-[#219EBC] uppercase tracking-widest block mb-1">Molaridad Actual</span>
            <span className="text-3xl font-black text-white font-mono tracking-tighter">
              {bitacoraData?.mActual?.toFixed(3) || '0.000'} <span className="text-xs text-slate-500">M</span>
            </span>
          </div>
          <button 
            onClick={() => validarP5()} 
            disabled={soluciones.status === 'success'} 
            className="w-full py-4 bg-white text-[#023047] rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Validar Concentración
          </button>
        </div>
      </div>
    </div>
  );
}
