"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, MapPin, CheckCircle2, Clock, XCircle, FileText, BarChart3, TrendingUp, FileDown, Sparkles } from "lucide-react";
import { type PracticeRecord } from "@/lib/mockData";
import { generateStudentReport, generateReinforcementReport } from "@/lib/reportUtils";

type StudentProps = {
  student: {
    id: string;
    name: string;
    email: string;
    initials: string;
    color: string;
    score: number;
    lastActivity: string;
    stats: { subject: string; value: number }[];
    practices?: PracticeRecord[];
    grupo?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function StudentProfileModal({ student, isOpen, onClose }: StudentProps) {
  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] w-[95vw] border-dash-border bg-dash-card p-0 overflow-hidden text-foreground">
        {/* Banner Section - More expansive */}
        <div className="relative h-48 bg-gradient-to-r from-primary via-[#044a71] to-[#219EBC]">
           <div className="absolute top-6 right-20 opacity-10">
              <BarChart3 className="h-36 w-36 text-white rotate-6" />
           </div>
           
           {/* Botón de Reporte en Banner */}
           <div className="absolute top-8 right-8">
              <button 
                onClick={() => generateStudentReport(student)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 shadow-2xl"
              >
                <FileDown className="w-4 h-4" />
                Descargar Informe PDF
              </button>
           </div>

          <div className="absolute -bottom-16 left-16">
            <div className={`flex h-36 w-36 items-center justify-center rounded-[3rem] border-[10px] border-dash-card text-5xl font-black text-white shadow-2xl ${student.color}`}>
              {student.initials}
            </div>
          </div>
        </div>

        {/* Header Info - Better spacing */}
        <div className="px-16 pt-24 pb-12 flex flex-wrap items-end justify-between gap-10">
          <div className="flex-1">
            <DialogHeader className="p-0 text-left">
              <div className="inline-flex items-center gap-2 mb-3">
                 <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg ring-1 ring-primary/20">Perfil de Alumno</span>
                 <span className="bg-orange-500/10 text-orange-600 text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg ring-1 ring-orange-500/20">{student.grupo || 'GENERAL'}</span>
              </div>
              <DialogTitle className="text-5xl font-black tracking-tighter mb-3 uppercase leading-tight">{student.name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-8 mt-4">
                <p className="text-sm font-bold text-muted-foreground/60 flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary/50" /> {student.email}
                </p>
                <p className="text-sm font-bold text-muted-foreground/60 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary/50" /> Campus Virtual — Nodo Educativo
                </p>
              </div>
            </DialogHeader>
          </div>
          
          <div className="rounded-[2.5rem] bg-dash-bg border border-dash-border px-10 py-6 flex items-center gap-10 shadow-2xl border-opacity-50">
            <div className="text-right">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 mb-2">Promedio Gral.</p>
                <div className="text-6xl font-black text-primary dark:text-dash-accent tracking-tighter leading-none">
                {student.score}
                <span className="text-lg font-bold text-muted-foreground/20 ml-2 tracking-normal">/10</span>
                </div>
            </div>
            <div className="h-16 w-px bg-dash-border/60" />
            <div className="text-center">
                 <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 mb-3">Rendimiento</p>
                 <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Optimo</span>
                 </div>
            </div>
          </div>
        </div>

        {/* Improved Grid Layout - 4:8 ratio but with more absolute width */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 px-16 pb-16">
          
          {/* Radar Section - Expanded width container */}
          <div className="lg:col-span-4 space-y-10">
            <div className="rounded-[3rem] border border-dash-border bg-dash-bg/40 p-10 flex flex-col items-center shadow-xl">
                <div className="w-full flex items-center justify-between mb-10">
                    <h4 className="text-[13px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Análisis Competencial</h4>
                </div>
                <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={student.stats}>
                    <PolarGrid stroke="rgba(100,116,139,0.15)" />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: "#64748b", fontSize: 12, fontWeight: 900 }}
                    />
                    <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={false} 
                        axisLine={false}
                    />
                    <Radar
                        name={student.name}
                        dataKey="value"
                        stroke="#219EBC"
                        fill="#219EBC"
                        fillOpacity={0.4}
                        strokeWidth={4}
                    />
                    </RadarChart>
                </ResponsiveContainer>
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-dash-border bg-dash-bg/40 p-8 shadow-xl">
                <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-6">Métricas de Actividad</h4>
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Tiempo en simulación</span>
                        <span className="font-black text-foreground text-sm uppercase">{student.lastActivity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Tasa de finalización</span>
                        <span className="font-black text-foreground text-sm uppercase">100%</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Practice List - Max context width */}
          <div className="lg:col-span-8 space-y-10">
            <div className="rounded-[3rem] border border-dash-border bg-dash-card/40 h-full overflow-hidden flex flex-col shadow-2xl">
                <div className="p-10 border-b border-dash-border bg-dash-card/60 flex items-center justify-between">
                    <div>
                        <h4 className="text-[13px] font-black uppercase tracking-[0.4em] text-muted-foreground">Evolución Histórica</h4>
                        <p className="text-[12px] text-muted-foreground/50 font-bold mt-2 uppercase tracking-tight">Registro de desempeño en laboratorios vivos</p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-primary flex flex-col items-center justify-center text-white shadow-xl shadow-primary/30">
                        <span className="text-lg font-black leading-none">{student.practices?.filter(p => p.status === 'completada').length || 0}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">ENTREGAS</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[580px] p-8 space-y-4">
                    {student.practices?.map((practice) => (
                        <div key={practice.id} className="flex items-center gap-8 rounded-[2rem] p-6 transition-all hover:bg-dash-card border border-transparent hover:border-dash-border group hover:shadow-xl bg-dash-bg/20">
                            {/* Status Icon Wrapper */}
                            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-inner ${
                                practice.status === 'completada' ? 'bg-emerald-500/15' : 
                                practice.status === 'en_progreso' ? 'bg-orange-500/15' : 'bg-muted/30'
                            }`}>
                                {practice.status === 'completada' && <CheckCircle2 className="h-7 w-7 text-emerald-500" />}
                                {practice.status === 'en_progreso' && <Clock className="h-7 w-7 text-orange-500" />}
                                {practice.status === 'pendiente' && <XCircle className="h-7 w-7 text-muted-foreground/20" />}
                            </div>
                            
                            {/* Practice Info - No Truncation */}
                            <div className="flex-1 min-w-0">
                                <h5 className="text-base font-black text-foreground group-hover:text-primary dark:group-hover:text-dash-accent transition-colors uppercase tracking-tighter mb-1">
                                    {practice.name}
                                </h5>
                                <div className="flex items-center gap-4">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{practice.subject}</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-dash-border" />
                                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${
                                        practice.status === 'completada' ? 'text-emerald-500' : 
                                        practice.status === 'en_progreso' ? 'text-orange-500' : 'text-muted-foreground/30'
                                    }`}>
                                        {practice.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                             {/* Stats & Actions */}
                             <div className="flex items-center gap-8 pl-4 border-l border-dash-border/30">
                                 <div className="text-right min-w-[80px]">
                                     <span className="block text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Calificación</span>
                                     {practice.score !== null ? (
                                         <div className="text-2xl font-black text-foreground tracking-tighter">
                                             {practice.score}
                                             <span className="text-sm font-bold text-muted-foreground/20 ml-1 tracking-normal">/10</span>
                                         </div>
                                     ) : (
                                         <span className="text-xs font-black uppercase text-muted-foreground/10 italic tracking-widest">—</span>
                                     )}
                                 </div>
                                 
                                 {practice.status === 'completada' && (
                                   <button
                                     onClick={() => generateReinforcementReport(student, practice)}
                                     className="p-3 rounded-xl bg-dash-bg border border-dash-border text-[#023047] hover:bg-primary hover:text-white hover:border-primary transition-all group/btn shadow-sm"
                                     title="Generar Ficha de Refuerzo"
                                   >
                                     <Sparkles className="h-4 w-4 group-hover/btn:animate-pulse" />
                                   </button>
                                 )}
                             </div>
                        </div>
                    ))}
                    
                    {(!student.practices || student.practices.length === 0) && (
                      <div className="py-24 text-center">
                         <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/30">Sin actividad registrada</p>
                      </div>
                    )}
                </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
