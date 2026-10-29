'use client';
import React from 'react';
import Component from '@/components/ciencias/PilotoCiencia';
import definition from '@/components/ciencias/definiciones/quimica-13';
export default function Piloto(props:{onValidate?:()=>void}){return <Component definition={definition} {...props}/>;}
