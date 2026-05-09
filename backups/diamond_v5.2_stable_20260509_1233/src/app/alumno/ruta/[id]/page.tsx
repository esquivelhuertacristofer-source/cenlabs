"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, ArrowRight, Play, Award, 
  FlaskConical, Zap, Microscope, Calculator, Atom
} from 'lucide-react';
import { FACULTADES } from '@/lib/rutas_mapeo';
import { PLANEAMIENTOS } from '@/lib/planeamientos';
import ThemeToggle from '@/components/ThemeToggle';

import RadarCompetencias from '@/components/RadarCompetencias';

export default function FacultadRutaPage() {
  const { id } = useParams();
  const router = useRouter();
  const facultad = FACULTADES[id as keyof typeof FACULTADES];

  if (!facultad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#060B14]">
        <h1 className="text-2xl font-black text-[#023047] dark:text-white mb-4">Facultad no encontrada</h1>
        <Link href="/alumno/inicio" className="text-[#219EBC] font-black uppercase tracking-widest text-xs flex items-center gap-2">
           <ArrowLeft size={16} /> Volver al Hub
        </Link>
      </div>
    );
  }

  // Filtrar planeamientos que pertenecen a esta facultad
  const labsMapeados = Object.values(PLANEAMIENTOS).filter(p => facultad.labs.includes(p.id));

  return (
    <div className="min-h-screen font-['Outfit'] bg-[#F8FAFC] dark:bg-[#060B14] transition-colors duration-500 overflow-x-hidden">
      
      {/* ── HEADER / NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-6">
        <div className="max-w-[1600px] mx-auto bg-white/40 dark:bg-[#0A1121]/40 backdrop-blur-xl px-6 py-4 flex justify-between items-center rounded-2xl border border-white/40 dark:border-white/10 shadow-lg transition-all duration-300">
          <button 
            onClick={() => router.push('/alumno/inicio')}
            className="flex items-center gap-3 group text-[#023047] dark:text-white transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-white/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-black text-xs uppercase tracking-[0.2em] hidden sm:block">Regresar al Hub</span>
          </button>
          
          <div className="flex items-center gap-4">
             <ThemeToggle />
             <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2"></div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#023047]/40 dark:text-white/40 uppercase tracking-widest hidden lg:block text-right">Sesión <br />Activa</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#219EBC] to-[#023047] flex items-center justify-center text-white font-black shadow-lg">
                  AL
                </div>
             </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 px-6 pb-24 flex flex-col items-center">
        
        {/* ── HERO DE FACULTAD: DASHBOARD PROFESIONAL ── */}
        <div className="w-full max-w-[1600px] mb-20 flex flex-col lg:flex-row gap-8">
          {/* Tarjeta de Identidad */}
          <div className="flex-[2] relative rounded-[60px] overflow-hidden group shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] h-[500px] md:h-[600px]">
            <Image 
              src={facultad.image} 
              alt={facultad.nombre} 
              fill
              priority
              className="object-cover transition-transform duration-[20s] ease-linear group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/60 to-transparent z-10"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-20">
               <div className="flex flex-col gap-4 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                 <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full w-fit text-[10px] font-black text-white uppercase tracking-[0.3em]">
                    Especialización Académica
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight italic">
                   {facultad.nombre}
                 </h1>
                 <p className="text-lg text-white/70 font-medium leading-relaxed">
                   {facultad.descripcion}
                 </p>
                 <div className="flex items-center gap-8 mt-6 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 w-fit">
                    <div className="flex flex-col">
                       <span className="text-3xl font-black text-white">{labsMapeados.length}</span>
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Módulos</span>
                    </div>
                    <div className="w-px h-10 bg-white/20"></div>
                    <div className="flex flex-col">
                       <span className="text-3xl font-black text-[#FB8500]">Elite</span>
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Nivel Carrera</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Radar de Competencias */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[60px] p-8 border border-white/60 dark:border-white/10 flex flex-col h-full shadow-xl">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[#023047] dark:text-white font-black text-sm uppercase tracking-[0.3em]">Perfil de Competencias</h3>
                  <Award className="text-[#FB8500]" size={24} />
               </div>
               
               <RadarCompetencias color={facultad.accent} />

               <div className="mt-8 space-y-4">
                  <p className="text-[10px] font-black text-[#023047]/40 dark:text-white/40 uppercase tracking-widest">Proyección Profesional</p>
                  <div className="flex flex-wrap gap-2">
                    {facultad.id === 'ingenieria' ? (
                      ['Ingeniero Aeroespacial', 'Analista de Procesos', 'I+D Materiales'].map(s => (
                        <span key={s} className="px-3 py-1 bg-[#023047] text-[#8ECAE6] text-[9px] font-black rounded-full uppercase tracking-widest">{s}</span>
                      ))
                    ) : facultad.id === 'salud' ? (
                      ['Médico Investigador', 'Biotecnólogo', 'Patólogo'].map(s => (
                        <span key={s} className="px-3 py-1 bg-[#FB8500] text-white text-[9px] font-black rounded-full uppercase tracking-widest">{s}</span>
                      ))
                    ) : (
                      ['Científico de Datos', 'Astrofísico', 'Matemático'].map(s => (
                        <span key={s} className="px-3 py-1 bg-[#219EBC] text-white text-[9px] font-black rounded-full uppercase tracking-widest">{s}</span>
                      ))
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* ── LISTADO DE LABORATORIOS: EL DIRECTORIO ── */}
        <div className="w-full max-w-[1600px]">
           <div className="flex items-center gap-4 mb-12">
              <h2 className="text-[#023047] dark:text-white font-black text-3xl tracking-tight">Cruce de Prácticas Aplicadas</h2>
              <div className="h-[1px] flex-grow bg-slate-200 dark:bg-slate-800"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {labsMapeados.map((lab, index) => {
                const Icon = lab.materia === 'Física' ? Zap : lab.materia === 'Química' ? FlaskConical : lab.materia === 'Biología' ? Microscope : Calculator;
                return (
                  <Link 
                    key={lab.id}
                    href={`/alumno/laboratorio/${lab.id.split('-')[0]}?id=${lab.id}`} 
                    className="group bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[40px] p-8 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all flex flex-col h-full relative overflow-hidden stagger-2"
                  >
                    {/* Background Glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#219EBC]/5 blur-[40px] rounded-full group-hover:bg-[#219EBC]/15 transition-colors"></div>

                    <div className="flex items-start justify-between mb-8">
                       <div className="w-14 h-14 rounded-2xl bg-[#f8fafc] dark:bg-white/5 flex items-center justify-center text-[#219EBC] shadow-inner group-hover:scale-110 transition-transform">
                          <Icon className="w-7 h-7" />
                       </div>
                       <div className="text-[10px] font-black text-[#023047]/40 dark:text-white/40 uppercase tracking-[0.2em] bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-full border border-slate-200 dark:border-white/10">
                          {lab.materia}
                       </div>
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-xl md:text-2xl font-black text-[#023047] dark:text-white leading-tight mb-4 group-hover:text-[#219EBC] transition-colors">
                        {lab.titulo}
                      </h3>
                      <p className="text-sm text-slate-400 dark:text-slate-500 font-medium leading-relaxed line-clamp-3 mb-6">
                        {lab.teoria}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-[#FB8500]"></div>
                         <span className="text-[10px] font-black text-[#023047]/60 dark:text-white/40 uppercase tracking-widest">{lab.dificultad}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#219EBC] font-black text-xs uppercase tracking-widest translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        Simular <ArrowRight size={14} />
                      </div>
                    </div>

                    {/* Efecto de 'Card Index' al hover */}
                    <div className="absolute top-0 left-0 w-2 h-0 bg-[#219EBC] group-hover:h-full transition-all duration-500"></div>
                  </Link>
                );
              })}
           </div>
        </div>
      </main>

      {/* ── FOOTER ACADÉMICO ── */}
      <footer className="w-full py-20 px-6 border-t border-slate-200 dark:border-white/5 mt-20">
         <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-[#023047] flex items-center justify-center text-[#8ECAE6] font-black text-xl shadow-lg">
                  C
               </div>
               <div>
                  <p className="font-black text-[#023047] dark:text-white uppercase tracking-widest text-sm">CEN Laboratorios</p>
                  <p className="text-xs text-slate-400 font-medium tracking-wide">University Standard • v3.5</p>
               </div>
            </div>
            <p className="text-slate-400 text-xs font-medium text-center md:text-right italic">
              "La experimentación es la única fuente de verdad. El resto es solo poesía."
            </p>
         </div>
      </footer>

      {/* Estilos locales para animaciones Stagger */}
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-2 {
          animation: fadeUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
