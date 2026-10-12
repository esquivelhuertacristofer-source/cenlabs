"use client";

/**
 * Vista por el OCULAR del microscopio: campo circular con la preparación.
 * El desenfoque y el brillo vienen del DOMINIO (desenfoqueB1, brilloEfectivoB1):
 * aquí sólo se aplican, igual que lo haría el ajuste de foco y el reóstato.
 */
import React, { useEffect, useRef, useState } from 'react';
import CampoOcular, { type Muestra } from './CampoOcular';

interface Props {
  muestra: Muestra;
  objetivoMag: number;
  posicionX: number;
  posicionY: number;
  /** px de CSS (desenfoqueB1) */
  desenfoque: number;
  /** brillo efectivo del dominio (brilloEfectivoB1): 60 = imagen normal */
  brillo: number;
  /** objetivo de 100x sin aceite: la imagen se vuelve lechosa */
  lechoso?: boolean;
}

export default function Microscopio3DScene({ muestra, objetivoMag, posicionX, posicionY, desenfoque, brillo, lechoso = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [D, setD] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setD(Math.floor(Math.min(e.contentRect.width, e.contentRect.height) - 6)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative flex h-full w-full items-center justify-center bg-[#08090c]">
      {D > 40 && (
        <div className="relative shrink-0 overflow-hidden rounded-full" style={{ width: D, height: D, boxShadow: '0 0 0 5px #1c1f24, 0 0 0 6px #3a3f46' }}>
          <div className="absolute" style={{ inset: '-5%', filter: `blur(${desenfoque.toFixed(2)}px) brightness(${Math.max(0.05, brillo / 60).toFixed(2)})` }}>
            <CampoOcular muestra={muestra} mag={objetivoMag} posX={posicionX} posY={posicionY} />
          </div>
          {lechoso && <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.22), rgba(255,255,255,0.10))' }} />}
          {/* viñeteo del ocular: la luz cae hacia el borde del campo */}
          <div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 ' + Math.round(D * 0.12) + 'px ' + Math.round(D * 0.03) + 'px rgba(0,0,0,0.55)' }} />
        </div>
      )}
    </div>
  );
}
