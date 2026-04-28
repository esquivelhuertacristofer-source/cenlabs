"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import RightPanel from "@/components/RightPanel";
import { useSimuladorStore } from '@/store/simuladorStore';
import { supabase, getCurrentProfile } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const { user, setUser, setSession } = useSimuladorStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      if (!supabaseSession) {
        // Si no hay sesión, vamos al login
        router.push("/login");
        return;
      }

      setSession(supabaseSession);
      let currentUser = user;
      if (!user) {
        currentUser = await getCurrentProfile();
        if (currentUser) {
          setUser(currentUser);
        }
      }

      // --- RBAC: Profesores y Admins en el Dashboard Raíz ---
      if (currentUser && currentUser.role !== 'profesor') {
        if (currentUser.role === 'admin') {
          router.push("/admin/usuarios"); // Admin va a su panel
        } else if (currentUser.role === 'alumno') {
          router.push("/alumno/inicio");
        } else {
          router.push("/login");
        }
        return;
      }

      setIsLoading(false);
    };

    initAuth();
  }, [user, setUser, setSession, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FB8500] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#023047] font-bold font-['Outfit']">Validando credenciales docentes...</p>
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
