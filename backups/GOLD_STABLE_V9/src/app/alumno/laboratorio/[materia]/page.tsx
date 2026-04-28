import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  FlaskConical, Zap, Microscope, Calculator, 
  Play, ArrowLeft, CheckCircle2, Lock, Clock, Target, Home, User
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

// ==========================================
// MOCK DATA DE MATERIAS ESTILIZADAS
// ==========================================
const MATERIAS_DB: Record<string, any> = {
  "quimica": {
    id: "quimica",
    title: "Laboratorio de Química",
    subtitle: "Módulo 2: Estequiometría y Gases",
    icon: FlaskConical,
    image: "/images/quimica_3d.png",
    accentUrl: "/alumno/inicio",
    gradient: "bg-[#e8f6f9] dark:bg-[#0D1B2A]",
    fadeColor: "from-[#e8f6f9] dark:from-[#0D1B2A]",
    accentText: "text-[#219EBC] dark:text-[#8ECAE6]",
    accentBg: "bg-[#219EBC] hover:bg-[#126782]",
    ringColor: "stroke-[#219EBC] dark:stroke-[#8ECAE6]",
    shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(33,158,188,0.4)] dark:hover:shadow-[0_20px_50px_-12px_rgba(33,158,188,0.6)]",
    cardLight: "bg-white/40 border-[#219EBC]/10",
    cardDark: "dark:bg-[#126782]/10 dark:border-[#8ECAE6]/10",
    globalAdvance: 58,
    avgPrecision: 9.5,
    practices: [
      { id: "q1", title: "Construcción Atómica", objetivo: "Comprender la relación entre protones, neutrones y electrones para formar isótopos.", tiempo: "30 min", state: "completed", score: "10/10" },
      { id: "q2", title: "Leyes de los Gases", objetivo: "Analizar la relación P, V y T mediante una cámara de aforo variable.", tiempo: "45 min", state: "completed", score: "9/10" },
      { id: "q3", title: "Balanceo Estequiométrico", objetivo: "Aplicar la Ley de Conservación de la Masa equilibrando ecuaciones químicas.", tiempo: "60 min", state: "active", icon: FlaskConical },
      { id: "q4", title: "Preparación de Soluciones", objetivo: "Calcular y preparar disoluciones en Molaridad exacta.", tiempo: "40 min", state: "locked" },
      { id: "q5", title: "Celdas Galvánicas", objetivo: "Observar reacciones redox elementales.", tiempo: "90 min", state: "locked" },
      { id: "q6", title: "Cinética Química", objetivo: "Medir la velocidad de una reacción dependiente del calor.", tiempo: "55 min", state: "locked" },
      { id: "q7", title: "Ley de Conservación", objetivo: "Comprobar la masa antes y después de oxidar un metal.", tiempo: "45 min", state: "locked" },
      { id: "q8", title: "Destilación Fraccionada", objetivo: "Separar componentes de una mezcla de alcoholes.", tiempo: "120 min", state: "locked" },
      { id: "q9", title: "Valoración Complexométrica", objetivo: "Determinar la dureza del agua usando EDTA.", tiempo: "60 min", state: "locked" },
      { id: "q10", title: "Síntesis de Aspirina", objetivo: "Sintetizar ácido acetilsalicílico purificado.", tiempo: "90 min", state: "locked" },
    ]
  },
  "fisica": {
    id: "fisica",
    title: "Laboratorio de Física",
    subtitle: "Módulo 2: Mecánica y Dinámica",
    icon: Zap,
    image: "/images/fisica_3d.png",
    gradient: "bg-[#fef3e6] dark:bg-[#1E1204]",
    fadeColor: "from-[#fef3e6] dark:from-[#1E1204]",
    accentText: "text-[#FB8500] dark:text-[#FFB703]",
    accentBg: "bg-[#FB8500] hover:bg-[#E85D04]",
    ringColor: "stroke-[#FB8500] dark:stroke-[#FFB703]",
    shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(251,133,0,0.3)] dark:hover:shadow-[0_20px_50px_-12px_rgba(251,133,0,0.6)]",
    cardLight: "bg-white/40 border-[#FB8500]/10",
    cardDark: "dark:bg-[#FB8500]/10 dark:border-[#FFB703]/10",
    globalAdvance: 25,
    avgPrecision: 8.5,
    practices: [
      { id: "f1", title: "Vectores Concurrentes", objetivo: "Medir fuerzas utilizando mesa de fuerzas inclinadas.", tiempo: "40 min", state: "completed", score: "8.5/10" },
      { id: "f2", title: "Leyes de Newton", objetivo: "Medir aceleración de carrito en riel de aire libre de fricción.", tiempo: "50 min", state: "active", icon: Zap },
      { id: "f3", title: "Péndulo Simple", objetivo: "Calcular y comprobar la aceleración de la gravedad terrestre.", tiempo: "45 min", state: "locked" },
      { id: "f4", title: "Choques Inelásticos", objetivo: "Comprobar que la energía cinética no se conserva.", tiempo: "60 min", state: "locked" },
      { id: "f5", title: "Presión Hidrostática", objetivo: "Medir la presión a diferentes profundidades en fluidos.", tiempo: "35 min", state: "locked" },
      { id: "f6", title: "Principio de Arquímedes", objetivo: "Medir la fuerza de empuje en diferentes líquidos.", tiempo: "45 min", state: "locked" },
      { id: "f7", title: "Leyes de la Termodinámica", objetivo: "Comprobar el equivalente mecánico del calor exacto.", tiempo: "80 min", state: "locked" },
      { id: "f8", title: "Circuitos DC Básicos", objetivo: "Verificar la Ley de Ohm y Kirchhoff en mallas.", tiempo: "60 min", state: "locked" },
      { id: "f9", title: "Campos Magnéticos", objetivo: "Líneas de campo en imanes de barra y herradura.", tiempo: "40 min", state: "locked" },
      { id: "f10", title: "Óptica Geométrica", objetivo: "Reflexión y refracción a través de prismas de vidrio.", tiempo: "55 min", state: "locked" },
    ]
  },
  "biologia": {
    id: "biologia",
    title: "Laboratorio de Biología",
    subtitle: "Módulo 1: Bases Celulares",
    icon: Microscope,
    image: "/images/biologia_3d.png",
    gradient: "bg-[#e8f6fc] dark:bg-[#0B151F]",
    fadeColor: "from-[#e8f6fc] dark:from-[#0B151F]",
    accentText: "text-[#8ECAE6] dark:text-[#A8DADC]",
    accentBg: "bg-[#219EBC] hover:bg-[#126782]",
    ringColor: "stroke-[#8ECAE6] dark:stroke-[#A8DADC]",
    shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(142,202,230,0.5)] dark:hover:shadow-[0_20px_50px_-12px_rgba(142,202,230,0.7)]",
    cardLight: "bg-white/40 border-[#8ECAE6]/10",
    cardDark: "dark:bg-[#126782]/10 dark:border-[#8ECAE6]/10",
    globalAdvance: 66,
    avgPrecision: 9.8,
    practices: [
      { id: "b1", title: "Manejo del Microscopio", objetivo: "Enfoque y manipulación en la preparación de placas.", tiempo: "30 min", state: "completed", score: "10/10" },
      { id: "b2", title: "Células Epiteliales", objetivo: "Observación directa de mucosa bucal humana teñida.", tiempo: "45 min", state: "completed", score: "10/10" },
      { id: "b3", title: "Mitosis Celular", objetivo: "Observar cromosomas en distintas fases en raíz de cebolla.", tiempo: "60 min", state: "completed", score: "9.5/10" },
      { id: "b4", title: "Meiosis y División", objetivo: "Identificar etapas exclusivas de meiosis in vitro.", tiempo: "55 min", state: "active", icon: Microscope },
      { id: "b5", title: "Extracción de ADN", objetivo: "Separar la doble hélice genómica vegetal con solventes.", tiempo: "90 min", state: "locked" },
      { id: "b6", title: "Catálisis Enzimática", objetivo: "Evaluar la acción de la amilasa sobre el almidón.", tiempo: "50 min", state: "locked" },
      { id: "b7", title: "Fotosíntesis Práctica", objetivo: "Medir el O2 liberado por planta acuática elodea.", tiempo: "60 min", state: "locked" },
      { id: "b8", title: "Sangre y Tipificación", objetivo: "Determinar grupos sanguíneos mediante anticuerpos.", tiempo: "40 min", state: "locked" },
      { id: "b9", title: "Anatomía Comparada", objetivo: "Disección virtual de crustáceo e identificación orgánica.", tiempo: "120 min", state: "locked" },
      { id: "b10", title: "Osmosis Celular", objetivo: "Análisis de plasmólisis y turgencia en glóbulos.", tiempo: "45 min", state: "locked" },
    ]
  },
  "matematicas": {
    id: "matematicas",
    title: "Laboratorio de Matemáticas",
    subtitle: "Módulo 3: Álgebra Lineal",
    icon: Calculator,
    image: "/images/mates_3d.png",
    gradient: "bg-[#fefaf0] dark:bg-[#1A180E]",
    fadeColor: "from-[#fefaf0] dark:from-[#1A180E]",
    accentText: "text-[#FFB703] dark:text-[#FFD166]",
    accentBg: "bg-[#FFB703] hover:bg-[#FB8500]",
    ringColor: "stroke-[#FFB703] dark:stroke-[#FFD166]",
    shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(255,183,3,0.3)] dark:hover:shadow-[0_20px_50px_-12px_rgba(255,183,3,0.6)]",
    cardLight: "bg-white/40 border-[#FFB703]/10",
    cardDark: "dark:bg-[#FB8500]/10 dark:border-[#FFB703]/10",
    globalAdvance: 20,
    avgPrecision: 7.8,
    practices: [
      { id: "m1", title: "Sistemas de Ecuaciones", objetivo: "Resolver complejas matrices de 3x3 paso por paso.", tiempo: "45 min", state: "completed", score: "7.8/10" },
      { id: "m2", title: "Gráficas de Funciones", objetivo: "Trazar cuadráticas y polinómicas en espacios abstractos.", tiempo: "60 min", state: "active", icon: Calculator },
      { id: "m3", title: "Derivadas Direccionales", objetivo: "Cálculo en superficies y espacios tridimensionales.", tiempo: "90 min", state: "locked" },
      { id: "m4", title: "Cálculo de Áreas", objetivo: "Integrales definidas bajo la curva y sólidos de revolución.", tiempo: "70 min", state: "locked" },
      { id: "m5", title: "Series de Taylor", objetivo: "Aproximación polinomial de funciones trascendentes reales.", tiempo: "80 min", state: "locked" },
      { id: "m6", title: "Optimización Crítica", objetivo: "Hallar máximos y mínimos mediante cálculo diferencial.", tiempo: "50 min", state: "locked" },
      { id: "m7", title: "Probabilidad Bayesiana", objetivo: "Distribuciones estadísticas y cálculo de eventos.", tiempo: "40 min", state: "locked" },
      { id: "m8", title: "Vectores en el Espacio", objetivo: "Producto punto, cruz y geometría analítica 3D.", tiempo: "60 min", state: "locked" },
      { id: "m9", title: "Ecuaciones Diferenciales", objetivo: "Modelado de crecimiento poblacional y decaimiento.", tiempo: "90 min", state: "locked" },
      { id: "m10", title: "Transformada de Laplace", objetivo: "Aplicación a resortes e impulso físico.", tiempo: "120 min", state: "locked" },
    ]
  }
};

// ==========================================
// COMPONENTES MINI
// ==========================================
const ConcentricRings = ({ global, precision, colorClass }: { global: number, precision: number, colorClass: string }) => {
  const globalOffset = 100 - (global / 100) * 100;
  const precisionOffset = 80 - (precision / 10) * 80;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        {/* Track Global */}
        <circle className="stroke-black/5 dark:stroke-white/5" strokeWidth="6" fill="transparent" r="48" cx="56" cy="56" />
        {/* Progress Global */}
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth="6" strokeLinecap="round" fill="transparent" r="48" cx="56" cy="56"
          strokeDasharray="301" strokeDashoffset={(301 * globalOffset) / 100}
        />
        
        {/* Track Precision */}
        <circle className="stroke-black/5 dark:stroke-white/5" strokeWidth="6" fill="transparent" r="38" cx="56" cy="56" />
        {/* Progress Precision */}
        <circle
          className={`${colorClass} transition-all duration-1200 ease-out opacity-60`}
          strokeWidth="6" strokeLinecap="round" fill="transparent" r="38" cx="56" cy="56"
          strokeDasharray="238" strokeDashoffset={(238 * precisionOffset) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center scale-90">
         <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{global}%</span>
         <span className="text-[9px] font-bold text-slate-400 uppercase">Avance</span>
      </div>
    </div>
  );
};


// ==========================================
// PAGE COMPONENT
// ==========================================
export default async function LaboratorioMateriaPage({ params }: { params: Promise<{ materia: string }> }) {
  // En Next.js 15+ params debe ser resolved como promesa
  const resolvedParams = await params;
  const materiaId = resolvedParams.materia?.toLowerCase();
  const data = MATERIAS_DB[materiaId];

  if (!data) return notFound();

  const activePractice = data.practices.find((p: any) => p.state === "active");

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseSoft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        .stagger-0 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .stagger-3 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both; }
        .stagger-4 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .stagger-5 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both; }
        
        .pulse-soft { animation: pulseSoft 3s ease-in-out infinite; }

        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background-color: rgba(2, 48, 71, 0.15);
          border-radius: 20px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .dark ::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); }
      `}} />

      <div className="min-h-screen font-['Outfit'] flex flex-col bg-[#F8FAFC] dark:bg-[#060B14] transition-colors duration-500 overflow-x-hidden relative">
        
        {/* Fondo Global */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000 dark:opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0230470A_1px,transparent_1px),linear-gradient(to_bottom,#0230470A_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0A_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0A_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#8ECAE6]/10 dark:bg-[#8ECAE6]/40 blur-[150px]"></div>
        </div>

        {/* Global Navbar Auxiliar */}
        <div className="px-6 pt-6 sticky top-0 z-40 w-full max-w-[1600px] mx-auto">
          <nav className="bg-white/80 dark:bg-[#0A1121]/80 backdrop-blur-xl px-4 sm:px-6 py-4 flex justify-between items-center rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            
            <Link href="/alumno/inicio" className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300 font-bold text-sm">
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Volver al Hub</span>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700">
                 <User size={18} />
              </div>
            </div>
          </nav>
        </div>

        <main className="flex-grow flex flex-col pt-8 pb-32 px-6 w-full max-w-[1600px] mx-auto z-10">
          
          {/* ======================= */}
          {/* 1. HERO SECTION (GLASS + 3D) */}
          {/* ======================= */}
          <div className={`relative w-full rounded-[40px] ${data.gradient} border border-white/60 dark:border-white/5 shadow-sm overflow-hidden flex flex-col md:flex-row p-8 md:p-12 mb-8 stagger-0 transition-colors`}>
             <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.015] pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
             </div>
             
             {/* 3D Mass Bleed (Derecha) */}
             <div className="absolute top-0 right-0 w-[55%] md:w-[60%] lg:w-[50%] h-full z-0 pointer-events-none rounded-r-[40px] opacity-20 md:opacity-100">
               <div className={`absolute inset-0 bg-gradient-to-r ${data.fadeColor} via-transparent to-transparent z-10 w-full`}></div>
               <img src={data.image} alt={data.title} className="w-full h-full object-cover object-left mix-blend-multiply dark:mix-blend-normal dark:opacity-80 transition-opacity duration-500" />
             </div>

             {/* Contenido Izquierdo */}
             <div className="relative z-10 w-full md:w-[60%] flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-white/60 dark:bg-black/30 backdrop-blur-md flex items-center justify-center shadow-sm border border-white dark:border-white/5">
                      <data.icon className={`w-5 h-5 ${data.accentText}`} />
                   </div>
                   <span className={`text-sm font-black ${data.accentText} uppercase tracking-widest bg-white/40 dark:bg-black/20 px-3 py-1 rounded-full border border-white/40 dark:border-white/5 backdrop-blur-sm`}>
                     Materia Activa
                   </span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black text-[#023047] dark:text-white leading-tight tracking-tight mb-2 transition-colors">
                  {data.title}
                </h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-bold mb-10 w-3/4 leading-snug">
                  {data.subtitle}
                </p>

                {/* Métricas */}
                <div className="flex flex-wrap items-center gap-6 mt-auto">
                   <ConcentricRings global={data.globalAdvance} precision={data.avgPrecision} colorClass={data.ringColor} />
                   <div className="flex flex-col justify-center gap-3">
                     <div className="bg-white/60 dark:bg-black/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white dark:border-white/5 shadow-sm">
                       <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Precisión Promedio</p>
                       <p className={`text-2xl font-black ${data.accentText}`}>{data.avgPrecision} <span className="text-sm font-bold opacity-60">/ 10</span></p>
                     </div>
                     <div className="bg-white/60 dark:bg-black/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white dark:border-white/5 shadow-sm">
                       <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Desempeño</p>
                       <p className={`text-sm font-black text-[#023047] dark:text-white mt-1`}>Excelente ⭐️</p>
                     </div>
                   </div>
                </div>
             </div>
          </div>

          {/* ======================= */}
          {/* 2. QUICK RESUME BANNER */}
          {/* ======================= */}
          {activePractice && (
            <div className={`w-full ${data.cardLight} ${data.cardDark} backdrop-blur-xl border rounded-[32px] p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 mb-12 shadow-sm stagger-1 transition-colors`}>
               <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-white/70 dark:bg-black/40 shadow-inner flex items-center justify-center pulse-soft">
                    <Play className={`w-8 h-8 ${data.accentText}`} fill="currentColor" />
                 </div>
                 <div>
                   <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Siguiente en tu lista</p>
                   <p className="text-2xl font-black text-[#023047] dark:text-white">Práctica: {activePractice.title}</p>
                 </div>
               </div>
               
               <Link href={`/alumno/simulador/${materiaId}-${activePractice.id}`} className={`px-8 py-4 rounded-xl font-black text-white text-lg ${data.accentBg} shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3`}>
                 <Play size={20} fill="currentColor" />
                 Comenzar Práctica
               </Link>
            </div>
          )}

          {/* ======================= */}
          {/* 3. GRID BENTO DE PRÁCTICAS */}
          {/* ======================= */}
          <div className="w-full mb-6">
             <h2 className="text-3xl font-black text-[#023047] dark:text-white mb-8 tracking-tight">Catálogo de Prácticas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {data.practices.map((practica: any, index: number) => {
               
                const isCompleted = practica.state === "completed";
                const isActive = practica.state === "active";
                const isLocked = practica.state === "locked";

                // ESTADO 1: ACTIVE (Tarjeta grande bento que cruza 2 columnas si es necesario)
                if (isActive) {
                   return (
                     <div key={practica.id} className={`md:col-span-2 relative ${data.gradient} border border-white/60 dark:border-white/10 rounded-[32px] p-8 lg:p-10 flex flex-col justify-between group overflow-hidden ${data.shadowGlow} transition-all duration-500 hover:-translate-y-1 stagger-${(index % 4) + 2}`}>
                        
                        {/* 3D Decorativo difuminado en la esquina */}
                        <div className="absolute -bottom-6 -right-6 w-56 h-56 opacity-20 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6 dark:opacity-10 mix-blend-multiply dark:mix-blend-normal">
                           <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="relative z-10 w-full sm:w-[70%]">
                           <span className={`inline-block px-3 py-1 bg-white/70 dark:bg-black/40 rounded-full text-xs font-black uppercase tracking-widest ${data.accentText} border border-white/50 dark:border-white/5 mb-6`}>
                             Práctica Actual
                           </span>
                           <h3 className="text-3xl font-black text-[#023047] dark:text-white leading-tight mb-4">{practica.title}</h3>
                           <p className="text-slate-600 dark:text-slate-400 font-medium mb-8 pr-4">{practica.objetivo}</p>
                           
                           <div className="flex items-center gap-6">
                             <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold bg-white/40 dark:bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                                <Clock size={18} />
                                <span>{practica.tiempo}</span>
                             </div>
                             <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold bg-white/40 dark:bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                                <Target size={18} />
                                <span>Simulador Interactivo</span>
                             </div>
                           </div>
                        </div>
                        
                        <div className="mt-8 md:mt-0 relative z-10 w-fit self-start md:self-end md:absolute md:bottom-8 md:right-8">
                           <Link href={`/alumno/simulador/${materiaId}-${practica.id}`} className={`w-14 h-14 rounded-full ${data.accentBg} text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95`}>
                              <Play fill="currentColor" size={24} className="ml-1" />
                           </Link>
                        </div>
                     </div>
                   );
                }

                // ESTADO 2: COMPLETED
                if (isCompleted) {
                   return (
                     <div key={practica.id} className={`relative bg-white/50 dark:bg-slate-800/40 backdrop-blur-xl border border-white dark:border-slate-700/50 rounded-[32px] p-6 lg:p-8 flex flex-col justify-between group hover:shadow-[0_10px_40px_-15px_rgba(34,197,94,0.3)] transition-all duration-500 hover:-translate-y-1 stagger-${(index % 4) + 2}`}>
                        
                        <div className="flex justify-between items-start mb-6">
                           <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 dark:text-green-400 border border-green-500/20">
                              <CheckCircle2 size={24} />
                           </div>
                           <span className={`inline-block px-3 py-1 bg-green-50 dark:bg-green-500/10 rounded-full text-xs font-black uppercase tracking-widest text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20`}>
                             Completada
                           </span>
                        </div>
                        
                        <div>
                           <h3 className="text-xl font-black text-[#023047] dark:text-slate-200 mb-2 leading-tight">{practica.title}</h3>
                           <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 line-clamp-2">{practica.objetivo}</p>
                           
                           <div className="flex items-center justify-between mt-auto">
                              <div className="flex flex-col">
                                 <span className="text-[10px] uppercase font-bold text-slate-400">Calificación</span>
                                 <span className="text-lg font-black text-[#023047] dark:text-white">{practica.score}</span>
                              </div>
                              <Link href={`/alumno/reporte/${practica.id}`} className="text-sm font-bold text-[#219EBC] dark:text-[#8ECAE6] hover:underline underline-offset-4">
                                Ver Reporte
                              </Link>
                           </div>
                        </div>
                     </div>
                   );
                }

                // ESTADO 3: LOCKED
                if (isLocked) {
                   return (
                     <div key={practica.id} className={`relative bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/30 rounded-[32px] p-6 lg:p-8 flex flex-col justify-between opacity-70 hover:opacity-100 transition-opacity duration-300 stagger-${(index % 4) + 2}`}>
                        
                        <div className="absolute inset-0 bg-slate-50/40 dark:bg-[#060B14]/40 rounded-[32px] backdrop-blur-[2px] z-10 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 text-center px-4">
                           <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center mb-3">
                              <Lock size={20} className="text-slate-400 dark:text-slate-500" />
                           </div>
                           <p className="text-xs font-bold text-[#023047] dark:text-white">Se desbloquea al completar la práctica anterior.</p>
                        </div>

                        <div className="flex justify-between items-start mb-6 grayscale opacity-60">
                           <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-600">
                              <Lock size={24} />
                           </div>
                           <span className={`inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700`}>
                             Bloqueada
                           </span>
                        </div>
                        
                        <div className="grayscale opacity-60">
                           <h3 className="text-xl font-black text-slate-600 dark:text-slate-300 mb-2 leading-tight">{practica.title}</h3>
                           <p className="text-sm text-slate-400 font-medium mb-6 line-clamp-2">{practica.objetivo}</p>
                           
                           <div className="flex items-center gap-2 text-slate-400 font-bold mt-auto">
                              <Clock size={16} />
                              <span className="text-sm">{practica.tiempo}</span>
                           </div>
                        </div>
                     </div>
                   );
                }

             })}
          </div>
        </main>
      </div>
    </>
  );
}
