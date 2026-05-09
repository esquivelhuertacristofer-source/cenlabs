"use client";

import { Users, LayoutGrid, CheckCircle, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { metricCards } from "@/lib/mockData";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const icons = [Users, LayoutGrid, CheckCircle];
const iconBgColors = [
  "bg-blue-500/10",
  "bg-sky-500/10",
  "bg-orange-500/10",
];
const iconColors = [
  "text-[#023047]",
  "text-[#219EBC]",
  "text-[#FB8500]",
];

export default function MetricCards() {
  const { selectedGroup } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    alumnos: 0,
    grupos: 0,
    practicas: 0
  });
  
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      
      try {
        let alumnosCount = 0;
        let gruposCount = 0;
        let practicasCount = 0;

        if (selectedGroup === 'all') {
          // 1. Alumnos
          const { count: aCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumno');
          alumnosCount = aCount || 0;
          
          // 2. Grupos
          const { count: gCount } = await supabase.from('grupos').select('*', { count: 'exact', head: true });
          gruposCount = gCount || 0;
          
          // 3. Prácticas (Completadas)
          const { count: pCount } = await supabase.from('intentos').select('*', { count: 'exact', head: true }).eq('status', 'completed');
          practicasCount = pCount || 0;
        } else {
          // Filtrado por grupo
          // Primero obtenemos el ID del grupo
          const { data: grupoData } = await supabase.from('grupos').select('id').eq('nombre', selectedGroup).single();
          
          if (grupoData) {
            const groupId = grupoData.id;
            
            // 1. Alumnos en el grupo
            const { count: aCount } = await supabase
              .from('alumnos_grupos')
              .select('*', { count: 'exact', head: true })
              .eq('id_grupo', groupId);
            alumnosCount = aCount || 0;
            
            gruposCount = 1; // Estamos filtrando por un grupo específico

            // 2. Prácticas completadas por alumnos de este grupo
            // Necesitamos los IDs de los alumnos del grupo
            const { data: alumnosInGroup } = await supabase
              .from('alumnos_grupos')
              .select('id_alumno')
              .eq('id_grupo', groupId);
            
            if (alumnosInGroup && alumnosInGroup.length > 0) {
              const studentIds = alumnosInGroup.map(a => a.id_alumno);
              const { count: pCount } = await supabase
                .from('intentos')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .in('id_alumno', studentIds);
              practicasCount = pCount || 0;
            }
          }
        }

        setStats({
          alumnos: alumnosCount,
          grupos: gruposCount,
          practicas: practicasCount
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [selectedGroup]);
  
  const displayMetrics = [
    { ...metricCards[0], value: stats.alumnos.toString() },
    { ...metricCards[1], value: stats.grupos.toString() },
    { ...metricCards[2], value: stats.practicas.toString() } 
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {displayMetrics.map((card, i) => {
        const Icon = icons[i];
        const isPositive = card.isPositive || card.change === "Sin cambios";
        
        return (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-[2rem] border border-white bg-white/70 backdrop-blur-xl p-7 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(2,48,71,0.1)] hover:-translate-y-1 cursor-default"
          >
            {/* Background Accent Blur */}
            <div className={`absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-10 blur-3xl ${iconBgColors[i]}`} />

            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-sm border border-white ${iconBgColors[i]}`}
                >
                  <Icon className={`h-6 w-6 ${iconColors[i]}`} strokeWidth={2.5} />
                </div>
                
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm border ${
                  isPositive
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-red-50 text-red-600 border-red-100"
                }`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.change}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-5xl font-black text-[#023047] tracking-tighter" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {loading ? (
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                  ) : (
                    card.value
                  )}
                  {card.suffix && !loading && (
                    <span className="text-xl font-bold text-[#8ECAE6] ml-1">
                      {card.suffix}
                    </span>
                  )}
                </p>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#023047]/40 leading-none pb-1">{card.title}</h3>
              </div>
              
              {/* Progress bar sutil */}
              <div className="mt-6 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 delay-300 ${iconColors[i].replace('text-', 'bg-')}`} 
                  style={{ width: isPositive ? '75%' : '40%' }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
