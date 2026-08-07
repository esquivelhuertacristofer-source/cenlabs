"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import RightPanel from "@/components/RightPanel";
import { useSimuladorStore } from '@/store/simuladorStore';
import { supabase } from '@/lib/supabase-browser';
import { getCurrentProfile } from '@/lib/supabase-helpers';

export default function Home() {
  const router = useRouter();
  const setUser = useSimuladorStore((s) => s.setUser);
  const setSession = useSimuladorStore((s) => s.setSession);
  // `null` = ya podemos pintar el dashboard. Cualquier otro valor es el aviso
  // que ve el usuario mientras esperamos, y tiene que decir la verdad de lo que
  // esta pasando: no todos los que llegan aqui son profesores.
  const [espera, setEspera] = useState<string | null>('Validando tus credenciales...');
  const yaVerifico = useRef(false);

  useEffect(() => {
    // Un solo intento. El efecto escribe en el store (setUser) y el store es
    // dependencia del componente: sin este cerrojo se relanzaba a si mismo y
    // volvia a pedirle la sesion a Supabase en mitad de la redirección.
    if (yaVerifico.current) return;
    yaVerifico.current = true;

    const initAuth = async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (!authUser || authError) {
        setEspera('Necesitas iniciar sesión. Te llevamos al acceso...');
        router.push("/login");
        return;
      }

      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      if (supabaseSession) setSession(supabaseSession);
      let currentUser = useSimuladorStore.getState().user;
      if (!currentUser) {
        currentUser = await getCurrentProfile();
        if (currentUser) {
          setUser(currentUser);
        }
      }

      // --- RBAC: Profesores y Admins en el Dashboard Raíz ---
      if (currentUser && currentUser.role !== 'profesor') {
        // El aviso se cambia ANTES de redirigir: la navegación del lado del
        // cliente puede tardar segundos (en dev, compilar la ruta destino), y
        // durante todo ese rato la pantalla se queda en este componente.
        if (currentUser.role === 'admin') {
          setEspera('Abriendo el panel de administración...');
          router.push("/admin/usuarios"); // Admin va a su panel
        } else if (currentUser.role === 'alumno') {
          setEspera('Abriendo tu panel de alumno...');
          router.push("/alumno/inicio");
        } else {
          setEspera('Tu cuenta no tiene un rol asignado. Te llevamos al acceso...');
          router.push("/login");
        }
        return;
      }

      setEspera(null);
    };

    initAuth();
  }, [setUser, setSession, router]);

  if (espera !== null) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FB8500] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#023047] font-bold font-['Outfit']">{espera}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr_340px] font-['Outfit'] animate-in fade-in duration-700">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="col-start-2 overflow-y-auto bg-dash-bg p-6">
        <MainContent />
      </main>

      {/* Right Panel */}
      <aside className="overflow-y-auto border-l border-dash-border bg-dash-bg p-5">
        <RightPanel />
      </aside>
    </div>
  );
}
