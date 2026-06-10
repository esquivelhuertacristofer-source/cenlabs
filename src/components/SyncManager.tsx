'use client';

import { useEffect, useRef } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { Intento } from '@/lib/supabase-helpers';
import { syncIntentoServer } from '@/app/actions/auth';
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
    setCurrentIntentoId,
  } = useSimuladorStore(
    useShallow(state => ({
      user:               state.user,
      score:              state.score,
      timer:              state.timer,
      pasoActual:         state.pasoActual,
      bitacoraData:       state.bitacoraData,
      syncStatus:         state.syncStatus,
      setSyncStatus:      state.setSyncStatus,
      currentIntentoId:   state.currentIntentoId,
      setCurrentIntentoId: state.setCurrentIntentoId,
    }))
  );

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
      id_alumno:          state.user.id,
      sim_id:             state.simId,
      score:              state.score,
      total_time_seconds: state.timer,
      last_step:          state.pasoActual,
      bitacora_data:      state.bitacoraData,
      status:             'in_progress',
    };

    try {
      const result = await syncIntentoServer(intentoData);
      if (!result.success) {
        if (!isClosing) setSyncStatus('error');
        console.error('[SyncManager] Error de sincronización:', result.error);
      } else {
        const data = result.data;
        if (!isClosing) {
          setSyncStatus('synced');
          if (data && data[0] && !currentIntentoId) {
            setCurrentIntentoId(data[0].id);
          }
        }
      }
    } catch {
      if (!isClosing) setSyncStatus('error');
    }
  };

  // Debounce de 3s sobre cambios de contenido académico.
  // timer se excluye a propósito: cambia cada segundo y reiniciaría el debounce
  // indefinidamente, impidiendo que el autosave llegue a dispararse.
  useEffect(() => {
    if (!user || !simId) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      performSync();
    }, 3000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, pasoActual, bitacoraData, user, simId]);

  // Respaldo para cierre de pestaña
  useEffect(() => {
    const handleUnload = () => performSync(true);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      performSync(true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
