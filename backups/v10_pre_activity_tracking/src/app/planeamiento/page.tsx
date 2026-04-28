"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PLANEAMIENTOS, Planeamiento } from "@/lib/planeamientos";
import { 
  BookOpen, Clock, Target, Rocket, 
  Lightbulb, CheckCircle, GraduationCap, 
  FlaskConical, Zap, Microscope, Calculator,
  ChevronRight, Sparkles, BookCheck, LayoutDashboard,
  Book, CheckSquare, Info, FileText, Search, X, Monitor, MonitorOff,
  Atom, Layers, Cloud, Wind, Thermometer, Snowflake, Users, 
  Divide, Hash, Scale, FastForward, Ruler, ArrowDown, Waves, 
  XOctagon, Eye, Maximize, Contrast, RefreshCw, Puzzle, ChevronUp, 
  Square, Grid, TrendingUp, Move, Cpu, AlertCircle, ListChecks, ClipboardList
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Atom, Layers, Zap, Cloud, Wind, Thermometer, Snowflake, Users, 
  Divide, Hash, Scale, FastForward, Ruler, ArrowDown, Waves, 
  XOctagon, Eye, Maximize, Contrast, RefreshCw, Puzzle, ChevronUp, 
  Square, Grid, TrendingUp, Move, BookOpen, Cpu
};

const MATERIAS = [
  { id: 'Química', icon: FlaskConical, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'Física', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'Biología', icon: Microscope, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'Matemáticas', icon: Calculator, color: 'text-amber-500', bg: 'bg-amber-50' }
];

export default function PlaneamientoPage() {
  const [activeMateria, setActiveMateria] = useState<string>('Química');
  const [selectedLabId, setSelectedLabId] = useState<string>("quimica-1");
  const [activeTab, setActiveTab] = useState<'estrategia' | 'teoria' | 'evaluacion'>('estrategia');
  const [searchTerm, setSearchTerm] = useState("");
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  const labIds = Object.keys(PLANEAMIENTOS)
    .filter(id => PLANEAMIENTOS[id].materia === activeMateria)
    .filter(id => 
      PLANEAMIENTOS[id].titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  const selectedPlan = PLANEAMIENTOS[selectedLabId] || PLANEAMIENTOS[labIds[0]] || Object.values(PLANEAMIENTOS)[0];

  return (
    <div className={`grid min-h-screen ${isProjectorMode ? 'grid-cols-1' : 'grid-cols-[240px_1fr]'} transition-all duration-700`}>
      {!isProjectorMode && <Sidebar />}

      <main className={`${isProjectorMode ? '' : 'col-start-2'} overflow-y-auto bg-dash-bg flex transition-all duration-700`}>
        
        {!isProjectorMode && (
          <div className="w-[300px] border-r border-dash-border bg-white flex flex-col animate-in slide-in-from-left duration-500">
            <div className="p-6 border-b border-dash-border bg-dash-bg/30">
              <h2 className="text-xl font-black text-[#023047] tracking-tight flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Guía Docente
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">
                Planeamiento de Clase
              </p>
            </div>

            <div className="flex p-2 gap-1 bg-dash-bg/50 border-b border-dash-border">
              {MATERIAS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                     setActiveMateria(m.id);
                     const firstLab = Object.keys(PLANEAMIENTOS).find(id => PLANEAMIENTOS[id].materia === m.id);
                     if (firstLab) setSelectedLabId(firstLab);
                  }}
                  className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
                    activeMateria === m.id 
                    ? 'bg-white shadow-sm ring-1 ring-dash-border' 
                    : 'hover:bg-white/50 text-muted-foreground'
                  }`}
                >
                  <m.icon className={`h-4 w-4 mb-1 ${activeMateria === m.id ? m.color : 'text-muted-foreground/40'}`} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">{m.id.substring(0,4)}</span>
                </button>
              ))}
            </div>

            <div className="p-4 border-b border-dash-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                <input 
                  type="text"
                  placeholder="Buscar laboratorio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dash-bg border border-dash-border rounded-lg py-1.5 pl-8 pr-8 text-[10px] font-bold outline-none focus:ring-1 focus:ring-primary/20 transition-all font-outfit"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-dash-border rounded"
                  >
                    <X className="h-2.5 w-2.5 text-muted-foreground/60" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {labIds.map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedLabId(id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
                    selectedLabId === id 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-transparent hover:bg-dash-bg text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black leading-tight ${selectedLabId === id ? 'text-primary' : 'text-[#023047]/70'}`}>
                      {PLANEAMIENTOS[id].titulo.split(':')[1] || PLANEAMIENTOS[id].titulo}
                    </span>
                    <ChevronRight className={`h-3 w-3 transition-transform ${selectedLabId === id ? 'translate-x-1 text-primary' : 'opacity-0 group-hover:opacity-30'}`} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                     <div className={`h-1.5 w-1.5 rounded-full ${selectedLabId === id ? 'bg-primary' : 'bg-dash-border'}`} />
                     <span className="text-[9px] font-bold text-muted-foreground uppercase">{PLANEAMIENTOS[id].duracion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-12 transition-all duration-700 ${isProjectorMode ? 'bg-white max-w-5xl mx-auto shadow-2xl my-8 rounded-[3rem] border border-dash-border' : ''}`}>
          
          <div className="mb-12">
            <div className="flex items-start justify-between border-b border-dash-border pb-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedPlan.materia === 'Física' ? 'bg-blue-500/10 text-blue-600' :
                    selectedPlan.materia === 'Química' ? 'bg-emerald-500/10 text-emerald-600' :
                    selectedPlan.materia === 'Biología' ? 'bg-rose-500/10 text-rose-600' : 'bg-orange-500/10 text-orange-600'
                  }`}>
                    {selectedPlan.materia}
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-dash-border mx-2" />
                  <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Código: {selectedLabId?.toUpperCase()}</span>
                </div>
                <h1 className={`font-black text-[#023047] tracking-tighter leading-tight uppercase transition-all mb-4 ${isProjectorMode ? 'text-7xl' : 'text-5xl'}`} style={{ fontFamily: "Outfit" }}>
                  {selectedPlan.titulo}
                </h1>
                
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-dash-border shadow-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-[11px] font-black text-[#023047] uppercase">{selectedPlan.duracion} ESTIMADOS</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-dash-border shadow-sm">
                    <Target className="h-4 w-4 text-emerald-500" />
                    <span className="text-[11px] font-black text-[#023047] uppercase">{selectedPlan.nivel}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-dash-border shadow-sm">
                    <GraduationCap className="h-4 w-4 text-orange-500" />
                    <span className="text-[11px] font-black text-[#023047] uppercase">{selectedPlan.dificultad}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsProjectorMode(!isProjectorMode)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                      isProjectorMode 
                        ? 'bg-orange-500 border-orange-600 text-white shadow-xl shadow-orange-200' 
                        : 'bg-white border-dash-border text-muted-foreground hover:border-primary hover:text-primary shadow-sm'
                    }`}
                  >
                    {isProjectorMode ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    {isProjectorMode ? 'Salir modo aula' : 'Modo Proyector'}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#023047] text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-[#023047]/20 active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    Exportar Guía
                  </button>
                </div>
                {isProjectorMode && (
                  <span className="text-[10px] font-black text-orange-500 animate-pulse uppercase tracking-[0.2em] bg-orange-50/50 px-3 py-1.5 rounded-full border border-orange-100">VISTA OPTIMIZADA - PITCH READY</span>
                )}
              </div>
            </div>

            {/* BARRA DE TIEMPOS RESTAURADA Y MEJORADA */}
            <div className="mt-10">
               <div className="flex items-center justify-between mb-3 px-1">
                 <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                   <Clock className="w-3 h-3" /> Distribución Sugerida de la Sesión
                 </span>
                 <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-full border border-primary/10">Total: {selectedPlan.duracion}</span>
               </div>
               <div className="h-4 w-full rounded-full bg-dash-bg border border-dash-border overflow-hidden flex shadow-inner">
                  <div 
                    className="h-full bg-orange-400 border-r-2 border-white/20 relative group" 
                    style={{ width: '20%' }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[9px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Inicio: {selectedPlan.tiempos.inicio}</div>
                  </div>
                  <div 
                    className="h-full bg-primary border-r-2 border-white/20 relative group" 
                    style={{ width: '60%' }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#023047] text-white text-[9px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Desarrollo: {selectedPlan.tiempos.desarrollo}</div>
                  </div>
                  <div 
                    className="h-full bg-emerald-400 relative group" 
                    style={{ width: '20%' }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Cierre: {selectedPlan.tiempos.cierre}</div>
                  </div>
               </div>
               <div className="flex justify-between mt-3 px-1">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-orange-600 uppercase">Apertura</span>
                   <span className="text-[11px] font-bold text-[#023047]">{selectedPlan.tiempos.inicio}</span>
                 </div>
                 <div className="flex flex-col items-center">
                   <span className="text-[9px] font-black text-primary uppercase">Experimentación</span>
                   <span className="text-[11px] font-bold text-[#023047]">{selectedPlan.tiempos.desarrollo}</span>
                 </div>
                 <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black text-emerald-600 uppercase">Síntesis</span>
                   <span className="text-[11px] font-bold text-[#023047]">{selectedPlan.tiempos.cierre}</span>
                 </div>
               </div>
            </div>
          </div>

          <div className={`mb-12 flex items-center p-2 bg-dash-bg rounded-[2rem] border border-dash-border/50 shadow-sm ${isProjectorMode ? 'scale-110 origin-left ml-4' : ''}`}>
            {['estrategia', 'teoria', 'evaluacion'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeTab === tab 
                  ? 'bg-[#023047] text-white shadow-lg shadow-[#023047]/20' 
                  : 'text-muted-foreground hover:bg-dash-border'
                }`}
              >
                {tab === 'estrategia' ? 'Estrategia' : tab === 'teoria' ? 'Marco Teórico' : 'Evaluación'}
              </button>
            ))}
          </div>

          <div className={`animate-in fade-in slide-in-from-bottom-4 duration-1000 ${isProjectorMode ? 'px-8' : ''}`}>
            {activeTab === 'estrategia' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="relative pl-8 border-l-2 border-dashed border-dash-border space-y-12">
                     {/* MOMENTO A */}
                     <div className="relative">
                       <div className="absolute -left-[41px] top-0 h-4 w-4 rounded-full bg-orange-500 ring-4 ring-orange-100 shadow-sm" />
                       <div className={`bg-white p-8 rounded-[2.5rem] border border-dash-border shadow-sm hover:shadow-md transition-all ${isProjectorMode ? 'border-2' : ''}`}>
                          <div className="flex items-center justify-between mb-6">
                             <h3 className={`font-black text-orange-600 uppercase tracking-widest ${isProjectorMode ? 'text-3xl' : 'text-sm'}`}>FASE I: APERTURA Y ENGANCHE</h3>
                             <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black border border-orange-100">{selectedPlan.tiempos.inicio}</span>
                          </div>
                          <p className={`text-[#023047] leading-[1.8] transition-all ${isProjectorMode ? 'text-3xl font-medium' : 'text-base font-bold'}`}>{selectedPlan.inicio}</p>
                       </div>
                     </div>

                     {/* MOMENTO B */}
                     <div className="relative">
                       <div className="absolute -left-[41px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-blue-100 shadow-sm" />
                       <div className={`bg-white p-8 rounded-[2.5rem] border border-dash-border shadow-sm hover:shadow-md transition-all ${isProjectorMode ? 'border-2' : ''}`}>
                          <div className="flex items-center justify-between mb-6">
                             <h3 className={`font-black text-primary uppercase tracking-widest ${isProjectorMode ? 'text-3xl' : 'text-sm'}`}>FASE II: DESARROLLO Y EXPLORACIÓN</h3>
                             <span className="bg-blue-50 text-primary px-3 py-1 rounded-full text-[9px] font-black border border-blue-100">{selectedPlan.tiempos.desarrollo}</span>
                          </div>
                          <p className={`text-[#023047] leading-[1.8] transition-all ${isProjectorMode ? 'text-3xl font-medium' : 'text-base font-bold'}`}>{selectedPlan.desarrollo}</p>
                       </div>
                     </div>

                     {/* MOMENTO C */}
                     <div className="relative">
                       <div className="absolute -left-[41px] top-0 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shadow-sm" />
                       <div className={`bg-white p-8 rounded-[2.5rem] border border-dash-border shadow-sm hover:shadow-md transition-all ${isProjectorMode ? 'border-2' : ''}`}>
                          <div className="flex items-center justify-between mb-6">
                             <h3 className={`font-black text-emerald-600 uppercase tracking-widest ${isProjectorMode ? 'text-3xl' : 'text-sm'}`}>FASE III: CIERRE Y EVALUACIÓN</h3>
                             <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black border border-emerald-100">{selectedPlan.tiempos.cierre}</span>
                          </div>
                          <p className={`text-[#023047] leading-[1.8] transition-all ${isProjectorMode ? 'text-3xl font-medium' : 'text-base font-bold'}`}>{selectedPlan.cierre}</p>
                       </div>
                     </div>
                  </div>
                </div>

                {/* SIDEBAR DE FICHA TÉCNICA */}
                <div className="space-y-6">
                  <div className="bg-[#023047] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                     <div className="absolute right-0 top-0 p-8 opacity-10">
                        <Rocket className="h-32 w-32" />
                     </div>
                     <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                       <ListChecks className="h-5 w-5 text-orange-400" />
                       Ficha Técnica
                     </h3>
                     <div className="space-y-6 relative z-10">
                        <div>
                          <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-2 opacity-70">Objetivos de Aprendizaje</span>
                          <ul className="space-y-2">
                            {selectedPlan.objetivos.map((obj, i) => (
                              <li key={i} className="text-[11px] font-bold flex gap-2 opacity-90 leading-relaxed italic">
                                <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div>
                          <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-2 opacity-70">Competencias Clave</span>
                          <div className="flex flex-wrap gap-2">
                             {selectedPlan.competencias.map((comp, i) => (
                               <span key={i} className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full uppercase border border-white/5">{comp}</span>
                             ))}
                          </div>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div>
                          <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-2 opacity-70">Materiales Requeridos</span>
                          <div className="space-y-2">
                             {selectedPlan.materiales.map((mat, i) => (
                               <div key={i} className="flex items-center gap-2 text-[11px] font-bold">
                                 <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                 {mat}
                               </div>
                             ))}
                          </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-dash-border shadow-sm">
                     <div className="flex items-center gap-3 mb-4 text-primary">
                        <AlertCircle className="h-5 w-5" />
                        <h4 className="font-black text-[10px] uppercase tracking-widest">Tip para el Docente</h4>
                     </div>
                     <p className="text-[11px] font-bold text-[#023047]/60 leading-relaxed italic">
                       "{selectedPlan.tipDocente}"
                     </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teoria' && (
              <div className="space-y-12">
                <div className={`rounded-[3rem] border border-dash-border bg-white p-12 shadow-2xl transition-all relative overflow-hidden ${isProjectorMode ? 'border-4' : ''}`}>
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <BookOpen className="h-64 w-64" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="mb-10 flex items-center gap-5">
                      <div className="p-4 bg-primary/10 text-primary rounded-[1.5rem] shadow-inner">
                        <BookOpen className="h-10 w-10" />
                      </div>
                      <div>
                        <h3 className={`font-black text-[#023047] uppercase tracking-[0.3em] ${isProjectorMode ? 'text-4xl' : 'text-2xl'}`}>Marco Teórico</h3>
                        <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mt-1">Fundamentación Científica Institucional</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      <div className="lg:col-span-8">
                        <div className={`text-[#023047]/90 leading-[2.2] whitespace-pre-line transition-all font-medium ${isProjectorMode ? 'text-3xl' : 'text-lg'}`}>
                          {selectedPlan.teoria}
                        </div>
                      </div>
                      
                      <div className="lg:col-span-4 space-y-8">
                        <div className="bg-dash-bg/50 p-8 rounded-[2rem] border-l-4 border-primary">
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest block mb-4">Nota Científica</span>
                          <p className="text-[13px] font-bold text-[#023047]/70 italic leading-relaxed">
                            "El dominio de este marco teórico es esencial para la interpretación correcta de los datos recolectados en la simulación {selectedPlan.titulo}."
                          </p>
                        </div>
                        
                        <div className="bg-white p-8 rounded-[2rem] border border-dash-border shadow-sm">
                           <div className="flex items-center gap-2 mb-6">
                             <ClipboardList className="h-4 w-4 text-orange-500" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#023047]">Conceptos en esta Lección</span>
                           </div>
                           <div className="space-y-4">
                             {selectedPlan.conceptosClave.slice(0, 3).map((c, i) => (
                               <div key={i} className="flex gap-4 group">
                                  <div className="h-8 w-8 rounded-lg bg-dash-bg flex items-center justify-center text-primary font-black text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">0{i+1}</div>
                                  <div>
                                    <span className="text-[11px] font-black text-[#023047] block uppercase">{c.termino}</span>
                                    <span className="text-[9.5px] font-bold text-muted-foreground line-clamp-2">{c.definicion}</span>
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedPlan.conceptosClave.map((c, i) => {
                    const IconComp = ICON_MAP[c.icono || 'Info'] || Info;
                    return (
                      <div key={i} className={`group rounded-[2.5rem] border border-dash-border bg-white p-8 transition-all hover:bg-primary hover:text-white hover:scale-[1.02] hover:shadow-2xl shadow-sm ${isProjectorMode ? 'border-2' : ''}`}>
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-dash-bg group-hover:bg-white/20 text-primary group-hover:text-white transition-colors">
                          <IconComp className="h-7 w-7" />
                        </div>
                        <h4 className={`font-black uppercase tracking-widest mb-3 leading-tight ${isProjectorMode ? 'text-2xl' : 'text-xs'}`}>{c.termino}</h4>
                        <p className={`opacity-70 leading-relaxed transition-all ${isProjectorMode ? 'text-xl font-medium' : 'text-[11px] font-bold'}`}>{c.definicion}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'evaluacion' && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-[#023047] p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute -right-10 -bottom-10 opacity-10">
                     <CheckSquare className="h-64 w-64" />
                   </div>
                   <div className="relative z-10 flex items-center gap-8">
                      <div className="h-20 w-20 bg-orange-500 rounded-[2rem] flex items-center justify-center shadow-lg transform -rotate-12">
                        <Monitor className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-4xl font-black tracking-tighter" style={{ fontFamily: "Outfit" }}>Banco de Certificación</h3>
                        <p className="text-orange-300 font-black text-[10px] tracking-[0.3em] uppercase opacity-80 mt-1">Evaluación de Competencias Críticas v4.0</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {selectedPlan.quiz.map((q, i) => (
                    <div key={i} className={`bg-white p-12 rounded-[3rem] border border-dash-border shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden ${isProjectorMode ? 'border-4' : ''}`}>
                      <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <span className="text-9xl font-black">0{i + 1}</span>
                      </div>
                      
                      <div className="flex gap-10 relative z-10">
                        <div className="flex flex-col items-center gap-4">
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-dash-bg text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-dash-border group-hover:border-transparent">
                            {i + 1}
                          </span>
                          <div className="w-px flex-1 bg-dash-border" />
                        </div>

                        <div className="flex-1">
                          <h4 className={`font-black text-[#023047] mb-10 leading-tight ${isProjectorMode ? 'text-4xl' : 'text-2xl'}`} style={{ fontFamily: "Outfit" }}>
                            {q.pregunta}
                          </h4>
                          
                          <div className="space-y-4 mb-10">
                            {q.opciones.map((opt, optIndex) => (
                              <div 
                                key={optIndex} 
                                className={`p-6 rounded-[1.5rem] border-2 transition-all flex items-center gap-6 ${
                                  optIndex === q.correcta 
                                  ? 'bg-emerald-50 border-emerald-500/30 text-emerald-900 shadow-md translate-x-2' 
                                  : 'bg-dash-bg border-transparent text-[#023047]/50'
                                }`}
                              >
                                <div className={`h-6 w-6 rounded-full border-4 flex items-center justify-center ${optIndex === q.correcta ? 'bg-emerald-500 border-white' : 'bg-white border-dash-border'}`}>
                                   {optIndex === q.correcta && <CheckCircle className="h-3 w-3 text-white" />}
                                </div>
                                <span className={`font-bold ${isProjectorMode ? 'text-2xl' : 'text-base'}`}>{opt}</span>
                                {optIndex === q.correcta && (
                                   <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full">
                                      <Sparkles className="h-3 w-3 text-emerald-600" />
                                      <span className="text-[9px] font-black uppercase text-emerald-600">Correcta</span>
                                   </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="bg-orange-50/70 p-8 rounded-[2rem] border border-orange-200/50 flex gap-6 items-start">
                             <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-200">
                                <Info className="h-5 w-5 text-white" />
                             </div>
                             <div>
                               <strong className="uppercase font-black block mb-2 text-[10px] tracking-widest text-orange-700">Racional Pedagógico</strong>
                               <p className={`text-orange-900 font-bold leading-[1.6] ${isProjectorMode ? 'text-xl' : 'text-sm'}`}>
                                 {q.explicacion}
                               </p>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
