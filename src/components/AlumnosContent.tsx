"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import StudentProfileModal from "@/components/StudentProfileModal";
import { Search, Filter, UserPlus, MoreHorizontal, Users, FileDown, Loader2, Layout, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { generateGroupReport } from "@/lib/reportUtils";

export default function AlumnosContent() {
  const { selectedGroup } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [vincularEmail, setVincularEmail] = useState('');
  const [vincularLoading, setVincularLoading] = useState(false);
  const [vincularMsg, setVincularMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleVincular = async () => {
    if (!vincularEmail.trim()) return;
    if (selectedGroup === 'all') {
      setVincularMsg({ type: 'err', text: 'Selecciona un grupo en el panel izquierdo antes de vincular.' });
      return;
    }
    setVincularLoading(true);
    setVincularMsg(null);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', vincularEmail.toLowerCase().trim())
        .single();
      if (!profile) {
        setVincularMsg({ type: 'err', text: 'No se encontró ningún alumno con ese correo.' });
        return;
      }
      const { data: grupo } = await supabase
        .from('grupos')
        .select('id')
        .eq('nombre', selectedGroup)
        .single();
      if (!grupo) {
        setVincularMsg({ type: 'err', text: 'Grupo no encontrado.' });
        return;
      }
      const { error } = await supabase
        .from('alumnos_grupos')
        .upsert({ id_alumno: profile.id, id_grupo: grupo.id }, { onConflict: 'id_alumno,id_grupo' });
      if (error) throw error;
      setVincularMsg({ type: 'ok', text: `${profile.full_name} vinculado a ${selectedGroup} correctamente.` });
      setVincularEmail('');
      setRefreshKey(k => k + 1);
    } catch (e: any) {
      setVincularMsg({ type: 'err', text: e.message || 'Error al vincular.' });
    } finally {
      setVincularLoading(false);
    }
  };

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        // Fetch profiles, their groups and their attempts
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            role,
            alumnos_grupos (
              grupos (
                nombre
              )
            ),
            intentos (
              score,
              status,
              sim_id,
              started_at,
              completed_at,
              total_time_seconds,
              id
            )
          `)
          .eq('role', 'alumno');

        if (data) {
          const processed = data.map(p => {
            const intentos = p.intentos || [];
            const completed = intentos.filter((i: any) => i.status === 'completed');
            const avgScore = completed.length > 0 
              ? parseFloat((completed.reduce((acc: number, i: any) => acc + (i.score || 0), 0) / completed.length).toFixed(1))
              : 0;

            const groupName = (p.alumnos_grupos?.[0]?.grupos as any)?.nombre || "Sin Grupo";
            const initials = p.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || "??";
            
            // Generate stats for radar chart
            const categories: Record<string, { total: number; count: number }> = {
              'Química': { total: 0, count: 0 },
              'Física': { total: 0, count: 0 },
              'Biología': { total: 0, count: 0 },
              'Matemáticas': { total: 0, count: 0 }
            };

            completed.forEach((i: any) => {
              let cat = 'Matemáticas';
              const sim = (i.sim_id as string).toLowerCase();
              if (sim.startsWith('quimica')) cat = 'Química';
              else if (sim.startsWith('fisica')) cat = 'Física';
              else if (sim.startsWith('biologia')) cat = 'Biología';

              categories[cat].total += (i.score || 0);
              categories[cat].count += 1;
            });

            const stats = Object.entries(categories).map(([subject, stats]) => ({
              subject,
              value: stats.count > 0 ? Math.round((stats.total / stats.count) * 10) : 0 
            }));

            // Color based on group name hash or index
            const COLORS = ["bg-[#023047]", "bg-[#219EBC]", "bg-[#FB8500]", "bg-[#8ECAE6]", "bg-[#FFB703]"];
            const colorIndex = groupName.length % COLORS.length;

            return {
              id: p.id,
              name: p.full_name,
              email: p.email,
              group: groupName,
              score: avgScore,
              initials,
              color: COLORS[colorIndex],
              lastActivity: "Recientemente", // Could be derived from completed_at
              stats,
              practices: intentos.map((i: any) => {
                const prefix = (i.sim_id as string).split('-')[0].toLowerCase();
                const subjectMap: Record<string, string> = {
                  quimica: 'Química', fisica: 'Física',
                  biologia: 'Biología', matematicas: 'Matemáticas',
                };
                return {
                  id: i.id,
                  name: i.sim_id,
                  subject: subjectMap[prefix] ?? prefix.toUpperCase(),
                  status: i.status === 'completed' ? 'completada' : 'en_progreso',
                  score: i.score,
                  date: i.completed_at,
                };
              }),
              completadas: completed.length
            };
          });
          setAllStudents(processed);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [refreshKey]);

  const filteredStudents = allStudents.filter((s) => {
    const matchesGroup = selectedGroup === "all" || s.group === selectedGroup;
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const handleDownloadGroupReport = () => {
    const groupName = selectedGroup === 'all' ? 'Todos los Grupos' : selectedGroup;
    generateGroupReport(groupName, filteredStudents);
  };

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <Sidebar />

      <main className="col-start-2 overflow-y-auto bg-dash-bg p-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-[#023047] tracking-tighter" style={{ fontFamily: "Outfit, sans-serif" }}>Directorio de Alumnos</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Gestiona y supervisa el rendimiento de tus estudiantes por grupo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadGroupReport}
              disabled={filteredStudents.length === 0}
              className="flex items-center gap-2 rounded-xl border-2 border-[#023047]/10 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-[#023047] transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              <FileDown className="h-4 w-4" />
              Informe Grupal
            </button>
            <button onClick={() => { setShowVincularModal(true); setVincularMsg(null); setVincularEmail(''); }} className="flex items-center gap-2 rounded-xl bg-[#023047] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#219EBC] shadow-lg shadow-primary/20 active:scale-95" style={{ fontFamily: "Outfit, sans-serif" }}>
              <UserPlus className="h-4 w-4" />
              Vincular Alumno
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#023047]/30" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-[1.25rem] border border-white bg-white/60 backdrop-blur-md py-3.5 pl-12 pr-4 text-sm font-bold text-[#023047] outline-none transition-all focus:border-[#219EBC]/50 focus:ring-4 focus:ring-[#219EBC]/5 placeholder:text-[#023047]/20 shadow-sm"
              style={{ fontFamily: "Outfit, sans-serif" }}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white shadow-sm mr-2">
              <button 
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'cards' ? 'bg-[#023047] text-white shadow-lg' : 'text-[#023047]/40 hover:text-[#023047]'}`}
              >
                <Layout className="h-3.5 w-3.5" />
                Fichas
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-[#023047] text-white shadow-lg' : 'text-[#023047]/40 hover:text-[#023047]'}`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Malla
              </button>
            </div>
            
            <button className="flex items-center gap-2 rounded-xl border border-white bg-white/50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-[#023047]/60 hover:bg-white hover:text-[#023047] transition-all shadow-sm">
              <Filter className="h-4 w-4" />
              Más Filtros
            </button>
            <div className="h-8 w-px bg-dash-border/40 mx-2" />
            <p className="text-[10px] font-black text-[#023047]/30 uppercase tracking-[0.2em]">
                {filteredStudents.length} resultados
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest text-[#023047]/40">Sincronizando con Supabase...</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-xl p-6 transition-all duration-500 hover:border-[#219EBC]/30 hover:shadow-[0_20px_50px_rgba(2,48,71,0.1)] hover:-translate-y-2 shadow-sm"
              >
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                  <div className="p-2 bg-[#023047] rounded-xl text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                </div>

                <div className="mb-6 flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] text-xl font-black text-white shadow-xl transition-transform duration-500 group-hover:scale-110 ${student.color}`} style={{ fontFamily: "Outfit, sans-serif" }}>
                    {student.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-black text-[#023047] leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {student.name}
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#219EBC] mt-0.5">
                      {student.group.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#023047]/30">Promedio General</span>
                    <span className="text-lg font-black text-[#023047] leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>{student.score}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#023047]/5 overflow-hidden p-[1px]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#023047] to-[#219EBC] rounded-full transition-all duration-1000" 
                      style={{ width: `${(student.score / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#023047]/5 pt-5">
                  <p className="text-[9px] font-bold text-[#023047]/40 uppercase tracking-tight">
                    Actividad: {student.lastActivity}
                  </p>
                  <button className="text-[10px] font-black uppercase tracking-[0.2em] text-[#219EBC] hover:text-[#023047] transition-colors">
                    Ver Perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProgressGrid students={filteredStudents} />
        )}

        {!loading && filteredStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white/40 rounded-[3rem] border-2 border-dashed border-[#023047]/5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl mb-6">
              <Users className="h-8 w-8 text-[#023047]/10" />
            </div>
            <h3 className="text-xl font-black text-[#023047]" style={{ fontFamily: "Outfit, sans-serif" }}>No se encontraron alumnos</h3>
            <p className="text-sm text-[#023047]/40 mt-2 max-w-xs font-medium">
              Intenta cambiar los filtros o el término de búsqueda para encontrar lo que buscas en este grupo.
            </p>
          </div>
        )}

        <StudentProfileModal
          student={selectedStudent}
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />

        {showVincularModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#023047]/50 backdrop-blur-sm" onClick={() => setShowVincularModal(false)}>
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#023047] flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#023047] tracking-tighter" style={{ fontFamily: "Outfit, sans-serif" }}>Vincular Alumno</h2>
                  <p className="text-[10px] font-bold text-[#023047]/40 uppercase tracking-widest">
                    {selectedGroup === 'all' ? 'Selecciona un grupo primero' : selectedGroup}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#023047]/60 mb-2">Correo del alumno</label>
                <input
                  type="email"
                  placeholder="alumno@cenlaboratorios.com"
                  value={vincularEmail}
                  onChange={e => setVincularEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVincular()}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-[#023047] outline-none focus:border-[#219EBC] focus:ring-4 focus:ring-[#219EBC]/10 transition-all"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                  autoFocus
                />
              </div>
              {vincularMsg && (
                <div className={`mb-4 rounded-xl px-4 py-3 text-xs font-bold ${vincularMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {vincularMsg.text}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowVincularModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVincular}
                  disabled={vincularLoading || !vincularEmail.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#023047] text-white text-xs font-black uppercase tracking-widest hover:bg-[#219EBC] transition-all disabled:opacity-50"
                >
                  {vincularLoading ? 'Vinculando…' : 'Vincular'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Sub-component: ProgressGrid ─────────────────────────────────────────────

function ProgressGrid({ students }: { students: any[] }) {
  // Define the 40 labs organized by subject
  const subjects = [
    { name: 'Química', prefix: 'QMI', count: 10, color: 'text-emerald-500' },
    { name: 'Física', prefix: 'FIS', count: 10, color: 'text-blue-500' },
    { name: 'Biología', prefix: 'BIO', count: 10, color: 'text-amber-500' },
    { name: 'Matemáticas', prefix: 'MAT', count: 10, color: 'text-purple-500' },
  ];

  return (
    <div className="w-full overflow-x-auto rounded-[3rem] border border-white bg-white/50 backdrop-blur-xl shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#023047]/5">
            <th className="sticky left-0 z-20 bg-white/80 p-6 text-left text-[10px] font-black uppercase tracking-widest text-[#023047]/40 backdrop-blur-md">Alumno</th>
            {subjects.map(sub => (
              <th key={sub.name} colSpan={sub.count} className={`p-4 text-center text-[10px] font-black uppercase tracking-[0.3em] border-l border-[#023047]/5 ${sub.color}`}>
                {sub.name}
              </th>
            ))}
          </tr>
          <tr className="border-b border-[#023047]/5">
             <th className="sticky left-0 z-20 bg-white/80 p-2 backdrop-blur-md"></th>
             {subjects.map(sub => 
               Array.from({ length: sub.count }).map((_, i) => (
                 <th key={`${sub.prefix}-${i+1}`} className="p-2 text-[8px] font-black text-[#023047]/30 border-l border-[#023047]/5 min-w-[32px]">
                   {i + 1}
                 </th>
               ))
             )}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-[#023047]/5 hover:bg-[#023047]/5 transition-colors group">
              <td className="sticky left-0 z-10 bg-white/80 group-hover:bg-slate-50/80 p-6 backdrop-blur-md min-w-[200px]">
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-lg ${student.color} flex items-center justify-center text-[10px] font-black text-white shadow-sm`}>
                     {student.initials}
                   </div>
                   <span className="text-xs font-bold text-[#023047] truncate">{student.name}</span>
                </div>
              </td>
              {subjects.map(sub => 
                Array.from({ length: sub.count }).map((_, i) => {
                  const simId = `${sub.prefix.toLowerCase()}-${i+1}`;
                  const attempt = student.practices.find((p: any) => p.name.toLowerCase() === simId);
                  
                  let statusColor = 'bg-slate-100'; // Not started
                  let tooltip = 'Pendiente';

                  if (attempt) {
                    if (attempt.status === 'completada' && (attempt.score || 0) >= 6) {
                      statusColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
                      tooltip = `Aprobado: ${attempt.score}/10`;
                    } else {
                      statusColor = 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]';
                      tooltip = `En proceso: ${attempt.score || 0}/10`;
                    }
                  }

                  return (
                    <td key={simId} className="p-2 text-center border-l border-[#023047]/5">
                      <div className="group/cell relative flex justify-center">
                        <div className={`h-4 w-4 rounded-full transition-transform hover:scale-150 cursor-help ${statusColor}`} />
                        {/* Simple Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover/cell:block z-30 pointer-events-none">
                            <div className="bg-[#023047] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                {sub.name} {i+1}: {tooltip}
                            </div>
                        </div>
                      </div>
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
