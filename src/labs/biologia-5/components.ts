'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('@/components/PilotoGenetica'), { loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraGenetica'), { loading: Loader });
