"use client";

import { useState } from "react";
import {
  Users, BookOpen, Atom, Zap, 
  ArrowRight, Shield, Cpu, Monitor, AlertCircle,
  FlaskConical, Check
} from "lucide-react";
import styles from "./Landing.module.css";
import Link from "next/link";
import { motion } from "framer-motion";

const OUTFIT = "'Outfit', var(--font-outfit), sans-serif";
const APPLE_GRAY = "#1d1d1f";
const APPLE_SUB = "#86868b";

// ─── APPLE NAVBAR ────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="w-full sticky top-0 z-[100] border-b border-gray-100 backdrop-blur-2xl bg-white/80">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col leading-none">
            <span style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: 24, color: APPLE_GRAY, letterSpacing: "-0.02em" }}>CEN</span>
            <span style={{ fontFamily: OUTFIT, fontWeight: 600, fontSize: 10, color: "#219EBC", letterSpacing: "0.15em", textTransform: "uppercase" }}>Laboratorios</span>
          </div>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium">
          <Link href="/login" className="px-6 py-2 rounded-full text-white bg-black hover:bg-gray-800 transition-all">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── APPLE HERO ─────────────────────────────────────────────────────────────
function AppleHero() {
  return (
    <section className="relative w-full flex flex-col items-center text-center pt-32 pb-24 px-6 overflow-hidden bg-white">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl flex flex-col items-center gap-6 z-10"
      >
        <h1 
          style={{ 
            fontFamily: OUTFIT, 
            fontWeight: 800, 
            fontSize: "clamp(56px, 10vw, 96px)", 
            color: APPLE_GRAY, 
            lineHeight: 1, 
            letterSpacing: "-0.05em" 
          }}
        >
          CEN Labs.
        </h1>
        <p 
          style={{ 
            fontFamily: OUTFIT, 
            fontSize: "clamp(24px, 3vw, 28px)", 
            fontWeight: 500, 
            color: APPLE_SUB, 
            letterSpacing: "-0.02em",
            maxWidth: 700 
          }}
        >
          El estándar de oro en simulación científica de alto rendimiento.
        </p>
        
        <div className="mt-8">
           <Link href="#contacto" className="text-xl font-bold text-blue-600 hover:underline flex items-center gap-2">
             Agenda una Demo <ArrowRight className="w-6 h-6" />
           </Link>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl mt-12 relative px-4"
      >
        <img 
          src="/images/landing/apple_hero.png" 
          alt="Absolute Excellence Asset" 
          className="w-full h-auto drop-shadow-[0_35px_60px_rgba(0,0,0,0.1)]"
        />
      </motion.div>
    </section>
  );
}

// ─── APPLE PRINCIPLES ───────────────────────────────────────────────────────
function PrinciplesSection() {
  const cards = [
    { title: "Cero Riesgos", desc: "Prácticas seguras sin reactivos físicos ni peligros.", icon: <Shield className="w-10 h-10" /> },
    { title: "Escalabilidad", desc: "Miles de alumnos experimentando en simultáneo.", icon: <Users className="w-10 h-10" /> },
    { title: "Rigor Científico", desc: "40 laboratorios con base pedagógica profunda.", icon: <BookOpen className="w-10 h-10" /> },
  ];

  return (
    <section className="w-full bg-white flex flex-col items-center py-40 px-6">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-24">
        {cards.map(({ title, desc, icon }, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.1 }}
            key={title} 
            className="flex flex-col items-center text-center gap-6"
          >
            <div className="text-black mb-2">{icon}</div>
            <h3 style={{ fontFamily: OUTFIT, fontSize: 24, fontWeight: 800, color: APPLE_GRAY }}>{title}</h3>
            <p style={{ fontFamily: OUTFIT, fontSize: 18, color: APPLE_SUB, lineHeight: 1.6 }}>{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── TECH DNA (WHITE PAPER STYLE) ───────────────────────────────────────────
function TechDnaSection() {
  return (
    <section className="w-full py-40 bg-[#F5F5F7] flex flex-col items-center px-6">
      <div className="max-w-5xl text-center space-y-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 style={{ fontFamily: OUTFIT, fontWeight: 800, fontSize: "clamp(32px, 5vw, 64px)", color: APPLE_GRAY, letterSpacing: "-0.04em" }}>
            Potencia 2.5D.<br />Simplicidad Web.
          </h2>
          <p style={{ fontFamily: OUTFIT, fontSize: 22, color: APPLE_SUB, lineHeight: 1.5, maxWidth: 700, margin: "auto" }}>
            Un motor gráfico diseñado para el rigor pedagógico. Visuales tridimensionales que corren en cualquier navegador, sin fricción ni instalaciones.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 rounded-[40px] overflow-hidden shadow-sm">
           <div className="bg-white p-16 text-left space-y-6">
              <Cpu className="w-12 h-12 text-blue-600" />
              <h4 className="text-2xl font-extrabold" style={{ color: APPLE_GRAY }}>CEN Advisor AI</h4>
              <p className="text-lg text-gray-500 leading-relaxed">Analítica predictiva que detecta brechas de aprendizaje antes que ocurran, guiando al docente con datos reales.</p>
           </div>
           <div className="bg-white p-16 text-left space-y-6">
              <Zap className="w-12 h-12 text-orange-500" />
              <h4 className="text-2xl font-extrabold" style={{ color: APPLE_GRAY }}>Latencia Cero</h4>
              <p className="text-lg text-gray-500 leading-relaxed">Simulaciones optimizadas al bit para funcionar incluso en infraestructuras escolares con conectividad limitada.</p>
           </div>
        </div>
      </div>
    </section>
  );
}

// ─── APPLE CATALOG ──────────────────────────────────────────────────────────
const CATALOG_CARDS = [
  { title: "Química", desc: "Estequiometría, titulación y enlaces avanzados.", img: "/images/landing/quimica.png" },
  { title: "Física", desc: "Cinemática, leyes de Newton y energía.", img: "/images/landing/fisica.png" },
  { title: "Biología", desc: "Microscopía, genética y síntesis de proteínas.", img: "/images/landing/biologia.png" },
  { title: "Matemáticas", desc: "Álgebra, geometría plana y cálculo.", img: "/images/landing/matematicas.png" },
];

function CatalogSection() {
  return (
    <section id="catalogo" className="w-full bg-white py-48 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-28">
          <h2 style={{ fontFamily: OUTFIT, fontWeight: 800, fontSize: "clamp(48px, 6vw, 84px)", color: APPLE_GRAY, letterSpacing: "-0.05em" }}>
            Un universo de prácticas.
          </h2>
          <p className="text-xl text-gray-400 mt-4">Más de 40 experiencias interactivas listas para el salón.</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {CATALOG_CARDS.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 1 }}
              className="group flex flex-col gap-8 cursor-pointer"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-[48px] bg-[#F5F5F7] shadow-sm">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-1000" />
              </div>
              <div className="px-6">
                <h3 style={{ fontFamily: OUTFIT, fontSize: 28, fontWeight: 800, color: APPLE_GRAY }}>{item.title}</h3>
                <p style={{ fontFamily: OUTFIT, fontSize: 20, color: APPLE_SUB }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA BANNER ─────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <section className="w-full py-48 bg-white flex flex-col items-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-5xl w-full bg-[#023047] rounded-[60px] p-24 text-center text-white space-y-10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent pointer-events-none" />
        <h2 style={{ fontFamily: OUTFIT, fontSize: "clamp(42px, 5vw, 64px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          Únete al estándar de oro.<br />Transforma tu institución hoy.
        </h2>
        <div className="flex justify-center gap-6 relative z-10">
          <Link href="#contacto" className="px-12 py-5 rounded-full bg-white text-black font-bold text-xl hover:bg-gray-100 transition-all">
            Solicitar Demo
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-full py-20 bg-[#F5F5F7] px-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex flex-col gap-2">
          <span style={{ fontFamily: OUTFIT, fontWeight: 900, fontSize: 24, color: APPLE_GRAY }}>CEN Labs</span>
          <span className="text-sm text-gray-500">© 2025 CEN Lab. Todos los derechos reservados.</span>
        </div>
        <div className="flex gap-12 text-sm font-semibold text-gray-600">
           <Link href="#" className="hover:text-black">Privacidad</Link>
           <Link href="#" className="hover:text-black">Términos</Link>
           <Link href="#" className="hover:text-black">Contacto</Link>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <AppleHero />
      <PrinciplesSection />
      <TechDnaSection />
      <CatalogSection />
      <CtaBanner />
      <Footer />
    </div>
  );
}
