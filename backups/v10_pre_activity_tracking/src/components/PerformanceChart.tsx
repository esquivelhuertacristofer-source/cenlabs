"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { ChevronDown, BarChart3, Loader2 } from "lucide-react";

interface ChartData {
  day: string;
  hours: number;
}

export default function PerformanceChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerformance() {
      setLoading(true);
      
      // Obtener intentos de los últimos 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: records } = await supabase
        .from('intentos')
        .select('started_at, total_time_seconds')
        .gte('started_at', sevenDaysAgo.toISOString());

      if (records) {
        // Inicializar los 7 días
        const last7Days: Record<string, number> = {};
        const daysLabel = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = daysLabel[d.getDay()];
          last7Days[label] = 0;
        }

        // Sumar tiempos (convertir segundos a horas)
        records.forEach(r => {
          const d = new Date(r.started_at);
          const label = daysLabel[d.getDay()];
          if (last7Days[label] !== undefined) {
            last7Days[label] += (r.total_time_seconds || 0) / 3600;
          }
        });

        const formatted = Object.entries(last7Days).map(([day, hours]) => ({
          day,
          hours: parseFloat(hours.toFixed(2))
        }));
        
        setData(formatted);
      }
      setLoading(false);
    }

    fetchPerformance();
  }, []);

  return (
    <div className="rounded-[2rem] border border-white bg-white/70 backdrop-blur-xl p-8 shadow-[0_10px_40px_rgba(2,48,71,0.05)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(2,48,71,0.1)] hover:-translate-y-1 group">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-[#219EBC] shadow-sm border border-white transition-transform duration-500 group-hover:scale-110">
            <BarChart3 className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#023047]/40 leading-none pb-1">Análisis Semanal</h3>
            <p className="text-xl font-black text-[#023047]" style={{ fontFamily: "Outfit, sans-serif" }}>Tiempo de Uso Real</p>
          </div>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white/50 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#023047]/60 transition-all hover:bg-white hover:text-[#219EBC] hover:border-[#219EBC]/30 shadow-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
          Última Semana
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Chart */}
      <div className="h-64 w-full flex items-center justify-center">
        {loading ? (
          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#219EBC" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#219EBC" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="1 1000"
                stroke="rgba(2,48,71,0.08)"
                vertical={false}
                strokeWidth={1}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#023047", fontSize: 11, fontWeight: 900, fontFamily: "Outfit" }}
                axisLine={false}
                tickLine={false}
                dy={15}
              />
              <YAxis
                tick={{ fill: "#023047", fontSize: 11, fontWeight: 900, opacity: 0.3, fontFamily: "Outfit" }}
                axisLine={false}
                tickLine={false}
                dx={-5}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 1)",
                  borderRadius: "20px",
                  color: "#023047",
                  fontSize: "12px",
                  fontWeight: "900",
                  fontFamily: "Outfit",
                  boxShadow: "0 20px 50px rgba(2, 48, 71, 0.15)",
                  padding: "12px 16px",
                }}
                itemStyle={{ color: "#219EBC" }}
                cursor={{ stroke: "#219EBC", strokeWidth: 2, opacity: 0.2 }}
                formatter={(value: any) => [`${value} hrs`, "Uso"]}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#219EBC"
                strokeWidth={5}
                fill="url(#chartGradient)"
                dot={{ r: 0 }}
                activeDot={{
                  r: 8,
                  fill: "#FB8500",
                  stroke: "#ffffff",
                  strokeWidth: 4,
                }}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Legend Footer */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
               <div className="w-3 h-3 rounded-full bg-[#219EBC]" />
               <span className="text-[10px] font-black uppercase text-[#023047]/40 tracking-wider">Hrs de uso real</span>
            </div>
         </div>
         <span className="text-[11px] font-black text-[#219EBC]">Datos de la última semana</span>
      </div>
    </div>
  );
}
