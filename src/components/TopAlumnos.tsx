"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Star, Users, Loader2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

interface TopAlumnoReal {
  name: string;
  score: number;
  initials: string;
  color: string;
}

export default function TopAlumnos() {
  const { selectedGroup } = useAppContext();
  const [topList, setTopList] = useState<TopAlumnoReal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTop() {
      setLoading(true);
      
      // 1. Obtener perfiles de tipo alumno
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          intentos (
            score,
            status
          )
        `)
        .eq('role', 'alumno');

      const { data, error } = await query;

      if (data && data.length > 0) {
        const COLORS = ["bg-[#023047]", "bg-[#219EBC]", "bg-[#FB8500]", "bg-[#8ECAE6]", "bg-[#FFB703]"];
        
        // 2. Procesar datos reales
        const processed = data.map((p: any) => {
          const finishedIntentos = p.intentos?.filter((i: any) => i.status === 'completed') || [];
          const totalScore = finishedIntentos.reduce((acc: number, i: any) => acc + (i.score || 0), 0);
          const initials = p.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || "??";
          
          return {
            name: p.full_name || "Alumno Sin Nombre",
            score: totalScore,
            initials,
            color: "" 
          };
        })
        .filter(a => a.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((a, i) => ({ ...a, color: COLORS[i % COLORS.length] }));

        setTopList(processed);
      } else {
        // FALLBACK: Usar Mock Data para la DEMO
        const { topAlumnos: mockTop } = await import("@/lib/mockData");
        setTopList(mockTop.map(a => ({ ...a, color: a.color || "bg-[#023047]" })));
      }
      setLoading(false);
    }

    fetchTop();
  }, [selectedGroup]);

  return (
    <div className="rounded-[2rem] border border-white bg-white/70 backdrop-blur-xl p-8 shadow-[0_10px_40px_rgba(2,48,71,0.05)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(2,48,71,0.1)] group h-full">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#FB8500] shadow-sm border border-white">
             <Trophy className="h-5 w-5" strokeWidth={2.5} />
           </div>
           <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#023047]/40 leading-none pb-1">Excelencia Académica</h3>
              <p className="text-lg font-black text-[#023047]" style={{ fontFamily: "Outfit, sans-serif" }}>Top Alumnos</p>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
          </div>
        ) : topList.map((alumno, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl p-3 transition-all duration-300 hover:bg-white hover:shadow-lg hover:-translate-x-1 border border-transparent hover:border-gray-50 group/item"
          >
            <div className="relative">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-lg transition-transform group-hover/item:scale-110 ${alumno.color}`}
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {alumno.initials}
              </div>
              {i < 3 && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-50 scale-90">
                  {i === 0 && <span className="text-xs">🥇</span>}
                  {i === 1 && <span className="text-xs">🥈</span>}
                  {i === 2 && <span className="text-xs">🥉</span>}
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[#023047]" style={{ fontFamily: "Outfit, sans-serif" }}>
                {alumno.name}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                   {[...Array(5)].map((_, idx) => (
                     <Star key={idx} className={`w-2 h-2 ${idx < 4 ? 'fill-[#FFB703] text-[#FFB703]' : 'text-gray-200'}`} />
                   ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#219EBC]">
                   Nivel Real
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xl font-black text-[#023047] leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>
                {alumno.score}
              </p>
              <p className="text-[9px] font-black text-[#023047]/40 uppercase tracking-tighter">PUNTOS</p>
            </div>
          </div>
        ))}
        
        {!loading && topList.length === 0 && (
          <div className="py-16 text-center space-y-3">
             <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto opacity-50">
                <Users className="w-6 h-6 text-gray-300" />
             </div>
             <p className="text-xs text-[#023047]/40 font-black uppercase tracking-widest">
               Sin datos reales aún
             </p>
          </div>
        )}
      </div>
      
      <button className="w-full mt-6 py-3 border-2 border-dashed border-[#023047]/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#023047]/40 hover:bg-[#023047]/5 hover:text-[#023047] transition-all" style={{ fontFamily: "Outfit, sans-serif" }}>
         Ver Tabla de Posiciones
      </button>
    </div>
  );
}
