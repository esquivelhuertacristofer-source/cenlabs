"use client";

import { topAlumnos, students } from "@/lib/mockData";
import { Trophy } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export default function TopAlumnos() {
  const { selectedGroup } = useAppContext();

  // Filter students by group and sort by score
  const displayAlumnos = students
    .filter((s) => selectedGroup === "all" || s.group === selectedGroup)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card p-5 h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Top Alumnos {selectedGroup !== 'all' && `(${selectedGroup.toUpperCase()})`}</h3>
        <Trophy className="h-4 w-4 text-yellow-500" />
      </div>
      <div className="space-y-3">
        {displayAlumnos.map((alumno, i) => (
          <div
            key={alumno.name}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
          >
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${alumno.color}`}
            >
              {alumno.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {alumno.name}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {alumno.score}/10 PUNTOS
              </p>
            </div>
            {i === 0 && <span className="text-lg">🥇</span>}
            {i === 1 && <span className="text-lg">🥈</span>}
            {i === 2 && <span className="text-lg">🥉</span>}
          </div>
        ))}
        {displayAlumnos.length === 0 && (
          <p className="py-10 text-center text-xs text-muted-foreground font-medium italic">
            Sin datos para este grupo
          </p>
        )}
      </div>
    </div>
  );
}
