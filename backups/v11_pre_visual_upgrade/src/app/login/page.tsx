"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MoveLeft, Eye, EyeOff, Beaker, Zap, Dna, Calculator, Loader2, AlertCircle } from "lucide-react";
import { supabase, getCurrentProfile, ensureProfile } from "@/lib/supabase";
import { useSimuladorStore } from "@/store/simuladorStore";

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
  const [isLoading, setIsLoading] = useState(false);
  const [errorObj, setErrorObj] = useState<{message: string} | null>(null);
  const { setSession, setUser } = useSimuladorStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorObj(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        const { data: { user } } = await supabase.auth.getUser();
        let profile = await getCurrentProfile();
        if (!profile && user) {
          profile = await ensureProfile(user.id, user.email || '', user.user_metadata);
        }
        if (profile) {
          setUser(profile);
          if (profile.role === 'admin') router.push("/admin/usuarios");
          else if (profile.role === 'profesor') router.push("/");
          else router.push("/alumno/inicio");
        } else {
          setErrorObj({ message: "Error al cargar perfil académico." });
        }
      }
    } catch (err: any) {
      setErrorObj({ message: err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white overflow-hidden">
      
      {/* ── LADO IZQUIERDO: Branding Glassmorphic (50%) ── */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex relative w-1/2 bg-[#023047] overflow-hidden"
      >
        {/* MESH BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] bg-[#0A1A2F] rounded-full blur-[100px] opacity-70" 
          />
          <motion.div 
            animate={{ scale: [1.1, 1.3, 1.1], x: [0, -40, 0], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] bg-[#219EBC] rounded-full blur-[110px] opacity-40" 
          />
          
          {/* ANIMATED ORBS (No Imágenes) */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                x: [0, Math.random() * 100 - 50, 0], 
                y: [0, Math.random() * 100 - 50, 0],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-32 h-32 bg-white rounded-full blur-[60px]"
              style={{ top: `${20 + i * 20}%`, left: `${20 + i * 15}%` }}
            />
          ))}
        </div>

        {/* CONTENIDO BRANDING */}
        <div className="relative z-10 flex flex-col h-full w-full p-16 xl:p-24 justify-between">
          <Link href="/landing" className="inline-flex items-center gap-2 text-[#8ECAE6] hover:text-white transition-all text-sm font-black uppercase tracking-[0.2em] group">
            <MoveLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Volver
          </Link>

          <div className="max-w-xl text-center lg:text-left">
            {/* BIG GLASS ICON (No Imagen) */}
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative inline-block mb-12"
            >
              <div className="absolute inset-0 bg-white/10 blur-[40px] rounded-full scale-150" />
              <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.2)]">
                <Beaker className="w-20 h-20 text-[#FB8500]" strokeWidth={1.5} />
              </div>
            </motion.div>

            <h1 className="text-white font-black text-6xl leading-[1.05] tracking-tight mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>
              CEN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8ECAE6] to-[#219EBC]">Laboratorios</span>
            </h1>
            
            <p className="text-blue-100/40 text-lg font-medium max-w-sm leading-relaxed">
              Plataforma de simulación científica de alta fidelidad. Un entorno diseñado para la excelencia académica.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="w-8 h-[2px] bg-white/10" />
            <span className="text-white/20 text-[11px] font-black uppercase tracking-[0.4em]">v3.5 Platinum Edition</span>
          </div>
        </div>
      </motion.div>

      {/* ── LADO DERECHO: Login Claymorphic (50%) ── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 bg-[#F8FAFC]">
        {/* TEXTURA DE RUIDO SUTIL */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[460px] relative z-10"
        >
          {/* EL CONTENEDOR CLAYMorphic */}
          <div className="bg-white rounded-[60px] p-10 sm:p-14 shadow-[30px_30px_70px_-10px_rgba(0,0,0,0.1),inset_6px_6px_30px_rgba(255,255,255,1),inset_-6px_-6px_20px_rgba(0,0,20,0.03)] border border-white/40">
            
            <div className="space-y-8">
              <div className="text-center lg:text-left space-y-3">
                <div className="lg:hidden inline-flex bg-[#023047] p-3 rounded-2xl mb-6">
                  <Beaker className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-[#023047] font-black text-4xl tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Bienvenido
                </h2>
                <p className="text-gray-400 font-medium text-sm">Ingresa a la red de laboratorios más avanzada.</p>
              </div>

              {/* Error UI */}
              <AnimatePresence>
                {errorObj && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-red-50 text-red-600 px-5 py-4 rounded-[28px] text-xs font-bold border border-red-100 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorObj.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#023047]/30 uppercase tracking-[0.2em] ml-4">E-mail Académico</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@institucion.edu"
                    className="w-full bg-[#F1F5F9]/60 border-2 border-transparent rounded-[28px] px-7 py-4 text-[#023047] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FB8500]/10 focus:border-[#FB8500]/20 transition-all font-bold placeholder:text-gray-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-[#023047]/30 uppercase tracking-[0.2em]">Contraseña</label>
                    <Link href="#" className="text-[9px] font-black text-[#219EBC] hover:text-[#FB8500] uppercase tracking-widest transition-colors font-bold">Reiniciar</Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F1F5F9]/60 border-2 border-transparent rounded-[28px] px-7 py-4 text-[#023047] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FB8500]/10 focus:border-[#FB8500]/20 transition-all font-bold placeholder:text-gray-300 pr-16"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#FB8500] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-5 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] transition-all relative overflow-hidden group
                    ${isLoading ? "bg-gray-100 text-gray-400 cursor-wait shadow-inner" : "bg-[#FB8500] text-white shadow-[0_20px_50px_rgba(251,133,0,0.3)] hover:shadow-[0_25px_60px_rgba(251,133,0,0.45)] hover:-translate-y-1.5 active:translate-y-0.5"}
                  `}
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isLoading ? "Entrando..." : "Iniciar Sesión"}</span>
                  </div>
                </button>
              </form>

              <p className="text-center text-[10px] text-gray-400 font-bold px-8 leading-relaxed">
                Sistema de acceso seguro 256-bit. <br className="hidden sm:block" /> Contacte a soporte si presenta problemas.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
