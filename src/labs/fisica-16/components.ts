'use client';
import dynamic from 'next/dynamic';
import {Loader} from '../_loader';
export const Piloto=dynamic(()=>import('./Piloto'),{ssr:false,loading:Loader});
export const Bitacora=dynamic(()=>import('./Bitacora'),{ssr:false,loading:Loader});
