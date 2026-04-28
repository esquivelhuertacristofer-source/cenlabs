"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, ShieldCheck, Microscope, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraConstruccionAtomica() {
  const { particulas, setParticulas, validarEstructura, bitacoraData } = useSimuladorStore();
  
  // Defensive defaults
  const { protones = 0, neutrones = 0, electrones = 0, isStable = true } = particulas || {};
  const hallazgos = bitacoraData?.hallazgos || [];

  const masaAtomica = protones + neutrones;
  const cargaNeta = protones - electrones;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* MONITORES DE PARTÍCULAS */}
      <div className="grid grid-cols-1 gap-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Controles Subatómicos</h4>
        {/* Protones */}
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center font-black">Z</div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Protones</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setParticulas(protones - 1, neutrones, electrones)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all font-black">-</button>
            <span className="w-4 text-center font-black text-slate-800">{protones}</span>
            <button onClick={() => setParticulas(protones + 1, neutrones, electrones)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all font-black">+</button>
          </div>
        </div>

        {/* Neutrones */}
        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black">N</div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Neutrones</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setParticulas(protones, neutrones - 1, electrones)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all font-black">-</button>
            <span className="w-4 text-center font-black text-slate-800">{neutrones}</span>
            <button onClick={() => setParticulas(protones, neutrones + 1, electrones)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all font-black">+</button>
          </div>
        </div>

        {/* Electrones */}
        <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-white flex items-center justify-center font-black">e-</div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Electrones</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setParticulas(protones, neutrones, electrones - 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-yellow-600 hover:border-yellow-600 transition-all font-black">-</button>
            <span className="w-4 text-center font-black text-slate-800">{electrones}</span>
            <button onClick={() => setParticulas(protones, neutrones, electrones + 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-yellow-600 hover:border-yellow-600 transition-all font-black">+</button>
          </div>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS (TABLA TÉCNICA) */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Microscope size={18} className="text-[#219EBC]" />
          <h4 className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Registro de Hallazgos</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-medium text-slate-600">
            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-2 py-3">Z</th>
                <th className="px-2 py-3">A</th>
                <th className="px-2 py-3">Carga</th>
                <th className="px-5 py-3 text-right">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hallazgos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-bold italic">
                    Sin registros. Usa el botón de actividad en el reactor para guardar datos.
                  </td>
                </tr>
              ) : (
                hallazgos.map((h: any, idx: number) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-black text-[#219EBC]">#{idx + 1}</td>
                    <td className="px-2 py-3 font-bold">{h.z}</td>
                    <td className="px-2 py-3 font-bold">{h.a}</td>
                    <td className="px-2 py-3">
                      <span className={`px-1.5 py-0.5 rounded-md ${h.carga === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {h.carga > 0 ? `+${h.carga}` : h.carga}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400">{h.timestamp}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACCIÓN FINAL */}
      <button 
        onClick={() => {
          if (validarEstructura()) {
            // El trigger del modal de éxito está en el store
          }
        }}
        className="w-full py-5 bg-[#023047] hover:bg-[#219EBC] text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 group"
      >
        <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
        Someter para Validación
      </button>

    </div>
  );
}
