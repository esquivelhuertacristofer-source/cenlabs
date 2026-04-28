"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Upload, UserPlus, CheckCircle2, AlertCircle, 
  Loader2, Download, FileText, ClipboardList, Trash2,
  ChevronRight, ShieldAlert, LogOut
} from "lucide-react";
import { onboardInstitutionalUsers } from "../../actions/adminActions";
import { supabase, getCurrentProfile, ensureProfile } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

interface Group {
  id: string;
  nombre: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [namesText, setNamesText] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [role, setRole] = useState<"alumno" | "profesor">("alumno");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: {name: string, email: string}[]; errors: any[] } | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GUARDIA DE SEGURIDAD: Solo rol 'admin' puede entrar
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace("/login");
        return;
      }
      
      let profile = await getCurrentProfile();
      if (!profile) {
        profile = await ensureProfile(session.user.id, session.user.email || '', session.user.user_metadata);
      }

      if (!profile || profile.role !== 'admin') {
        // No es admin: expulsado silenciosamente al login
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }
      
      setIsAuthorized(true);
      setAuthChecking(false);
      
      // Cargar grupos reales de la BD
      const { data } = await supabase.from('grupos').select('id, nombre');
      if (data) setGroups(data);
    };
    
    checkAccess();
  }, [router]);

  const handleProcess = async () => {
    const namesArray = namesText.split('\n').map(n => n.trim()).filter(n => n !== "");
    if (namesArray.length === 0) return alert("Por favor escribe o pega al menos un nombre.");
    if (!selectedGroup && role === 'alumno') return alert("Por favor selecciona un grupo de destino.");

    setIsProcessing(true);
    try {
      const res = await onboardInstitutionalUsers(namesArray, selectedGroup || null, role);
      setResults(res);
    } catch {
      alert("Error: Verifica que el SERVICE_ROLE_KEY esté configurado.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const names = text.split('\n')
        .map(line => line.split(',')[0].replace(/"/g, '').trim())
        .filter(n => n && n.toLowerCase() !== 'nombre' && n.toLowerCase() !== 'name');
      setNamesText(names.join('\n'));
    };
    reader.readAsText(file);
  };

  const downloadReport = () => {
    if (!results) return;
    const doc = new jsPDF();
    const groupName = groups.find(g => g.id === selectedGroup)?.nombre || 'Sin Grupo';
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Accesos - CEN Laboratorios", 10, 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Grupo: ${groupName}  |  Rol: ${role}  |  Fecha: ${new Date().toLocaleDateString('es-MX')}`, 10, 28);
    doc.line(10, 32, 200, 32);
    
    doc.setFont("helvetica", "bold");
    doc.text("NOMBRE COMPLETO", 10, 42);
    doc.text("CORREO INSTITUCIONAL", 80, 42);
    doc.text("CONTRASEÑA", 155, 42);
    doc.line(10, 45, 200, 45);
    
    doc.setFont("helvetica", "normal");
    let y = 52;
    results.success.forEach((user) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(user.name.substring(0, 35), 10, y);
      doc.text(user.email.substring(0, 45), 80, y);
      doc.text("CenLabs2026Password!", 155, y);
      y += 8;
    });

    doc.save(`Accesos_${groupName}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // ── Pantalla de Carga de Autenticación ──
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#023047] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="w-12 h-12 border-4 border-[#FB8500] border-t-transparent rounded-full animate-spin" />
          <p className="font-bold font-['Outfit']">Verificando credenciales de administrador...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-['Outfit']">
      
      {/* Topbar de Admin */}
      <div className="bg-[#023047] px-8 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-[#FB8500] rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm">Panel de Administración</p>
            <p className="text-[#8ECAE6]/60 text-xs">CEN Laboratorios — Acceso Restringido</p>
          </div>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          className="flex items-center gap-2 text-[#8ECAE6]/70 hover:text-white transition-colors text-sm font-bold"
        >
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-[#023047] mb-1 tracking-tight">Fábrica de Usuarios</h1>
          <p className="text-gray-500 font-medium">Pega una lista de nombres o sube un CSV y el sistema generará las cuentas automáticamente.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Lado Izquierdo */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Configuración */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm flex flex-wrap gap-6 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Grupo de Destino</label>
                <select 
                  value={selectedGroup} 
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-[#023047] focus:ring-2 focus:ring-[#219EBC] outline-none"
                >
                  <option value="">-- Sin grupo (Profesores) --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div className="w-40">
                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Rol</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-[#023047] focus:ring-2 focus:ring-[#219EBC] outline-none"
                >
                  <option value="alumno">Alumno</option>
                  <option value="profesor">Profesor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Desde CSV</label>
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-gray-100 text-[#023047] rounded-xl font-bold hover:bg-gray-200 transition-all">
                  <Upload className="w-4 h-4" /> Cargar Archivo
                </label>
              </div>
            </div>

            {/* Área de Texto */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-[#023047] flex items-center gap-2 text-lg">
                  <ClipboardList className="w-5 h-5 text-[#FB8500]" />
                  Pega la lista (un nombre por línea)
                </h2>
                {namesText && (
                  <button onClick={() => { setNamesText(""); setResults(null); }} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <textarea 
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder={"Juan Pérez García\nMaría Elena Sánchez\nRoberto Carlos Ruiz\n..."}
                className="w-full h-72 bg-gray-50 rounded-2xl p-6 font-mono text-sm text-[#023047] outline-none focus:ring-2 focus:ring-[#FB8500] border border-gray-100 resize-none"
              />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">
                  {namesText ? `${namesText.split('\n').filter(n => n.trim()).length} nombres detectados` : "Sin nombres aún"}
                </p>
                <button 
                  onClick={handleProcess}
                  disabled={isProcessing || !namesText.trim()}
                  className="px-8 py-4 bg-[#023047] hover:bg-[#219EBC] text-white font-black rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {isProcessing ? "Creando cuentas..." : "Generar Cuentas"}
                </button>
              </div>
            </div>
          </div>

          {/* Panel Derecho */}
          <div className="lg:col-span-4 space-y-6">
            
            <AnimatePresence>
              {results && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-[#023047] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-14 w-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-400/30">
                        <FileText className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl">¡Alta Exitosa!</h3>
                        <p className="text-white/50 text-xs">{results.success.length} cuentas creadas</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6 p-4 bg-white/5 rounded-2xl">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Exitosas</span>
                        <span className="font-black text-emerald-400">{results.success.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Con error</span>
                        <span className="font-black text-red-400">{results.errors.length}</span>
                      </div>
                      {results.errors.length > 0 && (
                        <p className="text-[10px] text-red-300/70 mt-1">Posible causa: los correos ya existen en el sistema.</p>
                      )}
                    </div>
                    
                    <button onClick={downloadReport}
                      className="w-full py-4 bg-[#FB8500] hover:bg-[#FFB703] text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all"
                    >
                      <Download className="w-5 h-5" /> Descargar PDF de Accesos
                    </button>
                  </div>
                  <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#FB8500] opacity-10 blur-3xl rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm">
              <h3 className="font-black text-[#023047] mb-5 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-[#219EBC]" /> Instrucciones
              </h3>
              <div className="space-y-5">
                {[
                  ["1", "Elige el **Grupo** y **Rol** de los usuarios a crear."],
                  ["2", "Pega los nombres uno por línea, o carga un archivo **CSV** (primera columna = nombres)."],
                  ["3", "Haz clic en **Generar Cuentas** y espera."],
                  ["4", "Descarga el **PDF** con correos y contraseñas para entregarlo a la escuela."],
                ].map(([num, text]) => (
                  <div key={num} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-blue-50 text-[#219EBC] flex items-center justify-center font-black text-xs flex-shrink-0">{num}</div>
                    <p className="text-xs text-gray-500 font-medium pt-0.5">{text.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium">
                  <strong>Contraseña por defecto:</strong> CenLabs2026Password!<br/>
                  <strong>Dominio:</strong> @cenlaboratorios.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
