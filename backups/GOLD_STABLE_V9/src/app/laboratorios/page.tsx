"use client";

import Sidebar from "@/components/Sidebar";
import { laboratories } from "@/lib/mockData";
import { PlayCircle, BookOpen, Users, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function LaboratoriosPage() {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <Sidebar />

      <main className="col-start-2 overflow-y-auto bg-dash-bg p-8 flex flex-col items-center justify-center">
        {/* Page Header */}
        <div className="mb-14 text-center max-w-3xl w-full">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/10 text-primary shadow-inner">
                <Activity className="h-8 w-8" />
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tight mb-4 uppercase">
                Biblioteca de Escenarios
            </h1>
            <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
                4 Unidades fundamentales con 10 laboratorios de práctica continua por asignatura.
            </p>
        </div>

        {/* Labs Carousel - Highly Aesthetic Implementation */}
        <div className="w-full max-w-6xl px-16">
            <Carousel
                opts={{
                    align: "center",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-8">
                    {laboratories.map((lab) => (
                        <CarouselItem key={lab.id} className="pl-8 md:basis-1/2 lg:basis-1/3">
                            <div className="group relative overflow-hidden rounded-[3rem] border border-dash-border bg-dash-card transition-all duration-700 hover:border-primary/60 hover:shadow-[0_40px_80px_-20px_rgba(2,48,71,0.15)] hover:-translate-y-4">
                                {/* Image Preview */}
                                <div className="relative h-72 w-full overflow-hidden">
                                    <img 
                                        src={lab.image} 
                                        alt={lab.name} 
                                        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-125"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-dash-card via-dash-card/20 to-transparent" />
                                    
                                    {/* Subject Badge */}
                                    <div className="absolute top-6 left-6">
                                         <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white ${lab.bgColor.replace('dark:', '')} backdrop-blur-xl border border-white/20 shadow-2xl`}>
                                            <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]" />
                                            {lab.subject}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-10">
                                    <h3 className="mb-4 text-2xl font-black text-foreground tracking-tighter group-hover:text-primary dark:group-hover:text-dash-accent transition-colors uppercase">
                                        {lab.name}
                                    </h3>
                                    
                                    <p className="text-[13px] font-medium text-muted-foreground/80 leading-relaxed mb-8 line-clamp-2">
                                        {lab.description}
                                    </p>

                                    <div className="mb-10 grid grid-cols-2 gap-4 border-y border-dash-border/40 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Currículo</span>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                                <span className="text-[12px] font-black text-foreground">{lab.practices} PRÁCTICAS</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 border-l border-dash-border/40 pl-4">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Participación</span>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-primary" />
                                                <span className="text-[12px] font-black text-foreground">{lab.activeStudents} ALUMNOS</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <button className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-primary py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#034061] hover:shadow-[0_20px_40px_-10px_rgba(2,48,71,0.4)] active:scale-95">
                                            <PlayCircle className="h-5 w-5" />
                                            ACCEDER
                                        </button>
                                        <button className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] border border-dash-border bg-dash-bg py-5 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
                                            GUÍA DOCENTE
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="flex justify-center gap-6 mt-16">
                   <CarouselPrevious className="static translate-y-0 h-16 w-16 rounded-3xl border-dash-border bg-dash-card hover:border-primary/50 hover:bg-primary hover:text-white transition-all shadow-xl" />
                   <CarouselNext className="static translate-y-0 h-16 w-16 rounded-3xl border-dash-border bg-dash-card hover:border-primary/50 hover:bg-primary hover:text-white transition-all shadow-xl" />
                </div>
            </Carousel>
        </div>
      </main>
    </div>
  );
}
