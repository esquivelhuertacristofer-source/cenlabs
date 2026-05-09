import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';

// Tipos de monómeros para renderizado
const Monomero = ({ type, x, y, delay }: { type: string, x: number, y: number, delay: number }) => {
    // Colores según nutriente
    const colors: Record<string, string> = {
        almidon: '#10B981', // Verde Glucosa
        proteina: '#8B5CF6', // Violeta Aminoácido
        lipido: '#FBBF24'    // Amarillo Ácido Graso
    };

    return (
        <motion.circle
            initial={{ cx: x, cy: y, opacity: 0 }}
            animate={{ 
                cx: x + (Math.random() * 20 - 10), 
                cy: y + 100, // Cae a la sangre
                opacity: [0, 1, 1, 0] 
            }}
            transition={{ duration: 2, delay, ease: "easeIn" }}
            r="4"
            fill={colors[type] || '#ccc'}
            filter="drop-shadow(0 0 4px rgba(0,0,0,0.2))"
        />
    );
};

export default function PilotoSistemaDigestivo() {
  const { digestion, setDigestion } = useSimuladorStore();
  const { macronutriente, enzimaSeleccionada, nivelPH, estado, monomerosAbsorbidos } = digestion;
  
  const [monomeros, setMonomeros] = useState<any[]>([]);

  // Efecto de color de fondo basado en pH
  const getPHColor = (ph: number) => {
    if (ph < 4) return 'rgba(239, 68, 68, 0.05)'; // Ácido fuerte (Rojo)
    if (ph < 6) return 'rgba(245, 158, 11, 0.05)'; // Ácido débil (Naranja/Amarillo)
    if (ph < 8) return 'rgba(16, 185, 129, 0.05)'; // Neutro (Verde)
    return 'rgba(6, 182, 212, 0.05)'; // Alcalino (Azul)
  };

  useEffect(() => {
    if (estado === 'digerido' && monomerosAbsorbidos < 100) {
        // Simular catálisis y absorción
        const id = setInterval(() => {
            setDigestion({ 
                monomerosAbsorbidos: Math.min(100, monomerosAbsorbidos + 10) 
            });
            
            // Spawn monómeros visuales
            const newMons = Array.from({ length: 5 }).map((_, i) => ({
                id: Date.now() + i,
                x: 200 + Math.random() * 400,
                y: 150 + Math.random() * 50
            }));
            setMonomeros(prev => [...prev.slice(-20), ...newMons]);

            if (monomerosAbsorbidos + 10 >= 100) {
                setDigestion({ estado: 'absorbido' });
                clearInterval(id);
            }
        }, 800);
        return () => clearInterval(id);
    }
  }, [estado, monomerosAbsorbidos, setDigestion]);

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden bg-white rounded-3xl" style={{ backgroundColor: getPHColor(nivelPH) }}>
      
      {/* 1. SECCIÓN SUPERIOR: ÓRGANO / BIORREACTOR */}
      <div className="flex-1 relative p-12 overflow-hidden">
        
        {/* Leyenda de PH */}
        <div className="absolute top-6 left-6 flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 transition-colors bg-white ${
                nivelPH < 6 ? 'text-rose-500' : nivelPH > 8 ? 'text-cyan-500' : 'text-emerald-500'
            }`}>
               Entorno: {nivelPH < 6 ? 'Estómago (HCl)' : nivelPH > 8 ? 'Intestino (Sales)' : 'Duodeno'}
            </div>
        </div>

        {/* Polímero Central */}
        <div className="absolute inset-0 flex items-center justify-center">
            <svg width="800" height="400" viewBox="0 0 800 400" className="overflow-visible">
                <defs>
                    <linearGradient id="bloodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#991b1b" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="denature">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                        <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
                    </filter>
                </defs>

                {/* Vellosidades intestinales (Frontera) */}
                <path 
                    d="M 0 300 Q 20 280 40 300 T 80 300 T 120 300 T 160 300 T 200 300 T 240 300 T 280 300 T 320 300 T 360 300 T 400 300 T 440 300 T 480 300 T 520 300 T 560 300 T 600 300 T 640 300 T 680 300 T 720 300 T 760 300 T 800 300"
                    fill="none" stroke="#fecaca" strokeWidth="4" strokeLinecap="round"
                />

                {/* Sangre fluyendo horizontalmente */}
                <motion.rect 
                    animate={{ x: [-100, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    x="0" y="320" width="1000" height="60" fill="url(#bloodGrad)" rx="10"
                />
                
                {/* Glóbulos rojos simplificados */}
                {[...Array(10)].map((_, i) => (
                    <motion.circle 
                        key={i}
                        animate={{ x: [-100, 900] }}
                        transition={{ repeat: Infinity, duration: 4, delay: i * 0.4, ease: "linear" }}
                        cy={350 + (i % 3) * 5} r="5" fill="#f87171" opacity="0.5"
                    />
                ))}

                {/* Macronutriente (Polímero) */}
                <AnimatePresence>
                    {(estado === 'intacto') && (

                        <motion.g 
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="pointer-events-none"
                        >
                            {macronutriente === 'almidon' && (
                                <g transform="translate(400, 150)">
                                    {[...Array(6)].map((_, i) => (
                                        <motion.path 
                                            key={i}
                                            d="M -15 -10 L 15 -10 L 25 0 L 15 10 L -15 10 L -25 0 Z"
                                            fill="#10B981"
                                            x={i * 45 - 110}
                                            transform={`translate(${i * 45 - 110}, 0)`}
                                            stroke="#065f46" strokeWidth="2"
                                        />
                                    ))}
                                    <path d="M -110 0 L 110 0" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" />
                                </g>
                            )}
                            {macronutriente === 'proteina' && (
                                <g transform="translate(400, 150)">
                                    {[...Array(6)].map((_, i) => (
                                        <motion.circle 
                                            key={i}
                                            r="18"
                                            fill={['#3B82F6', '#8B5CF6', '#EC4899'][i % 3]}
                                            cx={i * 40 - 100}
                                            stroke="#1e3a8a" strokeWidth="2"
                                        />
                                    ))}
                                    <path d="M -100 0 L 100 0" stroke="#1e3a8a" strokeWidth="2" strokeDasharray="4 4" />
                                </g>
                            )}
                            {macronutriente === 'lipido' && (
                                <g transform="translate(350, 120)">
                                    <rect width="10" height="80" fill="#FBBF24" rx="5" />
                                    <rect x="10" y="10" width="60" height="10" fill="#FBBF24" rx="5" />
                                    <rect x="10" y="35" width="60" height="10" fill="#FBBF24" rx="5" />
                                    <rect x="10" y="60" width="60" height="10" fill="#FBBF24" rx="5" />
                                </g>
                            )}
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Enzima Inyectada */}
                <AnimatePresence>
                    {enzimaSeleccionada && (
                        <motion.g
                            initial={{ x: 400, y: -50, opacity: 0 }}
                            animate={{ 
                                x: 400, 
                                y: estado === 'desnaturalizado' ? 250 : 150, 
                                opacity: 1,
                                filter: estado === 'desnaturalizado' ? 'url(#denature)' : 'none'
                            }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: "spring", stiffness: 50 }}
                        >
                            <path 
                                d="M -20 -20 A 25 25 0 1 1 20 -20 L 0 0 Z" 
                                fill={estado === 'desnaturalizado' ? '#94A3B8' : '#219EBC'} 
                                stroke={estado === 'desnaturalizado' ? '#475569' : '#023047'} strokeWidth="3"
                                transform="rotate(180)"
                            />
                            {/* Ojos de Pacmanenzima */}
                            <circle cx="-5" cy="-8" r="2" fill="white" />
                            {/* Glow efecto si es activa */}
                            {estado === 'digerido' && (
                                <motion.circle 
                                    animate={{ r: [30, 40, 30] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    r="30" fill="#219EBC" fillOpacity="0.2"
                                />
                            )}
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Monómeros cayendo */}
                {monomeros.map(m => (
                    <Monomero key={m.id} type={macronutriente} x={m.x} y={m.y} delay={0} />
                ))}

            </svg>
        </div>

        {/* Notificaciones / Feedback Visual */}
        <AnimatePresence>
            {estado === 'desnaturalizado' && (
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-40 left-1/2 -translate-x-1/2 bg-rose-50 border border-rose-200 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl shadow-rose-500/10"
                >
                    <div className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center font-black">!</div>
                    <div>
                        <p className="text-[11px] font-black text-rose-600 uppercase">Enzima Desnaturalizada</p>
                        <p className="text-[10px] font-bold text-rose-400 uppercase">El pH no es el óptimo para esta enzima</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>

      {/* 2. PIE DE PÁGINA: GLOSARIO INTERACTIVO */}
      <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-around">
          {[
              { label: 'Hidrólisis', desc: 'Ruptura química mediante agua' },
              { label: 'Especifidad', desc: 'Modelo Llave-Cerradura' },
              { label: 'Absorción', desc: 'Paso al torrente sanguíneo' }
          ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                  <span className="text-[10px] font-bold text-slate-500">{item.desc}</span>
              </div>
          ))}
      </div>
    </div>
  );
};
