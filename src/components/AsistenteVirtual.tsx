"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, CheckCircle2, FlaskConical, Microscope } from "lucide-react";
import Image from "next/image";

type MascotType = "dr_quantum" | "dra_helix";
type PoseType = "neutral" | "happy" | "warning";

interface AsistenteVirtualProps {
  isVisible: boolean;
  onClose: () => void;
  text: string;
  mascot?: MascotType;
  pose?: PoseType;
  title?: string;
  showButton?: boolean;
  variant?: 'fixed' | 'inline' | 'sidebar-hud';
}

export default function AsistenteVirtual({
  isVisible,
  onClose,
  text,
  mascot = "dr_quantum",
  pose = "neutral",
  title = "INSTRUCCIONES",
  showButton = true,
  variant = 'fixed'
}: AsistenteVirtualProps) {
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const mascotPath = `/assets/art/mascotas/${mascot}_${pose}.png`;

  if (variant === 'sidebar-hud') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full bg-black/40 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-white/10 flex items-center gap-6 shadow-2xl relative overflow-hidden group"
          >
            {/* Glow Decorativo de fondo */}
            <div className={`absolute -left-10 -top-10 w-40 h-40 blur-[80px] opacity-20 rounded-full ${mascot === 'dr_quantum' ? 'bg-[#219EBC]' : 'bg-pink-500'}`} />
            
            {/* Mascota (Izquierda) */}
            <div className="relative w-24 h-24 flex-shrink-0">
               {!imgError ? (
                 <Image 
                   src={mascotPath} 
                   alt={mascot} 
                   fill 
                   className="object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform" 
                   onError={() => setImgError(true)}
                 />
               ) : (
                 <div className="w-full h-full rounded-2xl bg-white/5 flex items-center justify-center text-[10px] text-white/20 font-black border border-dashed border-white/10">IMG</div>
               )}
            </div>

            {/* Diálogo (Derecha) */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
               <div className="flex items-center gap-2 mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${mascot === 'dr_quantum' ? 'bg-[#219EBC]' : 'bg-pink-500'}`} />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{title}</span>
               </div>
               <p className="text-[13px] font-bold text-slate-200 leading-tight line-clamp-3">
                 {text}
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className={`${variant === 'fixed' ? 'fixed bottom-10 left-10 z-[110] max-w-md' : 'relative w-full z-10'} flex flex-col items-start gap-2 pointer-events-none`}
        >
          {/* Burbuja de Diálogo Glassmorphic */}
          <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.3)] pointer-events-auto">
            {/* Cabecera */}
            <div className="flex items-center gap-2 mb-4">
              {mascot === "dr_quantum" ? (
                <FlaskConical size={16} className="text-[#219EBC]" />
              ) : (
                <Microscope size={16} className="text-pink-500" />
              )}
              <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                {title}
              </span>
            </div>

            {/* Texto del Diálogo */}
            <p className="text-white text-lg font-bold leading-relaxed mb-6">
              {text}
            </p>

            {/* Botón de Acción */}
            {showButton && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="group flex items-center gap-3 bg-[#219EBC] hover:bg-[#8ECAE6] text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-[#219EBC]/20 transition-all"
              >
                <span className="text-[11px] font-black uppercase tracking-widest">
                  Entendido, ¡Génesis!
                </span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}

            {/* Decoración Z-index para el nombre del científico */}
            <div className="absolute -top-4 left-10 px-4 py-1.5 bg-[#0A1121] border border-white/10 rounded-full shadow-lg">
              <span className="text-[9px] font-black text-[#219EBC] uppercase tracking-widest">
                {mascot === "dr_quantum" ? "Dr. Quantum" : "Dra. Helix"}
              </span>
            </div>
          </div>

          {/* Imagen de la Mascota */}
          <div className="relative w-48 h-48 -mr-12 -mt-16 pointer-events-none">
            {!imgError ? (
              <Image
                src={mascotPath}
                alt={mascot}
                width={200}
                height={200}
                className="object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                onError={() => setImgError(true)}
              />
            ) : (
              // Marcador de posición mientras se suben las imágenes
              <div className="w-full h-full bg-gradient-to-tr from-slate-700 to-slate-800 rounded-full border-4 border-white/20 flex items-center justify-center text-white/20 font-black text-center text-xs p-4 border-dashed">
                [Esperando imagen: {mascot}_{pose}.webp]
              </div>
            )}
            
            {/* Glow debajo de la mascota */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-6 blur-xl rounded-full opacity-50 ${mascot === "dr_quantum" ? 'bg-[#219EBC]' : 'bg-pink-500'}`} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
