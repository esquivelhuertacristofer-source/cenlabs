"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoveLeft, Eye, EyeOff, Loader2, AlertCircle,
  CheckCircle2, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase handles the URL hash (access_token / code) automatically.
    // PASSWORD_RECOVERY fires once the session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { error: sbError } = await supabase.auth.updateUser({ password });
      if (sbError) throw sbError;
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al actualizar la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white overflow-hidden">

      {/* ── BRANDING IZQUIERDO ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex relative w-1/2 bg-[#023047] overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] bg-[#0A1A2F] rounded-full blur-[100px] opacity-70"
          />
          <motion.div
            animate={{ scale: [1.1, 1.3, 1.1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] bg-[#FB8500] rounded-full blur-[110px] opacity-20"
          />
        </div>

        <div className="relative z-10 flex flex-col h-full w-full p-16 xl:p-24 justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[#8ECAE6] hover:text-white transition-all text-sm font-black uppercase tracking-[0.2em] group"
          >
            <MoveLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Inicio de sesión
          </Link>

          <div className="max-w-xl">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative inline-block mb-12"
            >
              <div className="absolute inset-0 bg-white/10 blur-[40px] rounded-full scale-150" />
              <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.2)]">
                <ShieldCheck className="w-20 h-20 text-[#FB8500]" strokeWidth={1.5} />
              </div>
            </motion.div>

            <h1
              className="text-white font-black text-5xl leading-[1.05] tracking-tight mb-6"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Nueva<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB8500] to-[#FFB703]">
                Contraseña
              </span>
            </h1>
            <p className="text-blue-100/40 text-lg font-medium max-w-sm leading-relaxed">
              Elige una contraseña segura de al menos 8 caracteres.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="w-8 h-[2px] bg-white/10" />
            <span className="text-white/20 text-[11px] font-black uppercase tracking-[0.4em]">
              Sesión Cifrada
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── FORMULARIO DERECHO ─────────────────────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 bg-[#F8FAFC]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[460px] relative z-10"
        >
          <div className="bg-white rounded-[60px] p-10 sm:p-14 shadow-[30px_30px_70px_-10px_rgba(0,0,0,0.1),inset_6px_6px_30px_rgba(255,255,255,1),inset_-6px_-6px_20px_rgba(0,0,20,0.03)] border border-white/40">
            <AnimatePresence mode="wait">

              {/* Estado: contraseña actualizada exitosamente */}
              {done && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-4"
                >
                  <div className="flex justify-center">
                    <div className="bg-green-50 p-5 rounded-full">
                      <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2
                      className="text-[#023047] font-black text-3xl tracking-tight"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      Contraseña actualizada
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Redirigiendo al inicio de sesión...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Estado: esperando que Supabase valide el token del email */}
              {!done && !sessionReady && (
                <motion.div
                  key="waiting"
                  className="text-center space-y-6 py-8"
                >
                  <Loader2 className="w-10 h-10 text-[#219EBC] animate-spin mx-auto" />
                  <p className="text-gray-400 text-sm font-medium">
                    Verificando el enlace de recuperación...
                  </p>
                  <p className="text-gray-300 text-xs">
                    Si llegaste aquí por error,{" "}
                    <Link href="/forgot-password" className="text-[#219EBC] hover:underline">
                      solicita un nuevo enlace
                    </Link>
                    .
                  </p>
                </motion.div>
              )}

              {/* Estado: sesión válida, mostrar formulario */}
              {!done && sessionReady && (
                <motion.div key="form" className="space-y-8">
                  <div className="space-y-3">
                    <div className="lg:hidden inline-flex bg-[#023047] p-3 rounded-2xl mb-4">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h2
                      className="text-[#023047] font-black text-4xl tracking-tight"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      Nueva clave
                    </h2>
                    <p className="text-gray-400 font-medium text-sm">
                      Mínimo 8 caracteres.
                    </p>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-50 text-red-600 px-5 py-4 rounded-[28px] text-xs font-bold border border-red-100 flex items-center gap-3"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#023047]/30 uppercase tracking-[0.2em] ml-4">
                        Nueva Contraseña
                      </label>
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

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#023047]/30 uppercase tracking-[0.2em] ml-4">
                        Confirmar Contraseña
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#F1F5F9]/60 border-2 border-transparent rounded-[28px] px-7 py-4 text-[#023047] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FB8500]/10 focus:border-[#FB8500]/20 transition-all font-bold placeholder:text-gray-300"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-5 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] transition-all
                        ${isLoading
                          ? "bg-gray-100 text-gray-400 cursor-wait shadow-inner"
                          : "bg-[#FB8500] text-white shadow-[0_20px_50px_rgba(251,133,0,0.3)] hover:shadow-[0_25px_60px_rgba(251,133,0,0.45)] hover:-translate-y-1.5 active:translate-y-0.5"
                        }`}
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      <span className="flex items-center justify-center gap-3">
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLoading ? "Guardando..." : "Actualizar contraseña"}
                      </span>
                    </button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
