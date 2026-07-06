'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('@/components/PilotoRiemann'), { loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraRiemann'), { loading: Loader });
