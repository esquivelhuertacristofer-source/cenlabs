import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Activity, Thermometer, FlaskConical, Target, 
  Wind, CheckCircle2, AlertCircle, Info, Beaker,
  ChevronRight, ArrowRight, MousePointer2, Zap
} from 'lucide-react';

export default function BitacoraTransporte() {
  const { transporte, setTransporte, validarB2, resetB2 } = useSimuladorStore();
  const { concExt, concInt, tipoCelula, volumen, status, presionOsmotica, history } = transporte;

  const getStatusInfo = () => {
    const diff = concExt - concInt;
    if (Math.abs(diff) < 0.05) return { text: 'Homeostasis Isotónica', icon: <CheckCircle2 className="text-emerald-400" />, color: 'bg-emerald-500' };
    if (diff > 0) return { text: 'Impacto Hipertónico', icon: <Wind className="text-rose-400" />, color: 'bg-rose-500' };
    return { text: 'Impacto Hipotónico', icon: <Activity className="text-cyan-400" />, color: 'bg-cyan-50' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      
      {/* 1. CONFIGURACIÓN DEL SISTEMA */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <FlaskConical size={20} />
           </div>
           <div>
              <h4 className="text-sm font-black text-[#023047] uppercase">Variables del Medio</h4>
              <p className="text-[10px] font-bold text-slate-400">AJUSTE DE CONCENTRACIONES</p>
           </div>
        </div>

        <div className="space-y-6">
          {/* Tipo de Célula */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Target size={12} /> Modelo Biológico
            </span>
            <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
              {(['animal', 'vegetal'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTransporte({ tipoCelula: t })}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tight rounded-xl transition-all ${
                    tipoCelula === t ? 'bg-white text-[#023047] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t === 'animal' ? 'Eritrocito' : 'Tejido Vegetal'}
                </button>
              ))}
            </div>
          </div>

          {/* Slider Concentración */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Beaker size={12} /> Concentración Exterior
              </span>
              <span className="text-xl font-mono font-black text-[#023047]">{concExt.toFixed(2)} M</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01" value={concExt}
              onChange={(e) => setTransporte({ concExt: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#219EBC]"
            />
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
              <span>0.0 M (Pura)</span>
              <span>0.5 M</span>
              <span>1.0 M (Saturada)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TELEMETRÍA HOMEOSTÁTICA */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20"><Activity size={60} /></div>
        <h4 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mb-4">Sensores Biométricos</h4>
        
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Presión Osmótica</span>
              <div className="flex items-end gap-1">
                 <span className="text-lg font-mono font-black">{presionOsmotica.toFixed(1)}</span>
                 <span className="text-[10px] font-bold opacity-60 mb-1">atm</span>
              </div>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Estado Celular</span>
              <span className="text-[10px] font-black text-cyan-400 leading-none">{volumen > 105 ? 'Turgencia' : volumen < 95 ? 'Plasmólisis' : 'Isotonía'}</span>
           </div>
        </div>

        {/* Gráfico de Volumen (Miniatura) */}
        <div className="mt-6">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-400 uppercase">Volumen vs Tiempo</span>
              <span className="text-[10px] font-mono text-cyan-400">{volumen.toFixed(1)}%</span>
           </div>
           <div className="h-20 flex items-end gap-0.5 bg-black/20 rounded-xl p-2 overflow-hidden">
              {history.map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${(h.volumen / 180) * 100}%` }}
                  className={`w-full min-w-[2px] rounded-t-sm ${status === 'error' ? 'bg-rose-500' : 'bg-cyan-500/60'}`}
                />
              ))}
           </div>
        </div>
      </div>

      {/* 3. ACCIÓN DE LABORATORIO */}
      <div className="space-y-3">
        <button 
          onClick={validarB2}
          disabled={status === 'success'}
          className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
            status === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#FB8500] text-white hover:bg-[#FFB703]'
          }`}
        >
          {status === 'success' ? (
            <><CheckCircle2 size={18} /> Isotonía Verificada</>
          ) : (
            <><MousePointer2 size={18} /> Validar Equilibrio</>
          )}
        </button>

        <button 
          onClick={resetB2}
          className="w-full py-4 bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-colors"
        >
          Reiniciar Solución
        </button>
      </div>

      {/* Info Contextual (Alerts) */}
      <AnimatePresence>
        {Math.abs(concExt - concInt) < 0.05 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
               <Zap size={16} />
            </div>
            <p className="text-[10px] font-bold text-emerald-800 leading-tight">
               ¡Equilibrio dinámico alcanzado! El flujo de agua es neto cero.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
