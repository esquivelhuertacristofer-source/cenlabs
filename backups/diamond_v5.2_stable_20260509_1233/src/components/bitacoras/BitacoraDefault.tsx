"use client";

import React from 'react';
import { FileText, Database, ShieldCheck, Activity } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function BitacoraDefault({ subject = 'General' }: { subject?: string }) {
  const { bitacoraData } = useSimuladorStore();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* HEADER DE PROTOCOLO */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-slate-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Database size={60} className="text-white" />
        </div>
        
        <div className="relative z-10 text-center py-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
             <FileText size={32} className="text-[#219EBC]" />
          </div>
          <h4 className="text-white font-black text-lg leading-tight mb-2 uppercase tracking-tighter">Protocolo {subject}</h4>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] leading-relaxed">
            Registro telemétrico en tiempo real
          </p>
        </div>
      </div>

      {/* PANEL DE DATOS DINÁMICOS (Si existen) */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden">
         <div className="flex items-center gap-2 mb-6">
            <Activity size={14} className="text-[#219EBC]" />
            <h4 className="text-[10px] font-black text-[#023047] uppercase tracking-[0.2em]">Hallazgos de Misión</h4>
         </div>

         {Object.keys(bitacoraData || {}).length > 0 ? (
           <div className="space-y-3">
             {Object.entries(bitacoraData).map(([key, value]) => (
               <div key={key} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#219EBC]/30 transition-colors">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-black text-[#023047]">{String(value)}</span>
               </div>
             ))}
           </div>
         ) : (
           <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
              <ShieldCheck size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                Ajustando Instrumentación...<br/>Interactúa con el simulador para registrar datos.
              </p>
           </div>
         )}
      </div>

      <div className="p-6 bg-[#FB8500]/5 border border-[#FB8500]/20 rounded-[2rem]">
         <p className="text-[9px] font-bold text-[#FB8500] uppercase tracking-widest leading-relaxed text-center italic">
           Nota: Este simulador utiliza el protocolo de registro estándar v9.0
         </p>
      </div>

    </div>
  );
}
