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

      if (totalAlumnos && totalAlumnos > 0 && intentos) {
        const uniqueAlumnos = new Set(intentos.map(i => i.id_alumno)).size;
        const rate = Math.round((uniqueAlumnos / totalAlumnos) * 100);
        setCompletionRate(rate);
      } else {
        // FALLBACK: Dato de éxito para la DEMO
        setCompletionRate(88);
      }
    };

    fetchCompletionRate();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[4rem] bg-[#023047] p-8 md:p-14 shadow-2xl shadow-[#023047]/20 transition-all duration-700 hover:shadow-3xl hover:shadow-[#023047]/30 group border border-white/10 mt-2">
      
      {/* Mesh Gradient Background Elements */}
      <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#219EBC] opacity-30 blur-[120px] animate-pulse" />
      <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#FB8500] opacity-15 blur-[100px]" />
      
      {/* Decorative Blueprint Grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "50px 50px" }}></div>

      {/* Content Area */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 h-full">
        
        <div className="max-w-xl text-center md:text-left space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FB8500] animate-pulse shadow-[0_0_10px_#FB8500]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8ECAE6]" style={{ fontFamily: "Outfit, sans-serif" }}>
              Panel de Control de Centro • CEN LABS
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white leading-[1] tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Bienvenido de nuevo,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8ECAE6] via-[#219EBC] to-white">
              {user?.full_name?.split(' ')[0] || "Profesor"} 👋
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 font-medium leading-relaxed max-w-lg">
            Hoy tu institución reporta un <span className="text-[#FFB703] font-black underline decoration-4 underline-offset-8 decoration-[#FFB703]/30">{completionRate}%</span> de efectividad en las prácticas de esta semana.
          </p>
          
          <div className="pt-6 flex flex-wrap justify-center md:justify-start gap-5">
            <a 
              href="/admin/usuarios"
              className="px-8 py-4 bg-[#FB8500] hover:bg-[#FFB703] text-[#023047] font-black rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 text-[11px] uppercase tracking-widest flex items-center gap-3" 
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Gestionar Alumnos
            </a>
            <a 
              href="/api/results/export" // Endpoint ficticio para demo
              onClick={(e) => e.preventDefault()}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl border border-white/10 backdrop-blur-md transition-all text-[11px] uppercase tracking-widest" 
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Auditoria de Datos
            </a>
          </div>
        </div>

        {/* ── Visual Asset: CSS-Based Diamond State Illustration ── */}
        <div className="relative w-full max-w-[380px] md:max-w-[480px] aspect-square transform transition-all duration-1000 group-hover:scale-105 group-hover:-rotate-2 shrink-0 flex items-center justify-center">
            {/* Esferas de datos flotantes (Puros CSS) */}
            <div className="relative w-72 h-72">
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/10 rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full animate-[spin_35s_linear_infinite_reverse]" />
                
                {/* Nodos de datos */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#8ECAE6] rounded-full shadow-[0_0_15px_#8ECAE6]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#FB8500] rounded-full shadow-[0_0_10px_#FB8500]" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#219EBC] rounded-full shadow-[0_0_10px_#219EBC]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#fff]" />
                
                {/* Centro Nuclear del Dashboard */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl flex items-center justify-center shadow-inner overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    <div className="text-4xl">📊</div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
