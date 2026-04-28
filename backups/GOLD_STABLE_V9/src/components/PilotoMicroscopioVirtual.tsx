"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function PilotoMicroscopioVirtual() {
  const { microscopio } = useSimuladorStore();
  const { aumento, iluminacion, posicionX, posicionY, muestra } = microscopio;

  // Escala visual basada en el aumento real (logarítmica)
  // 1x -> scale 1
  // 10000x -> scale 1000 (aprox)
  const scaleValue = useMemo(() => {
    return Math.pow(aumento, 0.6);
  }, [aumento]);

  // Capas de Detalle (LOD)
  // Capa 1: Tejido (0 - 200x)
  // Capa 2: Célula (200x - 2000x)
  // Capa 3: Orgánulos (> 2000x)
  const layer = useMemo(() => {
    if (aumento < 200) return 1;
    if (aumento < 2000) return 2;
    return 3;
  }, [aumento]);

  // Estilo de iluminación (viñeta y brillo)
  const lightStyle = {
    filter: `brightness(${iluminacion / 100}) contrast(1.1) saturate(1.2)`,
    background: `radial-gradient(circle, transparent 20%, rgba(0,0,0,${Math.max(0, 0.8 - iluminacion / 100)}) 80%)`,
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden cursor-move">
      {/* Máscara Ocular */}
      <div className="absolute inset-0 z-50 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] border-[40px] border-black rounded-full" />
      
      {/* Contenedor de la Muestra */}
      <motion.div 
        className="relative w-[1000px] h-[1000px] flex items-center justify-center"
        animate={{ 
          scale: scaleValue,
          x: posicionX,
          y: posicionY,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      >
        {/* FONDO CITOPLASMÁTICO (Base) */}
        <div 
          className={`absolute inset-0 rounded-full opacity-30 blur-2xl transition-colors duration-1000 ${
            muestra === 'vegetal' ? 'bg-emerald-900/50' : 'bg-rose-900/50'
          }`} 
        />

        {/* CAPA 1: TEJIDO (MOSAICO) */}
        <AnimatePresence>
          {layer === 1 && (
            <motion.div 
              key="tissue"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-wrap gap-2 items-center justify-center pointer-events-none"
            >
              {Array.from({ length: 150 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-16 h-20 border-[1px] opacity-40 ${
                    muestra === 'vegetal' 
                      ? 'border-emerald-500/30 bg-emerald-800/20 rounded-lg' 
                      : 'border-rose-500/30 bg-rose-800/20 rounded-full'
                  }`}
                  style={{ transform: `rotate(${Math.random() * 10}deg)` }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CAPA 2: CÉLULA INDIVIDUAL */}
        <AnimatePresence>
          {layer >= 2 && (
            <motion.div 
              key="cell"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Cuerpo Celular */}
              <div 
                className={`w-[600px] h-[600px] border-2 shadow-2xl transition-all duration-1000 ${
                  muestra === 'vegetal' 
                    ? 'rounded-3xl border-emerald-400/50 bg-emerald-900/10' 
                    : 'rounded-full border-rose-400/50 bg-rose-900/10 shadow-rose-500/20'
                }`}
              />
              
              {/* Núcleo */}
              <motion.div 
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className={`absolute w-48 h-48 blur-[2px] border-4 flex items-center justify-center overflow-hidden ${
                  muestra === 'vegetal' ? 'bg-amber-900/40 border-amber-500/30' : 'bg-purple-900/40 border-purple-500/30'
                } rounded-full`}
              >
                <div className="w-20 h-20 bg-black/40 rounded-full blur-md" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CAPA 3: ORGÁNULOS (MICROESTRUCTURAS) */}
        <AnimatePresence>
          {layer === 3 && (
            <motion.div 
              key="organelles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {/* Generación de Orgánulos Aleatorios */}
              {Array.from({ length: 20 }).map((_, i) => (
                <Organelle 
                  key={i} 
                  type={muestra === 'vegetal' ? (i % 3 === 0 ? 'chloroplast' : 'mitochondria') : 'mitochondria'} 
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* FILTRO DE ILUMINACIÓN Y VIÑETA */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={lightStyle}
      />

      {/* UI DE TELEMETRÍA FLOTANTE (Solo para wow factor) */}
      <div className="absolute top-8 left-8 p-4 bg-black/40 backdrop-blur-md border border-teal-500/30 rounded-xl font-mono text-[10px] text-teal-400 z-[60]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span>REAL-TIME SPECIMEN ANALYSIS</span>
        </div>
        <div className="space-y-1 opacity-70">
          <p>RESOLUTION: {(0.61 * 550 / (0.65 + (aumento/10000))).toFixed(3)}nm</p>
          <p>CELL_TYPE: {muestra.toUpperCase()}</p>
          <p>MAG_FACTOR: {aumento}x</p>
          <p>LUMENS: {iluminacion}%</p>
        </div>
      </div>
    </div>
  );
};

const Organelle = ({ type, index }: { type: 'chloroplast' | 'mitochondria', index: number }) => {
  // Ciclosis: Los orgánulos se mueven lentamente
  const randomX = useMemo(() => -400 + Math.random() * 800, []);
  const randomY = useMemo(() => -400 + Math.random() * 800, []);
  const rotation = useMemo(() => Math.random() * 360, []);

  return (
    <motion.div
      className="absolute"
      initial={{ x: randomX, y: randomY, rotate: rotation, scale: 0 }}
      animate={{ 
        scale: 0.15,
        x: [randomX, randomX + 20, randomX],
        y: [randomY, randomY - 20, randomY],
        rotate: [rotation, rotation + 5, rotation]
      }}
      transition={{ 
        duration: 10 + Math.random() * 10, 
        repeat: Infinity, 
        ease: "linear" 
      }}
    >
      {type === 'chloroplast' ? (
        <div className="w-64 h-40 bg-emerald-600 rounded-[60%] border-4 border-emerald-400/50 flex flex-wrap p-4 gap-2 justify-center items-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          {/* Granas */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-12 h-4 bg-emerald-900 rounded-full opacity-60" />
          ))}
        </div>
      ) : (
        <div className="w-56 h-32 bg-rose-600 rounded-[50%] border-4 border-rose-400/50 p-2 overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.3)]">
          {/* Crestas Mitocondriales */}
          <div className="w-full h-full border-t-8 border-rose-900/40 rounded-full scale-y-150 rotate-45" />
          <div className="absolute inset-0 flex flex-col justify-around">
             <div className="h-1 bg-rose-900/30 w-full" />
             <div className="h-1 bg-rose-900/30 w-1/2 ml-auto" />
             <div className="h-1 bg-rose-900/30 w-3/4" />
          </div>
        </div>
      )}
    </motion.div>
  );
};
