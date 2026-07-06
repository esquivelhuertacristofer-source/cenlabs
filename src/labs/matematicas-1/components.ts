'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('@/components/PilotoCuadraticas'), { loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraCuadraticas'), { loading: Loader });
