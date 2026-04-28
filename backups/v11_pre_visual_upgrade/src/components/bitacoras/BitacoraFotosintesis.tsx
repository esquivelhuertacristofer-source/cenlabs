import React from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Sun, Droplets, Zap, Activity, Play, Square,
  RotateCcw, Info, Lightbulb, Thermometer, Box
} from 'lucide-react';

export default function BitacoraFotosintesis() {
  const { fotosintesis, setFotosintesis, bitacoraData } = useSimuladorStore();
  const { distancia, color, oxigenoAcumulado, targetO2, simulando, status, tiempo } = fotosintesis;

  const colors = [
    { id: 'blanco', hex: '#FFFFFF', label: 'Blanco' },
    { id: 'rojo', hex: '#EF4444', label: 'Rojo' },
    { id: 'azul', hex: '#3B82F6', label: 'Azul' },
    { id: 'verde', hex: '#10B981', label: 'Verde' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      
      {/* 1. CONTROL AMBIENTAL */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Sun size={20} />
           </div>
           <div>
              <h4 className="text-sm font-black text-[#023047] uppercase tracking-tighter">Consola Ambiental</h4>
              <p className="text-[10px] font-bold text-slate-400">AJUSTE DE PARÁMETROS</p>
           </div>
        </div>

        <div className="space-y-6">
           {/* Distancia Slider */}
           <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distancia Focal</span>
                 <span className="text-sm font-mono font-black text-[#023047]">{distancia} cm</span>
              </div>
              <input 
                type="range" min="1" max="10" step="0.5"
                value={distancia}
                onChange={(e) => setFotosintesis({ distancia: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#219EBC]"
              />
           </div>

           {/* Selector de Espectro */}
           <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Longitud de Onda (Color)</span>
              <div className="grid grid-cols-4 gap-2">
                 {colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setFotosintesis({ color: c.id as any })}
                      className={`relative h-12 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${color === c.id ? 'border-slate-900 shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                       <div 
                         className="w-4 h-4 rounded-full border border-slate-200 mb-1"
                         style={{ backgroundColor: c.hex }}
                       />
                       <span className="text-[8px] font-black uppercase tracking-tighter">
                          {c.label}
                       </span>
                       {color === c.id && (
                          <motion.div layoutId="colorTab" className="absolute -top-1 -right-1 w-3 h-3 bg-slate-900 rounded-full flex items-center justify-center border-2 border-white">
                             <Zap size={6} className="text-white" />
                          </motion.div>
                       )}
                    </button>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* 2. TELEMETRÍA DE PRODUCCIÓN */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10"><Droplets size={60} /></div>
         
         <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
               <Activity size={24} className="text-cyan-400" />
            </div>
            <div>
               <h3 className="text-lg font-black tracking-tighter">Sonda Bio-Gaseosa</h3>
               <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Producción de O₂</p>
            </div>
         </div>

         <div className="space-y-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
               <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-white/40 uppercase">Tasa de Burbujeo</span>
                  <span className="text-xs font-mono font-black text-cyan-400">{(bitacoraData.tasaBPM || 0).toFixed(1)} BPM</span>
               </div>
               <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${Math.min(100, (bitacoraData.tasaBPM || 0) * 0.5)}%` }}
                    className="h-full bg-cyan-400"
                  />
               </div>
            </div>

            <div className="flex justify-between gap-3">
               <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[8px] font-black text-white/40 uppercase block mb-1">Acumulado</span>
                  <span className="text-xl font-mono font-black">{oxigenoAcumulado.toFixed(1)} <small className="text-[10px]">ml</small></span>
               </div>
               <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[8px] font-black text-white/40 uppercase block mb-1">Cronómetro</span>
                  <span className="text-xl font-mono font-black">{tiempo.toFixed(1)}s</span>
               </div>
            </div>
         </div>

         <div className="mt-6 flex gap-3">
            <button
               onClick={() => setFotosintesis({ simulando: !simulando })}
               disabled={status === 'success'}
               className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 ${simulando ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'}`}
            >
               {simulando ? <Square size={14} /> : <Play size={14} />}
               {simulando ? 'Detener' : 'Iniciar'}
            </button>
            <button 
               onClick={() => setFotosintesis({ oxigenoAcumulado: 0, tiempo: 0, status: 'idle' })}
               className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white/60 transition-colors"
            >
               <RotateCcw size={18} />
            </button>
         </div>
      </div>

      {/* 3. META Y OBJETIVO */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
         <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
               <Zap size={16} />
            </div>
            <span className="text-xs font-black text-emerald-900 uppercase">Misión de Recolección</span>
         </div>
         <p className="text-[10px] font-bold text-emerald-700 leading-relaxed mb-4">
            Recolecta <span className="text-sm">50.0 ml</span> de oxígeno maximizando la tasa fotosintética. Evita la zona de baja absorción.
         </p>
         <div className="relative h-12 bg-white rounded-xl border border-emerald-200 flex items-center px-4 overflow-hidden">
             <motion.div 
               animate={{ width: `${(oxigenoAcumulado / targetO2) * 100}%` }}
               className="absolute left-0 top-0 bottom-0 bg-emerald-400 opacity-20"
             />
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest relative z-10">Meta Alcanzada: {(oxigenoAcumulado / targetO2 * 100).toFixed(1)}%</span>
         </div>
      </div>
    </div>
  );
};
