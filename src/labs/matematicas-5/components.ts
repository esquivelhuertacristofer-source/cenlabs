'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('@/components/PilotoTrigonometria'), { ssr: false, loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraTrigonometria'), { ssr: false, loading: Loader });
