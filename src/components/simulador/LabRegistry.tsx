"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Loader = () => (
  <div className="flex h-full w-full items-center justify-center bg-slate-50/50 animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#219EBC] border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando...</span>
    </div>
  </div>
);

// --- PILOTOS ---
export const PILOTO_REGISTRY: Record<string, any> = {
  'quimica-1': dynamic(() => import('@/components/PilotoConstruccionAtomica'), { loading: Loader }),
  'quimica-2': dynamic(() => import('@/components/PilotoLeyesGases'), { loading: Loader }),
  'quimica-3': dynamic(() => import('@/components/PilotoBalanceoEcuaciones'), { loading: Loader }),
  'quimica-4': dynamic(() => import('@/components/PilotoReactivoLimitante'), { loading: Loader }),
  'quimica-5': dynamic(() => import('@/components/PilotoPreparacionSoluciones'), { loading: Loader }),
  'quimica-6': dynamic(() => import('@/components/PilotoSolubilidadCristalizacion'), { loading: Loader }),
  'quimica-7': dynamic(() => import('@/components/PilotoTitulacionAcidoBase'), { loading: Loader }),
  'quimica-8': dynamic(() => import('@/components/PilotoEquilibrioQuimico'), { loading: Loader }),
  'quimica-9': dynamic(() => import('@/components/PilotoCeldasGalvanicas'), { loading: Loader }),
  'quimica-10': dynamic(() => import('@/components/PilotoDestilacionFraccionada'), { loading: Loader }),
  
  'fisica-1': dynamic(() => import('@/components/PilotoTiroParabolico'), { loading: Loader }),
  'fisica-2': dynamic(() => import('@/components/PilotoPlanoInclinado'), { loading: Loader }),
  'fisica-3': dynamic(() => import('@/components/PilotoPenduloSimple'), { loading: Loader }),
  'fisica-4': dynamic(() => import('@/components/PilotoLeyHooke'), { loading: Loader }),
  'fisica-5': dynamic(() => import('@/components/PilotoPrensaHidraulica'), { loading: Loader }),
  'fisica-6': dynamic(() => import('@/components/PilotoArquimedes'), { loading: Loader }),
  'fisica-7': dynamic(() => import('@/components/PilotoDilatacionTermica'), { loading: Loader }),
  'fisica-8': dynamic(() => import('@/components/PilotoLeyOhm'), { loading: Loader }),
  'fisica-9': dynamic(() => import('@/components/PilotoElectrostatica'), { loading: Loader }),
  'fisica-10': dynamic(() => import('@/components/PilotoMotorElectrico'), { loading: Loader }),

  'matematicas-1': dynamic(() => import('@/components/PilotoCuadraticas'), { loading: Loader }),
  'matematicas-2': dynamic(() => import('@/components/PilotoSistemas2x2'), { loading: Loader }),
  'matematicas-3': dynamic(() => import('@/components/PilotoRichter'), { loading: Loader }),
  'matematicas-4': dynamic(() => import('@/components/PilotoPitagoras'), { loading: Loader }),
  'matematicas-5': dynamic(() => import('@/components/PilotoTrigonometria'), { loading: Loader }),
  'matematicas-6': dynamic(() => import('@/components/PilotoTransformaciones'), { loading: Loader }),
  'matematicas-7': dynamic(() => import('@/components/PilotoSnell'), { loading: Loader }),
  'matematicas-8': dynamic(() => import('@/components/PilotoDerivadas'), { loading: Loader }),
  'matematicas-9': dynamic(() => import('@/components/PilotoRiemann'), { loading: Loader }),
  'matematicas-10': dynamic(() => import('@/components/PilotoGalton'), { loading: Loader }),

  'biologia-1': dynamic(() => import('@/components/PilotoMicroscopioVirtual'), { loading: Loader }),
  'biologia-2': dynamic(() => import('@/components/PilotoTransporteCelular'), { loading: Loader }),
  'biologia-3': dynamic(() => import('@/components/PilotoSintesisProteinas'), { loading: Loader }),
  'biologia-4': dynamic(() => import('@/components/PilotoFotosintesis'), { loading: Loader }),
  'biologia-5': dynamic(() => import('@/components/PilotoGenetica'), { loading: Loader }),
  'biologia-6': dynamic(() => import('@/components/PilotoSeleccionNatural'), { loading: Loader }),
  'biologia-7': dynamic(() => import('@/components/PilotoSistemaNervioso'), { loading: Loader }),
  'biologia-8': dynamic(() => import('@/components/PilotoElectrocardiograma'), { loading: Loader }),
  'biologia-9': dynamic(() => import('@/components/PilotoSistemaDigestivo'), { loading: Loader }),
  'biologia-10': dynamic(() => import('@/components/PilotoPoblaciones'), { loading: Loader }),
};

// --- BITÁCORAS ---
export const BITACORA_REGISTRY: Record<string, any> = {
  'quimica-1': dynamic(() => import('@/components/bitacoras/BitacoraConstruccionAtomica'), { loading: Loader }),
  'quimica-2': dynamic(() => import('@/components/bitacoras/BitacoraLeyesGases'), { loading: Loader }),
  'quimica-3': dynamic(() => import('@/components/bitacoras/BitacoraBalanceoEcuaciones'), { loading: Loader }),
  'quimica-4': dynamic(() => import('@/components/bitacoras/BitacoraReactivoLimitante'), { loading: Loader }),
  'quimica-5': dynamic(() => import('@/components/bitacoras/BitacoraPreparacionSoluciones'), { loading: Loader }),
  'quimica-6': dynamic(() => import('@/components/bitacoras/BitacoraSolubilidadCristalizacion'), { loading: Loader }),
  'quimica-7': dynamic(() => import('@/components/bitacoras/BitacoraTitulacionAcidoBase'), { loading: Loader }),
  'quimica-8': dynamic(() => import('@/components/bitacoras/BitacoraEquilibrioQuimico'), { loading: Loader }),
  'quimica-9': dynamic(() => import('@/components/bitacoras/BitacoraCeldasGalvanicas'), { loading: Loader }),
  'quimica-10': dynamic(() => import('@/components/bitacoras/BitacoraDestilacion'), { loading: Loader }),

  'fisica-1': dynamic(() => import('@/components/bitacoras/BitacoraTiroParabolico'), { loading: Loader }),
  'fisica-2': dynamic(() => import('@/components/bitacoras/BitacoraPlanoInclinado'), { loading: Loader }),
  'fisica-3': dynamic(() => import('@/components/bitacoras/BitacoraPenduloSimple'), { loading: Loader }),
  'fisica-4': dynamic(() => import('@/components/bitacoras/BitacoraLeyHooke'), { loading: Loader }),
  'fisica-5': dynamic(() => import('@/components/bitacoras/BitacoraPrensaHidraulica'), { loading: () => null }),
  'fisica-6': dynamic(() => import('@/components/bitacoras/BitacoraArquimedes'), { loading: Loader }),
  'fisica-7': dynamic(() => import('@/components/bitacoras/BitacoraDilatacionTermica'), { loading: Loader }),
  'fisica-8': dynamic(() => import('@/components/bitacoras/BitacoraLeyOhm'), { loading: Loader }),
  'fisica-9': dynamic(() => import('@/components/bitacoras/BitacoraElectrostatica'), { loading: Loader }),
  'fisica-10': dynamic(() => import('@/components/bitacoras/BitacoraMotorElectrico'), { loading: Loader }),

  'matematicas-1': dynamic(() => import('@/components/bitacoras/BitacoraCuadraticas'), { loading: Loader }),
  'matematicas-2': dynamic(() => import('@/components/bitacoras/BitacoraSistemas2x2'), { loading: Loader }),
  'matematicas-3': dynamic(() => import('@/components/bitacoras/BitacoraRichter'), { loading: Loader }),
  'matematicas-4': dynamic(() => import('@/components/bitacoras/BitacoraPitagoras'), { loading: Loader }),
  'matematicas-5': dynamic(() => import('@/components/bitacoras/BitacoraTrigonometria'), { loading: Loader }),
  'matematicas-6': dynamic(() => import('@/components/bitacoras/BitacoraTransformaciones'), { loading: Loader }),
  'matematicas-7': dynamic(() => import('@/components/bitacoras/BitacoraSnell'), { loading: Loader }),
  'matematicas-8': dynamic(() => import('@/components/bitacoras/BitacoraDerivadas'), { loading: Loader }),
  'matematicas-9': dynamic(() => import('@/components/bitacoras/BitacoraRiemann'), { loading: Loader }),
  'matematicas-10': dynamic(() => import('@/components/bitacoras/BitacoraGalton'), { loading: Loader }),

  'biologia-1': dynamic(() => import('@/components/bitacoras/BitacoraMicroscopio'), { loading: Loader }),
  'biologia-2': dynamic(() => import('@/components/bitacoras/BitacoraTransporte'), { loading: Loader }),
  'biologia-3': dynamic(() => import('@/components/bitacoras/BitacoraSintesis'), { loading: Loader }),
  'biologia-4': dynamic(() => import('@/components/bitacoras/BitacoraFotosintesis'), { loading: Loader }),
  'biologia-5': dynamic(() => import('@/components/bitacoras/BitacoraGenetica'), { loading: Loader }),
  'biologia-6': dynamic(() => import('@/components/bitacoras/BitacoraSeleccion'), { loading: Loader }),
  'biologia-7': dynamic(() => import('@/components/bitacoras/BitacoraSistemaNervioso'), { loading: Loader }),
  'biologia-8': dynamic(() => import('@/components/bitacoras/BitacoraElectrocardiograma'), { loading: Loader }),
  'biologia-9': dynamic(() => import('@/components/bitacoras/BitacoraSistemaDigestivo'), { loading: Loader }),
  'biologia-10': dynamic(() => import('@/components/bitacoras/BitacoraPoblaciones'), { loading: Loader }),
};
