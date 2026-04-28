import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Zap, Activity, FlaskConical, Target, 
  Wind, CheckCircle2, AlertCircle, Info, 
  ChevronRight, ArrowRight, MousePointer2, Dna, Library
} from 'lucide-react';

export default function BitacoraSintesis() {
  const { sintesis, addNucleotido, advanceRibosoma, resetB3 } = useSimuladorStore();
  const { fase, adnPlantilla, arnMensajero, proteina, errores, currentIndex, status } = sintesis;

  const bases = ['A', 'U', 'C', 'G'];
  
  const progresso = fase === 'transcripcion' 
    ? (arnMensajero.length / adnPlantilla.length) * 100 
    : (currentIndex / arnMensajero.length) * 100;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      
      {/* 1. ESTADO DE LA SECUENCIA */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Library size={20} />
           </div>
           <div>
              <h4 className="text-sm font-black text-[#023047] uppercase">Estado Molecular</h4>
              <p className="text-[10px] font-bold text-slate-400">FASE: {fase.toUpperCase()}</p>
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso del Gen</span>
            <span className="text-xs font-mono font-black text-[#023047]">{progresso.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
             <motion.div 
               animate={{ width: `${progresso}%` }}
               className={`h-full ${fase === 'transcripcion' ? 'bg-[#219EBC]' : 'bg-[#10B981]'}`}
             />
          </div>
          
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
             <span className="text-[10px] font-black text-slate-400 uppercase">Tasa de Mutación</span>
             <div className="flex items-center gap-2">
                <span className={`text-sm font-mono font-black ${errores > 3 ? 'text-rose-500' : 'text-[#023047]'}`}>
                   {errores}
                </span>
                <Activity size={12} className={errores > 3 ? 'text-rose-500' : 'text-slate-400'} />
             </div>
          </div>
        </div>
      </div>

      {/* 2. CONSOLA DE ACCIÓN */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={60} /></div>
        
        <h4 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mb-6">
           {fase === 'transcripcion' ? 'Ensamblaje de Nucleótidos' : 'Control Ribosomal'}
        </h4>

        {fase === 'transcripcion' ? (
          <div className="grid grid-cols-2 gap-3">
            {bases.map(base => (
              <button
                key={base}
                onClick={() => addNucleotido(base)}
                className="group relative h-20 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95 flex flex-col items-center justify-center"
              >
                <span className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors uppercase">{base}</span>
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">
                   {base === 'A' ? 'Adenina' : base === 'U' ? 'Uracilo' : base === 'C' ? 'Citosina' : 'Guanina'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={advanceRibosoma}
              disabled={status === 'success'}
              className="w-full h-32 bg-white/5 hover:bg-white/10 border-2 border-dashed border-emerald-500/30 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform">
                 <MousePointer2 size={24} />
              </div>
              <div className="text-center">
                 <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block">Leer Codón</span>
                 <span className="text-[10px] font-bold text-white/40">Siguiente triplete en el mRNA</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 3. CADENA RESULTANTE (Preview) */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Dna size={12} /> Proteína en Formación
         </h4>
         
         <div className="flex flex-wrap gap-2">
            {proteina.length === 0 ? (
               <div className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Esperando Traducción...</span>
               </div>
            ) : (
               proteina.map((aa, i) => (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={i}
                    className="px-3 py-1.5 rounded-full text-[10px] font-black text-white shadow-sm flex items-center gap-2"
                    style={{ backgroundColor: aa.color }}
                  >
                     <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                     {aa.name.toUpperCase()}
                  </motion.div>
               ))
            )}
         </div>
      </div>

      {/* Botón Reiniciar */}
      <button 
        onClick={resetB3}
        className="w-full py-4 bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-colors"
      >
        Reiniciar Secuencia
      </button>

      {/* Info Contextual (Alerts) */}
      <AnimatePresence>
        {errores > 5 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 animate-pulse">
               <AlertCircle size={16} />
            </div>
            <p className="text-[10px] font-bold text-rose-800 leading-tight">
               ¡Tasa de mutación elevada! Revisa las reglas de apareamiento en la pestaña 'Conceptos'.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
