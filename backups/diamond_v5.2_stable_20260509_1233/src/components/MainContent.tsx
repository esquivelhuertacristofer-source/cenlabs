"use client";

import WelcomeBanner from "./WelcomeBanner";
import MultiMetricCards from "./MetricCards";
import PerformanceChart from "./PerformanceChart";
import GroupRadarChart from "./GroupRadarChart";
import TopAlumnos from "./TopAlumnos";
import LatestDeliveries from "./LatestDeliveries";

export default function MainContent() {
  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-12">
      {/* ── SECCIÓN HERO ── */}
      <WelcomeBanner />

      {/* ── MÉTRICAS RÁPIDAS ── */}
      <MultiMetricCards />

      {/* ── BENTO GRID PRINCIPAL ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        
        {/* Columna Izquierda: Gráficos (8 col) */}
        <div className="lg:col-span-8 space-y-8 flex flex-col">
           <PerformanceChart />
           <GroupRadarChart />
        </div>

        {/* Columna Derecha: Ranking (4 col) */}
        <div className="lg:col-span-4 flex flex-col">
           <TopAlumnos />
        </div>
      </div>
      
      {/* ── SECCIÓN INFERIOR: ENTREGAS ── */}
      <div className="w-full pt-4">
         <LatestDeliveries />
      </div>
    </div>
  );
}
