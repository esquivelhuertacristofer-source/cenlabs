"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabase-browser";
import { ChevronRight, History, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { DayButton, type DayButtonProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { PLANEAMIENTOS } from "@/lib/planeamientos";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CalendarPanel() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activityDays, setActivityDays] = useState<Record<string, string>>({});
  const [plannedDays, setPlannedDays] = useState<Record<string, string>>({});
  const [allActivity, setAllActivity] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [isSaving, setIsSaving] = useState(false);

  const fetchAllData = async () => {
    // 1. Fetch Actual Activity (Completions)
    const { data: intentos } = await supabase
      .from('intentos')
      .select('completed_at, sim_id, profiles(full_name)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    // 2. Fetch Planned Assignments
    const { data: asignaciones } = await supabase
      .from('asignaciones')
      .select('*')
      .order('planned_date', { ascending: true });

    if (intentos) {
      const days: Record<string, string> = {};
      intentos.forEach(item => {
        if (item.completed_at) {
          const dStr = format(new Date(item.completed_at), 'yyyy-MM-dd');
          days[dStr] = "#219EBC"; // Teal for completion
        }
      });
      setActivityDays(days);
      const { data: assignments, error: asigError } = await supabase.from('asignaciones').select('*');
      if (asigError) {
        console.warn("La tabla 'asignaciones' no existe o no es accesible aún.");
      } else if (assignments) {
        setAllAssignments(assignments);
        const mapped = assignments.reduce((acc, a) => {
          const d = format(new Date(a.planned_date), 'yyyy-MM-dd');
          acc[d] = '#FB8500';
          return acc;
        }, {} as Record<string, string>);
        setPlannedDays(mapped);
      }
      setAllActivity(intentos);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSaveAssignment = async () => {
    if (!date || !selectedLab) return;
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión activa");

      // Obtener ID real del grupo si no es 'all'
      let groupIdToSave = 'all';
      if (selectedGroup !== 'all') {
        const { data: gData } = await supabase.from('grupos').select('id').eq('nombre', selectedGroup).single();
        if (gData) groupIdToSave = gData.id;
      }

      const newAssignment = {
        id_profesor: user.id,
        sim_id: selectedLab,
        planned_date: format(date, 'yyyy-MM-dd'),
        id_grupo: groupIdToSave,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('asignaciones').insert(newAssignment);
      
      if (error) {
        console.error("Error Supabase:", error);
        alert("Error al guardar: Asegúrate de crear la tabla 'asignaciones' en tu Supabase SQL Editor.");
      } else {
        await fetchAllData();
        setIsModalOpen(false);
        setSelectedLab("");
      }
    } catch (err: any) {
      console.error("Error en handleSaveAssignment:", err);
      alert(err.message || "Error inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering logic for the selected day
  const { dayActivity, dayAssignments } = useMemo(() => {
    if (!date) return { dayActivity: [], dayAssignments: [] };
    
    const dStr = format(date, 'yyyy-MM-dd');
    return {
      dayActivity: allActivity.filter(i => format(new Date(i.completed_at), 'yyyy-MM-dd') === dStr),
      dayAssignments: allAssignments.filter(a => format(new Date(a.planned_date), 'yyyy-MM-dd') === dStr)
    };
  }, [date, allActivity, allAssignments]);

  const CustomDayButton = (props: DayButtonProps) => {
    const { day, modifiers, ...buttonProps } = props;
    const dayOfMonth = day.date.getDate();
    const dStr = format(day.date, 'yyyy-MM-dd');
    
    const hasActivity = activityDays[dStr];
    const hasPlanned = plannedDays[dStr];

    return (
      <DayButton
        day={day}
        modifiers={modifiers}
        {...buttonProps}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative h-8 w-8 p-0 font-black aria-selected:opacity-100",
          modifiers.selected && "bg-[#023047] text-white hover:bg-[#023047] hover:text-white rounded-xl shadow-lg",
          modifiers.today && "border-2 border-primary/20",
          props.className
        )}
      >
        <span className="relative z-10 text-[11px]">{dayOfMonth}</span>
        <div className="absolute bottom-1 flex gap-0.5 justify-center w-full">
          {hasActivity && (
            <div className="h-1 w-1 rounded-full bg-[#219EBC]" />
          )}
          {hasPlanned && (
            <div className="h-1 w-1 rounded-full bg-[#FB8500]" />
          )}
        </div>
      </DayButton>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Card */}
      <div className="rounded-[2.5rem] border border-dash-border bg-white p-5 shadow-sm group">
        <div className="mb-4 flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary opacity-40" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Planeación Docente</h3>
           </div>
           
           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
             <DialogTrigger 
               render={
                <button className="h-7 w-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                  <span className="text-lg leading-none">+</span>
                </button>
               }
             />
             <DialogContent className="rounded-[2.5rem] border-dash-border bg-white p-8 max-w-md font-outfit">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#023047] tracking-tight">Programar Práctica</DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Para el {date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : 'día seleccionado'}
                  </p>
                </DialogHeader>
                
                <div className="py-6 space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#023047]/40">Seleccionar Laboratorio</label>
                      <Select value={selectedLab} onValueChange={(val: string | null) => setSelectedLab(val || "")}>
                        <SelectTrigger className="w-full h-14 rounded-2xl border-dash-border bg-dash-bg font-bold text-[#023047]">
                          <SelectValue placeholder="Elige un simulador..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-dash-border bg-white shadow-2xl max-h-[300px]">
                          {Object.entries(PLANEAMIENTOS).map(([id, plan]) => (
                            <SelectItem key={id} value={id} className="font-bold text-xs py-3 rounded-xl focus:bg-primary/5">
                              {plan.titulo.split(':')[1] || plan.titulo} ({plan.materia})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                   
                   <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <p className="text-[10px] font-bold text-orange-800 leading-relaxed italic">
                        "La actividad aparecerá en el calendario de tus alumnos para este día."
                      </p>
                   </div>
                </div>

                <DialogFooter className="gap-3">
                   <DialogClose 
                     render={
                       <button className="flex-1 py-4 rounded-2xl border border-dash-border font-black text-[11px] uppercase tracking-widest text-muted-foreground hover:bg-dash-bg transition-all">
                         Cancelar
                       </button>
                     }
                   />
                   <button 
                    onClick={handleSaveAssignment}
                    disabled={!selectedLab || isSaving}
                    className="flex-[2] py-4 rounded-2xl bg-[#023047] text-white font-black text-[11px] uppercase tracking-widest hover:bg-[#219EBC] shadow-xl shadow-[#023047]/20 transition-all disabled:opacity-50"
                   >
                     {isSaving ? 'Guardando...' : 'Confirmar Agenda'}
                   </button>
                </DialogFooter>
             </DialogContent>
           </Dialog>
        </div>

        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-full"
          locale={es}
          components={{
            DayButton: CustomDayButton
          }}
        />
      </div>

      {/* Detail Sidebar - Agenda & Activity */}
      <div className="rounded-[2.5rem] border border-dash-border bg-white p-6 shadow-sm min-h-[300px] flex flex-col">
        <div className="mb-6 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#023047]">
                Agenda: {date ? format(date, "dd MMM", { locale: es }) : '--'}
              </h3>
           </div>
        </div>

        <div className="space-y-4 flex-1">
          {/* Planned Assignments */}
          {dayAssignments.length > 0 && (
            <div className="space-y-2">
               {dayAssignments.map((asig, i) => (
                 <div key={i} className="bg-orange-500/5 border border-orange-200/50 rounded-2xl p-4 flex gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-200">
                       <History className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">Planificado</p>
                       <p className="text-xs font-black text-[#023047] line-clamp-1">
                         {PLANEAMIENTOS[asig.sim_id]?.titulo.split(':')[1] || asig.sim_id}
                       </p>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* Actual Activity Logs */}
          <div className="space-y-3 mt-4">
             <h4 className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest pl-1 mb-2">Completados Hoy</h4>
             {dayActivity.length > 0 ? dayActivity.map((activity, i) => (
               <div
                 key={i}
                 className="group flex flex-col gap-1 rounded-2xl p-4 bg-dash-bg/30 border border-transparent hover:border-dash-border transition-all"
               >
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#219EBC] uppercase tracking-tighter">
                      {activity.sim_id.split('-')[0]}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground/40">
                      {format(new Date(activity.completed_at), "HH:mm")}
                    </span>
                 </div>
                 <p className="text-xs font-black text-[#023047]">
                   {activity.profiles?.full_name || "Alumno"}
                 </p>
                 <p className="text-[10px] text-muted-foreground/60 italic leading-none font-medium">
                    Práctica exitosa
                 </p>
               </div>
             )) : dayAssignments.length === 0 ? (
               <div className="py-12 text-center">
                  <p className="text-[10px] font-black uppercase text-muted-foreground/20 tracking-widest leading-loose">
                    Sin actividad<br/>ni agenda
                  </p>
               </div>
             ) : (
                <p className="text-[10px] font-bold text-muted-foreground/30 italic text-center py-4">Esperando entregas...</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
