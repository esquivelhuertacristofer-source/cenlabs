"use client";

import { latestDeliveries, students } from "@/lib/mockData";
import { Activity } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export default function LatestDeliveries() {
  const { selectedGroup } = useAppContext();

  // Filter deliveries by group (manual mapping for mock)
  const filteredDeliveries = latestDeliveries.filter((d) => {
    if (selectedGroup === "all") return true;
    const student = students.find(s => s.name === d.name);
    return student?.group === selectedGroup;
  });

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card p-5 h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Últimas Actividades Entregadas</h3>
        <Activity className="h-4 w-4 text-primary" />
      </div>
      <div className="space-y-4">
        {filteredDeliveries.map((delivery, i) => (
          <div key={i} className="flex gap-3 group">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-all group-hover:scale-110 shadow-md ${delivery.color}`}
            >
              {delivery.initials}
            </div>
            <div className="min-w-0 flex-1 border-b border-dash-border/30 pb-3 group-last:border-0 group-last:pb-0">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {delivery.name}
                </p>
                <span className="ml-2 flex-shrink-0 text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">
                  {delivery.time}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground/80 leading-snug">
                {delivery.text}
              </p>
            </div>
          </div>
        ))}
        {filteredDeliveries.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground font-medium italic">
            Sin entregas recientes en este grupo
          </p>
        )}
      </div>
      <button className="mt-6 w-full rounded-xl border border-dash-border bg-dash-bg py-3 text-xs font-bold text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary shadow-sm">
        Ver todo el historial
      </button>
    </div>
  );
}
