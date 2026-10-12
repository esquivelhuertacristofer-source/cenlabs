"use client";

import React, { useEffect, useRef, useState } from 'react';
import { audio } from '@/utils/audioEngine';
import { useSimuladorStore } from '@/store/simuladorStore';
import { calculateTotalMagnification } from '@/utils/opticEngine';
import { MUESTRAS_B1, desenfoqueB1, brilloEfectivoB1 } from '@/domain/biologia';
import type { MuestraB1, ObjetivoMagB1 } from '@/store/types';
import Microscopio3DScene from './simuladores/bio01/Microscopio3DScene';
import MicroscopioBanco from './simuladores/bio01/MicroscopioBanco';
import { campoUm } from './simuladores/bio01/muestras';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';
import { Camera, Search, Droplet, Lightbulb } from 'lucide-react';

const MUESTRAS: { valor: MuestraB1; texto: string }[] = [
  { valor: 'vegetal', texto: 'Elodea' },
  { valor: 'animal', texto: 'Mucosa bucal' },
  { valor: 'bacteria', texto: 'Yogur (Gram)' },
];
const OBJETIVOS: { valor: `${ObjetivoMagB1}`; texto: string }[] = [
  { valor: '4', texto: '4×' }, { valor: '10', texto: '10×' }, { valor: '40', texto: '40×' }, { valor: '100', texto: '100×' },
];

/** El 3D del microscopio sólo cabe si la escena tiene ancho; si no, se alterna con el ocular. */
const ANCHO_DOBLE = 560;

export default function PilotoMicroscopioVirtual({ onValidate }: { onValidate?: () => void }) {
  const microscopio = useSimuladorStore((s) => s.microscopio);
  const setMicroscopio = useSimuladorStore((s) => s.setMicroscopio);
  const tomarCaptura = useSimuladorStore((s) => s.tomarCaptura);
  const {
    muestra, objetivoMag, iluminacion, posicionX, posicionY, targetOrganelle, muestraObjetivo,
    enfoqueMacro, enfoqueMicro, enfoqueZ, aceiteInmersionAplicado, status,
  } = microscopio;

  const totalMag = calculateTotalMagnification(objetivoMag);
  // La nitidez y el brillo del visor salen de las MISMAS funciones que usa el validador.
  const blurPx = desenfoqueB1(microscopio);
  const brillo = brilloEfectivoB1(microscopio);

  const analizar = () => { audio?.playLoading(); onValidate?.(); };
  const capturar = () => {
    tomarCaptura(`/assets/bio/${muestra}_${objetivoMag}x.webp`);
    audio?.playPop();
  };

  // ancho de la escena: decide si caben ocular y microscopio lado a lado
  const refEscena = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(720);
  const [vista, setVista] = useState<'ocular' | 'microscopio'>('ocular');
  useEffect(() => {
    const el = refEscena.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const doble = ancho >= ANCHO_DOBLE;

  const ocular = (
    <Microscopio3DScene
      muestra={muestra} objetivoMag={objetivoMag} posicionX={posicionX} posicionY={posicionY}
      desenfoque={blurPx} brillo={brillo} lechoso={objetivoMag === 100 && !aceiteInmersionAplicado}
    />
  );
  const banco = (
    <MicroscopioBanco
      muestra={muestra} objetivoMag={objetivoMag} enfoqueMacro={enfoqueMacro} enfoqueMicro={enfoqueMicro} enfoqueZ={enfoqueZ}
      posicionX={posicionX} posicionY={posicionY} iluminacion={iluminacion} aceite={aceiteInmersionAplicado}
    />
  );

  const escena = (
    <div ref={refEscena} className="flex h-full w-full bg-[#08090c]">
      {doble ? (
        <>
          <div className="relative h-full min-w-0 flex-[1.55]">{ocular}</div>
          <div className="relative h-full min-w-0 flex-1 border-l border-white/10">{banco}</div>
        </>
      ) : (
        <div className="relative h-full w-full">
          {vista === 'ocular' ? ocular : banco}
          <button
            type="button"
            onClick={() => setVista(vista === 'ocular' ? 'microscopio' : 'ocular')}
            className="absolute bottom-2 right-2 rounded-lg border border-white/15 bg-[#0f1a2b]/90 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-[#219EBC] hover:text-white"
          >
            {vista === 'ocular' ? 'Ver microscopio' : 'Ver ocular'}
          </button>
        </div>
      )}
    </div>
  );

  const barra = (
    <>
      <Lectura etiqueta="Localiza" valor={targetOrganelle} acento />
      <Lectura etiqueta="Preparación pedida" valor={MUESTRAS_B1[muestraObjetivo]} />
      <Lectura etiqueta="En la platina" valor={MUESTRAS_B1[muestra]} />
      <Lectura etiqueta="Aumento total" valor={`${totalMag}×`} />
      <Lectura etiqueta="Campo" valor={`⌀ ${campoUm(objetivoMag)} µm`} />
      {status === 'success' && <Lectura etiqueta="Resultado" valor={`Identificada: ${targetOrganelle}`} acento />}
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2.5">
      <GrupoControles>
        <Segmentado etiqueta="Preparación en la platina" opciones={MUESTRAS} valor={muestra}
          onChange={(v) => { audio?.playPop(); setMicroscopio({ muestra: v }); }} />
        <Segmentado etiqueta="Revólver (objetivo)" opciones={OBJETIVOS} valor={`${objetivoMag}` as `${ObjetivoMagB1}`}
          onChange={(v) => { audio?.playPop(); setMicroscopio({ objetivoMag: Number(v) as ObjetivoMagB1 }); }} />
        <BotonLab variante={aceiteInmersionAplicado ? 'acento' : 'secundario'}
          onClick={() => { audio?.playPop(); setMicroscopio({ aceiteInmersionAplicado: !aceiteInmersionAplicado }); }}
          title="El objetivo de 100× es de inmersión">
          <Droplet size={14} /> {aceiteInmersionAplicado ? 'Aceite aplicado' : 'Aplicar aceite de inmersión'}
        </BotonLab>
        <BotonLab onClick={analizar}><Search size={14} /> Analizar imagen</BotonLab>
        <BotonLab variante="secundario" onClick={capturar}><Camera size={14} /> Capturar</BotonLab>
      </GrupoControles>
      <GrupoControles>
        <Deslizador etiqueta="Macrométrico" valor={enfoqueMacro} min={0} max={100} paso={1} onChange={(v) => setMicroscopio({ enfoqueMacro: v })} />
        <Deslizador etiqueta="Micrométrico" valor={enfoqueMicro} min={0} max={10} paso={0.1} onChange={(v) => setMicroscopio({ enfoqueMicro: v })} />
        <Deslizador etiqueta="Platina X" valor={posicionX} min={-500} max={500} paso={5} onChange={(v) => setMicroscopio({ posicionX: v })} />
        <Deslizador etiqueta="Platina Y" valor={posicionY} min={-500} max={500} paso={5} onChange={(v) => setMicroscopio({ posicionY: v })} />
        <Deslizador etiqueta="Lámpara" valor={iluminacion} min={0} max={100} paso={1} unidad="%" onChange={(v) => setMicroscopio({ iluminacion: v })} />
      </GrupoControles>
    </div>
  );

  const lateral = (
    <div className="space-y-3 text-slate-300">
      <p className="flex gap-2"><Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-300" />
        Empieza con 4× para localizar la muestra y sube de aumento.</p>
      <p>A mayor aumento la imagen se oscurece y la profundidad de campo se reduce: ajusta la lámpara y el micrométrico.</p>
      <p>El objetivo de 100× trabaja sumergido en aceite: sin él la imagen pierde resolución.</p>
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barra} controles={controles} panelLateral={lateral} tituloPanel="Guía" />;
}
