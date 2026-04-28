"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimuladorStore } from "@/store/simuladorStore";
import { Plus, Minus, CheckCircle2, AlertCircle, Scale, Beaker, Info } from "lucide-react";

export default function PilotoBalanceoEcuaciones({ isWorktableDark, isProfesor }: { isWorktableDark: boolean, isProfesor: boolean }) {
  const { balanceo = { coeficientes: [1, 1, 1, 1], isBalanced: false }, setCoeficiente } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Datos Estequiométricos de Reacción: Propano + Oxígeno -> CO2 + Agua
  const reacData = useMemo(() => ({
    reactivos: {
        r1: { formula: "C3H8", name: "Propano", pesoBase: 44.1, color: "#219EBC" },
        r2: { formula: "O2", name: "Oxígeno", pesoBase: 32.0, color: "#8ECAE6" }
    },
    productos: {
        p1: { formula: "CO2", name: "Dióxido de Carbono", pesoBase: 44.0, color: "#FB8500" },
        p2: { formula: "H2O", name: "Agua", pesoBase: 18.0, color: "#FFB703" }
    }
  }), []);

  const coefs = balanceo?.coeficientes || [1, 1, 1, 1];
  
  const { pesoR, pesoP, isBalanced } = useMemo(() => {
    const r1 = (coefs[0] || 1) * reacData.reactivos.r1.pesoBase;
    const r2 = (coefs[1] || 1) * reacData.reactivos.r2.pesoBase;
    const p1 = (coefs[2] || 1) * reacData.productos.p1.pesoBase;
    const p2 = (coefs[3] || 1) * reacData.productos.p2.pesoBase;
    const pR = Math.round((r1 + r2) * 10) / 10;
    const pP = Math.round((p1 + p2) * 10) / 10;
    // El balance correcto (Propano): 1 C3H8 + 5 O2 -> 3 CO2 + 4 H2O
    const targetMatch = coefs[0] === 1 && coefs[1] === 5 && coefs[2] === 3 && coefs[3] === 4;
    return { pesoR: pR, pesoP: pP, isBalanced: targetMatch };
  }, [coefs, reacData]);

  const rotationAngle = Math.max(-20, Math.min(20, (pesoP - pesoR) * 0.4));

  if (!mounted) return <div className="p-20 text-center font-black animate-pulse text-[#219EBC]">CALIBRANDO BALANZA...</div>;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-8 pt-20 font-sans selection:bg-[#219EBC]/20">
      
      {/* ESCENA DE LA BALANZA (VFX PREMIUM) */}
      <div className="relative w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
        
        {/* Glow de Balance */}
        <AnimatePresence>
          {isBalanced && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.5 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className="absolute w-[800px] h-[400px] bg-green-400/20 blur-[120px] rounded-full -z-10 animate-pulse" 
            />
          )}
        </AnimatePresence>

        <div className="relative flex flex-col items-center">
          {/* Brazo de la Balanza */}
          <motion.div 
            animate={{ rotate: rotationAngle }} 
            transition={{ type: "spring", stiffness: 35, damping: 15 }} 
            className="relative w-[600px] h-4 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-full flex items-center justify-between px-2 shadow-2xl z-20 border-b-2 border-white/5"
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-600 border-4 border-slate-900 shadow-xl z-30" />
            
            {/* Platillo IZQUIERDO (Reactivos) */}
            <div className="absolute -left-12 top-4 flex flex-col items-center" style={{ transform: `rotate(${-rotationAngle}deg)` }}>
              <div className="w-1 h-32 bg-slate-500 opacity-40 shadow-inner" />
              <div className="relative w-56 h-12 bg-white/10 backdrop-blur-xl rounded-t-[3rem] border-b-[6px] border-slate-400 flex items-center justify-center shadow-xl overflow-hidden">
                 <div className="absolute inset-x-0 bottom-0 h-full bg-blue-500/10" style={{ transformOrigin: 'bottom', transform: `scaleY(${pesoR / 400})` }} />
                 <span className="text-[12px] font-black uppercase text-[#219EBC] z-10">{pesoR} <span className="opacity-40">u (Masa)</span></span>
              </div>
            </div>

            {/* Platillo DERECHO (Productos) */}
            <div className="absolute -right-12 top-4 flex flex-col items-center" style={{ transform: `rotate(${-rotationAngle}deg)` }}>
              <div className="w-1 h-32 bg-slate-500 opacity-40 shadow-inner" />
              <div className="relative w-56 h-12 bg-white/10 backdrop-blur-xl rounded-t-[3rem] border-b-[6px] border-slate-400 flex items-center justify-center shadow-xl overflow-hidden">
                 <div className="absolute inset-x-0 bottom-0 h-full bg-orange-500/10" style={{ transformOrigin: 'bottom', transform: `scaleY(${pesoP / 400})` }} />
                 <span className="text-[12px] font-black uppercase text-orange-600 z-10">{pesoP} <span className="opacity-40">u (Masa)</span></span>
              </div>
            </div>
          </motion.div>

          {/* Soporte de Balanza */}
          <div className="relative w-12 h-72 bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-2xl shadow-2xl border-x-2 border-slate-700">
             <div className="absolute top-10 w-full h-px bg-white/10" />
             <div className="absolute bottom-0 w-48 h-8 bg-slate-900 -ml-16 rounded-t-3xl shadow-2xl" />
          </div>
        </div>

        <motion.div 
           initial={false}
           animate={{ 
             scale: isBalanced ? 1.1 : 1, 
             color: isBalanced ? "#10B981" : "#64748B" 
           }}
           className={`mt-16 px-10 py-4 rounded-[2rem] border-2 font-black text-xs uppercase tracking-widest flex items-center gap-4 ${isBalanced ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'bg-slate-100/50 border-slate-200'}`}
        >
           {isBalanced ? <CheckCircle2 size={24} className="animate-bounce" /> : <Scale size={24} className="opacity-40" />}
           {isBalanced ? "Ecuación Balanceada (Ley de Lavoisier)" : "Estado: Desequilibrio de Masa"}
        </motion.div>
      </div>

      {/* CONTROLES DE LA ECUACIÓN (GOLD STANDARD UI) */}
      <div className={`w-full max-w-6xl ${isWorktableDark ? 'bg-slate-900/60' : 'bg-white/80'} backdrop-blur-3xl p-12 rounded-[4rem] border border-white/20 shadow-[0_50px_100px_rgba(0,0,0,0.15)] transition-all mb-4 relative overflow-hidden`}>
         
         <div className="absolute top-0 right-0 p-8 opacity-20"><Beaker size={80} className="text-[#219EBC]" /></div>

         <div className="flex items-center justify-center gap-10">
            {/* Reactivo 1 */}
            <div className="flex flex-col items-center gap-5">
               <div className="flex items-center bg-white border border-slate-200/50 rounded-2xl p-1.5 shadow-xl shadow-blue-500/5">
                  <button onClick={() => setCoeficiente(0, Math.max(1, coefs[0] - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400 group"><Minus size={18} /></button>
                  <div className="w-14 text-center font-black text-3xl text-[#219EBC]">{coefs[0]}</div>
                  <button onClick={() => setCoeficiente(0, coefs[0] + 1)} className="w-10 h-10 flex items-center justify-center bg-[#219EBC] rounded-xl text-white shadow-lg shadow-[#219EBC]/30 active:scale-95 transition-all"><Plus size={18} /></button>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-4xl font-mono font-black text-[#023047] uppercase tracking-tighter drop-shadow-sm">C<span className="text-xl align-sub">3</span>H<span className="text-xl align-sub">8</span></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{reacData.reactivos.r1.name}</span>
               </div>
            </div>

            <Plus className="text-slate-200" size={32} />

            {/* Reactivo 2 */}
            <div className="flex flex-col items-center gap-5">
               <div className="flex items-center bg-white border border-slate-200/50 rounded-2xl p-1.5 shadow-xl shadow-blue-500/5">
                  <button onClick={() => setCoeficiente(1, Math.max(1, coefs[1] - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><Minus size={18} /></button>
                  <div className="w-14 text-center font-black text-3xl text-[#219EBC]">{coefs[1]}</div>
                  <button onClick={() => setCoeficiente(1, coefs[1] + 1)} className="w-10 h-10 flex items-center justify-center bg-[#219EBC] rounded-xl text-white shadow-lg shadow-[#219EBC]/30 active:scale-95 transition-all"><Plus size={18} /></button>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-4xl font-mono font-black text-[#023047] uppercase tracking-tighter drop-shadow-sm">O<span className="text-xl align-sub">2</span></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{reacData.reactivos.r2.name}</span>
               </div>
            </div>

            {/* Flecha de Reacción */}
            <div className="flex flex-col items-center px-6">
                <div className="w-24 h-2 bg-slate-200 rounded-full relative">
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 border-l-[12px] border-l-slate-200 border-y-[8px] border-y-transparent" />
                   <motion.div 
                      animate={isBalanced ? { width: "100%" } : { width: "0%" }}
                      className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                   />
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase mt-2 tracking-widest">Reacciona</span>
            </div>

            {/* Producto 1 */}
            <div className="flex flex-col items-center gap-5">
               <div className="flex items-center bg-white border border-slate-200/50 rounded-2xl p-1.5 shadow-xl shadow-orange-500/5">
                  <button onClick={() => setCoeficiente(2, Math.max(1, coefs[2] - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><Minus size={18} /></button>
                  <div className="w-14 text-center font-black text-3xl text-orange-500">{coefs[2]}</div>
                  <button onClick={() => setCoeficiente(2, coefs[2] + 1)} className="w-10 h-10 flex items-center justify-center bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/30 active:scale-95 transition-all"><Plus size={18} /></button>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-4xl font-mono font-black text-[#023047] uppercase tracking-tighter drop-shadow-sm">CO<span className="text-xl align-sub">2</span></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{reacData.productos.p1.name}</span>
               </div>
            </div>

            <Plus className="text-slate-200" size={32} />

            {/* Producto 2 */}
            <div className="flex flex-col items-center gap-5">
               <div className="flex items-center bg-white border border-slate-200/50 rounded-2xl p-1.5 shadow-xl shadow-orange-500/5">
                  <button onClick={() => setCoeficiente(3, Math.max(1, coefs[3] - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><Minus size={18} /></button>
                  <div className="w-14 text-center font-black text-3xl text-orange-500">{coefs[3]}</div>
                  <button onClick={() => setCoeficiente(3, coefs[3] + 1)} className="w-10 h-10 flex items-center justify-center bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/30 active:scale-95 transition-all"><Plus size={18} /></button>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-4xl font-mono font-black text-[#023047] uppercase tracking-tighter drop-shadow-sm">H<span className="text-xl align-sub">2</span>O</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{reacData.productos.p2.name}</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
