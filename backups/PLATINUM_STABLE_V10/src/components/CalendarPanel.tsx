"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabase";
import { ChevronRight, History, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { DayButton, type DayButtonProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarPanel() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activityDays, setActivityDays] = useState<Record<number, string>>({});
  const [recentByDate, setRecentByDate] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCalendarActivity() {
      const { data } = await supabase
        .from('intentos')
        .select('completed_at, sim_id, profiles(full_name)')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (data) {
        const days: Record<number, string> = {};
        data.forEach(item => {
          if (item.completed_at) {
            const d = new Date(item.completed_at);
            if (d.getMonth() === new Date().getMonth()) {
              days[d.getDate()] = "#219EBC";
            }
          }
        });
        setActivityDays(days);
        setRecentByDate(data.slice(0, 3));
      }
    }
    fetchCalendarActivity();
  }, []);

  const CustomDayButton = (props: DayButtonProps) => {
    const { day, modifiers, ...buttonProps } = props;
    const dayOfMonth = day.date.getDate();
    const isCurrentMonth = day.date.getMonth() === new Date().getMonth();
    const color = activityDays[dayOfMonth];

    return (
      <DayButton
        day={day}
        modifiers={modifiers}
        {...buttonProps}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative h-8 w-8 p-0 font-normal aria-selected:opacity-100",
          modifiers.selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          modifiers.today && "bg-muted text-foreground",
          props.className
        )}
      >
        <span className="relative z-10">{dayOfMonth}</span>
        {color && isCurrentMonth && !modifiers.outside && (
          <div 
            className="absolute bottom-1.5 h-1 w-1 rounded-full z-20" 
            style={{ backgroundColor: color }}
          />
        )}
      </DayButton>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="rounded-[2rem] border border-dash-border bg-white p-4 shadow-sm group">
        <div className="mb-4 flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary opacity-40" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Actividad Mensual</h3>
           </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-full"
          components={{
            DayButton: CustomDayButton
          }}
        />
      </div>

      {/* Recapitulativo de Hoy/Reciente */}
      <div className="rounded-[2rem] border border-dash-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <History className="w-4 h-4 text-orange-500 opacity-40" />
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
               Logs Recientes
             </h3>
          </div>
        </div>
        <div className="space-y-4">
          {recentByDate.length > 0 ? recentByDate.map((activity, i) => (
            <div
              key={i}
              className="group flex flex-col gap-1 rounded-xl p-3 bg-dash-bg/30 border border-transparent hover:border-dash-border transition-all"
            >
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                   {activity.sim_id.split('-')[0]}
                 </span>
                 <span className="text-[9px] font-bold text-muted-foreground/40">
                   {format(new Date(activity.completed_at), "HH:mm")}
                 </span>
              </div>
              <p className="text-xs font-bold text-[#023047] line-clamp-1">
                {activity.profiles?.full_name || "Alumno"}
              </p>
              <p className="text-[10px] text-muted-foreground/60 italic leading-none">
                 Completó práctica
              </p>
            </div>
          )) : (
            <div className="py-10 text-center">
               <p className="text-[10px] font-black uppercase text-muted-foreground/20 tracking-widest">Sin actividad reciente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
