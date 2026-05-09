"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { 
  Flame, Snowflake, Thermometer, Zap, 
  RotateCcw, Info, ArrowRight, Layout,
  MousePointer2, AlertCircle, Beaker as BeakerIcon,
  Layers, Wind, Waves, Gauge, Activity
} from 'lucide-react';

// --- COMPONENTE: PEDESTAL 3D (ISOMÉTRICO) ---
const Pedestal3D = ({ color, active, label, icon: Icon, onClick }: any) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="relative cursor-pointer group"
      onClick={onClick}
    >
      {/* Etiqueta Flotante */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
        <div className="px-4 py-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl">
           <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
        </div>
        <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
      </div>

      <div className="relative w-64 h-32 preserve-3d">
        {/* Lado Superior (Top) */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 shadow-2xl transition-colors duration-500 ${active ? 'ring-2 ring-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]' : ''}`}>
           <div className="absolute inset-0 flex items-center justify-center">
              <Icon className={`w-10 h-10 transition-all duration-700 ${active ? 'text-white scale-125' : 'text-slate-600'}`} />
           </div>
           {/* Glow central */}
           <div className={`absolute inset-8 blur-3xl rounded-full transition-opacity duration-1000 ${active ? 'opacity-40' : 'opacity-0'}`} style={{ backgroundColor: color }} />
        </div>

        {/* Lado Frontal (Front) con Grosor */}
        <div className="absolute -bottom-8 inset-x-0 h-8 bg-slate-950/80 rounded-b-2xl border-x border-b border-white/5" />
      </div>

      {/* Sombra en el suelo */}
      <div className="absolute -bottom-12 inset-x-4 h-12 bg-black/40 blur-2xl rounded-full -z-10 group-hover:scale-110 transition-transform duration-500" />
    </motion.div>
  );
};

export default function PilotoSolubilidadCristalizacion() {
  const { solubilidad, setUbicacionVaso, addSalSolubilidad, setSustanciaSolubilidad, updateTemperaturaP6, resetP6 } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const tempInterval = useRef<NodeJS.Timeout | null>(null);

  // --- MOUSE PARALLAX LOGIC ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  
  const rotateX = useTransform(springY, [-500, 500], [5, -5]);
  const rotateY = useTransform(springX, [-500, 500], [-5, 5]);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = clientX - window.innerWidth / 2;
      const y = clientY - window.innerHeight / 2;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (tempInterval.current) clearInterval(tempInterval.current);
    tempInterval.current = setInterval(() => {
      updateTemperaturaP6(0.5);
    }, 100);
    return () => { if (tempInterval.current) clearInterval(tempInterval.current); };
  }, [solubilidad.ubicacion, updateTemperaturaP6]);



  if (!mounted) return null;

  // Fallback substances to avoid crashes if store state hasn't updated yet
  const sustanciasFallback = [
    { id: 'kno3', nombre: 'Nitrato de Potasio', formula: 'KNO₃', color: '#ffffff', a: 31.6, b: 0.02, desc: 'Alta dependencia térmica.' },
    { id: 'nacl', nombre: 'Cloruro de Sodio', formula: 'NaCl', color: '#f8fafc', a: 35.7, b: 0.001, desc: 'Curva casi plana.' },
    { id: 'cuso4', nombre: 'Sulfato de Cobre (II)', formula: 'CuSO₄', color: '#3b82f6', a: 14.3, b: 0.025, desc: 'Cristales azules vibrantes.' },
    { id: 'kclo3', nombre: 'Clorato de Potasio', formula: 'KClO₃', color: '#e2e8f0', a: 3.3, b: 0.04, desc: 'Muy baja solubilidad en frío.' }
  ];

  const sustancias = solubilidad.sustancias || sustanciasFallback;
  const sIdx = (typeof solubilidad.sustanciaIdx === 'number') ? solubilidad.sustanciaIdx : 0;
  const sActual = sustancias[sIdx] || sustancias[0];

  const limite = sActual.a * Math.exp(sActual.b * solubilidad.temp);
  const salSolida = Math.max(0, solubilidad.salAgregada - limite);
  const saturationRatio = Math.min(1, solubilidad.salAgregada / (limite || 1));
  const numCristales = Math.min(150, Math.floor(salSolida * 1.2));

  // Alerta de Cristalización Narrativa
  useEffect(() => {
    if (salSolida > 1 && solubilidad.ubicacion === 'hielo') {
      audio?.playNotification();
    }
  }, [salSolida > 1, solubilidad.ubicacion === 'hielo']);

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden flex flex-col items-center justify-center font-sans perspective-[2000px]">
      
      {/* ── FONDO AMBIENTAL TRIDIMENSIONAL ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Suelo Isométrico */}
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t from-black to-transparent transform-gpu skew-x-[-20deg] scale-y-[0.5] origin-bottom opacity-40">
           <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
        </div>

        {/* Luces Ambientales Volumétricas */}
        <div className="absolute -top-1/2 -left-1/4 w-[150vw] h-[150vw] bg-[radial-gradient(circle_at_center,rgba(33,158,188,0.05)_0%,transparent_70%)]" />
        
        {/* Estrellas/Polvo en suspensión (3D Depth) */}
        {[...Array(20)].map((_, i) => (
          <motion.div 
            key={i}
            animate={{ 
              y: [-20, 20, -20], 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-white rounded-full blur-[1px]"
            style={{ 
              width: 2 + i % 3, 
              height: 2 + i % 3,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              zIndex: i % 2 === 0 ? 10 : 60
            }}
          />
        ))}
      </div>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-20">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Estado del Reactor Térmico
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Solubility Status HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${solubilidad.salAgregada > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Reactivo</div>
              <div className={`text-sm font-black italic ${solubilidad.salAgregada > 0 ? 'text-orange-400' : 'text-white/20'}`}>{solubilidad.salAgregada > 0 ? 'CARGADO' : 'PENDIENTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${solubilidad.temp > 25 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Energía</div>
              <div className={`text-sm font-black italic ${solubilidad.temp > 25 ? 'text-red-400' : 'text-white/20'}`}>{solubilidad.temp > 25 ? 'ALTA' : 'AMBIENTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${salSolida > 0 ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Precipitación</div>
              <div className={`text-sm font-black italic ${salSolida > 0 ? 'text-cyan-400' : 'text-white/20'}`}>{salSolida > 0 ? 'ACTIVA' : 'SOLUBLE'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ESCENA PRINCIPAL (WITH MOUSE PARALLAX) ── */}
      <motion.div 
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative w-full max-w-7xl h-[700px] flex items-center justify-center px-20 pt-20"
      >
        
        {/* ── CONTENEDOR DE ESTACIONES ── */}
        <div className="absolute bottom-40 inset-x-20 flex justify-between items-end preserve-3d">
          
          <Pedestal3D 
            label="Estación Térmica"
            color="#fb8500"
            active={solubilidad.ubicacion === 'parrilla'}
            icon={Flame}
            onClick={() => { 
              setUbicacionVaso('parrilla'); 
              audio.playPop(); 
              audio.playNotification();
            }}
          />

          <Pedestal3D 
            label="Zona de Trabajo"
            color="#ffffff"
            active={solubilidad.ubicacion === 'mesa'}
            icon={Layout}
            onClick={() => { 
              setUbicacionVaso('mesa'); 
              audio.playPop(); 
              audio.playNotification();
            }}
          />

          <Pedestal3D 
            label="Cámara Criogénica"
            color="#219ebc"
            active={solubilidad.ubicacion === 'hielo'}
            icon={Snowflake}
            onClick={() => { 
              setUbicacionVaso('hielo'); 
              audio.playPop(); 
              audio.playNotification();
            }}
          />

        </div>

        {/* ── EL VASO DE PRECIPITADOS (ENTITY 3D) ── */}
        <motion.div 
          layout
          transition={{ type: 'spring', damping: 20, stiffness: 80 }}
          className={`absolute bottom-[320px] z-50 pointer-events-none flex flex-col items-center preserve-3d
             ${solubilidad.ubicacion === 'parrilla' ? 'left-[20%] -translate-x-1/2' : (solubilidad.ubicacion === 'hielo' ? 'left-[80%] -translate-x-1/2' : 'left-1/2 -translate-x-1/2')}`}
        >
          {/* Beaker Logic 3D */}
          <div className="relative w-48 h-64 group preserve-3d">
            
            {/* Cuerpo del Vaso (Cilíndrico con profundidad) */}
            <div className="absolute inset-0 bg-white/[0.05] backdrop-blur-2xl rounded-b-[4rem] border-[1px] border-white/20 shadow-[0_0_100px_rgba(255,255,255,0.05)] overflow-hidden">
               
               {/* Marcas de Graduación (Isometric look) */}
               <div className="absolute left-0 inset-y-0 w-12 flex flex-col justify-around py-16 opacity-20">
                  {[250, 200, 150, 100, 50].map(m => (
                    <div key={m} className="flex items-center gap-2">
                      <div className={`h-[1px] bg-white ${m % 100 === 0 ? 'w-6' : 'w-3'}`} />
                      <span className="text-[7px] font-black text-white italic">{m}</span>
                    </div>
                  ))}
               </div>

               {/* LÍQUIDO DINÁMICO VOLUMÉTRICO */}
               <motion.div 
                  initial={{ height: '70%' }}
                  animate={{ 
                    height: '70%', 
                    background: `linear-gradient(to top, ${sActual.color}33, ${sActual.color}0D)`
                  }}
                  className="absolute bottom-0 left-0 right-0 border-t border-white/20"
               >
                  {/* EFECTOS DE CALOR (Vapor Volumétrico) */}
                  <AnimatePresence>
                    {solubilidad.temp > 70 && solubilidad.ubicacion === 'parrilla' && (
                      <div className="absolute -top-32 inset-x-0 flex justify-center gap-2 pointer-events-none">
                        {[1, 2, 3, 4].map(i => (
                          <motion.div 
                            key={i}
                            initial={{ y: 20, opacity: 0, scale: 0.5 }}
                            animate={{ y: -200, opacity: [0, 0.6, 0], scale: [0.5, 2, 3] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
                            className="w-16 h-16 bg-white/5 rounded-full blur-[40px]"
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>

                  {/* CRISTALES (3D DEPTH LAYERING) */}
                  <div className="absolute bottom-6 inset-x-8 h-full flex flex-wrap-reverse items-start justify-center gap-1.5 overflow-hidden preserve-3d">
                     {/* Capa Trasera (Difusa) */}
                     {Array.from({ length: Math.floor(numCristales * 0.4) }).map((_, i) => (
                        <motion.div 
                          key={`back-${i}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 0.6, opacity: 0.5, rotate: i * 45 }}
                          className="w-2 h-2 blur-[2px] rounded-sm"
                          style={{ 
                            backgroundColor: sActual.color, 
                            opacity: 0.4,
                            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' 
                          }}
                        />
                     ))}
                     
                     {/* Capa Frontal (Nítida) */}
                     <AnimatePresence>
                        {Array.from({ length: Math.floor(numCristales * 0.6) }).map((_, i) => (
                           <motion.div 
                              key={`front-${i}`}
                              initial={{ scale: 0, y: -40, opacity: 0 }}
                              animate={{ 
                                 scale: 1, 
                                 y: 0,
                                 opacity: 1,
                                 rotate: i * 137.5,
                              }}
                              transition={{ 
                                 type: 'spring', 
                                 damping: 15,
                                 stiffness: 100,
                                 delay: i * 0.005 
                              }}
                              className={`w-4 h-4 shadow-[0_0_15px_rgba(255,255,255,0.4)]`}
                              style={{ 
                                 backgroundColor: sActual.color,
                                 clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                 zIndex: 100 + i
                              }}
                           />
                        ))}
                     </AnimatePresence>
                  </div>
                  
                  {/* Cáusticas de luz en el líquido */}
                  <motion.div 
                    animate={{ x: [-20, 20, -20], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent)] blur-xl" 
                  />
               </motion.div>
            </div>

            {/* Borde Superior (3D Rim) */}
            <div className="absolute -top-4 left-0 right-0 h-8 bg-white/10 rounded-full border border-white/30 skew-x-[-5deg] backdrop-blur-sm" />

            {/* Reflejos de Cristal (Highlights) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 rounded-b-[4rem] pointer-events-none border-r border-white/5" />
          </div>
          
          {/* Beaker Shadow (Interactive) */}
          <motion.div 
             animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
             transition={{ duration: 4, repeat: Infinity }}
             className="w-40 h-8 mt-10 bg-black/80 blur-3xl rounded-full" 
          />
        </motion.div>

        {/* ── FLOATING TELEMETRY HUD (PARALLAX) ── */}
        <div className="absolute top-0 inset-x-0 h-40 flex justify-between items-start pointer-events-none preserve-3d">
           <motion.div 
             style={{ translateZ: 100 }}
             className="flex flex-col gap-2"
           >
              <div className="px-5 py-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                 <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Thermal Telemetry</span>
              </div>
              <h2 className="text-6xl font-black text-white italic tracking-tighter flex items-baseline gap-3">
                 {solubilidad.temp.toFixed(1)} <span className="text-2xl text-slate-500 not-italic uppercase tracking-widest font-bold">deg.C</span>
              </h2>
              <div className="mt-2 text-xs font-black text-[#FB8500] uppercase tracking-widest flex items-center gap-2">
                 <Info size={14} />
                 <span>Substancia: {sActual.nombre}</span>
              </div>
           </motion.div>

           <motion.div 
             style={{ translateZ: 100 }}
             className="flex flex-col items-end gap-4"
           >
              <div className="p-8 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl flex items-center gap-10">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Masa Soluto</span>
                    <span className="text-3xl font-black text-white tabular-nums">{solubilidad.salAgregada.toFixed(1)}g</span>
                 </div>
                 <div className="w-px h-12 bg-white/10" />
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado Químico</span>
                    <div className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter ${salSolida > 0 ? 'bg-orange-500 text-black' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                       {salSolida > 0 ? 'SOBRESATURADA' : (saturationRatio > 0.9 ? 'SATURADA' : 'INSATURADA')}
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>

      </motion.div>

      {/* ── PANEL DE CONTROL INFERIOR (DIAMOND DOCK) ── */}
      <div className="absolute bottom-10 inset-x-10 flex justify-between items-end z-[100]">
        
        {/* Dock de Acciones con Selector de Substancias */}
        <div className="group p-3 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex items-center gap-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
           <div className="flex flex-col px-6 border-r border-white/10">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Selector de Reactivo</span>
              <div className="flex gap-2">
                 {sustancias.map((s: any, i: number) => (
                    <button 
                       key={s.id}
                       onClick={() => { setSustanciaSolubilidad(i); audio.playPop(); }}
                       className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${sIdx === i ? 'bg-orange-500 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)] text-black' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                       title={s.nombre}
                    >
                       <span className="text-[9px] font-black">{s.formula.slice(0, 3)}</span>
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="flex gap-3 p-1">
              <button 
                onClick={() => { addSalSolubilidad(20); audio.playPop(); }}
                disabled={solubilidad.salAgregada >= 200}
                className="group relative flex items-center gap-4 px-10 py-6 bg-orange-500 hover:bg-orange-400 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl shadow-orange-500/30 overflow-hidden"
              >
                <span>Añadir 20g</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => { resetP6(); audio.playRemove(); }}
                className="w-20 h-20 bg-slate-800 hover:bg-red-500 text-white rounded-[2.5rem] flex items-center justify-center transition-all border border-white/5 shadow-xl"
                title="Reset Reactor"
              >
                <RotateCcw className="w-7 h-7" />
              </button>
           </div>
        </div>

        {/* HUD DE RENDIMIENTO (DERECHA) */}
        <div className="flex flex-col gap-6 items-end">
           <div className="p-8 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl min-w-[320px] preserve-3d">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Gauge className="w-4 h-4 text-[#219ebc]" />
                   </div>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Capacidad Máxima</span>
                 </div>
                 <span className="text-xs font-black text-white italic">{limite.toFixed(1)}g</span>
              </div>
              
              <div className="relative h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 p-1">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${saturationRatio * 100}%` }}
                    className={`h-full rounded-full transition-colors duration-1000 ${saturationRatio >= 1 ? 'bg-orange-500 shadow-[0_0_30px_#f97316]' : 'bg-[#219EBC] shadow-[0_0_30px_#219ebc]'}`}
                 />
              </div>
              
              <p className="mt-3 text-[9px] text-slate-500 leading-tight italic font-bold">{sActual.desc}</p>
           </div>

           <div className="flex gap-3">
              <div className="px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
                 <Waves className="w-4 h-4 text-cyan-400" />
                 <span className="text-[9px] font-black text-white/80 uppercase tracking-widest italic">H₂O Pura: 100mL</span>
              </div>
              <div className="px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
                 <Gauge className="w-4 h-4 text-slate-400" />
                 <span className="text-[9px] font-black text-white/80 uppercase tracking-widest italic">1.0 ATM</span>
              </div>
           </div>
        </div>
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
      `}</style>

    </div>
  );
}
