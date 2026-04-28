"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Plus, Minus, CheckCircle2, Scale, Beaker, Info, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraBalanceoEcuaciones() {
  const { balanceo = { coeficientes: [1, 1, 1, 1], isBalanced: false }, setCoeficiente } = useSimuladorStore();
  const coefs = balanceo?.coeficientes || [1, 1, 1, 1];
  const isBalanced = balanceo?.isBalanced || false;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MONITORES DE COEFICIENTES */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ajuste de Coeficientes</h3>
        
        {/* Reactivos */}
        <div className="grid grid-cols-1 gap-3">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-black text-[#219EBC]">C₃H₈</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Propano</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl">
              <button onClick={() => setCoeficiente(0, Math.max(1, coefs[0] - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400"><Minus size={14} /></button>
              <span className="w-6 text-center font-black text-lg text-[#023047]">{coefs[0]}</span>
              <button onClick={() => setCoeficiente(0, coefs[0] + 1)} className="w-8 h-8 flex items-center justify-center bg-[#219EBC] text-white rounded-lg shadow-lg shadow-[#219EBC]/20 active:scale-95"><Plus size={14} /></button>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-black text-[#219EBC]">O₂</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Oxígeno</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl">
              <button onClick={() => setCoeficiente(1, Math.max(1, coefs[1] - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400"><Minus size={14} /></button>
              <span className="w-6 text-center font-black text-lg text-[#023047]">{coefs[1]}</span>
              <button onClick={() => setCoeficiente(1, coefs[1] + 1)} className="w-8 h-8 flex items-center justify-center bg-[#219EBC] text-white rounded-lg shadow-lg shadow-[#219EBC]/20 active:scale-95"><Plus size={14} /></button>
            </div>
          </div>
        </div>

        <div className="flex justify-center py-1">
          <div className="w-px h-6 bg-slate-200" />
        </div>

        {/* Productos */}
        <div className="grid grid-cols-1 gap-3">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-black text-orange-500">CO₂</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Dióxido de Carbono</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl">
              <button onClick={() => setCoeficiente(2, Math.max(1, coefs[2] - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400"><Minus size={14} /></button>
              <span className="w-6 text-center font-black text-lg text-[#023047]">{coefs[2]}</span>
              <button onClick={() => setCoeficiente(2, coefs[2] + 1)} className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-lg shadow-lg shadow-orange-500/20 active:scale-95"><Plus size={14} /></button>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-black text-orange-500">H₂O</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Agua</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl">
              <button onClick={() => setCoeficiente(3, Math.max(1, coefs[3] - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400"><Minus size={14} /></button>
              <span className="w-6 text-center font-black text-lg text-[#023047]">{coefs[3]}</span>
              <button onClick={() => setCoeficiente(3, coefs[3] + 1)} className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-lg shadow-lg shadow-orange-500/20 active:scale-95"><Plus size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ESTADO DE BALANCE */}
      <div className={`p-6 rounded-[2rem] border-2 transition-all ${isBalanced ? 'bg-green-500 text-white border-green-400 shadow-xl' : 'bg-[#023047] text-white border-white/10'}`}>
        <div className="flex items-center gap-3 mb-3">
          {isBalanced ? <CheckCircle2 size={24} className="animate-bounce" /> : <Scale size={24} className="text-[#8ECAE6]" />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isBalanced ? 'Sistema en Equilibrio' : 'Ecuación Desbalanceada'}</span>
        </div>
        <p className="text-[11px] font-bold opacity-80 leading-relaxed">
          {isBalanced 
            ? "Has cumplido la Ley de Lavoisier: la materia no se crea ni se destruye, solo se transforma." 
            : "Ajusta los coeficientes hasta que el número de átomos de cada elemento sea igual en ambos lados."}
        </p>
      </div>

      {!isBalanced && (
        <div className="bg-slate-100/50 p-4 rounded-2xl flex items-start gap-3">
          <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-slate-500 italic leading-snug">
            Tip: Empieza balanceando el Carbono, luego el Hidrógeno y deja el Oxígeno para el final.
          </p>
        </div>
      )}

    </div>
  );
}
