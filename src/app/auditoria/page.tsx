"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  ShieldCheck, Search, Download, Filter, 
  ArrowUpDown, CheckCircle2, Clock, XCircle,
  BarChart3, Loader2, FileSpreadsheet
} from "lucide-react";

interface AuditLog {
  id: string;
  student_name: string;
  sim_id: string;
  status: string;
  score: number;
  total_time_seconds: number;
  started_at: string;
  completed_at: string | null;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      // Solo procedemos si Supabase está configurado
      const { isSupabaseConfigured } = await import('@/lib/supabase');
      if (!isSupabaseConfigured()) {
        console.warn('[Auditoria] Supabase no configurado.');
        setLoading(false);
        return;
      }

      const { data: intentos, error } = await supabase
        .from('intentos')
        .select('*, profiles(full_name)')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('[Auditoria] Error fetching logs:', error.message);
      } else if (intentos) {
        const formatted: AuditLog[] = intentos.map((i: any) => ({
          id: i.id,
          student_name: i.profiles?.full_name || "Usuario Desconocido",
          sim_id: i.sim_id,
          status: i.status,
          score: i.score,
          total_time_seconds: i.total_time_seconds,
          started_at: i.started_at,
          completed_at: i.completed_at
        }));
        setLogs(formatted);
      }
    } catch (err) {
      console.error('[Auditoria] Error crítico:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.sim_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ["ID", "Estudiante", "Laboratorio", "Estado", "Puntaje", "Tiempo (seg)", "Fecha Inicio", "Fecha Fin"];
    const rows = filteredLogs.map(log => [
      log.id,
      log.student_name,
      log.sim_id,
      log.status,
      log.score,
      log.total_time_seconds,
      log.started_at,
      log.completed_at || "N/A"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Auditoria_CEN_Labs_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <Sidebar />

      <main className="col-start-2 overflow-y-auto bg-dash-bg p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              Consola de Auditoría Avanzada
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Sigue en tiempo real cada interacción y resultado de los laboratorios.
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#034061] shadow-lg shadow-primary/20 active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar CSV de Auditoría
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-dash-border shadow-sm">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 text-primary/60">Registros Totales</p>
                <div className="text-3xl font-black text-[#023047]">{logs.length}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-dash-border shadow-sm">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 text-emerald-500/60">Completados</p>
                <div className="text-3xl font-black text-[#023047]">{logs.filter(l => l.status === 'completed').length}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-dash-border shadow-sm">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 text-orange-500/60">En Curso</p>
                <div className="text-3xl font-black text-[#023047]">{logs.filter(l => l.status === 'in_progress').length}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-dash-border shadow-sm">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 text-red-500/60">Bajos Scores</p>
                <div className="text-3xl font-black text-[#023047]">{logs.filter(l => l.score < 6 && l.status === 'completed').length}</div>
            </div>
        </div>

        {/* Controles de Filtrado */}
        <div className="bg-white p-4 rounded-2xl border border-dash-border shadow-sm mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por estudiante o simulación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border-none bg-dash-bg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/40"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-dash-bg border-none rounded-xl px-4 py-2.5 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todos los Estados</option>
            <option value="completed">Completados</option>
            <option value="in_progress">En Progreso</option>
            <option value="abandoned">Abandonados</option>
          </select>
          <button 
             onClick={fetchAuditLogs}
             className="p-2.5 rounded-xl bg-dash-bg hover:bg-dash-border transition-colors text-muted-foreground"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* Audit Table */}
        <div className="bg-white rounded-3xl border border-dash-border shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dash-bg/50 border-b border-dash-border">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Estudiante</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Laboratorio</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Score</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Tiempo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Fecha / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Consultando Bitácoras...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-dash-bg/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                          {log.student_name.substring(0,2).toUpperCase()}
                       </div>
                       <span className="text-sm font-bold text-foreground">{log.student_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 uppercase text-[10px] font-black text-primary/60 tracking-tight">
                    {log.sim_id.replace(/-/g, ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {log.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                        log.status === 'in_progress' ? <Clock className="w-4 h-4 text-orange-500" /> :
                        <XCircle className="w-4 h-4 text-red-500" />}
                       <span className={`text-[10px] font-black uppercase tracking-widest ${
                          log.status === 'completed' ? 'text-emerald-500' : 
                          log.status === 'in_progress' ? 'text-orange-500' : 'text-red-500'
                       }`}>
                          {log.status.replace('_', ' ')}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-black ${log.score >= 8 ? 'text-emerald-600' : log.score >= 6 ? 'text-orange-600' : 'text-red-600'}`}>
                        {log.score}/10
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-muted-foreground">
                    {formatDuration(log.total_time_seconds)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-muted-foreground/60 italic">
                    {format(new Date(log.started_at), "dd MMM, HH:mm", { locale: es })}
                  </td>
                </tr>
              ))}
              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                     <p className="text-sm font-bold text-muted-foreground opacity-30">No hay registros que coincidan con los filtros.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
