"use client";
/**
 * Q4 · Reactivo limitante — reactor de vidrio con dos dosificadores y colector (R3F + kit).
 *
 *   ANTES de validar (la escena NO conoce el limitante ni el exceso): cada dosificador
 *   muestra la masa cargada (lectura de instrumento) y su contenido; el reactor y el
 *   colector están vacíos.
 *   AL validar con éxito: los dosificadores se vacían en el reactor, las moléculas
 *   (bolas y varillas con geometría real) reaccionan, el reactivo limitante desaparece, el
 *   otro queda en el reactor como exceso y el producto cae al colector. Un cuenta
 *   molecular entero y consistente: los átomos se conservan.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { LabCanvas, EncuadrarCaja, SoporteUniversal, Aro, Etiqueta } from '../_kit';
import { MoleculasEnBandeja, type EspecieBandeja } from '../qmi03/moleculas';
import {
  Dosificador, TuboVidrio, Reactor, Colector, alturaConoEnRadio, PUERTOS, Y_FONDO, R_REACTOR, R_COLECTOR,
} from './piezas';

type V3 = [number, number, number];

const COLOR_A = '#3f9fc4';
const COLOR_B = '#d9a21b';
const POS_REACTOR: V3 = [-0.9, 0, 0];
const POS_COLECTOR: V3 = [3.7, 0, 0.75];
const X_TOLVA: [number, number] = [-4.0, 2.3];
const Z_VARILLA = -2.7;
const R_ARO = 0.4;
const Y_ARO = 5.1;
const Z_TOLVA = Z_VARILLA + 0.62 + R_ARO;     // centro del aro
const Y_BOQUILLA = Y_ARO + 0.0035 - alturaConoEnRadio(R_ARO);

interface Props {
  limitanteData: any;
  isRunning?: boolean;
}

/** Cuenta molecular entera y consistente (conserva los átomos) para dibujar la síntesis. */
function cuentaMolecular(reac: any, moles: number[], limIdx: number) {
  const c = reac.reactivos.map((r: any) => r.coef as number);
  const cp = reac.productos.map((p: any) => p.coef as number);
  const total = Math.max(1e-9, moles[0] + moles[1]);
  const k = 28 / total;
  const otro = 1 - limIdx;
  const xi = Math.max(1, Math.round((moles[limIdx] / c[limIdx]) * k)); // «extensión» en moléculas
  const N: number[] = [0, 0];
  N[limIdx] = c[limIdx] * xi;
  N[otro] = Math.min(46, Math.max(Math.round(moles[otro] * k), c[otro] * xi + 1));
  return { N, xi, c, cp };
}

function Montaje({ limitanteData }: Props) {
  const ld = limitanteData ?? {};
  const reac = ld.reacciones?.[ld.reaccionActual ?? 0] ?? ld.reacciones?.[0];
  const resuelto = ld.status === 'success';
  const masas: number[] = ld.inputMasses ?? [0, 0];

  // progreso de la síntesis (0 → 1): arranca al validar; si ya estaba resuelta al montar, queda al final
  const progreso = useRef(resuelto ? 1 : 0);
  const previa = useRef(resuelto);
  useEffect(() => {
    if (resuelto && !previa.current) progreso.current = 0;
    if (!resuelto) progreso.current = 0;
    previa.current = resuelto;
  }, [resuelto]);

  const fin = useMemo(() => {
    if (!resuelto || !reac || !ld.results || ld.results.limitingIdx < 0) return null;
    return cuentaMolecular(reac, ld.results.moles, ld.results.limitingIdx);
  }, [resuelto, reac, ld.results]);

  const [estado, setEstado] = useState({ nA: 0, nB: 0, prod: 0, drenado: 0, agitando: false });
  const ultimo = useRef('');
  useFrame((_, dtReal) => {
    const dt = Math.min(dtReal, 0.05);
    if (resuelto && progreso.current < 1) progreso.current = Math.min(1, progreso.current + dt / 2.6);
    const p = resuelto ? progreso.current : 0;
    let nA = 0, nB = 0, prod = 0;
    const drenado = Math.min(1, p / 0.5);
    if (fin && resuelto) {
      const { N, xi, c } = fin;
      const entra = Math.min(1, p / 0.5);
      const reaccionado = p <= 0.5 ? 0 : Math.floor(xi * Math.min(1, (p - 0.5) / 0.4) + 1e-9);
      const cant = (i: number) => Math.round(N[i] * entra) - (p <= 0.5 ? 0 : c[i] * reaccionado);
      nA = Math.max(0, cant(0)); nB = Math.max(0, cant(1));
      prod = reaccionado;
    }
    const agitando = resuelto && p < 0.95;
    const clave = `${nA}|${nB}|${prod}|${drenado.toFixed(2)}|${agitando}`;
    if (clave !== ultimo.current) { ultimo.current = clave; setEstado({ nA, nB, prod, drenado, agitando }); }
  });

  if (!reac) return null;
  const mx = Math.max(masas[0], masas[1], 1e-6);
  const nivel = (i: number) => Math.max(0.12, Math.min(1, masas[i] / (1.25 * mx))) * (1 - estado.drenado);
  const f = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : '—');

  const especiesReactor: EspecieBandeja[] = [
    { formula: reac.reactivos[0].formula, copias: estado.nA },
    { formula: reac.reactivos[1].formula, copias: estado.nB },
  ];
  const especiesColector: EspecieBandeja[] = reac.productos.map((p: any) => ({ formula: p.formula, copias: estado.prod * (fin?.cp[reac.productos.indexOf(p)] ?? 0) }));
  const puertoA: V3 = [POS_REACTOR[0] + PUERTOS[0][0], PUERTOS[0][1], 0];
  const puertoB: V3 = [POS_REACTOR[0] + PUERTOS[1][0], PUERTOS[1][1], 0];
  const bq = (i: number): V3 => [X_TOLVA[i], Y_BOQUILLA - 0.28, Z_TOLVA];
  const tuboA: V3[] = [bq(0), [X_TOLVA[0] + 0.2, bq(0)[1] - 0.18, Z_TOLVA + 0.2], [-2.6, 4.18, -0.55], [puertoA[0], 4.12, 0], [puertoA[0], 3.9, 0]];
  const tuboB: V3[] = [bq(1), [X_TOLVA[1] - 0.2, bq(1)[1] - 0.18, Z_TOLVA + 0.2], [0.9, 4.2, -0.55], [puertoB[0], 4.14, 0], [puertoB[0], 3.9, 0]];
  const salidaX = POS_REACTOR[0];
  const tuboSalida: V3[] = [[salidaX, 0.46, 0], [salidaX, 0.27, 0], [0.6, 0.27, 0.05], [2.2, 0.27, 0.35], [POS_COLECTOR[0] - 0.55, 0.62, POS_COLECTOR[2]], [POS_COLECTOR[0] - 0.55, 0.78, POS_COLECTOR[2]]];

  return (
    <group>
      {/* dosificadores sobre soportes universales con aro */}
      {[0, 1].map((i) => (
        <SoporteUniversal key={i} position={[X_TOLVA[i], 0, Z_VARILLA]} alturaVarilla={Y_ARO + 0.5}>
          <Aro altura={Y_ARO} diametro={R_ARO * 2}>
            <Dosificador
              position={[0, -alturaConoEnRadio(R_ARO), 0]}
              color={i === 0 ? COLOR_A : COLOR_B}
              nivel={nivel(i)}
              formula={reac.reactivos[i].formula}
              rotulo={i === 0 ? 'A' : 'B'}
              masa={`m = ${f(masas[i])} g`}
              abierta={resuelto && estado.drenado < 1 ? 1 : 0}
            />
          </Aro>
        </SoporteUniversal>
      ))}

      <TuboVidrio puntos={tuboA} />
      <TuboVidrio puntos={tuboB} />
      <TuboVidrio puntos={tuboSalida} radio={0.08} />

      <Reactor position={POS_REACTOR} agitando={estado.agitando} descarga={resuelto && estado.prod > 0 ? 1 : 0} />
      <group position={[POS_REACTOR[0], Y_FONDO + 0.01, POS_REACTOR[2]]}>
        <MoleculasEnBandeja especies={especiesReactor} radio={R_REACTOR - 0.12} />
      </group>
      <Etiqueta texto="Reactor" modo="plano" position={[POS_REACTOR[0], 0.14, 1.95]} tamano={0.17} peso={700} color="#ffffff" fondo="#3b4a54" />

      <Colector position={POS_COLECTOR} />
      <group position={[POS_COLECTOR[0], POS_COLECTOR[1] + 0.08, POS_COLECTOR[2]]}>
        <MoleculasEnBandeja especies={especiesColector} radio={R_COLECTOR - 0.12} />
      </group>
    </group>
  );
}

export default function Limitante3DScene({ limitanteData }: Props) {
  return (
    <LabCanvas
      fondo="laboratorio"
      camara={{ posicion: [0, 5, 17], objetivo: [0, 3, 0], fov: 35 }}
      controles={{ minDistancia: 6, maxDistancia: 30, cajaObjetivo: [[-3, 1, -1], [3, 5, 1]] }}
    >
      <EncuadrarCaja caja={[[-5.2, 0, -3.4], [5.6, 7.3, 2.4]]} margen={0.98} direccion={[0.04, 0.17, 1]} />
      <Montaje limitanteData={limitanteData} />
    </LabCanvas>
  );
}
