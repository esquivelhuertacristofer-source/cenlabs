"use client";

import WelcomeBanner from "./WelcomeBanner";
import MultiMetricCards from "./MetricCards";
import PerformanceChart from "./PerformanceChart";
import TopAlumnos from "./TopAlumnos";
import LatestDeliveries from "./LatestDeliveries";

export default function MainContent() {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <WelcomeBanner />

      {/* Metrics Row */}
      <MultiMetricCards />

      {/* Charts & Lists Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PerformanceChart />
        <TopAlumnos />
      </div>

      {/* Latest Deliveries (Replaces Messages) */}
      <LatestDeliveries />
    </div>
  );
}
