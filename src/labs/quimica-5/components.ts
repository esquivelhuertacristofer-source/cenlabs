'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('@/components/PilotoPreparacionSoluciones'), { loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraPreparacionSoluciones'), { loading: Loader });
