import React from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Dna, Users, BarChart3, Binary, Zap, 
  RotateCcw, Info, Activity, Microscope
} from 'lucide-react';

export default function BitacoraGenetica() {
  const { genetica, setGenetica, generarF1, resetB5 } = useSimuladorStore();
  const { padre1, padre2, tamanioMuestra, poblacionF1, status } = genetica;

  const countFenotipos = () => {
    const counts = { 'cyan-dobles': 0, 'cyan-simples': 0, 'fucsia-dobles': 0, 'fucsia-simples': 0 };
    poblacionF1.forEach(p => counts[p.fenotipo as keyof typeof counts]++);
    return counts;
  };

  const actuals = countFenotipos();
  const total = poblacionF1.length || 1;

  const fenotiposData = [
    { id: 'cyan-dobles', label: 'Cyan / Dobles', color: '#219EBC', teorico: 56.25 },
    { id: 'cyan-simples', label: 'Cyan / Simples', color: '#8ECAE6', teorico: 18.75 },
    { id: 'fucsia-dobles', label: 'Fucsia / Dobles', color: '#FF006E', teorico: 18.75 },
    { id: 'fucsia-simples', label: 'Fucsia / Simples', color: '#FF85A1', teorico: 6.25 },
  ];

  const genotipos = ['AABB', 'Aabb', 'aaBB', 'aabb', 'AaBb'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      
      {/* 1. INCUBADORA GENÉTICA */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Microscope size={20} />
           </div>
           <div>
              <h4 className="text-sm font-black text-[#023047] uppercase tracking-tighter">Incubadora Genética</h4>
              <p className="text-[10px] font-bold text-slate-400">CONFIGURACIÓN PARENTAL</p>
           </div>
        </div>

        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Padre (P1)</label>
                 <select 
                    value={padre1}
                    onChange={(e) => setGenetica({ padre1: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-xs font-black text-[#023047] focus:ring-2 focus:ring-[#219EBC] outline-none"
                 >
                    {genotipos.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Madre (P2)</label>
                 <select 
                    value={padre2}
                    onChange={(e) => setGenetica({ padre2: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-xs font-black text-[#023047] focus:ring-2 focus:ring-[#219EBC] outline-none"
                 >
                    {genotipos.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
              </div>
           </div>

           <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tamaño Muestra (N)</span>
                 <span className="text-sm font-mono font-black text-[#023047]">{tamanioMuestra}</span>
              </div>
              <input 
                type="range" min="10" max="500" step="10"
                value={tamanioMuestra}
                onChange={(e) => setGenetica({ tamanioMuestra: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-fucsia-500"
              />
           </div>

           <button
             onClick={generarF1}
             className="w-full h-14 bg-[#023047] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
           >
              <Zap size={14} className="text-yellow-400" />
              Generar Población F1
           </button>
        </div>
      </div>

      {/* 2. TELEMETRÍA FENOTÍPICA */}
      <div className="bg-[#1a1c2c] rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute -top-10 -right-10 opacity-5 rotate-12"><Dna size={200} /></div>
         
         <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
               <BarChart3 size={24} className="text-fucsia-400" />
            </div>
            <div>
               <h3 className="text-lg font-black tracking-tighter uppercase">Resultados F1</h3>
               <p className="text-[10px] text-fucsia-400 font-bold uppercase tracking-widest">Conteo Empírico vs Teórico</p>
            </div>
         </div>

         <div className="space-y-4 relative z-10">
            {fenotiposData.map((f) => {
               const actual = (actuals[f.id as keyof typeof actuals] / total) * 100;
               return (
                  <div key={f.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: f.color }}>{f.label}</span>
                        <div className="flex gap-3">
                           <span className="text-[9px] font-bold text-white/40 italic">T: {f.teorico.toFixed(1)}%</span>
                           <span className="text-[10px] font-black text-white">{actual.toFixed(1)}%</span>
                        </div>
                     </div>
                     <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute h-full left-0 top-0 opacity-20"
                          style={{ width: `${f.teorico}%`, backgroundColor: f.color }}
                        />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${actual}%` }}
                          className="absolute h-full left-0 top-0 shadow-[0_0_10px_currentColor]"
                          style={{ backgroundColor: f.color }}
                        />
                     </div>
                  </div>
               );
            })}
         </div>

         <button 
            onClick={resetB5}
            className="mt-6 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest transition-colors"
         >
            <RotateCcw size={14} /> Limpiar Terrario
         </button>
      </div>

      {/* 3. DESVIACIÓN ESTADÍSTICA */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
         <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
               <Activity size={16} />
            </div>
            <span className="text-xs font-black text-[#023047] uppercase">Margen de Desviación</span>
         </div>
         <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
            "A mayor tamaño de muestra ($N$), menor es la fluctuación aleatoria y más fiel es el resultado a la proporción de Mendel."
         </p>
      </div>
    </div>
  );
};
