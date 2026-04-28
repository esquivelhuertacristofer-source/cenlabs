"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { upcomingActivities, calendarActivities } from "@/lib/mockData";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { DayButton, type DayButtonProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function CalendarPanel() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Custom DayButton to show activity dots
  const CustomDayButton = (props: DayButtonProps) => {
    const { day, modifiers, ...buttonProps } = props;
    const dayOfMonth = day.date.getDate();
    const isCurrentMonth = day.date.getMonth() === new Date().getMonth();
    const color = calendarActivities[dayOfMonth];

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
      <div className="rounded-2xl border border-dash-border bg-dash-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Calendario de Actividades</h3>
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

      {/* Upcoming Activities */}
      <div className="rounded-2xl border border-dash-border bg-dash-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Próximas Actividades
          </h3>
          <button className="text-xs font-medium text-primary transition-colors hover:text-primary/80 uppercase tracking-widest font-black">
            Ver todo
          </button>
        </div>
        <div className="space-y-3">
          {upcomingActivities.map((activity, i) => (
            <div
              key={i}
              className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
            >
              <div 
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                style={{ 
                  backgroundColor: `${calendarActivities[activity.day]}20`, 
                  color: calendarActivities[activity.day] 
                }}
              >
                {activity.day}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.date}{" "}
                  <span style={{ color: calendarActivities[activity.day] }}>● {activity.time}</span>
                </p>
                <p className="truncate text-[10px] text-muted-foreground/60 italic">
                  {activity.location}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
