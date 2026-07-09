'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('@/components/PilotoPenduloSimple'), { ssr: false, loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraPenduloSimple'), { ssr: false, loading: Loader });
