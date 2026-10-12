'use client';
/**
 * _kit/texto.tsx — texto 3D SIN red: etiquetas dibujadas en lienzo.
 *
 * Por qué no <Text> de drei: troika (0.52) no lee woff2 —la única Outfit local que
 * hay— y, cuando a la fuente le falta un glifo, descarga fuentes de respaldo de un
 * CDN. En escuelas con filtro de red eso es texto que no aparece.
 *
 * `Etiqueta`: texto con mini-formato matemático:  x^2  x^{10}  v_0  v_{max}
 * (superíndice/subíndice), y `*texto*` en cursiva (variables).
 * Las texturas se cachean por contenido+estilo y se comparten con conteo de
 * referencias (cien marcas "5" de un eje usan UNA textura).
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { familiaTexto, useVersionFuentes, crearLienzo, texturaDeLienzo, rectRed } from './texturas';
import { analizarFormato, type Tramo } from './calculos';

export interface EstiloEtiqueta {
  color?: string;
  fondo?: string | null;      // color de la placa; null = sin placa
  borde?: string | null;
  peso?: 400 | 500 | 600 | 700;
  cursiva?: boolean;
}

const PX = 96; // altura de la línea en el lienzo (px)

interface EntradaCache { tex: THREE.CanvasTexture; aspecto: number; refs: number; mat: Map<string, THREE.Material> }
const cache = new Map<string, EntradaCache>();

function dibujarEtiqueta(texto: string, e: Required<EstiloEtiqueta>): { canvas: HTMLCanvasElement; aspecto: number } {
  const fam = familiaTexto();
  const tramos = analizarFormato(texto);
  const medir = crearLienzo(4, 4).getContext('2d')!;
  const fuente = (tr: Tramo) => `${tr.cursiva || e.cursiva ? 'italic ' : ''}${e.peso} ${tr.nivel ? PX * 0.62 : PX}px ${fam}`;
  let ancho = 0;
  for (const tr of tramos) { medir.font = fuente(tr); ancho += medir.measureText(tr.t).width; }
  const padX = e.fondo ? PX * 0.32 : PX * 0.08, padY = e.fondo ? PX * 0.18 : PX * 0.06;
  const W = Math.ceil(ancho + padX * 2), H = Math.ceil(PX * 1.32 + padY * 2);
  const c = crearLienzo(W, H);
  const ctx = c.getContext('2d')!;
  if (e.fondo) {
    ctx.fillStyle = e.fondo;
    rectRed(ctx, 1, 1, W - 2, H - 2, Math.min(H * 0.3, 26)); ctx.fill();
    if (e.borde) { ctx.lineWidth = 3; ctx.strokeStyle = e.borde; ctx.stroke(); }
  }
  let x = padX;
  const base = padY + PX * 1.0;
  for (const tr of tramos) {
    ctx.font = fuente(tr);
    ctx.fillStyle = e.color;
    ctx.textBaseline = 'alphabetic';
    const dy = tr.nivel === 1 ? -PX * 0.38 : tr.nivel === -1 ? PX * 0.2 : 0;
    ctx.fillText(tr.t, x, base + dy);
    x += ctx.measureText(tr.t).width;
  }
  return { canvas: c, aspecto: W / H };
}

function useTexturaEtiqueta(texto: string, estilo: EstiloEtiqueta) {
  const vf = useVersionFuentes();
  const e: Required<EstiloEtiqueta> = {
    color: estilo.color ?? '#10212b', fondo: estilo.fondo === undefined ? null : estilo.fondo,
    borde: estilo.borde ?? null, peso: estilo.peso ?? 600, cursiva: estilo.cursiva ?? false,
  };
  const clave = [texto, e.color, e.fondo, e.borde, e.peso, e.cursiva, vf].join('|');
  const entrada = useMemo(() => {
    if (typeof document === 'undefined') return null;
    let en = cache.get(clave);
    if (!en) {
      const { canvas, aspecto } = dibujarEtiqueta(texto, e);
      en = { tex: texturaDeLienzo(canvas), aspecto, refs: 0, mat: new Map() };
      cache.set(clave, en);
    }
    en.refs++;
    return en;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  useEffect(() => () => {
    if (!entrada) return;
    entrada.refs--;
    if (entrada.refs <= 0) {
      // se libera en diferido: un remount inmediato (StrictMode, HMR) la reutiliza
      setTimeout(() => {
        if (entrada.refs <= 0 && cache.get(clave) === entrada) {
          entrada.tex.dispose(); entrada.mat.forEach((m) => m.dispose()); cache.delete(clave);
        }
      }, 2000);
    }
  }, [entrada, clave]);
  return entrada;
}

export interface EtiquetaProps extends EstiloEtiqueta {
  texto: string;
  position?: [number, number, number];
  /** altura del texto en u */
  tamano?: number;
  /** 'sprite' mira siempre a la cámara; 'plano' queda fijo (rotable con rotation) */
  modo?: 'sprite' | 'plano';
  /** punto de anclaje: [0,0] = esquina inferior izquierda, [0.5,0.5] = centro */
  ancla?: [number, number];
  /** se dibuja por encima de todo (no lo tapan las piezas) */
  siempreVisible?: boolean;
  rotation?: [number, number, number];
  renderOrder?: number;
  opacidad?: number;
}

const planoUnidad = new THREE.PlaneGeometry(1, 1);

/** Etiqueta de texto (lienzo) — sprite o plano. */
export function Etiqueta({
  texto, position, tamano = 0.2, modo = 'sprite', ancla = [0.5, 0.5], siempreVisible = false,
  rotation, renderOrder = 10, opacidad = 1, ...estilo
}: EtiquetaProps) {
  const en = useTexturaEtiqueta(texto, estilo);
  const claveMat = `${modo}|${siempreVisible}|${opacidad}`;
  const mat = useMemo(() => {
    if (!en) return null;
    let m = en.mat.get(claveMat);
    if (!m) {
      m = modo === 'sprite'
        ? new THREE.SpriteMaterial({ map: en.tex, transparent: true, depthTest: !siempreVisible, depthWrite: false, opacity: opacidad, toneMapped: false })
        : new THREE.MeshBasicMaterial({ map: en.tex, transparent: true, depthTest: !siempreVisible, depthWrite: false, opacity: opacidad, toneMapped: false, side: THREE.DoubleSide });
      en.mat.set(claveMat, m);
    }
    return m;
  }, [en, claveMat, modo, siempreVisible, opacidad]);
  if (!en || !mat) return null;
  const alto = tamano * 1.32 * (estilo.fondo ? 1.25 : 1.08);
  const ancho = alto * en.aspecto;
  if (modo === 'sprite') {
    return (
      <sprite position={position} scale={[ancho, alto, 1]} center={ancla} material={mat as THREE.SpriteMaterial} renderOrder={renderOrder} />
    );
  }
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={planoUnidad} material={mat} scale={[ancho, alto, 1]} position={[(0.5 - ancla[0]) * ancho, (0.5 - ancla[1]) * alto, 0]} renderOrder={renderOrder} />
    </group>
  );
}

/** Alias semántico para matemáticas (cursiva por defecto en letras sueltas). */
export function EtiquetaMath(props: EtiquetaProps) {
  return <Etiqueta peso={500} color="#f4f7f8" {...props} />;
}

/** Placa plana con texto (para rotular piezas: "HCl 0,1 M"). */
export function Rotulo(props: Omit<EtiquetaProps, 'modo'>) {
  return <Etiqueta modo="plano" fondo="#ffffff" color="#1b2a33" peso={600} {...props} />;
}

export default Etiqueta;
