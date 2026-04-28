"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { PlayCircle, FlaskConical, Zap, Microscope, Calculator, BookOpen, Users, Activity } from "lucide-react";

const LABS_REAL = [
  {
    id: "quimica",
    name: "Laboratorio de Química",
    subject: "Química",
    description: "10 prácticas interactivas: construcción atómica, leyes de gases, titulación, electroquímica y más.",
    practices: 10,
    icon: FlaskConical,
    color: "from-[#219EBC] to-[#023047]",
    badgeColor: "bg-[#219EBC]",
    href: "/alumno/laboratorio/quimica",
    image: "/images/quimica_3d.png"
  },
  {
    id: "fisica",
    name: "Laboratorio de Física",
    subject: "Física",
    description: "10 prácticas: tiro parabólico, plano inclinado, péndulo, ley de Hooke, colisiones y circuitos.",
    practices: 10,
    icon: Zap,
    color: "from-[#FB8500] to-[#E85D04]",
    badgeColor: "bg-[#FB8500]",
    href: "/alumno/laboratorio/fisica",
    image: "/images/fisica_3d.png"
  },
  {
    id: "biologia",
    name: "Laboratorio de Biología",
    subject: "Biología",
    description: "10 prácticas: microscopio virtual, transporte celular, síntesis de proteínas, genética y ecosistemas.",
    practices: 10,
    icon: Microscope,
    color: "from-[#8ECAE6] to-[#219EBC]",
    badgeColor: "bg-[#8ECAE6]",
    href: "/alumno/laboratorio/biologia",
    image: "/images/biologia_3d.png"
  },
  {
    id: "matematicas",
    name: "Laboratorio de Matemáticas",
    subject: "Matemáticas",
    description: "10 prácticas: sistemas de ecuaciones, funciones cuadráticas, trigonometría, derivadas e integrales.",
    practices: 10,
    icon: Calculator,
    color: "from-[#FFB703] to-[#FB8500]",
    badgeColor: "bg-[#FFB703]",
    href: "/alumno/laboratorio/matematicas",
    image: "/images/mates_3d.png"
  },
];

export default function LaboratoriosContent() {
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('intentos')
        .select('id_alumno, sim_id')
        .eq('status', 'completed');

      if (data) {
        const counts: Record<string, Set<string>> = {};
        data.forEach(item => {
          const materia = item.sim_id.split('-')[0];
          if (!counts[materia]) counts[materia] = new Set();
          counts[materia].add(item.id_alumno);
        });
        const result: Record<string, number> = {};
        Object.entries(counts).forEach(([k, v]) => result[k] = v.size);
        setStats(result);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <Sidebar />

      <main className="col-start-2 overflow-y-auto bg-dash-bg p-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Biblioteca de Laboratorios</h1>
              <p className="text-sm text-muted-foreground font-medium">4 materias · 40 prácticas interactivas en total</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {LABS_REAL.map((lab) => {
            const Icon = lab.icon;
            const activeStudents = stats[lab.id] || 0;

            return (
              <div
                key={lab.id}
                className="group relative overflow-hidden rounded-[2.5rem] border border-dash-border bg-dash-card transition-all duration-500 hover:border-primary/40 hover:shadow-[0_30px_60px_-15px_rgba(2,48,71,0.15)] hover:-translate-y-2"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={lab.image}
                    alt={lab.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${lab.color} opacity-80`} />

                  <div className="absolute top-6 left-6">
                    <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white ${lab.badgeColor} backdrop-blur-xl border border-white/20 shadow-xl`}>
                      <Icon className="h-3.5 w-3.5" />
                      {lab.subject}
                    </div>
                  </div>

                  <div className="absolute -bottom-4 -right-4 opacity-10">
                    <Icon className="h-32 w-32 text-white" />
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-xl font-black text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {lab.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">
                    {lab.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 border-y border-dash-border/50 py-5 mb-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Prácticas</span>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm font-black text-foreground">{lab.practices} módulos</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-dash-border/50 pl-4">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Alumnos activos</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-black text-foreground">{activeStudents} completaron</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={lab.href}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#034061] hover:shadow-[0_15px_30px_-8px_rgba(2,48,71,0.35)] active:scale-95"
                  >
                    <PlayCircle className="h-5 w-5" />
                    Ver Prácticas
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
