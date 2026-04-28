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

  useEffect(() => {
    // Solo sincronizar si el usuario está autenticado y estamos en un simulador
    if (!user || !simId) return;

    const performSync = async () => {
      setSyncStatus('pending');
      console.log('[SyncManager] Iniciando sincronización...');

      const intentoData: Partial<Intento> = {
        id_alumno: user.id,
        sim_id: simId,
        score: score,
        total_time_seconds: timer,
        last_step: pasoActual,
        bitacora_data: bitacoraData,
        status: 'in_progress', // El status se cambia a 'completed' solo al finalizar la práctica
      };

      // Si tenemos un ID previo (para editar el mismo intento), lo incluimos
      // NOTA: El esquema propuesto usa un UNIQUE CONSTRAINT (id_alumno, sim_id, status)
      // por lo que el upsert de Supabase encontrará la fila correcta sin necesidad del UUID exacto si el status es 'in_progress'.

      const { data, error } = await syncIntento(intentoData);

      if (error) {
        console.error('[SyncManager] Error de sincronización:', error);
        setSyncStatus('error');
      } else {
        console.log('[SyncManager] Sincronización exitosa.');
        if (data && data[0] && !currentIntentoId) {
          setCurrentIntentoId(data[0].id);
        }
        setSyncStatus('synced');
      }
    };

    // Debounce de 30 segundos según arquitectura propuesta (o 5s para pruebas rápidas)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    syncTimeoutRef.current = setTimeout(() => {
      performSync();
    }, 30000); 

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [score, timer, pasoActual, bitacoraData, user, simId]);

  return null; // Componente invisible
}
