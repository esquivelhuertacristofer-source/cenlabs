"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase-browser";
import { Activity, Loader2 } from "lucide-react";

import { useAppContext } from "@/context/AppContext";

interface SubjectScore {
  subject: string;
  value: number;
}

export default function GroupRadarChart() {
  const { selectedGroup } = useAppContext();
  const [data, setData] = useState<SubjectScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGroupMetrics() {
      setLoading(true);
      
      try {
        let query = supabase
          .from('intentos')
          .select('sim_id, score, status, id_alumno')
          .eq('status', 'completed');

        // Filtrado por grupo
        if (selectedGroup !== 'all') {
          const { data: grupoData } = await supabase.from('grupos').select('id').eq('nombre', selectedGroup).single();
          if (grupoData) {
            const { data: alumnosInGroup } = await supabase.from('alumnos_grupos').select('id_alumno').eq('id_grupo', grupoData.id);
            if (alumnosInGroup && alumnosInGroup.length > 0) {
              query = query.in('id_alumno', alumnosInGroup.map(a => a.id_alumno));
            } else {
              setData([]);
              setLoading(false);
              return;
            }
          }
        }

        const { data: records } = await query;

        if (records && records.length > 0) {
          const categories: Record<string, { total: number; count: number }> = {
            'Química': { total: 0, count: 0 },
            'Física': { total: 0, count: 0 },
            'Biología': { total: 0, count: 0 },
            'Matemáticas': { total: 0, count: 0 }
          };

          records.forEach(r => {
            let cat = 'Matemáticas';
            const sim = r.sim_id.toUpperCase();
            if (sim.startsWith('QMI')) cat = 'Química';
            else if (sim.startsWith('FIS')) cat = 'Física';
            else if (sim.startsWith('BIO')) cat = 'Biología';
            
            categories[cat].total += (r.score || 0);
            categories[cat].count += 1;
          });

          const formatted = Object.entries(categories).map(([subject, stats]) => ({
            subject,
            value: stats.count > 0 ? Math.round((stats.total / stats.count) * 10) : 0 
          }));
          
          setData(formatted);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Error fetching group metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchGroupMetrics();
  }, [selectedGroup]);

  return (
    <div className="rounded-[2rem] border border-white bg-white/70 backdrop-blur-xl p-8 shadow-[0_10px_40px_rgba(2,48,71,0.05)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(2,48,71,0.1)] hover:-translate-y-1 group flex flex-col min-h-[500px]">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-[#FB8500] shadow-sm border border-white transition-transform duration-500 group-hover:scale-110">
          <Activity className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#023047]/40 leading-none pb-1">Análisis Grupal</h3>
          <p className="text-xl font-black text-[#023047]" style={{ fontFamily: "Outfit, sans-serif" }}>Equilibrio de Competencias</p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full flex items-center justify-center">
        {loading ? (
          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="rgba(2,48,71,0.1)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: "#023047", fontSize: 12, fontWeight: 900, fontFamily: "Outfit" }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={false} 
                axisLine={false}
              />
              <Radar
                name="Grupo"
                dataKey="value"
                stroke="#FB8500"
                fill="#FB8500"
                fillOpacity={0.5}
                strokeWidth={4}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            Fortaleza actual: <span className="text-primary">{[...data].sort((a,b) => b.value - a.value)[0]?.subject || 'Calculando...'}</span>
        </p>
      </div>
    </div>
  );
}
