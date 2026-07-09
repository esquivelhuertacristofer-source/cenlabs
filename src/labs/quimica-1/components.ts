'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../_loader';

export const Piloto = dynamic(() => import('@/components/PilotoConstruccionAtomica'), { ssr: false, loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraConstruccionAtomica'), { ssr: false, loading: Loader });
