"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Compass, MoveHorizontal, RotateCw, RotateCcw, 
  CheckCircle2, AlertCircle, Info, Binary, Sparkles,
  Gauge, Scaling, Target, Power, Activity, Settings2,
  Wind, Hammer, Layers
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Constantes Físicas
// ==========================================

const K_RPM_SCALE = 1.041; // RPM = K * V * B * N

// ==========================================
// Componente Principal: PilotoMotorElectrico
// ==========================================

export default function PilotoMotorElectrico() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();

  // -- SEMILLA: RETO INDUSTRIAL --
  const [seed] = useState(() => {
    const rpm = Math.floor(Math.random() * 1700) + 800; // 800 a 2500
    const dir = Math.random() > 0.5 ? 'CW' : 'CCW';
    return { targetRPM: rpm, targetDir: dir };
  });

  // -- ESTADO LOCAL --
  const [motor, setMotor] = useState({
    imanIzq: 'N',        // 'N' o 'S'
    imanDer: 'S',        // 'N' o 'S'
    voltaje: 0,          // 0V a 24V
    espiras: 10,         // 10, 50, 100
    interruptor: false
  });

  const [resultado, setResultado] = useState<'exito' | 'error' | null>(null);

  // -- CÁLCULOS FÍSICOS --
  const B = useMemo(() => {
    if (motor.imanIzq === 'N' && motor.imanDer === 'S') return 1;
    if (motor.imanIzq === 'S' && motor.imanDer === 'N') return -1;
    return 0; // Se anulan
  }, [motor.imanIzq, motor.imanDer]);

  const rpmCalculadas = motor.interruptor ? Math.floor(K_RPM_SCALE * motor.voltaje * B * motor.espiras) : 0;
  const absRPM = Math.abs(rpmCalculadas);
  const currentDir = rpmCalculadas > 0 ? 'CW' : (rpmCalculadas < 0 ? 'CCW' : 'STILL');

  const animationDuration = absRPM > 0 ? 60 / absRPM : 0;
  const isCorrectDir = currentDir === seed.targetDir;
  const isCorrectRPM = Math.abs(absRPM - seed.targetRPM) / seed.targetRPM <= 0.05; // 5% Tolerancia
  const isHot = motor.interruptor && B === 0 && motor.voltaje > 0;

  // -- HANDLERS --
  const handleValidar = () => {
    if (isCorrectDir && isCorrectRPM) {
      setResultado('exito');
      setBitacora({ 
        ...bitacoraData, 
        fisica10: `✅ LABORATORIO FINALIZADO: Motor P10. RPM=${absRPM}. Target=${seed.targetRPM}. Dir=${currentDir}.` 
      });
    } else {
      setResultado('error');
      setTimeout(() => setResultado(null), 3000);
    }
  };


  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit'] relative text-white">
      {/* 🔮 LIENZO (100% del contenedor Piloto) */}
      <main className="flex-grow h-full relative flex flex-col p-20 overflow-hidden">
         
         <style jsx>{`
            @keyframes spin-cw { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
            @keyframes spin-ccw { from { transform: rotateY(360deg); } to { transform: rotateY(0deg); } }
            @keyframes vibrate-intense { 
              0%, 100% { transform: translate(0, 0); }
              20% { transform: translate(-3px, 2px); }
              40% { transform: translate(3px, -2px); }
              60% { transform: translate(-3px, -2px); }
              80% { transform: translate(3px, 2px); }
            }
            .animate-vibrate-intense { animation: vibrate-intense 0.1s infinite; }
         `}</style>

         {/* ESCENA SVG */}
         <svg width="600" height="400" viewBox="0 0 600 400" className="overflow-visible z-10 drop-shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            
            {/* LÍNEAS DE CAMPO MAGNÉTICO (B) */}
            <g opacity="0.3">
               {B !== 0 ? (
                 Array.from({ length: 8 }).map((_, i) => (
                    <motion.line 
                      key={i}
                      initial={{ x1: B > 0 ? 100 : 500, x2: B > 0 ? 100 : 500 }}
                      animate={{ x1: B > 0 ? 500 : 100, x2: B > 0 ? 510 : 90 }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1, ease: "linear" }}
                      y1={140 + i * 15} y2={140 + i * 15}
                      stroke="#818cf8" strokeWidth="1" strokeDasharray="10 20"
                    />
                 ))
               ) : (
                  motor.voltaje > 0 && (
                    <g>
                      <line x1="200" y1="200" x2="300" y2="150" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
                      <line x1="400" y1="200" x2="300" y2="150" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
                      <line x1="200" y1="200" x2="300" y2="250" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
                      <line x1="400" y1="200" x2="300" y2="250" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
                    </g>
                  )
               )}
            </g>

            {/* IMÁN IZQUIERDO */}
            <g transform="translate(100, 150)">
               <rect width="100" height="100" rx="12" fill={motor.imanIzq === 'N' ? '#ef4444' : '#3b82f6'} className="shadow-2xl" />
               <text x="50" y="60" textAnchor="middle" fill="white" fontSize="40" fontWeight="black" fillOpacity="0.3">{motor.imanIzq}</text>
               <rect width="10" height="100" x="90" fill="rgba(255,255,255,0.05)" />
            </g>

            {/* IMÁN DERECHO */}
            <g transform="translate(400, 150)">
               <rect width="100" height="100" rx="12" fill={motor.imanDer === 'N' ? '#ef4444' : '#3b82f6'} className="shadow-2xl" />
               <text x="50" y="60" textAnchor="middle" fill="white" fontSize="40" fontWeight="black" fillOpacity="0.3">{motor.imanDer}</text>
               <rect width="10" height="100" x="0" fill="rgba(0,0,0,0.1)" />
            </g>

            {/* ROTOR / BOBINA (3D Fake) */}
            <g transform="translate(300, 200)">
               <foreignObject x="-60" y="-60" width="120" height="120">
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    perspective: '1000px'
                  }}>
                    <div style={{
                      width: '100px', height: '100px',
                      border: `4px solid ${isHot ? '#ff0000' : '#b45309'}`,
                      borderRadius: '8px',
                      backgroundColor: isHot ? 'rgba(255,0,0,0.2)' : 'rgba(180,83,9,0.1)',
                      boxShadow: isHot ? '0 0 30px #ff0000' : 'none',
                      animation: absRPM > 0 ? `${currentDir === 'CW' ? 'spin-cw' : 'spin-ccw'} ${animationDuration}s linear infinite` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative'
                    }}>
                       {/* Núcleo de Hierro central */}
                       <div className="w-4 h-full bg-slate-800/80 rounded-full" />
                       {/* Espiras (Visual N) */}
                       <div className="absolute inset-0 flex flex-col justify-around p-2">
                          {Array.from({ length: motor.espiras / 10 }).map((_, i) => (
                             <div key={i} className="h-0.5 bg-[#d97706]/40 w-full" />
                          ))}
                       </div>
                    </div>
                  </div>
               </foreignObject>
            </g>

            {/* ESCOBILLAS Y CONMUTADOR */}
            <g transform="translate(300, 280)">
               <circle r="15" fill="#475569" cx="0" cy="0" />
               <rect x="-25" y="-5" width="10" height="10" fill="#1e293b" rx="2" />
               <rect x="15" y="-5" width="10" height="10" fill="#1e293b" rx="2" />
               <path d="M -20,5 L -20,40 L 100,40" fill="none" stroke="#64748b" strokeWidth="3" />
               <path d="M 20,5 L 20,40 L -100,40" fill="none" stroke="#64748b" strokeWidth="3" />
            </g>

            {/* BATERÍA INFERIOR */}
            <g transform="translate(250, 320)">
               <rect width="100" height="50" rx="8" fill="#1e293b" stroke="#334155" />
               <text x="50" y="32" textAnchor="middle" fill="white" fontSize="18" fontWeight="black" opacity="0.2">24V DC</text>
               <circle cx="20" cy="0" r="8" fill="#ef4444" />
               <circle cx="80" cy="0" r="8" fill="#3b82f6" />
            </g>
         </svg>

         {/* FEEDBACK OVERLAY */}
         <AnimatePresence>
            {resultado === 'exito' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center p-20 backdrop-blur-md">
                 <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border-t-[12px] border-indigo-500">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={40} /></div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">Laboratorio Completado</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed italic">Has calibrado el motor industrial a <span className="text-indigo-600 font-black">{absRPM} RPM</span>. Has completado todas las prácticas de física del programa.</p>
                    <button 
                     onClick={() => router.push('/alumno/laboratorio/fisica')}
                     className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-900/20"
                    >
                      Finalizar Programa
                    </button>
                 </div>
              </motion.div>
            )}

            {motor.interruptor && resultado === 'error' && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-500 text-white rounded-full flex items-center gap-4 shadow-2xl font-black uppercase text-[10px] tracking-widest border-b-4 border-red-700 pointer-events-none italic">
                 <AlertCircle size={20} /> Desviación de telemetría detectada. Ajusta el voltaje o el número de espiras.
              </motion.div>
            )}
         </AnimatePresence>

         {/* MODO INSTRUCTOR */}
         <div className="absolute bottom-10 right-10 flex gap-4">
            <button 
             onClick={() => {
                const targetV = Math.round(seed.targetRPM / (K_RPM_SCALE * 1 * 50));
                setMotor({
                   imanIzq: seed.targetDir === 'CW' ? 'N' : 'S',
                   imanDer: seed.targetDir === 'CW' ? 'S' : 'N',
                   voltaje: targetV,
                   espiras: 50,
                   interruptor: true
                });
             }} 
             className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-3"
            >
              <Binary size={14} className="group-hover:rotate-12 transition-transform" /> Auto-Calibrar (Demo)
            </button>
         </div>
      </main>
    </div>
  );
}
