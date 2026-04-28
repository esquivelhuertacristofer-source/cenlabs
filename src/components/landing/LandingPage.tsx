"use client";

import Image from "next/image";
import {
  Star, Play, Users,
  BookOpen, Atom, Magnet, Sigma, Dna, Zap, Calculator,
  Check, ArrowRight,
  Share2, MessageCircle, Camera, Tv,
  Monitor, FlaskConical, Landmark, Shield, GraduationCap, Mountain,
  Cpu, AlertCircle, BarChart3
} from "lucide-react";
import styles from "./Landing.module.css";
import Link from "next/link";
import { motion } from "framer-motion";

// ─── CORPORATE PALETTE ─────────────────────────────────────────────────────────
// Navy (text/dark):  #023047  |  Cerulean (accent): #219EBC  |  Sky (soft): #8ECAE6
// Orange CTA:        #FB8500  |  Gold:              #FFB703
// Hero bg: #EFF9FF  |  Blocks: indigo #023047, slate #8ECAE6, orange #FD9E02, gold #FFB703

const OUTFIT = "'Outfit', var(--font-outfit), sans-serif";

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const links = ["Acerca de CEN", "Nuestros Simuladores", "Contacto"];
  return (
    <nav className="w-full sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-white/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-5 flex items-center justify-between">

        {/* ── Logo + Brand ── */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-lg relative"
            style={{ width: 52, height: 52, background: "#EFF9FF", overflow: "hidden" }}
          >
            {/* Composite Icon Setup */}
            <Atom className="absolute" style={{ width: 28, height: 28, color: "#219EBC", opacity: 0.9, top: 4, left: 4 }} strokeWidth={2.5} />
            <Magnet className="absolute" style={{ width: 16, height: 16, color: "#FB8500", bottom: 6, right: 6, transform: "rotate(-45deg)" }} strokeWidth={3} />
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: 32, color: "#023047", letterSpacing: "0.1em" }}>
              CEN
            </span>
            <span style={{ fontFamily: OUTFIT, fontWeight: 600, fontSize: 12, color: "#219EBC", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Laboratorios
            </span>
          </div>
        </div>

        {/* ── Nav links ── */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#catalogo" className="text-sm font-semibold transition-colors hover:text-[#FB8500]" style={{ color: "#023047", fontFamily: OUTFIT }}>Laboratorios</Link>
          <Link href="#plataforma" className="text-sm font-semibold transition-colors hover:text-[#FB8500]" style={{ color: "#023047", fontFamily: OUTFIT }}>Plataforma</Link>
          <Link href="#colegios" className="text-sm font-semibold transition-colors hover:text-[#FB8500]" style={{ color: "#023047", fontFamily: OUTFIT }}>Colegios</Link>
          <Link href="#aliados" className="text-sm font-semibold transition-colors hover:text-[#FB8500]" style={{ color: "#023047", fontFamily: OUTFIT }}>Aliados</Link>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-4">
          <Link 
            href="/login"
            className="px-8 py-3.5 rounded-lg text-base font-bold text-white transition-opacity hover:opacity-90 shadow-md"
            style={{ background: "#FB8500", fontFamily: OUTFIT, letterSpacing: "0.02em" }}
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── MOSAIC GRID ─────────────────────────────────────────────────────────────
// ─── MOSAIC GRID (4-TILE PREMIUM) ─────────────────────────────────────────────
function ShowcaseHero() {
  const tiles = [
    { name: "Química", img: "/images/landing/quimica.png", icon: <FlaskConical className="w-4 h-4 text-emerald-500" /> },
    { name: "Física", img: "/images/landing/fisica.png", icon: <Zap className="w-4 h-4 text-orange-500" /> },
    { name: "Biología", img: "/images/landing/biologia.png", icon: <Dna className="w-4 h-4 text-rose-500" /> },
    { name: "Matemáticas", img: "/images/landing/matematicas.png", icon: <Calculator className="w-4 h-4 text-blue-500" /> },
  ];

  return (
    <div className="relative w-full max-w-2xl">
      {/* ── Glow Background ── */}
      <div className="absolute -inset-10 bg-gradient-to-br from-[#219EBC]/10 to-[#FB8500]/10 blur-[100px] rounded-full opacity-60" />

      <div className="relative grid grid-cols-2 gap-4 md:gap-6 p-4">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.name}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="relative aspect-[4/3] rounded-[32px] overflow-hidden bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-white/40 group"
          >
            <Image 
              src={tile.img} 
              alt={tile.name} 
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.2] group-hover:grayscale-0"
            />
            {/* ── Glass Badge ── */}
            <div className="absolute top-4 left-4 backdrop-blur-md bg-white/60 border border-white/40 px-3 py-1.5 rounded-2xl shadow-sm flex items-center gap-2">
               {tile.icon}
               <span style={{ fontFamily: OUTFIT, fontWeight: 800, fontSize: 11, color: "#023047", letterSpacing: "0.02em" }}>
                 {tile.name}
               </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#023047]/20 to-transparent group-hover:from-transparent transition-all" />
          </motion.div>
        ))}

        {/* ── Floating Main Badge ── */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-6 -right-6 md:-right-10 backdrop-blur-xl bg-[#023047]/95 border border-white/10 p-5 rounded-[28px] shadow-2xl z-10 flex items-center gap-4 text-white"
        >
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
            <Atom className="h-6 w-6 text-[#219EBC]" />
          </div>
          <div>
            <div className="text-[10px] font-black text-[#8ECAE6] uppercase tracking-[0.2em] mb-0.5">Tecnología Certificada</div>
            <div className="text-lg font-black tracking-tight">Renderizado 2.5D</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className={`w-full flex justify-center flex-col pt-16 pb-12 ${styles.schoolGrid}`} style={{ minHeight: "calc(100vh - 57px)" }}>
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-16 flex flex-col gap-12 lg:gap-20">
        
        {/* ── Top Area: Text + Mosaic ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col gap-6 relative">
            <div className="inline-flex self-start items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-gray-100" style={{ borderColor: "#FFB703" }}>
              <div className="h-2 w-2 rounded-full bg-[#FB8500] animate-pulse" />
              <span style={{ fontFamily: OUTFIT, fontSize: 13, fontWeight: 700, color: "#FB8500", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Innovación Educativa 2.5D
              </span>
            </div>
            <h1 style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: "clamp(46px, 6vw, 76px)", color: "#023047", lineHeight: 1.05, letterSpacing: "-0.04em" }}>
              El Nuevo Estándar en<br />Laboratorios Virtuales.
            </h1>
            <p style={{ fontFamily: OUTFIT, fontSize: 19, fontWeight: 500, color: "#5A5A72", lineHeight: 1.6, maxWidth: 560 }}>
              Accede a 40 simulaciones interactivas de ciencias exactas a través de un entorno digital de alto rendimiento. Diseñado para potenciar el análisis y la retención académica de tus alumnos.
            </p>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-6 pt-6">
              <Link 
                href="#contacto"
                className="px-8 py-4 rounded-[24px] font-bold text-white shadow-[0_4px_14px_rgba(2,48,71,0.25)] hover:shadow-[0_6px_20px_rgba(2,48,71,0.23)] transition-all hover:-translate-y-0.5"
                style={{ background: "#023047", fontFamily: OUTFIT, fontSize: 16 }}
              >
                Agenda Demostración
              </Link>
              <Link 
                href="#catalogo"
                className="font-bold transition-colors hover:text-[#219EBC] flex items-center gap-2"
                style={{ color: "#023047", fontFamily: OUTFIT, fontSize: 16 }}
              >
                Ver Laboratorios Virtuales <ArrowRight className="w-5 h-5 text-[#219EBC]" />
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full flex justify-center lg:justify-end">
            <ShowcaseHero />
          </motion.div>
        </div>

        {/* ── Bottom Area: Fichas ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-10">
          {/* Ficha 1 */}
          <div className="flex flex-col justify-center items-start gap-4 bg-white px-8 py-6 rounded-[24px] border shadow-[0_4px_24px_rgba(0,0,0,0.03)]" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center gap-4">
              <div className="bg-[#EFF9FF] p-3 rounded-xl text-[#219EBC] flex-shrink-0">
                <Zap className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: OUTFIT, fontWeight: 800, fontSize: 16, color: "#023047", lineHeight: 1.1 }}>Física y Química</span>
            </div>
            <span style={{ fontFamily: OUTFIT, fontSize: 14, color: "#686868", lineHeight: 1.4 }}>Prácticas seguras y medibles sin riesgo de accidentes.</span>
          </div>
          {/* Ficha 2 */}
          <div className="flex flex-col justify-center items-start gap-4 bg-white px-8 py-6 rounded-[24px] border shadow-[0_4px_24px_rgba(0,0,0,0.03)]" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center gap-4">
              <div className="bg-[#EFF9FF] p-3 rounded-xl text-[#219EBC] flex-shrink-0">
                <Dna className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: OUTFIT, fontWeight: 800, fontSize: 16, color: "#023047", lineHeight: 1.1 }}>Biología y Matemáticas</span>
            </div>
            <span style={{ fontFamily: OUTFIT, fontSize: 14, color: "#686868", lineHeight: 1.4 }}>Entornos interactivos adaptados a planes de estudio.</span>
          </div>
          {/* Ficha 3 */}
          <div className="flex flex-col justify-center items-start gap-4 bg-white px-8 py-6 rounded-[24px] border shadow-[0_4px_24px_rgba(0,0,0,0.03)]" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center gap-4">
              <div className="bg-[#EFF9FF] p-3 rounded-xl text-[#219EBC] flex-shrink-0">
                <BookOpen className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: OUTFIT, fontWeight: 800, fontSize: 16, color: "#023047", lineHeight: 1.1 }}>Evaluación Automática</span>
            </div>
            <span style={{ fontFamily: OUTFIT, fontSize: 14, color: "#686868", lineHeight: 1.4 }}>Métricas en tiempo real para el panel del docente.</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

// ─── MARQUEE (ALIADOS) ──────────────────────────────────────────────────────────
function MarqueeSection() {
  const logos = [
    { label: "SEP", icon: <Landmark className="w-8 h-8 text-gray-500" /> },
    { label: "Gobierno de Querétaro", icon: <Shield className="w-8 h-8 text-gray-500" /> },
    { label: "Gobierno del Estado de México", icon: <Mountain className="w-8 h-8 text-gray-500" /> },
    { label: "Gobierno de Jalisco", icon: <Shield className="w-8 h-8 text-gray-500" /> },
    { label: "Sec. Educación", icon: <GraduationCap className="w-8 h-8 text-gray-500" /> },
  ];
  const marqueeItems = [...logos, ...logos, ...logos];
  return (
    <div id="aliados" className="w-full bg-white py-10 overflow-hidden border-b border-gray-100 relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
      <p className="text-center text-sm font-semibold text-gray-400 mb-6 tracking-widest uppercase" style={{ fontFamily: OUTFIT }}>
        Instituciones que ya confían en nosotros
      </p>
      <div className={styles.marqueeTrack}>
        {marqueeItems.map((item, idx) => (
          <div key={idx} className={styles.marqueeElement}>
            {item.icon}
            <span style={{ fontFamily: OUTFIT, fontWeight: 700, fontSize: 18, color: "#6b7280" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ACHIEVE YOUR GOALS ─────────────────────────────────────────────────────
function GoalsSection() {
  const cards = [
    { title: "Cero Riesgos", desc: "Elimina el peligro asociado al uso de reactivos y equipo.", color: "#EFF9FF", iconBg: "#023047" },
    { title: "Reducción de Costos", desc: "Sin necesidad de comprar consumibles ni dar mantenimiento.", color: "#FFF8E6", iconBg: "#FB8500" },
    { title: "Accesibilidad Total", desc: "Realiza y repite prácticas desde cualquier lugar, 24/7.", color: "#F0FAFB", iconBg: "#219EBC" },
  ];

  return (
    <section id="beneficios" className="w-full bg-white flex items-center py-16 px-6">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h2 style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.03em", color: "#0A0826" }}>
            Transforma la Enseñanza de las Ciencias
          </h2>
          <p style={{ fontFamily: OUTFIT, fontSize: 16, color: "#686868", marginTop: 12, maxWidth: 640, margin: "12px auto 0", lineHeight: 1.6 }}>
            Herramientas diseñadas para maximizar la retención académica y optimizar los recursos de tu institución.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(({ title, desc, color, iconBg }, i) => (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }} key={title} className="rounded-3xl p-7 flex flex-col gap-4" style={{ background: color }}>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: iconBg }}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div style={{ fontFamily: OUTFIT, fontSize: 18, fontWeight: 700, color: "#0A0826" }}>{title}</div>
              <p style={{ fontFamily: OUTFIT, fontSize: 14, color: "#686868", lineHeight: 1.6 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TECH DNA SECTION ──────────────────────────────────────────────────────────
function TechDnaSection() {
  return (
    <section className="w-full py-24 bg-[#023047] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <Atom className="h-[800px] w-[800px] absolute -top-48 -left-48" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          whileInView={{ opacity: 1, x: 0 }} 
          viewport={{ once: true }}
          className="flex flex-col gap-8"
        >
          <div className="inline-flex self-start px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <span style={{ fontFamily: OUTFIT, fontSize: 13, fontWeight: 700, color: "#8ECAE6", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Nuestra Tecnología
            </span>
          </div>
          <h2 style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: "clamp(32px,4vw,52px)", color: "white", lineHeight: 1.1 }}>
            Motor Gráfico 2.5D y<br />Analítica Predictiva.
          </h2>
          <p className="text-blue-100/70 text-lg leading-relaxed max-w-lg">
            Combinamos lo mejor de la visualización tridimensional con la agilidad de la web moderna. El resultado: simulaciones envolventes que no requieren instalaciones ni equipos de alta gama.
          </p>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                <Monitor className="text-orange-400" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">CEN Advisor AI</h4>
                <p className="text-sm text-blue-100/40">Detecta brechas de aprendizaje en tiempo real y sugiere laboratorios de refuerzo.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#219EBC]/10 flex items-center justify-center shrink-0 border border-[#219EBC]/20">
                <Cpu className="text-[#8ECAE6]" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Rendimiento Extremo</h4>
                <p className="text-sm text-blue-100/40">Optimizado para latencia cero en cualquier conexión escolar.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative">
          <div className="absolute -inset-4 bg-blue-500/20 rounded-[40px] blur-3xl" />
          <div className="relative bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
            <div className="flex flex-col gap-6">
               <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Rendimiento Promedio</span>
                    <div className="text-4xl font-black text-white tracking-tighter italic">98.4%</div>
                  </div>
                  <div className="h-20 w-32 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
                     <div className="flex items-end gap-1 h-12">
                        {[40,60,45,90,75,45,60].map((h, i) => (
                          <div key={i} className="w-2 bg-blue-400/50 rounded-t-sm animate-pulse" style={{ height: `${h}%`, animationDelay: `${i*100}ms` }} />
                        ))}
                     </div>
                  </div>
               </div>
               <div className="h-px bg-white/10" />
               <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none">Pedagogical Alert</span>
                  </div>
                  <p className="text-[11px] text-orange-100 font-medium">Recomendación: Incrementar prácticas de Balanceo Estequiométrico en Grado 10.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PLATFORM SECTION ─────────────────────────────────────────────────────────
// ─── TECHNOLOGY BENTO SECTION ────────────────────────────────────────────────
function PlatformSection() {
  return (
    <section id="plataforma" className={`w-full py-32 px-6 ${styles.schoolGrid} bg-white relative z-20`}>
      <div className="max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          className="text-center mb-20 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFF9FF] border border-[#8ECAE6]/30">
            <Cpu className="w-4 h-4 text-[#219EBC]" />
            <span style={{ fontFamily: OUTFIT, fontSize: 13, fontWeight: 800, color: "#219EBC", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Nuestra Tecnología
            </span>
          </div>
          <h2 style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: "clamp(32px, 4vw, 56px)", color: "#023047", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Infraestructura de Grado<br />Institucional.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          {/* ── Card 1: 2.5D Engine (Large) ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 md:row-span-2 relative rounded-[48px] bg-[#023047] overflow-hidden shadow-2xl group"
          >
            <Image src="/images/landing/fisica.png" alt="Engine" fill className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#023047] via-[#023047]/20 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 space-y-4">
              <div className="inline-flex px-3 py-1 rounded-lg bg-[#219EBC]/20 border border-[#219EBC]/30 text-[#8ECAE6] text-[10px] font-black uppercase tracking-widest">
                Renderizado High-Fidelity
              </div>
              <h3 className="text-4xl font-black text-white" style={{ fontFamily: OUTFIT }}>Motor Gráfico 2.5D</h3>
              <p className="text-blue-100/60 max-w-md font-medium">Experiencias inmersivas que corren en cualquier navegador, optimizadas bit a bit para el sector educativo.</p>
            </div>
          </motion.div>

          {/* ── Card 2: AI Analytics ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[48px] bg-[#F8FAFC] border border-gray-100 shadow-xl p-10 flex flex-col justify-between group hover:border-[#219EBC]/30 transition-all"
          >
            <div className="h-16 w-16 rounded-[24px] bg-[#219EBC]/10 flex items-center justify-center border border-[#219EBC]/20 shadow-inner group-hover:bg-[#219EBC] transition-all">
              <BarChart3 className="text-[#219EBC] group-hover:text-white" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-black text-[#023047]">CEN Advisor AI</h4>
              <p className="text-sm text-gray-500 font-medium">Analítica predictiva que detecta brechas de aprendizaje antes que ocurran.</p>
            </div>
          </motion.div>

          {/* ── Card 3: Cloud Infrastructure ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-[48px] bg-gradient-to-br from-[#FB8500] to-[#FFB703] p-10 flex flex-col justify-between shadow-[0_20px_40px_rgba(251,133,0,0.2)]"
          >
            <div className="flex justify-between items-start">
               <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Zap className="text-white" />
               </div>
               <div className="font-mono text-[10px] text-white/60 font-black uppercase tracking-widest">Latency: &#60;15ms</div>
            </div>
            <div className="space-y-2 text-white">
              <h4 className="text-2xl font-black">Latencia Cero</h4>
              <p className="text-sm text-white/80 font-medium">Infraestructura distribuida para una fluidez total en el aula.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── BENEFITS SECTION ──────────────────────────────────────────────────────────
function BenefitsSection() {
  return (
    <section id="colegios" className="w-full bg-white py-24 px-6 relative overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        <div className="flex flex-col gap-6">
          <div className="inline-flex self-start px-4 py-1.5 rounded-full" style={{ background: "#EFF9FF" }}>
            <span style={{ fontFamily: OUTFIT, fontSize: 13, fontWeight: 700, color: "#219EBC", letterSpacing: "0.05em", textTransform: "uppercase" }}>Para Docentes</span>
          </div>
          <h2 style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.03em", color: "#0A0826", lineHeight: 1.15 }}>
            Control Total para la Academia
          </h2>
          <p style={{ fontFamily: OUTFIT, fontSize: 16, color: "#686868", lineHeight: 1.6 }}>
            CEN no es solo para el alumno. Proporcionamos a los docentes un panel de control avanzado para medir el rendimiento grupal e individual.
          </p>
        </div>
        <div className="relative h-[480px]">
          <div className="absolute" style={{ width: "85%", height: "80%", top: 0, right: 0, background: "#023047", borderRadius: "0 80px 80px 80px" }} />
          <Image 
            src="/images/lab-quimica.png" 
            alt="Teacher panel" 
            fill
            className="object-cover" 
            style={{ borderRadius: "80px 0 80px 80px" }} 
          />
        </div>
      </motion.div>
    </section>
  );
}

// ─── CATALOG SECTION ────────────────────────────────────────────────────────────
const CATALOG_CARDS = [
  { title: "Laboratorio de Química", desc: "Estequiometría, titulación y enlaces moleculares avanzados.", img: "/images/quimica_3d.png", color: "#emerald" },
  { title: "Laboratorio de Física", desc: "Vectores, cinemática y leyes universales de Newton.", img: "/images/fisica_3d.png", color: "#blue" },
  { title: "Laboratorio de Biología", desc: "Microscopía, genética y síntesis de proteínas.", img: "/images/biologia_3d.png", color: "#rose" },
  { title: "Laboratorio de Matemáticas", desc: "Álgebra, geometría plana y cálculo interactivo.", img: "/images/mates_3d.png", color: "#orange" },
];

function CatalogSection() {
  return (
    <section id="catalogo" className="w-full bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16 flex flex-col items-center">
          <h2 style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: "clamp(32px,4vw,52px)", color: "#023047", letterSpacing: "-0.03em" }}>
            Explora Nuestro Catálogo de Prácticas
          </h2>
        </motion.div>
        <motion.div 
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"
        >
          {CATALOG_CARDS.map((item, i) => (
            <motion.div 
              key={i} 
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="group rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image 
                  src={item.img} 
                  alt={item.title} 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="p-6 flex flex-col flex-1 gap-3">
                <h3 style={{ fontFamily: OUTFIT, fontSize: 20, fontWeight: 800, color: "#023047" }}>{item.title}</h3>
                <p style={{ fontFamily: OUTFIT, fontSize: 14, color: "#686868" }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section className="w-full bg-gray-50 flex items-center py-20 px-6">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.03em", color: "#023047" }}>
            Respaldado por la Comunidad Académica
          </h2>
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="absolute -left-4 top-0 h-12 w-12 rounded-full border-2 border-white shadow-md bg-gray-100 flex items-center justify-center hidden lg:flex">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <div className="absolute -right-4 top-0 h-12 w-12 rounded-full border-2 border-white shadow-md bg-gray-100 flex items-center justify-center hidden lg:flex">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5" style={{ fill: "#FFB703", stroke: "#FFB703" }} />)}
          </div>
          <p style={{ fontFamily: OUTFIT, fontSize: 20, color: "#5A5A72", lineHeight: 1.6, fontStyle: "italic", fontWeight: 500 }}>
            "La integración de los laboratorios de CEN incrementó el promedio de aprobación en la academia de ciencias en un 35% en el primer semestre."
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="h-14 w-14 rounded-full border-2 border-white shadow-sm bg-[#EFF9FF] flex items-center justify-center overflow-hidden">
               <Users className="w-8 h-8 text-[#219EBC]" />
            </div>
            <div className="text-left">
              <div style={{ fontFamily: OUTFIT, fontSize: 16, fontWeight: 800, color: "#023047" }}>Dr. Roberto Alcalá</div>
              <div style={{ fontFamily: OUTFIT, fontSize: 13, color: "#219EBC", fontWeight: 600 }}>Director Académico, Facultad de Ingeniería</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── CTA BANNER ───────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <section className="w-full px-6 py-20 pb-24">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-5xl mx-auto">
        <div
          className="relative overflow-hidden rounded-[40px] flex flex-col items-center text-center justify-center gap-6 px-8 py-20 shadow-2xl"
          style={{ background: "#219EBC" }}
        >
          <div className="absolute" style={{ width: 600, height: 600, right: -150, top: -150, background: "#023047", borderRadius: "50%", opacity: 0.15 }} />
          <div className="absolute" style={{ width: 400, height: 400, left: -100, bottom: -100, background: "#FFB703", borderRadius: "50%", opacity: 0.15 }} />
          
          <div className="relative z-10 max-w-3xl flex flex-col items-center">
            <h2 style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: "clamp(32px,4vw,52px)", color: "white", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Agenda una demostración para tu institución.
            </h2>
            <p style={{ fontFamily: OUTFIT, fontSize: 18, color: "rgba(255,255,255,0.9)", marginTop: 16, maxWidth: 600, lineHeight: 1.6 }}>
              Lleva la educación presencial y a distancia al siguiente nivel con la integración seamless de Laboratorios Virtuales B2B.
            </p>
          </div>
          
          <div className="relative z-10 w-full max-w-xl mt-6 flex flex-col sm:flex-row gap-3 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-sm">
            <input
              type="email"
              placeholder="Ingresa tu correo institucional..."
              className="flex-1 px-5 py-4 rounded-xl bg-white/90 text-[#023047] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
              style={{ fontFamily: OUTFIT, fontSize: 16 }}
            />
            <Link
              href="/"
              className="rounded-xl px-10 py-4 text-white transition-all hover:-translate-y-0.5 shadow-lg whitespace-nowrap"
              style={{ background: "#FB8500", fontFamily: OUTFIT, fontWeight: 800, fontSize: 16, letterSpacing: "0.02em" }}
            >
              Solicitar Demo
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contacto" className="w-full bg-[#0A0826] pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
          
          {/* ── Brand & Email ── */}
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center rounded-lg bg-white"
                style={{ width: 42, height: 42 }}
              >
                <span style={{ fontFamily: OUTFIT, fontWeight: 900, color: "#219EBC", fontSize: 18 }}>CEN</span>
              </div>
              <span style={{ fontFamily: OUTFIT, fontWeight: 800, fontSize: 18, color: "white", lineHeight: 1.2 }}>
                Campaña de Educación Nacional
              </span>
            </div>
            <div className="mt-8">
              <div style={{ fontFamily: OUTFIT, fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                Correo Electrónico:
              </div>
              <a 
                href="mailto:gerencia@campanaeducativanacional.com.mx" 
                style={{ fontFamily: OUTFIT, fontSize: 15, color: "white", fontWeight: 600, textDecoration: "none" }}
                className="hover:text-[#219EBC] transition-colors"
              >
                gerencia@campanaeducativanacional.com.mx
              </a>
            </div>
          </div>

          {/* ── Links Column ── */}
          <div>
            <div className="flex flex-col gap-4">
              {["Nosotros", "Productos", "Programa de Educación Nacional", "Valores"].map((l) => (
                <a 
                  key={l} 
                  href="#" 
                  style={{ fontFamily: OUTFIT, fontSize: 16, color: "rgba(255,255,255,0.7)", textDecoration: "none" }} 
                  className="hover:text-white transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* ── Address & Phones ── */}
          <div className="max-w-sm">
            <div className="flex flex-col gap-6">
              <div style={{ fontFamily: OUTFIT, fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                Mariano Matamoros #208 Casa Blanca,<br />
                Metepec, Estado de México.
              </div>
              
              <div className="flex flex-col gap-2">
                <div style={{ fontFamily: OUTFIT, fontSize: 16, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                  Teléfonos:
                </div>
                <div style={{ fontFamily: OUTFIT, fontSize: 18, color: "white", fontWeight: 800, letterSpacing: "0.02em" }}>
                  722 537 9594
                </div>
                <div style={{ fontFamily: OUTFIT, fontSize: 18, color: "white", fontWeight: 800, letterSpacing: "0.02em" }}>
                  729 178 9196
                </div>
              </div>
            </div>
          </div>

        </div>
        
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p style={{ fontFamily: OUTFIT, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            © {new Date().getFullYear()} Campaña de Educación Nacional. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" style={{ fontFamily: OUTFIT, fontSize: 12, color: "rgba(255,255,255,0.4)" }} className="hover:text-white transition-colors">Aviso de Privacidad</a>
            <a href="#" style={{ fontFamily: OUTFIT, fontSize: 12, color: "rgba(255,255,255,0.4)" }} className="hover:text-white transition-colors">Términos y Condiciones</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <GoalsSection />
      <PlatformSection />
      <TechDnaSection />
      <BenefitsSection />
      <CatalogSection />
      <TestimonialsSection />
      <CtaBanner />
      <Footer />
    </div>
  );
}
