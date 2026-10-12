"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { LabCanvas, EncuadrarCaja, cilindro, geoCache, useMateriales } from '../_kit';
import { simularDisparo, duracionAnimacionMs, RADIO_DIANA, type Mision1, type Disparo1 } from '@/domain/fisica';
import {
  TorreLanzamiento, Lanzador, MuroLadrillo, DianaSuelo, CintaSuelo, MangaViento, Estroboscopia,
  AmbientePlaneta, AMBIENTES, R_BOLA,
} from './piezas';

/* ────────────────────────────────────────────────────────────────────────────
   TiroParabolico3DScene — polígono de tiro (fondo «campo» del kit, 1 u = 1 m).

   Montaje: torre de celosía de altura y₀ con un lanzador de tubo sobre muñones,
   cuadrante graduado (0°–90°) y fotopuerta anular en la boca; muro de ladrillo con
   su altura y un mástil bandeado; diana pintada en el suelo (radio real del
   dominio); cinta métrica con estacas cada 10 m y manga de viento.

   Antes de disparar solo hay una guía de apuntado (la dirección de salida): la
   trayectoria con arrastre y viento es lo que el alumno debe predecir. Tras cada
   disparo la bola vuela UNA vez (misma duración que el veredicto del store) por la
   trayectoria calculada con el MISMO motor (domain/fisica · simularDisparo); las
   marcas estroboscópicas (intervalos iguales de tiempo) y la traza se conservan
   como referencia para corregir el tiro.

   Props: { angulo, y0, obsX, obsY, targetX, volando, escenario, ultimoDisparo }.
──────────────────────────────────────────────────────────────────────────── */

type Escenario = Mision1['escenario'];
type Vuelo = { t: number; dist: number };

interface SceneProps {
  angulo: number;
  y0: number;
  obsX: number;
  obsY: number;
  targetX: number;
  volando: boolean;
  escenario: Escenario;
  /** Viento de la misión (m/s, + hacia la diana): solo orienta la manga de viento. */
  viento?: number;
  /** Disparo lanzado (su trayectoria solo se conoce después de disparar). */
  ultimoDisparo: (Mision1 & Disparo1 & { id: number }) | null;
}

type Muestra = { p: THREE.Vector3; vx: number; vy: number; t: number };

/** Trayectoria de un disparo YA lanzado (mismo motor que el store). */
function useTrazaDisparo(ultimo: SceneProps['ultimoDisparo']) {
  return useMemo(() => {
    if (!ultimo) return null;
    const r = simularDisparo(ultimo, ultimo, true);
    const muestras: Muestra[] = r.muestras.map((m) => ({ p: new THREE.Vector3(m.x, m.y, 0), vx: m.vx, vy: m.vy, t: m.t }));
    if (muestras.length < 2) muestras.push({ ...(muestras[0] ?? { p: new THREE.Vector3(), vx: 0, vy: 0, t: 0 }), p: (muestras[0]?.p ?? new THREE.Vector3()).clone() });
    return { muestras, hitX: r.hitX, t: r.t, resultado: r.resultado, maxY: r.maxY };
  }, [ultimo]);
}

// ───────────────────────────── flechas de velocidad ─────────────────────────────

interface RefsFlecha { g: React.RefObject<THREE.Group | null>; c: React.RefObject<THREE.Mesh | null>; h: React.RefObject<THREE.Mesh | null> }
function useFlecha(): RefsFlecha {
  return { g: useRef<THREE.Group>(null), c: useRef<THREE.Mesh>(null), h: useRef<THREE.Mesh>(null) };
}
function FlechaViva({ r, color, grosor }: { r: RefsFlecha; color: string; grosor: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.5 }), [color]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group ref={r.g} visible={false}>
      <mesh ref={r.c} geometry={cilindro(1, 1, 1, 10)} material={mat} scale={[grosor, 1, grosor]} />
      <mesh ref={r.h} geometry={geoCache('cono-fis01', () => new THREE.ConeGeometry(1, 1, 16))} material={mat} scale={[grosor * 2.6, 1, grosor * 2.6]} />
    </group>
  );
}
function ponFlecha(r: RefsFlecha, vx: number, vy: number, esc: number, grosor: number) {
  const g = r.g.current, c = r.c.current, h = r.h.current;
  if (!g || !c || !h) return;
  const L = Math.hypot(vx, vy) * esc;
  if (L < 0.12) { g.visible = false; return; }
  g.visible = true;
  g.rotation.z = Math.atan2(vy, vx) - Math.PI / 2;
  const cab = Math.min(L * 0.4, grosor * 5);
  const cuerpo = L - cab;
  c.scale.y = cuerpo; c.position.y = cuerpo / 2;
  h.scale.y = cab; h.position.y = cuerpo + cab / 2;
}

// ───────────────────────────── proyectil ─────────────────────────────

function Proyectil({ muestras, volando, duracionMs, disparoId, vueloRef, onFin }: {
  muestras: Muestra[]; volando: boolean; duracionMs: number; disparoId: number; vueloRef: React.MutableRefObject<Vuelo>; onFin?: () => void;
}) {
  const m = useMateriales();
  const ref = useRef<THREE.Group>(null);
  const progreso = useRef(0);
  const visto = useRef<number | null>(null);
  const fR = useFlecha(), fX = useFlecha(), fY = useFlecha();
  const vmax = useMemo(() => Math.max(...muestras.map((s) => Math.hypot(s.vx, s.vy)), 1), [muestras]);
  const origen = muestras[0].p;

  useFrame((_, delta) => {
    const g = ref.current; if (!g) return;
    const n = muestras.length;
    if (visto.current !== disparoId) {
      visto.current = disparoId;
      progreso.current = volando ? 0 : n - 1;
    }
    if (volando && progreso.current < n - 1) {
      progreso.current = Math.min(n - 1, progreso.current + (delta * 1000 * (n - 1)) / duracionMs);
      if (progreso.current >= n - 1) onFin?.();
    }
    const i = Math.floor(progreso.current), f = progreso.current - i;
    const a = muestras[i], b = muestras[Math.min(i + 1, n - 1)];
    const x = a.p.x + (b.p.x - a.p.x) * f, y = a.p.y + (b.p.y - a.p.y) * f;
    g.position.set(x, Math.max(R_BOLA, y), 0);
    vueloRef.current.t = a.t + (b.t - a.t) * f;
    vueloRef.current.dist = Math.hypot(x - origen.x, y - origen.y);
    const vx = a.vx + (b.vx - a.vx) * f, vy = a.vy + (b.vy - a.vy) * f;
    const esc = 9 / vmax;
    const en = volando && progreso.current < n - 1;
    if (en) {
      ponFlecha(fR, vx, vy, esc, 0.16); ponFlecha(fX, vx, 0, esc, 0.1); ponFlecha(fY, 0, vy, esc, 0.1);
    } else {
      for (const r of [fR, fX, fY]) if (r.g.current) r.g.current.visible = false;
    }
  });

  return (
    <group ref={ref}>
      <mesh material={m.acero} castShadow><sphereGeometry args={[R_BOLA, 28, 20]} /></mesh>
      <FlechaViva r={fX} color="#78909c" grosor={0.1} />
      <FlechaViva r={fY} color="#78909c" grosor={0.1} />
      <FlechaViva r={fR} color="#0097a7" grosor={0.16} />
    </group>
  );
}

// ───────────────────────────── traza completa ─────────────────────────────

function TrazaTrayectoria({ muestras }: { muestras: Muestra[] }) {
  const geo = useMemo(() => {
    const pts = muestras.filter((_, i) => i % Math.max(1, Math.floor(muestras.length / 160)) === 0 || i === muestras.length - 1).map((s) => s.p);
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const largo = Math.abs(muestras[muestras.length - 1].p.x - muestras[0].p.x);
    const r = THREE.MathUtils.clamp(largo * 0.0009, 0.07, 0.3);
    return new THREE.TubeGeometry(curva, Math.min(300, pts.length * 2), r, 6, false);
  }, [muestras]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo}><meshBasicMaterial color="#e65100" transparent opacity={0.8} /></mesh>;
}

// ───────────────────────────── escena ─────────────────────────────

function Escena({ angulo, y0, obsX, obsY, targetX, volando, escenario, viento = 0, ultimoDisparo }: SceneProps) {
  const scene = useThree((s) => s.scene);
  const traza = useTrazaDisparo(ultimoDisparo);
  const vuelo = useRef<Vuelo>({ t: 0, dist: 1e9 });
  const amb = AMBIENTES[escenario];

  // niebla del mundo elegido
  useLayoutEffect(() => {
    scene.fog = amb ? new THREE.Fog(amb.colorNiebla, amb.niebla[0], amb.niebla[1]) : new THREE.Fog('#cfdfe9', 600, 2600);
  }, [scene, amb]);

  // el mapa de sombras del kit cubre ±40 m alrededor del origen: lo extendemos a todo el campo de tiro
  useLayoutEffect(() => {
    scene.traverse((o) => {
      const l = o as THREE.DirectionalLight;
      if (!l.isDirectionalLight || !l.castShadow) return;
      const c = l.shadow.camera as THREE.OrthographicCamera;
      c.left = -80; c.right = 80; c.top = 80; c.bottom = -80; c.near = 1; c.far = 260;
      c.updateProjectionMatrix();
      l.position.set(15, 50, 25);
      l.target.position.set(45, 0, 0); l.target.updateMatrixWorld();
      l.shadow.needsUpdate = true;
    });
  }, [scene]);

  const rad = (angulo * Math.PI) / 180;
  const alcance = traza ? Math.max(0, traza.hitX) : 0;
  const largoCinta = useMemo(() => {
    const necesario = Math.max(targetX + 12, alcance + 8, 60);
    const paso = necesario <= 120 ? 10 : necesario <= 300 ? 25 : necesario <= 600 ? 50 : 100;
    return { largo: Math.ceil(necesario / paso) * paso, paso };
  }, [targetX, alcance]);
  // encuadre: el montaje entero y, si el tiro se pasa mucho, solo parte de su trayectoria (la diana nunca queda diminuta)
  const caja = useMemo<[[number, number, number], [number, number, number]]>(() => {
    const xMax = Math.max(targetX + 12, Math.min(alcance + 6, 2.2 * targetX + 30));
    const yBase = Math.max(y0 + 9, obsY + 5, 14);
    const yMax = traza ? Math.max(yBase, Math.min(traza.maxY + 4, 0.5 * xMax)) : yBase;
    return [[-12, 0, -9], [xMax, yMax, 9]];
  }, [targetX, alcance, y0, obsY, traza]);
  const puntosEstro = useMemo(() => traza?.muestras.map((s) => ({ t: s.t, p: [s.p.x, s.p.y, 0] as [number, number, number] })) ?? [], [traza]);
  const guia = useMemo(() => [new THREE.Vector3(0, y0, 0), new THREE.Vector3(Math.cos(rad) * 14, y0 + Math.sin(rad) * 14, 0)], [rad, y0]);

  return (
    <>
      <EncuadrarCaja caja={caja} margen={1.08} direccion={[-0.42, 0.24, 1]} />
      {amb && <AmbientePlaneta def={amb} />}
      <group position={[0, amb ? 0.25 : 0, 0]}>

      <TorreLanzamiento altura={y0} />
      <group position={[0, y0, 0]}>
        <Lanzador angulo={angulo} vueloRef={vuelo} />
      </group>
      {/* guía de apuntado: solo la dirección de salida */}
      {!volando && <Line points={guia} color="#455a64" lineWidth={1.2} dashed dashSize={0.7} gapSize={0.5} transparent opacity={0.7} />}

      <MuroLadrillo x={obsX} alto={obsY} />
      <DianaSuelo x={targetX} radio={RADIO_DIANA} />
      <CintaSuelo largo={largoCinta.largo} paso={largoCinta.paso} />
      {escenario !== 'luna' && <MangaViento viento={viento} position={[16, 0, -10]} />}

      {traza && ultimoDisparo && (
        <>
          <Estroboscopia puntos={puntosEstro} tVuelo={traza.t} volando={volando} vueloRef={vuelo} />
          {!volando && <TrazaTrayectoria muestras={traza.muestras} />}
          <Proyectil muestras={traza.muestras} volando={volando} disparoId={ultimoDisparo.id} duracionMs={duracionAnimacionMs(traza.t)} vueloRef={vuelo} />
        </>
      )}
      </group>
    </>
  );
}

export default function TiroParabolico3DScene(props: SceneProps) {
  return (
    <div className="h-full w-full">
      <LabCanvas
        fondo="campo"
        camara={{ posicion: [60, 28, 140], objetivo: [45, 14, 0], fov: 40 }}
        controles={{ minDistancia: 8, maxDistancia: 420, maxPolar: 1.5, cajaObjetivo: [[-40, 0, -40], [260, 120, 40]] }}
      >
        <Escena {...props} />
      </LabCanvas>
    </div>
  );
}
