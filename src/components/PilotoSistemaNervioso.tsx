'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Brain, Zap, Activity, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SistemaNervioso3DScene from './simuladores/bio07/SistemaNervioso3DScene';

export default function PilotoSistemaNervioso({ isProfesor = false }: { isProfesor?: boolean }) {
  const router = useRouter();
  const { sistemaNervioso, generarSemillaB7, dispararReflejo, validarB7, setB7State } = useSimuladorStore();
  const { fuerzaGolpe, integridadMielina, estado, latenciaMedida, status } = sistemaNervioso;

  // Ref to avoid stale closure in the animation sequence
  const estadoRef = useRef(estado);
  useEffect(() => { estadoRef.current = estado; }, [estado]);

  // Inicialización (Semilla - El Reto Clínico)
  useEffect(() => {
    if (integridadMielina === 100 && latenciaMedida === 0) {
      generarSemillaB7();
    }
  }, []);

  // Parámetros de Animación
  // Velocidad visual: max 120 m/s -> 0.2s duration. min 1 m/s -> 3s duration.
  const moveDuration = Math.max(0.15, 3.5 - (integridadMielina / 30));

  // Secuencia de animación del reflejo
  const handleDispararReflejo = () => {
    if (estado !== 'reposo' && estado !== 'contraccion') return;
    if (status === 'success') return;

    // Secuencia: golpe → viajando_sensorial → sinapsis → viajando_motor → contraccion
    setB7State({ estado: 'golpe' });

    setTimeout(() => {
      setB7State({ estado: 'viajando_sensorial' });
    }, 300);

    setTimeout(() => {
      setB7State({ estado: 'sinapsis' });
    }, 300 + moveDuration * 1000);

    setTimeout(() => {
      setB7State({ estado: 'viajando_motor' });
    }, 300 + moveDuration * 1000 + 500);

    setTimeout(() => {
      setB7State({ estado: 'contraccion' });
    }, 300 + moveDuration * 1000 * 2 + 500);

    setTimeout(() => {
      // Calcular latencia medida en ms (distancia/velocidad)
      const velocidad = integridadMielina * 1.2; // m/s proporcional
      const latencia = Math.round(1000 / Math.max(1, velocidad));
      setB7State({ estado: 'reposo', latenciaMedida: latencia, velocidadConduccion: velocidad });
      // Persistir y marcar éxito
      dispararReflejo();
      validarB7();
    }, 300 + moveDuration * 1000 * 2 + 500 + 800);
  };

  return (
    <div className="w-full h-full relative bg-[#04050d] flex items-center justify-center overflow-hidden rounded-[2rem] shadow-2xl text-white font-['Outfit'] pointer-events-none">

      {/* ── ESCENA 3D — NEURONA / SINAPSIS (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <SistemaNervioso3DScene
          estado={estado}
          integridadMielina={integridadMielina}
          fuerzaGolpe={fuerzaGolpe}
          status={status}
        />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#04050d]/70 via-transparent to-[#04050d]/80" />

      {/* OVERLAYS TÉCNICOS (Rule #14 Compliant - Min 11px) */}
      <div className="absolute top-10 right-10 z-30 flex flex-col gap-4 pointer-events-none">
         <div className="flex items-center gap-4 bg-slate-900/60 border border-white/10 p-5 rounded-[2rem] backdrop-blur-xl shadow-2xl pointer-events-auto">
            <div className="flex flex-col items-end">
               <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Estado Dinámico</span>
               <span className={`text-sm font-black uppercase tracking-tighter ${
                 estado === 'reposo' ? 'text-slate-400' : 'text-[#67e8f9]'
               }`}>
                 {estado.replace('_', ' ')}
               </span>
            </div>
            <div className={`w-4 h-4 rounded-full ${
              estado === 'reposo' ? 'bg-slate-800' : 'bg-[#22d3ee] shadow-[0_0_20px_#22d3ee] animate-pulse'
            }`} />
         </div>

         <div className="flex items-center gap-4 bg-slate-900/60 border border-white/10 p-5 rounded-[2rem] backdrop-blur-xl shadow-2xl pointer-events-auto">
            <Zap className="text-[#22d3ee]" size={18} />
            <div className="flex flex-col items-end">
               <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Integridad Mielina</span>
               <span className="text-sm font-black uppercase tracking-tighter text-[#a5f3fc]">{Math.round(integridadMielina)}%</span>
            </div>
         </div>

         {isProfesor && (
            <div className="bg-[#e879f9]/10 border border-[#e879f9]/20 p-4 rounded-2xl flex items-center gap-3 pointer-events-auto">
               <Brain className="text-[#e879f9]" size={18} />
               <span className="text-[11px] font-black text-[#e879f9] uppercase">Ruta Cerebral Activa</span>
            </div>
         )}
      </div>

      {/* ETIQUETA SUPERIOR IZQUIERDA */}
      <div className="absolute top-10 left-10 z-30 pointer-events-none">
        <div className="bg-slate-900/60 border border-white/10 px-6 py-4 rounded-[2rem] backdrop-blur-xl shadow-2xl pointer-events-auto">
          <h4 className="text-[11px] font-black text-[#67e8f9] uppercase tracking-widest leading-none">Arco Reflejo Neuronal</h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">BIO-07 • Sinapsis y Potencial de Acción</p>
        </div>
      </div>

      {/* BOTÓN DISPARAR REFLEJO */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <AnimatePresence>
          {status !== 'success' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={handleDispararReflejo}
              disabled={estado !== 'reposo' && estado !== 'contraccion'}
              className={`pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all duration-200
                ${(estado !== 'reposo' && estado !== 'contraccion')
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-[#22d3ee] text-black hover:bg-[#67e8f9] cursor-pointer shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]'
                }`}
            >
              <Zap size={18} className={estado !== 'reposo' && estado !== 'contraccion' ? 'text-slate-500' : 'text-black'} />
              {estado === 'reposo' || estado === 'contraccion' ? 'Disparar Reflejo' : 'Procesando...'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* OVERLAY DE ÉXITO */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-[2rem] z-[200] pointer-events-auto"
          >
            <div className="flex flex-col items-center gap-6 p-12 bg-slate-900/90 border border-[#22d3ee]/30 rounded-[2rem] shadow-2xl max-w-md text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle size={64} className="text-[#22d3ee]" />
              </motion.div>
              <div>
                <p className="text-[11px] font-black text-[#22d3ee] uppercase tracking-widest mb-2">Reflejo Completado</p>
                <h3 className="text-2xl font-black text-white mb-3">Arco Reflejo Registrado</h3>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  El impulso nervioso viajó por la vía aferente, hizo sinapsis en la médula espinal y regresó por la vía eferente causando la contracción muscular.
                </p>
              </div>
              <div className="flex gap-6 mt-2">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Integridad Mielina</span>
                  <span className="text-xl font-black text-[#e879f9]">{Math.round(integridadMielina)}%</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latencia</span>
                  <span className="text-xl font-black text-[#22d3ee]">{sistemaNervioso.latenciaMedida} ms</span>
                </div>
              </div>
              <button onClick={() => router.push('/hub')} className="w-full mt-6 py-4 bg-[#22d3ee] hover:bg-[#67e8f9] text-black font-black rounded-2xl uppercase tracking-widest text-xs transition-colors">Cerrar Laboratorio</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 right-10 z-30 flex items-center gap-2 px-4 py-2 bg-black/20 rounded-full border border-white/5 opacity-50 pointer-events-none">
         <Activity size={14} className="text-slate-500" />
         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Neural Tracer v3.0</span>
      </div>

    </div>
  );
};
