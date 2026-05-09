import React from 'react';

export default function LoadingSimulador() {
  return (
    <div className="fixed inset-0 bg-[#F8FAFC] flex flex-col items-center justify-center z-[9999] font-['Outfit']">
      <div className="w-24 h-24 relative mb-8">
        {/* Anillos de carga concéntricos */}
        <div className="absolute inset-0 border-4 border-[#219EBC]/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-[#219EBC] border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-4 border-4 border-[#FB8500]/20 rounded-full"></div>
        <div className="absolute inset-4 border-4 border-[#FB8500] border-b-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
      </div>
      
      <h2 className="text-2xl font-black text-[#023047] uppercase tracking-widest mb-2 animate-pulse">
        Inicializando Laboratorio
      </h2>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
        Cargando motor de simulación y assets en alta fidelidad...
      </p>
      
      {/* Barra de progreso indeterminada */}
      <div className="w-64 h-1 bg-slate-200 rounded-full mt-8 overflow-hidden">
        <div className="w-1/2 h-full bg-gradient-to-r from-[#219EBC] to-[#FB8500] animate-[bounce_2s_infinite_alternate] rounded-full"></div>
      </div>
    </div>
  );
}
