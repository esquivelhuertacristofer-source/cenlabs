"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function ProgressRing({
  progress,
  color,
  size = 56,
  strokeWidth = 5,
}: {
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700/30"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-foreground">
        {progress}%
      </span>
    </div>
  );
}

export default function LabProgressRings() {
  const [labs, setLabs] = useState([
    { name: "Química", description: "Enlace Atómico, Gases, etc.", progress: 0, color: "#FB8500", prefix: "quimica" },
    { name: "Física", description: "Óptica, Mecánica, Energía", progress: 0, color: "#219EBC", prefix: "fisica" },
    { name: "Biología", description: "Microscopía, Fotosíntesis", progress: 0, color: "#8ECAE6", prefix: "biologia" },
    { name: "Matemáticas", description: "Cálculo, Geometría, Álgebra", progress: 0, color: "#023047", prefix: "matematicas" },
  ]);

  useEffect(() => {
    const fetchRealProgress = async () => {
      const { count: totalAlumnos } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'alumno');

      const { data: completed } = await supabase
        .from('intentos')
        .select('id_alumno, sim_id')
        .eq('status', 'completed');

      if (totalAlumnos && completed) {
        const updatedLabs = labs.map(lab => {
          const uniqueAlumnosInLab = new Set(
            completed
              .filter(i => i.sim_id.startsWith(lab.prefix))
              .map(i => i.id_alumno)
          ).size;
          
          return {
            ...lab,
            progress: Math.round((uniqueAlumnosInLab / totalAlumnos) * 100)
          };
        });
        setLabs(updatedLabs);
      }
    };

    fetchRealProgress();
  }, []);

  return (
    <div className="rounded-[2rem] border border-dash-border bg-dash-card p-6 shadow-sm">
      <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
        Penetración por Área
      </h3>
      <div className="space-y-6">
        {labs.map((lab) => (
          <div key={lab.name} className="flex items-center gap-4 group">
            <div className="flex-1">
              <p className="text-sm font-black text-[#023047] group-hover:text-primary transition-colors">
                {lab.name}
              </p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                {lab.description}
              </p>
            </div>
            <ProgressRing progress={lab.progress} color={lab.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
