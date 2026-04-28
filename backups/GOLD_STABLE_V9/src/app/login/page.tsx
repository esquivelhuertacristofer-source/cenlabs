"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MoveLeft, Eye, EyeOff, Beaker, Zap, Dna, Calculator, Loader2, AlertCircle } from "lucide-react";

const subjects = [
  { name: "Física", icon: Zap, color: "#FB8500" },
  { name: "Química", icon: Beaker, color: "#8ECAE6" },
  { name: "Biología", icon: Dna, color: "#219EBC" },
  { name: "Matemáticas", icon: Calculator, color: "#FFB703" },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // States for UX improvements
  const [isLoading, setIsLoading] = useState(false);
  const [errorObj, setErrorObj] = useState<{message: string} | null>(null);
  
  // State for rotating text
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSubjectIndex((prev) => (prev + 1) % subjects.length);
    }, 2800);
    return () => clearInterval(intervalId);
  }, []);

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorObj(null); // Clear previous errors

    // Simulating an API call with timeout
    setTimeout(() => {
      // Bypassing login completely for the mockup phase
      router.push("/alumno/inicio");
    }, 1200);
  };

  const CurrentIcon = subjects[currentSubjectIndex].icon;

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      
      {/* ── LADO IZQUIERDO: Branding (Oculto en móviles) ── */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex flex-col w-1/2 bg-[#023047] relative"
      >
        {/* Patrón de Fondo Escolar muy sutil */}
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: "radial-gradient(#8ECAE6 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
        
        <div className="relative z-10 flex flex-col h-full p-12 xl:p-20 justify-between">
          <div>
            <Link href="/landing" className="inline-flex items-center gap-2 text-[#8ECAE6] hover:text-white transition-colors text-sm font-semibold mb-12">
              <MoveLeft className="w-4 h-4" /> Volver al Inicio
            </Link>
          </div>

          <div className="max-w-xl">
            {/* Logo o Marca en texto */}
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#FB8500] p-2 rounded-lg">
                <Beaker className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tight text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                CEN Laboratorios
              </span>
            </div>
            
            <h1 className="text-white font-black text-5xl xl:text-6xl leading-[1.1] mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-300" style={{ fontFamily: "Outfit, sans-serif" }}>
              Entorno de Simulación Académica.
            </h1>
            
            {/* ── Rotating Dynamic Text ── */}
            <div className="flex items-center gap-3 h-10 overflow-hidden">
              <span className="text-[#8ECAE6] text-xl md:text-2xl font-medium tracking-wide">
                Explora
              </span>
              <div className="relative flex-1 h-full flex items-center">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={subjects[currentSubjectIndex].name}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -30, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "anticipate" }}
                    className="absolute flex items-center gap-2"
                  >
                    <CurrentIcon className="w-6 h-6" style={{ color: subjects[currentSubjectIndex].color }} />
                    <span className="text-white text-xl md:text-2xl font-bold tracking-wide">
                      {subjects[currentSubjectIndex].name}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="text-[#8ECAE6]/60 text-sm">
            © {new Date().getFullYear()} CEN Innovación Educativa. Todos los derechos reservados.
          </div>
        </div>
      </motion.div>

      {/* ── LADO DERECHO: Formulario ── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative bg-white">
        
        {/* Enlace de regreso solo para móvil */}
        <Link href="/landing" className="lg:hidden absolute top-6 left-6 inline-flex items-center gap-2 text-[#023047]/60 hover:text-[#023047] transition-colors text-sm font-semibold">
          <MoveLeft className="w-4 h-4" /> Volver
        </Link>
        <div className="lg:hidden absolute top-6 right-6 flex items-center gap-2">
            <div className="bg-[#023047] p-1.5 rounded-md">
              <Beaker className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#023047]" style={{ fontFamily: "Outfit, sans-serif" }}>CEN</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-[#023047] font-black text-3xl sm:text-4xl mb-3 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
              Bienvenido de nuevo
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium">
              Ingresa tus credenciales institucionales.
            </p>
          </div>

          {/* ── VISUAL ERROR UI ── */}
          <AnimatePresence>
            {errorObj && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">
                    {errorObj.message}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-[#023047] mb-2" htmlFor="email">
                Correo Institucional
              </label>
              <input
                id="email"
                type="text" // Type text to intentionally allow wrong input forms to test the visual error
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@escuela.edu.mx"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#219EBC] focus:border-transparent transition-all"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-[#023047]" htmlFor="password">
                  Contraseña
                </label>
                <Link href="#" className="text-sm font-bold text-[#219EBC] hover:text-[#023047] transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#219EBC] focus:border-transparent transition-all pr-12"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#023047] transition-colors p-1"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* ── SUBMIT BUTTON WITH LOADING STATE ── */}
            <button
              type="submit"
              disabled={isLoading}
              className={`relative w-full text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(251,133,0,0.25)] transition-all transform mt-2 text-base flex justify-center items-center overflow-hidden
                ${isLoading ? "bg-[#FB8500]/80 cursor-wait" : "bg-[#FB8500] hover:bg-[#E87A00] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(251,133,0,0.30)]"}
              `}
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verificando credenciales...</span>
                </div>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* ── REGLA B2B (Módulo de no-registro) ── */}
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium px-4">
              ¿No tienes una cuenta? Solicita tu acceso con la coordinación académica de tu escuela.
            </p>
          </div>
          
        </motion.div>
      </div>
    </div>
  );
}
