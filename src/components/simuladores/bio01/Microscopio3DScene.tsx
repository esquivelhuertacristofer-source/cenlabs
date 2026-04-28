"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import LivingCellScene from './LivingCellScene';

export default function Microscopio3DScene(props: any) {
  const { isDarkMode, iluminacion, enfoqueZ, objetivoMag, posicionX, posicionY, muestra } = props;

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={35} />
        
        <LivingCellScene 
          enfoque={enfoqueZ} 
          iluminacion={iluminacion} 
          isDarkMode={isDarkMode} 
          magnificacion={objetivoMag} 
          muestra={muestra || 'vegetal'}
          posicionX={posicionX}
          posicionY={posicionY}
        />
        
      </Canvas>

      <div className="absolute inset-0 z-50 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,1)] border-[40px] border-black rounded-full" />
    </div>
  );
}
