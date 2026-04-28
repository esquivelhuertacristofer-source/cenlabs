import React from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Dna, Zap, Activity, Thermometer, 
  Droplets, CheckCircle2, AlertCircle, 
  FlaskConical, Info, Play
} from 'lucide-react';

export default function BitacoraSistemaDigestivo() {
  const { digestion, setDigestion, resetB9 } = useSimuladorStore();
  const { macronutriente, enzimaSeleccionada, nivelPH, estado, monomerosAbsorbidos, status } = digestion;

  const getPHLabel = (ph: number) => {
    if (ph < 6) return 'Ácido';
    if (ph > 8) return 'Alcalino';
    return 'Neutro';
  };

  const macronutrienteLabels: Record<string, string> = {
    almidon: 'Carbohidrato (Almidón)',
    proteina: 'Proteína (Polipéptido)',
    lipido: 'Lípido (Triglicérido)'
  };

  const handleInyectar = () => {
    if (!enzimaSeleccionada) return;
    setDigestion({ estado: 'intacto' }); // Reset animation state to trigger fresh one
    
    setTimeout(() => {
        // Reglas Enzimáticas
        const rules: Record<string, { enzima: string, phRange: [number, number] }> = {
            almidon: { enzima: 'amilasa', phRange: [6.5, 7.5] },
            proteina: { enzima: 'pepsina', phRange: [1.5, 2.5] },
            lipido: { enzima: 'lipasa', phRange: [7.5, 8.5] }
        };

        const rule = rules[macronutriente];
        const phOk = nivelPH >= rule.phRange[0] && nivelPH <= rule.phRange[1];

        if (enzimaSeleccionada !== rule.enzima) {
            setDigestion({ estado: 'intacto', status: 'error' });
        } else if (!phOk) {
            setDigestion({ estado: 'desnaturalizado', status: 'error' });
        } else {
            setDigestion({ estado: 'digerido', status: 'idle' });
            // Simulation logic will update absorption
        }
    }, 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-10">
      
      {/* 1. CONSOLA METABÓLICA */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-[#023047] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#023047]/10">
              <FlaskConical size={20} />
           </div>
           <div>
              <h4 className="text-sm font-black text-[#023047] uppercase tracking-tighter">Consola Metabólica</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Inyección Enzimática</p>
           </div>
        </div>

        <div className="space-y-6">
           {/* Selector de Enzimas */}
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Enzima a Inyectar</label>
              <div className="grid grid-cols-1 gap-2">
                 {[
                   { id: 'amilasa', label: 'Amilasa (Saliva)', icon: Droplets },
                   { id: 'pepsina', label: 'Pepsina (Estómago)', icon: Zap },
                   { id: 'lipasa', label: 'Lipasa (Páncreas)', icon: Activity }
                 ].map((enzima) => (
                   <button
                     key={enzima.id}
                     onClick={() => setDigestion({ enzimaSeleccionada: enzima.id as any })}
                     className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                       enzimaSeleccionada === enzima.id 
                       ? 'border-[#219EBC] bg-[#219EBC]/5' 
                       : 'border-slate-50 hover:border-slate-100 bg-slate-50'
                     }`}
                   >
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enzimaSeleccionada === enzima.id ? 'bg-[#219EBC] text-white' : 'bg-slate-200 text-slate-500'}`}>
                        <enzima.icon size={16} />
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-tight ${enzimaSeleccionada === enzima.id ? 'text-[#023047]' : 'text-slate-500'}`}>
                        {enzima.label}
                     </span>
                   </button>
                 ))}
              </div>
           </div>

           {/* PH Slider */}
           <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2">
                    <Thermometer size={14} className="text-[#FB8500]" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Ajuste de pH</span>
                 </div>
                 <span className={`text-sm font-mono font-black py-1 px-3 rounded-lg ${
                    nivelPH < 6 ? 'bg-rose-100 text-rose-600' : nivelPH > 8 ? 'bg-cyan-100 text-cyan-600' : 'bg-emerald-100 text-emerald-600'
                 }`}>
                    {nivelPH.toFixed(1)}
                 </span>
              </div>
              <input 
                type="range" min="1.0" max="14.0" step="0.1"
                value={nivelPH}
                onChange={(e) => setDigestion({ nivelPH: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#FB8500]"
              />
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">
                <span>1.0 Ácido</span>
                <span className="text-[#219EBC]">7.0 Neutro</span>
                <span>14.0 Alcalino</span>
              </div>
           </div>

           <button
             disabled={!enzimaSeleccionada}
             onClick={handleInyectar}
             className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
               enzimaSeleccionada 
               ? 'bg-[#FB8500] text-white hover:bg-[#ff952b] shadow-lg shadow-[#FB8500]/20 active:scale-95'
               : 'bg-slate-100 text-slate-300 cursor-not-allowed'
             }`}
           >
              <Play size={16} />
              Inyectar Enzima
           </button>
        </div>
      </div>

      {/* 2. TELEMETRÍA DE ABSORCIÓN */}
      <div className="bg-[#0A1121] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#219EBC] opacity-5 blur-3xl" />
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
              <Dna size={24} className="text-[#219EBC]" />
           </div>
           <div>
              <h3 className="text-lg font-black tracking-tighter uppercase leading-tight">Monitor Metabólico</h3>
              <p className="text-[11px] text-[#219EBC] font-bold uppercase tracking-widest">Homeostasis Virtual</p>
           </div>
        </div>

        <div className="space-y-4 relative z-10">
           {/* Macronutriente Meta */}
           <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Polímero detectado</span>
              <p className="text-sm font-black text-[#FB8500] uppercase">{macronutrienteLabels[macronutriente]}</p>
           </div>

           {/* Telemetría Grid */}
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Estado Enzima</span>
                 <div className={`text-[10px] font-black uppercase flex items-center gap-2 ${
                    estado === 'desnaturalizado' ? 'text-rose-400' : enzimaSeleccionada ? 'text-emerald-400' : 'text-slate-500'
                 }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                        estado === 'desnaturalizado' ? 'bg-rose-400 animate-pulse' : enzimaSeleccionada ? 'bg-emerald-400' : 'bg-slate-500'
                    }`} />
                    {estado === 'desnaturalizado' ? 'Desnaturalizada' : enzimaSeleccionada ? 'Activa' : 'Sin Carga'}
                 </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Entorno</span>
                 <p className="text-[10px] font-black uppercase text-[#8ECAE6]">{getPHLabel(nivelPH)}</p>
              </div>
           </div>

           {/* Barra de Absorción */}
           <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                 <span className="text-white/60">Absorción Sanguínea</span>
                 <span className="text-[#219EBC]">{monomerosAbsorbidos}%</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${monomerosAbsorbidos}%` }}
                   className="h-full bg-gradient-to-r from-[#219EBC] to-[#8ECAE6] rounded-full shadow-[0_0_10px_rgba(33,158,188,0.5)]"
                 />
              </div>
           </div>

           <button
             disabled={monomerosAbsorbidos < 100}
             onClick={() => setDigestion({ status: 'success' })}
             className={`w-full mt-6 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
               monomerosAbsorbidos >= 100 
               ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95'
               : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
             }`}
           >
              <CheckCircle2 size={18} />
              Completar Digestión
           </button>
        </div>
      </div>

    </div>
  );
};
