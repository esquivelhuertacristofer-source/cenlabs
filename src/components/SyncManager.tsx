/**
 * ============================================
 * SYNC MANAGER - CEN LABS
 * ============================================
 * Maneja la sincronización automática entre el estado local
 * de Zustand y el backend de Supabase.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { syncIntento, Intento } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export function SyncManager() {
  const params = useParams();
  const simId = params.id as string;
  
  const { 
    user, 
    score, 
    timer, 
    pasoActual, 
    bitacoraData, 
    syncStatus,
    setSyncStatus,
    currentIntentoId,
    setCurrentIntentoId
  } = useSimuladorStore();

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef({ user, score, timer, pasoActual, bitacoraData, simId });

  // Mantener referencia actualizada para el cleanup/unload
  useEffect(() => {
    stateRef.current = { user, score, timer, pasoActual, bitacoraData, simId };
  }, [user, score, timer, pasoActual, bitacoraData, simId]);

  const performSync = async (isClosing = false) => {
    const state = stateRef.current;
    if (!state.user || !state.simId) return;

    if (!isClosing) setSyncStatus('pending');

    const intentoData: Partial<Intento> = {
      id_alumno: state.user.id,
      sim_id: state.simId,
      score: state.score,
      total_time_seconds: state.timer,
      last_step: state.pasoActual,
      bitacora_data: state.bitacoraData,
      status: 'in_progress',
    };

    try {
      const { data, error } = await syncIntento(intentoData);
      if (error) {
        if (!isClosing) setSyncStatus('error');
        console.error('[SyncManager] Error:', error);
      } else {
        if (!isClosing) {
          setSyncStatus('synced');
          if (data && data[0] && !currentIntentoId) {
            setCurrentIntentoId(data[0].id);
          }
        }
      }
    } catch (e) {
      if (!isClosing) setSyncStatus('error');
    }
  };

  useEffect(() => {
    if (!user || !simId) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    syncTimeoutRef.current = setTimeout(() => {
      performSync();
    }, 3000); // Reducido a 3s para mayor reactividad

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [score, timer, pasoActual, bitacoraData, user, simId]);

  // Respaldo para cierre de pestaña
  useEffect(() => {
    const handleUnload = () => {
      // Intentar una última sincronización rápida (Fire and forget)
      performSync(true);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      performSync(true); // También al desmontar el componente (cambio de ruta)
    };
  }, []);

  return null;
}
