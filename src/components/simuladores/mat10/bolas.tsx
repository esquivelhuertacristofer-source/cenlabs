'use client';
/**
 * mat10/bolas.tsx — las bolitas de acero y el RELOJ ÚNICO de la máquina.
 *
 * En cada cuadro, y en este orden:
 *   1. la inclinación α del tablero avanza hacia la que pide p (α = atan((2p − 1)·w/h));
 *   2. el tiempo FÍSICO avanza dt·(¼ en cámara lenta);
 *   3. la tolva suelta bolitas (ráfaga de 40/s o goteo de una cada 0,25 s, tiempo
 *      físico) sólo con el tablero asentado y si ningún canal está lleno; cada bolita
 *      sortea sus diez decisiones al salir (galton.ts, Bernoulli(p) exacta);
 *   4. cada bolita sigue sus tramos parabólicos; al pasar la boca de su canal se le
 *      asigna la primera ranura libre de la pila, y al posarse se CUENTA en el store
 *      (contarBolitaM10) en ese mismo cuadro: la pila estática, el histograma del dock
 *      y la barra de lecturas cambian a la vez;
 *   5. se publica en el banco lo que se ve (α, en vuelo, lleno, última bolita).
 *
 * Las cuentas del store son la única verdad de las pilas: la malla estática dibuja
 * exactamente `contenedores[k]` bolitas en las ranuras 0…n−1 de cada canal.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimuladorStore } from '@/store/simuladorStore';
import type { Calidad } from '../_kit';
import { useBancoGalton } from './banco';
import {
  CONTENEDORES, CAPACIDAD, R_BOLA, Y_SALIDA, alfaDeP, crearAzar, generarRecorrido, caidaFinal, posicionEn, ranura,
  type Recorrido, type Tramo,
} from './galton';
import { TOLVA_INTERIOR, type MaterialesGalton } from './piezas';

/** Bolitas en vuelo a la vez (con 40/s y ~1,1 s de vuelo bastan ~45). */
const MAX_VUELO = 160;
export const TASA_RAFAGA = 40;
export const PERIODO_GOTEO = 0.25;
export const CAMARA_LENTA = 0.25;
/** Tiempo de pantalla con que el tablero alcanza su nueva inclinación. */
const TAU_INCLINACION = 0.22;

interface Bola {
  activa: boolean;
  tSalida: number;
  alfa: number;
  rec: Recorrido | null;
  final: Tramo[] | null;
  tFin: number;
}

export interface DiagBolas {
  t: number; alfa: number; alfaObjetivo: number; enVuelo: number; cola: number; soltadas: number; posadas: number;
  semilla: number; lleno: boolean; estaticas: number;
}

/** Semilla de la sesión: aleatoria, o la de `?semilla=N` (capturas reproducibles). */
function semillaInicial(): number {
  if (typeof window !== 'undefined') {
    const s = Number(new URLSearchParams(window.location.search).get('semilla'));
    if (Number.isFinite(s) && s > 0) return s >>> 0;
  }
  return (Math.random() * 4294967296) >>> 0;
}

/** Reserva de la tolva: empaquetamiento hexagonal dentro de la V, con la superficie algo abombada. */
function posicionesReserva(): [number, number][] {
  const [[x0, y0], [x1, y1]] = TOLVA_INTERIOR;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  // distancia (con signo, + hacia dentro de la V) de un punto a la pared derecha
  const dentro = (x: number, y: number) => ((x - x0) * dy - (y - y0) * dx) / -L;
  const out: [number, number][] = [];
  const paso = R_BOLA * Math.sqrt(3);
  for (let j = 0; j < 14; j++) {
    const y = Y_SALIDA + j * paso;
    for (let i = -14; i <= 14; i++) {
      const x = (i + (j % 2 ? 0.5 : 0)) * 2 * R_BOLA;
      const techo = Y_SALIDA + 2.9 - 0.035 * x * x;
      if (y > techo) continue;
      if (dentro(Math.abs(x), y) < R_BOLA + 0.005) continue;
      out.push([x, y]);
    }
  }
  return out;
}

export function MaquinaBolas({ m, calidad, reducido, alfaRef, diag }: {
  m: MaterialesGalton; calidad: Calidad; reducido: boolean;
  alfaRef: React.MutableRefObject<number>; diag: React.MutableRefObject<DiagBolas>;
}) {
  const alta = calidad === 'alta';
  const vuelo = useRef<THREE.InstancedMesh>(null);
  const pila = useRef<THREE.InstancedMesh>(null);
  const reserva = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(R_BOLA, alta ? 16 : 12, alta ? 10 : 8), [alta]);
  useEffect(() => () => geo.dispose(), [geo]);
  const posReserva = useMemo(posicionesReserva, []);

  const semilla = useMemo(semillaInicial, []);
  const azar = useMemo(() => crearAzar(semilla), [semilla]);
  const bolas = useRef<Bola[]>(Array.from({ length: MAX_VUELO }, () => ({ activa: false, tSalida: 0, alfa: 0, rec: null, final: null, tFin: 0 })));
  const reloj = useRef({
    t: 0, tProx: 0, cola: 0, soltadas: 0, posadas: 0, numUltima: 0,
    destino: new Array(CONTENEDORES).fill(0) as number[],
    enCanal: new Array(CONTENEDORES).fill(0) as number[],
    contDibujado: null as number[] | null,
  });
  const o = useMemo(() => new THREE.Object3D(), []);

  // bolitas pedidas con «Soltar 100»: pasan del store a la cola de la tolva
  const pendientes = useSimuladorStore((s) => s.galton10.bolitasPendientes);
  useEffect(() => {
    if (pendientes > 0) {
      reloj.current.cola += pendientes;
      useSimuladorStore.getState().setGalton10({ bolitasPendientes: 0 });
    }
  }, [pendientes]);

  // Vaciar / cambiar p / reiniciar crean un arreglo de contenedores NUEVO y vacío: la
  // máquina se vacía entera (también lo que vuela y lo que esperaba en la tolva). Se
  // detecta en el mismo instante del cambio (suscripción síncrona), no en el cuadro siguiente.
  useEffect(() => useSimuladorStore.subscribe((s, prev) => {
    const c = s.galton10.contenedores;
    if (c === prev.galton10.contenedores || c.some((x) => x > 0)) return;
    const r = reloj.current;
    r.cola = 0;
    r.destino.fill(0); r.enCanal.fill(0);
    for (const b of bolas.current) b.activa = false;
  }), []);

  // inclinación inicial: la del p de entrada, sin animación
  const alfa = useRef<number | null>(null);

  useLayoutEffect(() => {
    const mesh = reserva.current; if (!mesh) return;
    posReserva.forEach(([x, y], i) => { o.position.set(x, y, 0); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [posReserva, o]);

  useFrame((_, delta) => {
    const st = useSimuladorStore.getState();
    const g10 = st.galton10;
    const banco = useBancoGalton.getState();
    const r = reloj.current;
    // las trayectorias son analíticas: un paso largo (equipo lento) no las desestabiliza; sólo se
    // acota para que volver a una pestaña oculta no dé un salto de segundos
    const dtP = Math.min(Math.max(delta, 0), 0.25);
    const p = g10.probabilidad;

    // 1 · inclinación
    const aObj = alfaDeP(p);
    if (alfa.current == null || reducido) alfa.current = aObj;
    else {
      const d = aObj - alfa.current;
      alfa.current = Math.abs(d) < 1e-6 ? aObj : alfa.current + d * (1 - Math.exp(-dtP / TAU_INCLINACION));
    }
    alfaRef.current = alfa.current;
    const asentado = Math.abs(alfa.current - aObj) < 2e-4;

    // 2 · tiempo físico
    const dt = dtP * (banco.lenta ? CAMARA_LENTA : 1);
    r.t += dt;

    // 3 · la tolva
    let cont = g10.contenedores;
    const llenoAhora = () => {
      for (let k = 0; k < CONTENEDORES; k++) if ((cont[k] ?? 0) + r.destino[k] >= CAPACIDAD) return true;
      return false;
    };
    let lleno = llenoAhora();
    // se sueltan todas las que tocaba soltar DENTRO de este cuadro, cada una en su instante
    if (r.tProx < r.t - dt) r.tProx = r.t - dt;
    while (asentado && !lleno && r.t >= r.tProx && (r.cola > 0 || banco.goteo)) {
      const b = bolas.current.find((x) => !x.activa);
      if (!b) break;
      const rec = generarRecorrido(p, azar);
      b.activa = true; b.tSalida = r.tProx; b.alfa = aObj; b.rec = rec; b.final = null; b.tFin = Infinity;
      r.destino[rec.k]++;
      r.soltadas++;
      if (r.cola > 0) { r.cola--; r.tProx += 1 / TASA_RAFAGA; } else r.tProx += PERIODO_GOTEO;
      lleno = llenoAhora();
    }
    if (!(asentado && !lleno && (r.cola > 0 || banco.goteo))) r.tProx = Math.max(r.tProx, r.t);

    // 4 · vuelo
    const mv = vuelo.current;
    let n = 0;
    for (const b of bolas.current) {
      if (!b.activa || !b.rec) continue;
      const rec = b.rec;
      const tl = r.t - b.tSalida;
      if (!b.final && tl >= rec.tBoca) {
        const k = rec.k;
        const ran = Math.min(CAPACIDAD - 1, (cont[k] ?? 0) + r.enCanal[k]);
        r.enCanal[k]++;
        b.final = caidaFinal(rec.tBoca, rec.boca, ranura(k, ran), b.alfa);
        b.tFin = b.final[1].t0 + b.final[1].dur;
      }
      if (b.final && tl >= b.tFin) {
        const k = rec.k;
        b.activa = false;
        r.destino[k] = Math.max(0, r.destino[k] - 1);
        r.enCanal[k] = Math.max(0, r.enCanal[k] - 1);
        r.posadas++;
        st.contarBolitaM10(k);
        cont = useSimuladorStore.getState().galton10.contenedores;
        banco.publicar({ ultima: { decisiones: rec.decisiones, k, n: ++r.numUltima } });
        continue;
      }
      const [x, y] = b.final && tl >= rec.tBoca ? posicionEn(b.final, tl) : posicionEn(rec.tramos, tl);
      if (mv && n < MAX_VUELO) { o.position.set(x, y, 0); o.updateMatrix(); mv.setMatrixAt(n, o.matrix); }
      n++;
    }
    if (mv) { mv.count = n; mv.instanceMatrix.needsUpdate = true; }

    // pila estática: exactamente lo que cuenta el store
    const mp = pila.current;
    if (mp && r.contDibujado !== cont) {
      let i = 0;
      for (let k = 0; k < CONTENEDORES; k++) {
        const c = Math.min(CAPACIDAD, cont[k] ?? 0);
        for (let q = 0; q < c; q++) { const [x, y] = ranura(k, q); o.position.set(x, y, 0); o.updateMatrix(); mp.setMatrixAt(i++, o.matrix); }
      }
      mp.count = i;
      mp.instanceMatrix.needsUpdate = true;
      r.contDibujado = cont;
    }

    // 5 · publicar lo que se ve (comparando con lo publicado: si el banco se reinicia, se repone)
    lleno = llenoAhora();
    const pub = useBancoGalton.getState();
    const aVis = asentado ? aObj : alfa.current;
    if (pub.alfaVis == null || Math.abs(aVis - pub.alfaVis) > 5e-5 || (asentado && pub.alfaVis !== aObj)) banco.publicar({ alfaVis: aVis });
    if (n !== pub.enVuelo) banco.publicar({ enVuelo: n });
    if (lleno !== pub.lleno) banco.publicar({ lleno });

    diag.current = {
      t: r.t, alfa: alfa.current, alfaObjetivo: aObj, enVuelo: n, cola: r.cola, soltadas: r.soltadas, posadas: r.posadas,
      semilla, lleno, estaticas: mp?.count ?? 0,
    };
  }, -1);

  useEffect(() => () => { useBancoGalton.getState().publicar({ alfaVis: null, enVuelo: 0, lleno: false }); }, []);

  return (
    <group userData={{ pieza: 'bola' }}>
      <instancedMesh ref={vuelo} args={[geo, m.acero, MAX_VUELO]} frustumCulled={false} castShadow={alta} />
      <instancedMesh ref={pila} args={[geo, m.acero, CONTENEDORES * CAPACIDAD]} frustumCulled={false} castShadow={alta} receiveShadow />
      <instancedMesh ref={reserva} args={[geo, m.acero, posReserva.length]} castShadow={alta} receiveShadow userData={{ pieza: 'reserva' }} />
    </group>
  );
}
