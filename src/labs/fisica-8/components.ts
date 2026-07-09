'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('@/components/PilotoLeyOhm'), { ssr: false, loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraLeyOhm'), { ssr: false, loading: Loader });
