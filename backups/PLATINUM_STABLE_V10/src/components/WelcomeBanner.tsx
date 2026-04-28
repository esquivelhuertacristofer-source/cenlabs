"use client";

import { useEffect, useState } from "react";
import { useSimuladorStore } from "@/store/simuladorStore";
import { supabase } from "@/lib/supabase";

export default function WelcomeBanner() {
  const { user } = useSimuladorStore();
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    const fetchCompletionRate = async () => {
      // 1. Obtener total de alumnos
      const { count: totalAlumnos } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'alumno');

      // 2. Obtener alumnos que han completado al menos una práctica
      const { data: intentos } = await supabase
        .from('intentos')
        .select('id_alumno')
        .eq('status', 'completed');

      if (totalAlumnos && intentos) {
        const uniqueAlumnos = new Set(intentos.map(i => i.id_alumno)).size;
        const rate = Math.round((uniqueAlumnos / totalAlumnos) * 100);
        setCompletionRate(rate);
      }
    };

    fetchCompletionRate();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#023047] p-8 md:p-10 shadow-2xl shadow-[#023047]/20 transition-all duration-700 hover:shadow-3xl hover:shadow-[#023047]/30 group border border-white/10">
      
      {/* Mesh Gradient Background Elements */}
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#219EBC] opacity-20 blur-[100px] animate-pulse" />
      <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-[#FB8500] opacity-10 blur-[80px]" />
      
      {/* Decorative Blueprint Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>

      {/* Content Area */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
        
        <div className="max-w-xl text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-2">
            <div className="h-2 w-2 rounded-full bg-[#FB8500] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]" style={{ fontFamily: "Outfit, sans-serif" }}>
              Panel de Control de Centro
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Bienvenido de nuevo,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8ECAE6] to-white">
              {user?.full_name?.split(' ')[0] || "Profesor"} 👋
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed max-w-md">
            El <span className="text-[#FFB703] font-black underline decoration-2 underline-offset-4 decoration-[#FFB703]/30">{completionRate}%</span> de tus grupos han completado sus prácticas semanales con éxito.
          </p>
          
          <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
            <a 
              href="/alumnos"
              className="px-6 py-3 bg-[#FB8500] hover:bg-[#FFB703] text-white font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-widest" 
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Ver Alumnos
            </a>
            <a 
              href="/auditoria"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/10 backdrop-blur-md transition-all text-sm uppercase tracking-widest" 
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Auditoria de Datos
            </a>
          </div>
        </div>

        {/* ── Visual Asset ── */}
        <div className="relative w-full max-w-[340px] md:max-w-[420px] aspect-square transform transition-all duration-1000 group-hover:scale-105 group-hover:-rotate-1 shrink-0">
          <img 
            src="/images/teacher-dashboard-banner.png" 
            alt="CEN Labs Illustration" 
            className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#219EBC]/20 to-transparent rounded-full blur-3xl -z-10" />
        </div>

      </div>
    </div>
  );
}
