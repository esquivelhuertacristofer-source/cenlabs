"use client";

import { Users, LayoutGrid, CheckCircle } from "lucide-react";
import { metricCards, students } from "@/lib/mockData";
import { useAppContext } from "@/context/AppContext";

const icons = [Users, LayoutGrid, CheckCircle];
const iconBgColors = [
  "bg-[#023047]/10 dark:bg-[#023047]/20",
  "bg-[#219EBC]/10 dark:bg-[#219EBC]/20",
  "bg-[#FB8500]/10 dark:bg-[#FB8500]/20",
];
const iconColors = [
  "text-[#023047] dark:text-[#8ECAE6]",
  "text-[#219EBC] dark:text-[#219EBC]",
  "text-[#FB8500] dark:text-[#FFB703]",
];

export default function MetricCards() {
  const { selectedGroup } = useAppContext();
  
  // Calculate dynamic values based on group
  const filteredStudents = students.filter(s => selectedGroup === 'all' || s.group === selectedGroup);
  
  const displayMetrics = [
    { ...metricCards[0], value: filteredStudents.length.toString() },
    { ...metricCards[1], value: selectedGroup === 'all' ? '4' : '1' },
    { ...metricCards[2] } 
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 font-sans">
      {displayMetrics.map((card, i) => {
        const Icon = icons[i];
        return (
          <div
            key={card.title}
            className="group rounded-2xl border border-dash-border bg-dash-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 cursor-default"
          >
            <div className="mb-4 flex items-center justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconBgColors[i]}`}
              >
                <Icon className={`h-5 w-5 ${iconColors[i]}`} />
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  card.isPositive || card.change === "Sin cambios"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                }`}
              >
                {card.change}
              </span>
            </div>
            <p className="text-4xl font-black text-foreground tracking-tighter" style={{ fontFamily: "Outfit, sans-serif" }}>
              {card.value}
              {card.suffix && (
                <span className="text-lg font-medium text-muted-foreground ml-1">
                  {card.suffix}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">{card.title}</p>
          </div>
        );
      })}
    </div>
  );
}
