"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Power, RotateCcw, Activity, Cpu, 
  CheckCircle2, AlertCircle, Info, Binary, Sparkles,
  Gauge, Scaling, Boxes, Settings, Battery
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Constantes y Lógica de Colores
// ==========================================

const COLOR_CODES = [
  { val: 0, color: '#000000', label: 'Negro' },
  { val: 1, color: '#92400e', label: 'Marrón' },
  { val: 2, color: '#ef4444', label: 'Rojo' },
  { val: 3, color: '#f97316', label: 'Naranja' },
  { val: 4, color: '#facc15', label: 'Amarillo' },
  { val: 5, color: '#22c55e', label: 'Verde' },
  { val: 6, color: '#3b82f6', label: 'Azul' },
  { val: 7, color: '#a855f7', label: 'Violeta' },
  { val: 8, color: '#64748b', label: 'Gris' },
  { val: 9, color: '#ffffff', label: 'Blanco' }
];

const getResistorBands = (val: number) => {
  const s = Math.floor(val).toString();
  const digit1 = parseInt(s[0]);
  const digit2 = s.length > 1 ? parseInt(s[1]) : 0;
  const multiplier = s.length - (s.length > 1 ? 2 : 1);
  
  return [
    COLOR_CODES[digit1]?.color || '#000',
    COLOR_CODES[digit2]?.color || '#000',
    COLOR_CODES[multiplier]?.color || '#000'
  ];
};

// ==========================================
// Componente Principal: PilotoLeyOhm
// ==========================================

export default function PilotoLeyOhm() {
  const router = useRouter();
  const { setBitacora, bitacoraData, updateScore } = useSimuladorStore();

  // -- SEMILLA: VOLTAJE DE BATERÍA --
  const [seed] = useState(() => ({
    voltaje: [5, 9, 12, 24][Math.floor(Math.random() * 4)]
  }));

  // -- ESTADO LOCAL --
  const [circuito, setCircuito] = useState({
    resistencia: 1000,
    switchOn: false,
    ledRoto: false
  });

  const [inputResistencia, setInputResistencia] = useState("");
  const [resultado, setResultado] = useState<'exito' | 'error' | null>(null);

  // -- CÁLCULOS FÍSICOS --
  const corriente = circuito.switchOn && !circuito.ledRoto 
    ? seed.voltaje / circuito.resistencia 
    : 0;
  const corrienteMA = corriente * 1000;

  // -- EFECTO DE PROTECCIÓN --
  useEffect(() => {
    if (corrienteMA > 35) {
      setCircuito(prev => ({ ...prev, ledRoto: true, switchOn: false }));
      updateScore(-5); // Penalización por romper equipo
    }
  }, [corrienteMA, updateScore]);

  // -- HANDLERS --
  const handleValidar = () => {
    const val = parseFloat(inputResistencia);
    const idealR = seed.voltaje / 0.02; // R para exactamente 20mA
    const margen = idealR * 0.05;

    if (Math.abs(val - idealR) <= margen) {
      setResultado('exito');
      setBitacora({ 
        ...bitacoraData, 
        fisica8: `✅ VALIDADO: V=${seed.voltaje}V. R_alumno=${val}Ω (Ideal=${idealR.toFixed(1)}Ω). LED Protegido.` 
      });
    } else {
      setResultado('error');
    }
  };

  const handleReset = () => {
    setCircuito(prev => ({ ...prev, ledRoto: false, switchOn: false, resistencia: 1000 }));
    setResultado(null);

  };

  const resistorBands = useMemo(() => getResistorBands(circuito.resistencia), [circuito.resistencia]);


  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit'] relative">
      {/* 🔮 LIENZO (100% del contenedor Piloto) */}
      <main className="flex-grow h-full relative flex flex-col items-center justify-center p-20 overflow-hidden">
         {/* Fondo decorativo */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#facc1505_0%,transparent_50%)]" />

         {/* ESCENA SVG CIRCUITO */}
         <svg width="600" height="400" viewBox="0 0 600 400" className="overflow-visible z-10 transition-transform duration-1000">
            {/* Cables (Path principal) */}
            <path 
              id="circuit-path"
              d="M 100 200 L 100 50 L 500 50 L 500 200 L 500 350 L 100 350 L 100 200"
              fill="none" stroke="#1e293b" strokeWidth="4" strokeLinejoin="round"
            />

            {/* BATERIA */}
            <g transform="translate(100, 200)">
               <rect x="-20" y="-30" width="40" height="60" fill="#0f172a" stroke="#475569" strokeWidth="2" rx="4" />
               <text y="-35" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="black" className="uppercase tracking-widest">Power Source</text>
               <text y="5" textAnchor="middle" fill="white" fontSize="14" fontWeight="black">{seed.voltaje}V</text>
               <circle y="-15" r="3" fill="#ef4444" cy="-15" />
               <circle y="15" r="3" fill="#64748b" cy="15" />
            </g>

            {/* INTERRUPTOR */}
            <g transform="translate(300, 50)">
               <line x1="-30" y1="0" x2="-10" y2="0" stroke="#1e293b" strokeWidth="6" />
               <line x1="10" y1="0" x2="30" y2="0" stroke="#1e293b" strokeWidth="6" />
               <motion.line 
                  animate={{ rotate: circuito.switchOn ? 0 : -45 }}
                  x1="-10" y1="0" x2="10" y2="0" stroke="#475569" strokeWidth="6" strokeLinecap="round"
                  style={{ originX: "-10px" }}
               />
               <text y="-20" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="black" className="uppercase tracking-widest">Switch</text>
            </g>

            {/* RESISTOR (Dinámico) */}
            <g transform="translate(300, 350)">
               <rect x="-40" y="-12" width="80" height="24" fill="#d1d5db" rx="8" />
               {/* BANDAS DE COLOR */}
               <rect x="-25" y="-12" width="6" height="24" fill={resistorBands[0]} />
               <rect x="-5" y="-12" width="6" height="24" fill={resistorBands[1]} />
               <rect x="15" y="-12" width="6" height="24" fill={resistorBands[2]} />
               <rect x="35" y="-12" width="4" height="24" fill="#fbbf24" /> {/* Tolerancia Oro 5% */}
               
               <line x1="-60" y1="0" x2="-40" y2="0" stroke="#1e293b" strokeWidth="4" />
               <line x1="40" y1="0" x2="60" y2="0" stroke="#1e293b" strokeWidth="4" />
               <text y="30" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="black" className="uppercase tracking-widest">Resistor ({circuito.resistencia}Ω)</text>
            </g>

            {/* LED REACTIVO */}
            <g transform="translate(500, 200)">
               <text y="-40" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="black" className="uppercase tracking-widest">Diodo LED</text>
               
               {/* Sombra de brillo (Glow) */}
               <AnimatePresence>
                 {circuito.switchOn && !circuito.ledRoto && (
                   <motion.circle 
                     initial={{ scale: 0 }}
                     animate={{ scale: corrienteMA / 20 }}
                     exit={{ scale: 0 }}
                     r="40" fill="url(#led-gradient)" opacity={corrienteMA / 40}
                   />
                 )}
               </AnimatePresence>

               {/* Cuerpo LED */}
               <path d="M -15,-15 L 15,0 L -15,15 Z" fill={circuito.ledRoto ? '#334155' : '#22c55e'} opacity={circuito.switchOn ? 1 : 0.6} />
               <line x1="15" y1="-15" x2="15" y2="15" stroke={circuito.ledRoto ? '#334155' : '#22c55e'} strokeWidth="4" />
               
               {/* EFECTO QUEMADO */}
               {circuito.ledRoto && (
                 <g className="animate-pulse">
                    <path d="M -10,-10 L 10,10 M -10,10 L 10,-10" stroke="white" strokeWidth="2" opacity="0.5" />
                    <circle r="12" fill="black" opacity="0.3" filter="blur(4px)" />
                    <text y="5" textAnchor="middle" fill="white" fontSize="6" fontWeight="black">KABOOOM!</text>
                 </g>
               )}
            </g>

            {/* FLUJO DE ELECTRONES (Dots) */}
            {circuito.switchOn && (
               <g>
                  {[0, 0.2, 0.4, 0.6, 0.8].map(offset => (
                    <circle key={offset} r="3" fill="#facc15">
                       <animateMotion 
                          dur={`${Math.max(0.5, 5 - corrienteMA / 5)}s`}
                          repeatCount="indefinite"
                          begin={`${offset * 5}s`}
                       >
                          <mpath href="#circuit-path" />
                       </animateMotion>
                       <animate r="3;5;3" dur="0.5s" repeatCount="indefinite" />
                    </circle>
                  ))}
               </g>
            )}

            {/* DEFINICIONES */}
            <defs>
               <radialGradient id="led-gradient">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="70%" stopColor="#166534" stopOpacity="0" />
               </radialGradient>
            </defs>
         </svg>

         {/* OVERLAY FALLA CRÍTICA */}
         <AnimatePresence>
            {circuito.ledRoto && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-red-950/20 backdrop-blur-[2px] z-30 pointer-events-none flex flex-col items-center justify-center">
                  <div className="bg-red-600/10 border border-red-500/30 p-8 rounded-[2rem] text-center">
                     <AlertCircle className="text-red-500 w-16 h-16 mx-auto mb-4 animate-ping" />
                     <h3 className="text-2xl font-black text-red-500 uppercase italic">¡LED DESTRUIDO!</h3>
                     <p className="text-red-300 text-[10px] font-black tracking-widest uppercase mt-2">Corriente excedió los 35 mA (Peligro crítico)</p>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* FEEDBACK ÉXITO */}
         <AnimatePresence>
            {resultado === 'exito' && (
              <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-20 bottom-10 z-50 flex items-center justify-center">
                 <div className="bg-white rounded-3xl p-8 w-full flex items-center justify-between shadow-2xl border-b-8 border-emerald-500 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center animate-bounce">
                          <CheckCircle2 size={32} />
                       </div>
                       <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Circuito Eficiente</h3>
                          <p className="text-slate-500 font-bold text-sm">Has configurado la resistencia de protección perfecta para el sistema.</p>
                       </div>
                    </div>
                    <button 
                     onClick={() => router.push('/alumno/laboratorio/fisica')}
                     className="px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all"
                    >
                      Finalizar Práctica
                    </button>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>

         {/* MODO INSTRUCTOR */}
         <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-slate-900/40 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Simulación Activa</span>
            </div>
            <button 
             onClick={() => {
                const idealR = Math.round(seed.voltaje / 0.02);
                setInputResistencia(idealR.toString());
                setCircuito(prev => ({ ...prev, resistencia: idealR, switchOn: true }));
             }} 
             className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-3"
            >
              <Binary size={14} className="group-hover:rotate-12 transition-transform" /> Auto-Configurar (Demo)
            </button>
         </div>
      </main>
    </div>
  );
}
