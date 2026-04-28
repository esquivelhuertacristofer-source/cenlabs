"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { students } from "@/lib/mockData";
import { useAppContext } from "@/context/AppContext";
import StudentProfileModal from "@/components/StudentProfileModal";
import { Search, Filter, UserPlus, MoreHorizontal, Users } from "lucide-react";

export default function AlumnosPage() {
  const { selectedGroup } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Filter students by group and search term
  const filteredStudents = students.filter((s) => {
    const matchesGroup = selectedGroup === "all" || s.group === selectedGroup;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <Sidebar />

      <main className="col-start-2 overflow-y-auto bg-dash-bg p-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Directorio de Alumnos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona y supervisa el rendimiento de tus estudiantes por grupo.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#034061] shadow-lg shadow-primary/20 active:scale-95">
            <UserPlus className="h-4 w-4" />
            Vincular Alumno
          </button>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-dash-border bg-dash-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-dash-border bg-dash-card px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              <Filter className="h-3.5 w-3.5" />
              Más Filtros
            </button>
            <div className="h-8 w-px bg-dash-border mx-2" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {filteredStudents.length} resultados
            </p>
          </div>
        </div>

        {/* Students Table/Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-dash-border bg-dash-card p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white shadow-lg ${student.color}`}>
                  {student.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-foreground">
                    {student.name}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Grupo: {student.group.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Promedio:</span>
                  <span className="font-bold text-primary dark:text-dash-accent">{student.score}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-dash-bg overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${(student.score / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-dash-border pt-4 mt-2">
                <p className="text-[10px] text-muted-foreground italic">
                  Activo {student.lastActivity}
                </p>
                <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
                  Ver Perfil
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dash-card border border-dash-border border-dashed mb-4">
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No se encontraron alumnos</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Intenta cambiar los filtros o el término de búsqueda para encontrar lo que buscas.
            </p>
          </div>
        )}

        <StudentProfileModal
          student={selectedStudent}
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      </main>
    </div>
  );
}
