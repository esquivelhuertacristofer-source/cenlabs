"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

interface DeliveryReal {
  id: string;
  name: string;
  initials: string;
  time: string;
  text: string;
  color: string;
}

export default function LatestDeliveries() {
  const { selectedGroup } = useAppContext();
  const [deliveries, setDeliveries] = useState<DeliveryReal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatest() {
      setLoading(true);
      // Obtener los últimos 5 intentos completados con los nombres de los alumnos
      const { data, error } = await supabase
        .from('intentos')
        .select(`
          id,
          sim_id,
          completed_at,
          score,
          profiles (
            full_name
          )
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        const COLORS = ["bg-[#023047]", "bg-[#219EBC]", "bg-[#FB8500]", "bg-[#8ECAE6]", "bg-[#FFB703]"];
        
        const mapped = data.map((d: any, i) => {
          const name = d.profiles?.full_name || "Alumno";
          const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
          
          // Formatear fecha
          const date = new Date(d.completed_at);
          const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          return {
            id: d.id,
            name,
            initials,
            time,
            text: `Completó el simulador de ${d.sim_id.split('-')[0].toUpperCase()} con score de ${d.score}/10`,
            color: COLORS[i % COLORS.length]
          };
        });
        setDeliveries(mapped);
      } else {
        // FALLBACK: Mock para demo
        const { latestDeliveries: mockDeliveries } = await import("@/lib/mockData");
        setDeliveries(mockDeliveries.map((m, i) => ({ ...m, id: `mock-${i}` })));
      }
      setLoading(false);
    }

    fetchLatest();
  }, [selectedGroup]);

  return (
    <div className="rounded-[2rem] border border-white bg-white/70 backdrop-blur-xl p-8 shadow-[0_10px_40px_rgba(2,48,71,0.05)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(2,48,71,0.1)] group h-full flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-[#219EBC] shadow-sm border border-white">
             <Activity className="h-5 w-5" strokeWidth={2.5} />
           </div>
           <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#023047]/40 leading-none pb-1">Actividad Reciente</h3>
              <p className="text-lg font-black text-[#023047]" style={{ fontFamily: "Outfit, sans-serif" }}>Entregas</p>
           </div>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
          </div>
        ) : deliveries.map((delivery, i) => {
          return (
            <div key={delivery.id} className="flex gap-4 group/item relative">
              {/* Timeline Line */}
              {i !== deliveries.length - 1 && (
                <div className="absolute left-6 top-12 bottom-[-1.5rem] w-0.5 bg-gray-100" />
              )}
              
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1rem] text-sm font-black text-white transition-all group-hover/item:scale-110 shadow-lg z-10 ${delivery.color}`}
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {delivery.initials}
              </div>
              
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-[#023047] truncate group-hover/item:text-[#219EBC] transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {delivery.name}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#023047]/30 whitespace-nowrap">
                    <Clock className="w-2.5 h-2.5" />
                    {delivery.time}
                  </div>
                </div>
                <div className="mt-1 flex items-start gap-1.5">
                   <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                   <p className="text-xs font-medium text-[#023047]/60 leading-tight">
                     {delivery.text}
                   </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {!loading && deliveries.length === 0 && (
          <div className="py-16 text-center space-y-3">
             <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto opacity-50">
                <Activity className="w-6 h-6 text-gray-300" />
             </div>
             <p className="text-xs text-[#023047]/40 font-black uppercase tracking-widest">
               Sin actividad reciente
             </p>
          </div>
        )}
      </div>

      <button className="w-full mt-8 py-4 bg-[#023047] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#219EBC] shadow-lg transition-all active:scale-95" style={{ fontFamily: "Outfit, sans-serif" }}>
         Ver Historial Completo
      </button>
    </div>
  );
}
