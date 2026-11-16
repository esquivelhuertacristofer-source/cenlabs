import Link from 'next/link';
import { ArrowLeft, ExternalLink, Factory, Info, User } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { ESTRELLAS, MOSAICO_ESTRELLAS, type Estrella } from '@/lib/estrellas';

// =============================================================================
// Catálogo de Ingeniería Avanzada: las siete prácticas estrella.
//
// A diferencia de las otras materias, estas prácticas NO pasan por /alumno/simulador:
// cada una es un paquete estático (public/estrellas/E#/) que se abre en su propia pestaña
// y guarda el avance en el navegador. Por eso aquí no hay anillo de progreso ni pestañas
// de módulo, y la página no consulta la base: la sesión de alumno la exige el layout de
// /alumno y el middleware, igual que en los otros catálogos.
// =============================================================================

export const metadata = { title: 'Ingeniería Avanzada · CEN Laboratorios' };

const TarjetaEstrella = ({ practica, numero }: { practica: Estrella; numero: number }) => (
  <article
    id={practica.id}
    className="relative w-full md:w-[calc(50%-0.75rem)] xl:w-[calc(33.333%-1rem)] 2xl:w-[calc(25%-1.125rem)] bg-white dark:bg-[#0A1121] border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col group overflow-hidden shadow-[0_6px_24px_rgb(0,0,0,0.04)] dark:shadow-[0_6px_24px_rgb(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(33,158,188,0.4)] border-t-4 border-t-[#219EBC]"
  >
    {/* PORTADA: fotograma de la escena 3D de la propia práctica */}
    <div className="relative aspect-[16/10] bg-[#e6f1f6] dark:bg-[#04202F] overflow-hidden">
      <img
        src={practica.portada}
        alt={`Escena 3D de la práctica: ${practica.titulo}`}
        width={960}
        height={600}
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <span className="absolute top-3 left-3 w-11 h-11 rounded-2xl bg-[#023047] text-white text-lg font-black flex items-center justify-center shadow-lg border border-white/20">
        {numero}
      </span>
    </div>

    <div className="flex flex-col flex-grow p-5 sm:p-6 gap-3">
      <span className="text-[11px] font-black uppercase tracking-widest text-[#126782] dark:text-[#8ECAE6]">
        Práctica {numero} • {practica.area}
      </span>
      <h3 className="text-lg sm:text-xl font-black text-[#023047] dark:text-white leading-snug">{practica.titulo}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-[15px] leading-relaxed">{practica.frase}</p>
      <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Se abre en otra pestaña</span>
        <a
          href={practica.href}
          target="_blank"
          rel="noopener"
          aria-label={`Abrir práctica ${numero}: ${practica.titulo} (se abre en otra pestaña)`}
          className="px-5 py-2.5 rounded-xl bg-[#FB8500] hover:bg-[#023047] dark:hover:bg-[#219EBC] text-white text-sm font-black flex items-center gap-2 shadow-md transition-colors"
        >
          Abrir práctica
          <ExternalLink size={15} strokeWidth={2.5} />
        </a>
      </div>
    </div>
  </article>
);

export default function IngenieriaAvanzadaCatalogPage() {
  const areas = ESTRELLAS.map((p) => p.area.toLowerCase());

  return (
    <div className="min-h-screen font-['Outfit'] flex flex-col bg-slate-50 dark:bg-[#060B14] transition-colors duration-500 overflow-x-hidden relative">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000 dark:opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#02304705_1px,transparent_1px),linear-gradient(to_bottom,#02304705_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0A_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0A_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#219EBC]/10 dark:bg-[#219EBC]/40 blur-[150px]"></div>
      </div>

      <div className="px-4 sm:px-6 pt-6 sticky top-0 z-40 w-full max-w-[1600px] mx-auto">
        <nav className="bg-white/90 dark:bg-[#0A1121]/90 backdrop-blur-xl px-4 sm:px-6 py-4 flex justify-between items-center rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
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

      <main className="flex-grow flex flex-col pt-8 pb-32 px-4 sm:px-6 w-full max-w-[1600px] mx-auto z-10">

        {/* 1. ENCABEZADO */}
        <div className="relative w-full rounded-[32px] sm:rounded-[40px] bg-[#e6f1f6] dark:bg-[#04202F] border border-[#219EBC]/20 dark:border-white/5 shadow-md overflow-hidden flex flex-col md:flex-row p-6 sm:p-8 md:p-12 mb-8 transition-colors">
          <div className="hidden sm:flex absolute top-0 right-0 w-[60%] md:w-[58%] lg:w-[52%] h-full z-0 pointer-events-none rounded-r-[40px] items-center justify-end overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#e6f1f6] dark:from-[#04202F] via-[#e6f1f6]/40 dark:via-[#04202F]/40 to-transparent z-10 w-full" />
            <img src={MOSAICO_ESTRELLAS} alt="" width={1364} height={869} className="w-full h-full object-cover object-left dark:opacity-85" />
          </div>

          <div className="relative z-10 w-full md:w-[60%] flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#023047] flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                <Factory className="w-6 h-6 text-[#023047] dark:text-[#FFB703]" />
              </div>
              <span className="text-sm font-black text-[#023047] dark:text-[#FFB703] uppercase tracking-widest bg-white dark:bg-black/20 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                Prácticas estrella
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[64px] font-black text-[#023047] dark:text-white leading-tight tracking-tight mb-4 transition-colors">
              Ingeniería Avanzada
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-bold mb-8 md:w-[90%] leading-snug">
              Siete prácticas completas con el encargo de un ingeniero en la industria: mides, calculas, decides y defiendes tu resultado.
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-auto">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-black text-[#023047] dark:text-white">{ESTRELLAS.length} <span className="text-lg text-slate-500 dark:text-slate-400 font-bold">prácticas</span></span>
                <span className="text-xs font-black text-[#126782] dark:text-[#8ECAE6] uppercase tracking-widest">Nivel licenciatura</span>
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 max-w-md first-letter:uppercase">
                {areas.slice(0, -1).join(', ')} y {areas.at(-1)}.
              </p>
            </div>
          </div>
        </div>

        {/* 2. AVISO: cómo funcionan (distinto del resto de la plataforma) */}
        <div role="note" className="w-full flex items-start gap-4 rounded-3xl border border-[#FFB703]/60 dark:border-[#FFB703]/30 bg-[#FFF8E6] dark:bg-[#1A180E] px-5 sm:px-6 py-5 mb-10">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[#FFB703] text-[#023047] flex items-center justify-center">
            <Info size={20} strokeWidth={2.5} />
          </div>
          <div className="text-sm sm:text-base text-[#023047] dark:text-slate-200 leading-relaxed">
            <p className="font-black mb-1">Cada práctica se abre aparte, en otra pestaña.</p>
            <p className="font-medium text-[#023047]/80 dark:text-slate-300">
              Tu avance se guarda en ese navegador, no en tu cuenta: para continuar otro día, entra desde el mismo equipo y el mismo navegador, y no borres sus datos. Estas prácticas no cuentan en tu porcentaje de avance del inicio.
            </p>
          </div>
        </div>

        {/* 3. LAS SIETE PRÁCTICAS */}
        <div className="w-full flex flex-wrap justify-between items-end gap-3 mb-6">
          <h2 className="text-2xl sm:text-4xl font-black text-[#023047] dark:text-white tracking-tight">Prácticas</h2>
          <span className="text-sm font-black text-[#126782] dark:text-[#8ECAE6] uppercase tracking-widest">{ESTRELLAS.length} con escena 3D</span>
        </div>

        {/* Siete no llenan una rejilla de 2, 3 ni 4 columnas: con flex centrado, la última fila
            queda al centro en vez de dejar una tarjeta suelta a la izquierda. */}
        <div className="flex flex-wrap justify-center gap-6">
          {ESTRELLAS.map((practica, i) => (
            <TarjetaEstrella key={practica.id} practica={practica} numero={i + 1} />
          ))}
        </div>
      </main>
    </div>
  );
}
