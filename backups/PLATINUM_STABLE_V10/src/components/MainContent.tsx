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
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Columna Izquierda: Gráfico de Rendimiento (8 col) */}
        <div className="lg:col-span-8 space-y-8">
           <PerformanceChart />
           <GroupRadarChart />
        </div>

        {/* Columna Derecha: Ranking y Actividad (4 col) */}
        <div className="lg:col-span-4 space-y-8">
           <TopAlumnos />
        </div>
        
        {/* Fila Inferior: Actividad Reciente (Full) */}
        <div className="lg:col-span-12">
           <LatestDeliveries />
        </div>

      </div>
    </div>
  );
}
