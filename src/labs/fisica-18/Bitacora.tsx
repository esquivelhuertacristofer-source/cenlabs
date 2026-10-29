'use client';
import React from 'react';
import Component from '@/components/ciencias/BitacoraCiencia';
import definition from '@/components/ciencias/definiciones/fisica-18';
export default function Bitacora(props:{onValidate?:()=>void}){return <Component definition={definition} {...props}/>;}
