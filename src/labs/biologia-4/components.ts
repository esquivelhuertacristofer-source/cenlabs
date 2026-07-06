'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('@/components/PilotoFotosintesis'), { loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraFotosintesis'), { loading: Loader });
