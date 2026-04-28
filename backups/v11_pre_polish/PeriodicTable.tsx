"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Zap } from 'lucide-react';

interface Element {
  z: number;
  symbol: string;
  name: string;
  mass: number;
  category: string;
  color: string;
  x: number;
  y: number;
}

const tableData: Element[] = [
  { z: 1, symbol: "H", name: "Hidrógeno", mass: 1.008, category: "No Metal", color: "#219EBC", x: 1, y: 1 },
  { z: 2, symbol: "He", name: "Helio", mass: 4.002, category: "Gas Noble", color: "#FB8500", x: 18, y: 1 },
  { z: 3, symbol: "Li", name: "Litio", mass: 6.941, category: "Alcalino", color: "#E63946", x: 1, y: 2 },
  { z: 4, symbol: "Be", name: "Berilio", mass: 9.012, category: "Alcalinotérreo", color: "#457B9D", x: 2, y: 2 },
  { z: 5, symbol: "B", name: "Boro", mass: 10.81, category: "Metaloide", color: "#A8DADC", x: 13, y: 2 },
  { z: 6, symbol: "C", name: "Carbono", mass: 12.01, category: "No Metal", color: "#1D3557", x: 14, y: 2 },
  { z: 7, symbol: "N", name: "Nitrógeno", mass: 14.00, category: "No Metal", color: "#1D3557", x: 15, y: 2 },
  { z: 8, symbol: "O", name: "Oxígeno", mass: 16.00, category: "No Metal", color: "#1D3557", x: 16, y: 2 },
  { z: 9, symbol: "F", name: "Flúor", mass: 19.00, category: "Halógeno", color: "#8ECAE6", x: 17, y: 2 },
  { z: 10, symbol: "Ne", name: "Neón", mass: 20.18, category: "Gas Noble", color: "#FB8500", x: 18, y: 2 },
  // ... Expandir según necesidad, añadimos los básicos para la simulación
];

export default function PeriodicTable() {
  const [selected, setSelected] = useState<Element | null>(null);

  return (
    <div className="w-full h-full flex flex-col gap-6 p-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consulta de Elementos (Z 1-10)</p>
        <div className="flex gap-2">
           {["Alcalino", "Gas Noble", "No Metal"].map(cat => (
             <div key={cat} className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tableData.find(e => e.category === cat)?.color }} />
                <span className="text-[10px] font-bold text-slate-500">{cat}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="relative grid grid-cols-18 gap-1 h-full max-h-[400px]">
        {tableData.map((el) => (
          <motion.div 
            key={el.z}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            onClick={() => setSelected(el)}
            className="aspect-square rounded-lg border border-slate-200 p-1 flex flex-col items-center justify-center cursor-pointer transition-colors shadow-sm bg-white"
            style={{ 
              gridColumn: el.x, 
              gridRow: el.y,
              borderLeftWidth: '4px',
              borderLeftColor: el.color
            }}
          >
            <span className="text-[8px] font-black text-slate-400 absolute top-1 left-2">{el.z}</span>
            <span className="text-sm font-black text-[#023047]">{el.symbol}</span>
            <span className="text-[7px] font-bold text-slate-400 uppercase truncate w-full text-center">{el.name}</span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-[#023047] rounded-[2rem] p-6 text-white flex gap-6 items-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
               <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white"><X size={18}/></button>
            </div>
            <div className="w-24 h-24 rounded-3xl bg-white/10 flex flex-col items-center justify-center border border-white/10">
               <span className="text-4xl font-black">{selected.symbol}</span>
               <span className="text-[10px] opacity-50 font-black">Z: {selected.z}</span>
            </div>
            <div className="flex-1 space-y-2">
               <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{selected.name}</h3>
                  <span className="px-3 py-0.5 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest">{selected.category}</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Masa Atómica</p>
                    <p className="text-lg font-black">{selected.mass} u</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Configuración</p>
                    <p className="text-lg font-black text-[#219EBC]">{selected.z} e-</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
