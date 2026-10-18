"use client";
/**
 * F1 · Tiro parabólico — el polígono en 3D (R3F), 1 u = 1 m.
 *
 *   BANCO: cañón neumático en montaje de sector, en una explanada hundida 1,6 m para que la boca
 *   quede a ras del campo (sale y cae a la misma altura). Dispara en bucle; el balín deja su
 *   ESTELA ESTROBOSCÓPICA (una imagen cada Δt) y dos sombras: la vertical sobre la regla del
 *   suelo, que sólo avanza en x —x(t)—, y la horizontal sobre la pantalla del fondo, que sólo
 *   sube y baja —y(t)—. Vectores v, vx y vy sobre el balín; fantasmas a trazos del vacío y del
 *   ángulo complementario.
 *   RETO: la torre de altura y₀, el muro, la diana con el dron y la manga de viento. Sólo se
 *   dibuja la trayectoria de un disparo YA lanzado; antes, la guía de salida.
 *
 * RELOJ ÚNICO. `reloj.paso(dt)` corre aquí en un useFrame de prioridad −1 (antes de dibujar);
 * el balín, las imágenes, las sombras, las cintas, los vectores y el dock leen ese estado.
 * Ningún useFrame con prioridad > 0 (r3f dejaría de dibujar solo).
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ControlesBanco } from '../_kit';
import { RADIO_DIANA, volarTiro, condicionesMision, type Escenario, type Mision1 } from '@/domain/fisica';
import type { RelojTiro } from './reloj';
import { estadoEn, type Trayectoria } from './balistica';
import {
  crearMateriales, materialCinta, materialCielo, texSombra, texBocanada, variacionMacro, type MatsTiro, type DefCielo,
} from './materiales';
import {
  Canon, Calderin, Terreno, Pantalla, Torre, Muro, Diana, Dron, MangaViento, Colinas, Arboleda, Lampara, useMatCuadrante,
  contarNormalesCero, K, R_BALIN, DESNIVEL, PANTALLA, CANON,
} from './piezas';
import { cifra } from './formato';

export type Calidad = 'alta' | 'media';
export type ModoEscena = 'banco' | 'reto';
export interface Capas { sombras: boolean; vectores: boolean; complementario: boolean; rotulos: boolean }

export interface TiroSceneProps {
  reloj: RelojTiro;
  modo: ModoEscena;
  /** ángulo del cañón (°): el del banco o el del store */
  angulo: number;
  /** misión del reto (null en el banco) */
  mision: Mision1 | null;
  /** el dron fue alcanzado */
  abatido: boolean;
  capas: Capas;
  calidad: Calidad;
  reducido: boolean;
  /** sube para volver al encuadre automático */
  encuadre?: number;
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const GRAD = Math.PI / 180;

// ───────────────────────────── mundos ─────────────────────────────

interface Mundo { cielo: DefCielo; suelo: string; colina: string; niebla: [string, number, number] | null; sol: [string, number]; hemi: [string, string, number]; arboles: boolean }
const MUNDOS: Record<Escenario, Mundo> = {
  tierra: { cielo: { cenit: '#3d78bd', horizonte: '#d4e3ee', suelo: '#7d8c6c', sol: '#fff1d6', brillo: 1 }, suelo: '#5e7f3e', colina: '#8ea495', niebla: ['#d2e1ec', 140, 1300], sol: ['#fff4e2', 2.6], hemi: ['#cfe3ff', '#5d6b4a', 0.55], arboles: true },
  luna: { cielo: { cenit: '#000000', horizonte: '#0a0b0f', suelo: '#2f2e2b', sol: '#ffffff', brillo: 1.3 }, suelo: '#8a8781', colina: '#6d6b67', niebla: null, sol: ['#ffffff', 3.2], hemi: ['#22252c', '#3a3936', 0.25], arboles: false },
  marte: { cielo: { cenit: '#a87e5c', horizonte: '#e3c39d', suelo: '#7a4a32', sol: '#fff0dd', brillo: 0.8 }, suelo: '#a6603b', colina: '#b77b55', niebla: ['#dcb892', 200, 1300], sol: ['#ffe6cc', 2.1], hemi: ['#f0cfa8', '#6b3a22', 0.6], arboles: false },
  jupiter: { cielo: { cenit: '#6b5541', horizonte: '#d8b78f', suelo: '#6b5238', sol: '#fff3e2', brillo: 0.6 }, suelo: '#b38a5c', colina: '#a07a52', niebla: ['#d4b48c', 150, 1000], sol: ['#ffeed8', 1.7], hemi: ['#e8d0ae', '#5c4630', 0.7], arboles: false },
};
/** El sol: alto y de frente a la izquierda; sus sombras caen cortas, casi bajo cada pieza. */
const DIR_SOL = new THREE.Vector3(-0.32, 1, 0.42).normalize();

// ───────────────────────────── ambiente ─────────────────────────────

function Ambiente({ mundo, calidad }: { mundo: Mundo; calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const cielo = useMemo(() => materialCielo(mundo.cielo, DIR_SOL), [mundo]);
  const geo = useMemo(() => new THREE.SphereGeometry(3000, 48, 24), []);
  useEffect(() => () => { cielo.dispose(); }, [cielo]);
  useEffect(() => () => { geo.dispose(); }, [geo]);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    // entorno para los metales: el mismo cielo (sin la proyección al fondo) en un PMREM
    const pm = new THREE.PMREMGenerator(gl);
    const esc = new THREE.Scene();
    const m = materialCielo(mundo.cielo, DIR_SOL);
    m.vertexShader = m.vertexShader.replace('gl_Position = p.xyww;', 'gl_Position = p;');
    const esfera = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), m);
    esc.add(esfera);
    const env = pm.fromScene(esc, 0.02, 0.1, 200).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.85;
    scene.background = null;
    scene.fog = mundo.niebla ? new THREE.Fog(mundo.niebla[0], mundo.niebla[1], mundo.niebla[2]) : null;
    esfera.geometry.dispose(); m.dispose();
    return () => { scene.environment = null; scene.fog = null; env.dispose(); pm.dispose(); };
  }, [gl, scene, mundo, calidad]);
  // la niebla es perspectiva aérea desde la CÁMARA: si se aleja (tiro alto del reto), se aleja con ella
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    const f = scene.fog as THREE.Fog | null;
    if (!f || !mundo.niebla) return;
    const d = Math.max(0, camera.position.length() - 70);
    f.near = mundo.niebla[1] + d; f.far = mundo.niebla[2] + d * 1.3;
  });
  return <mesh geometry={geo} material={cielo} renderOrder={-10} frustumCulled={false} />;
}

function Luces({ mundo, calidad, foco }: { mundo: Mundo; calidad: Calidad; foco: [number, number, number, number] }) {
  const sol = useRef<THREE.DirectionalLight>(null);
  const mapa = calidad === 'alta' ? 4096 : 2048;
  const [cx, cy, cz, rad] = foco;
  useLayoutEffect(() => {
    const l = sol.current; if (!l) return;
    l.position.set(cx + DIR_SOL.x * 160, cy + DIR_SOL.y * 160, cz + DIR_SOL.z * 160);
    l.target.position.set(cx, cy, cz); l.target.updateMatrixWorld();
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -rad; c.right = rad; c.top = rad; c.bottom = -rad; c.near = 10; c.far = 360;
    c.updateProjectionMatrix();
    l.shadow.bias = -0.0004; l.shadow.normalBias = 0.05; l.shadow.radius = 4;
    l.shadow.needsUpdate = true;
  }, [cx, cy, cz, rad]);
  return (
    <>
      <hemisphereLight args={[mundo.hemi[0], mundo.hemi[1], mundo.hemi[2]]} />
      <directionalLight ref={sol} color={mundo.sol[0]} intensity={mundo.sol[1]} castShadow shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* relleno frío desde la cámara: modela el cañón y la pantalla sin sombras propias */}
      <directionalLight position={[-30, 18, 60]} intensity={0.55} color="#dfe9f5" />
    </>
  );
}

const TONO_ACES = 6;
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.5} luminanceThreshold={1.4} luminanceSmoothing={0.2} radius={0.45} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.32} darkness={0.42} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number) {
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 0.5, 6000);
  const tgt = objetivo.clone();
  const v = new THREE.Vector3();
  const caja = (d: number) => {
    cam.position.copy(tgt).addScaledVector(dir, d);
    cam.up.set(0, 1, 0); cam.lookAt(tgt);
    cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of puntos) { v.copy(p).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    return { x0, x1, y0, y1 };
  };
  let d = 60;
  for (let pasada = 0; pasada < 3; pasada++) {
    let lo = 3, hi = 2000;
    for (let i = 0; i < 46; i++) { const m = (lo + hi) / 2; const b = caja(m); if ((b.x1 - b.x0) / 2 <= mx && (b.y1 - b.y0) / 2 <= my && b.x0 > -1 && b.y0 > -1 && b.x1 < 1 && b.y1 < 1) hi = m; else lo = m; }
    d = hi;
    const b = caja(d);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const medioAlto = d * Math.tan(THREE.MathUtils.degToRad(fov) / 2), medioAncho = medioAlto * aspecto;
    const derecha = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const arriba = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    tgt.addScaledVector(derecha, cx * medioAncho).addScaledVector(arriba, cy * medioAlto);
  }
  return { pos: tgt.clone().addScaledVector(dir, d), objetivo: tgt };
}

const direccion = (azGrad: number, elGrad: number) => {
  const az = azGrad * GRAD, el = elGrad * GRAD;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
};

/** Muestras de una trayectoria para el encuadre (cada ~1/12 del vuelo). */
function puntosTray(tr: Trayectoria | null, out: THREE.Vector3[]) {
  if (!tr) return;
  const n = 14;
  for (let i = 0; i <= n; i++) { const e = estadoEn(tr, (i / n) * tr.T); out.push(new THREE.Vector3(e.x, e.y, 0)); }
}

interface DefEncuadre { dir: THREE.Vector3; objetivo: THREE.Vector3; puntos: THREE.Vector3[]; mx: number; my: number }

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Camara({ def, reducido, encuadre, clave }: { def: DefEncuadre; reducido: boolean; encuadre: number; clave: string }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const usuario = useRef(false);
  const primera = useRef(true);
  const meta = useRef<{ pos: THREE.Vector3; obj: THREE.Vector3 } | null>(null);
  const anim = useRef<{ p0: THREE.Vector3; o0: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    if (!controls) return;
    const f = () => { usuario.current = true; anim.current = null; };
    controls.addEventListener('start', f);
    return () => controls.removeEventListener('start', f);
  }, [controls]);
  const aspecto = size.width / Math.max(1, size.height);
  const ultimo = useRef({ encuadre, clave });
  useLayoutEffect(() => {
    if (!controls) return;
    // un cambio de modo o el botón de encuadre devuelven el mando al encuadre automático
    if (ultimo.current.encuadre !== encuadre || ultimo.current.clave !== clave) { ultimo.current = { encuadre, clave }; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    const vertical = aspecto < 1;
    const p = encuadrar(def.dir, def.objetivo, def.puntos, camera.fov, aspecto, vertical ? 0.94 : def.mx, vertical ? Math.min(def.my, 0.62) : def.my);
    meta.current = { pos: p.pos, obj: p.objetivo };
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      anim.current = null;
      return;
    }
    anim.current = { p0: camera.position.clone(), o0: controls.target.clone(), t: 0 };
  }, [controls, aspecto, def, camera, reducido, encuadre, clave]);
  useFrame((_, dt) => {
    const a = anim.current, m = meta.current;
    if (!a || !m || !controls) return;
    a.t = Math.min(1, a.t + dt / 1.1);
    const e = facil(a.t);
    camera.position.lerpVectors(a.p0, m.pos, e);
    controls.target.lerpVectors(a.o0, m.obj, e);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── cintas ─────────────────────────────

/** Cinta de una trayectoria: N puntos (Hermite) con su tiempo y su longitud de arco. */
function geoCinta(tr: Trayectoria, N = 240, z = 0): THREE.BufferGeometry {
  const pos = new Float32Array(N * 2 * 3), tan = new Float32Array(N * 2 * 3), lado = new Float32Array(N * 2), at = new Float32Array(N * 2), as = new Float32Array(N * 2);
  const idx: number[] = [];
  let s = 0, px = 0, py = 0;
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * tr.T;
    const e = estadoEn(tr, t);
    if (i > 0) s += Math.hypot(e.x - px, e.y - py);
    px = e.x; py = e.y;
    const m = Math.hypot(e.vx, e.vy) || 1;
    for (let k = 0; k < 2; k++) {
      const v = i * 2 + k;
      pos[v * 3] = e.x; pos[v * 3 + 1] = e.y; pos[v * 3 + 2] = z;
      tan[v * 3] = e.vx / m; tan[v * 3 + 1] = e.vy / m; tan[v * 3 + 2] = 0;
      lado[v] = k ? 1 : -1; at[v] = t; as[v] = s;
    }
    if (i < N - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3));
  g.setAttribute('aLado', new THREE.BufferAttribute(lado, 1));
  g.setAttribute('aT', new THREE.BufferAttribute(at, 1));
  g.setAttribute('aS', new THREE.BufferAttribute(as, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

function Cinta({ tr, color, ancho, opacidad, trazo = 0, reloj, crece, visible = true, pieza }: {
  tr: Trayectoria | null; color: string; ancho: number; opacidad: number; trazo?: number; reloj: RelojTiro; crece: boolean; visible?: boolean; pieza: string;
}) {
  const mat = useMemo(() => materialCinta(color, ancho, opacidad, trazo), [color, ancho, opacidad, trazo]);
  useEffect(() => () => mat.dispose(), [mat]);
  const geo = useMemo(() => (tr && tr.T > 0 ? geoCinta(tr) : null), [tr]);
  useEffect(() => () => { geo?.dispose(); }, [geo]);
  const size = useThree((s) => s.size);
  useFrame(() => {
    mat.uniforms.uRes.value.set(size.width, size.height);
    mat.uniforms.uT.value = crece ? reloj.t + 1e-6 : 1e9;
  });
  if (!geo) return null;
  return <mesh geometry={geo} material={mat} visible={visible} renderOrder={4} frustumCulled={false} userData={{ pieza }} />;
}

// ───────────────────────────── balín, estela y sombras ─────────────────────────────

const MAX_MARCAS = 32;

function Balin({ reloj, mats, capas, modo, xPantalla, altoPantalla, y0 }: {
  reloj: RelojTiro; mats: MatsTiro; capas: Capas; modo: ModoEscena;
  xPantalla: React.MutableRefObject<number>; altoPantalla: number; y0: number;
}) {
  const bola = useRef<THREE.Mesh>(null);
  const estela = useRef<THREE.InstancedMesh>(null);
  const sSuelo = useRef<THREE.InstancedMesh>(null);
  const sPantalla = useRef<THREE.InstancedMesh>(null);
  const sBola = useRef<THREE.Mesh>(null), sBolaP = useRef<THREE.Mesh>(null);
  const geoBola = useMemo(() => new THREE.SphereGeometry(R_BALIN, 36, 24), []);
  const geoEstela = useMemo(() => new THREE.SphereGeometry(R_BALIN, 20, 14), []);
  const geoDisco = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => { geoBola.dispose(); geoEstela.dispose(); geoDisco.dispose(); }, [geoBola, geoEstela, geoDisco]);
  const tex = useMemo(() => texSombra(), []);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  const matSombra = useMemo(() => new THREE.MeshBasicMaterial({ color: '#141a20', alphaMap: tex ?? undefined, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }), [tex]);
  const matSombraViva = useMemo(() => new THREE.MeshBasicMaterial({ color: '#0d1116', alphaMap: tex ?? undefined, transparent: true, opacity: 0.72, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7 }), [tex]);
  useEffect(() => () => { matSombra.dispose(); matSombraViva.dispose(); }, [matSombra, matSombraViva]);
  const o = useMemo(() => new THREE.Object3D(), []);
  const marcasPuestas = useRef<unknown>(null);
  const qPantalla = useMemo(() => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), PANTALLA.giro - Math.PI / 2), []);
  const nPantalla = useMemo(() => new THREE.Vector3(-Math.cos(PANTALLA.giro), 0, Math.sin(PANTALLA.giro)), []);
  const qSuelo = useMemo(() => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), []);
  const dS = 2.1 * R_BALIN;

  useFrame(() => {
    const e = reloj.estado();
    const banco = modo === 'banco';
    const hay = !!e && !!reloj.tiro;
    // balín: en vuelo, su centro exacto; en reposo, apoyado (o en la cara del muro)
    const b = bola.current;
    if (b) {
      b.visible = true;
      if (!hay) b.position.set(0, y0, 0);
      else {
        const quieto = reloj.fase !== 'vuelo' && reloj.t >= reloj.tiro!.T - 1e-9 && reloj.tiro!.T > 0;
        const muro = reloj.tiro!.vuelo.fin === 'muro';
        b.position.set(e!.x - (quieto && muro ? R_BALIN : 0), quieto && !muro ? Math.max(e!.y, R_BALIN) : e!.y, 0);
      }
    }
    // imágenes del estroboscopio
    const est = estela.current, ss = sSuelo.current, sp = sPantalla.current;
    const marcas = reloj.marcas;
    const n = hay ? Math.min(MAX_MARCAS, reloj.marcasVisibles) : 0;
    if (est && ss && marcasPuestas.current !== marcas) {
      marcasPuestas.current = marcas;
      marcas.slice(0, MAX_MARCAS).forEach((m, i) => {
        o.position.set(m.x, m.y, 0); o.quaternion.identity(); o.scale.set(1, 1, 1); o.updateMatrix(); est.setMatrixAt(i, o.matrix);
        o.position.set(m.x, m.x >= 0 ? 0.03 : -DESNIVEL + 0.02, 0); o.quaternion.copy(qSuelo); o.scale.set(dS, dS, 1); o.updateMatrix(); ss.setMatrixAt(i, o.matrix);
      });
      est.instanceMatrix.needsUpdate = true; ss.instanceMatrix.needsUpdate = true;
    }
    if (est) est.count = n;
    if (ss) { ss.count = n; ss.visible = capas.sombras; }
    // sombras en la pantalla (sólo banco): la de cada imagen y la del balín
    if (sp) {
      sp.visible = banco && capas.sombras;
      if (sp.visible) {
        const xp = xPantalla.current;
        let k = 0;
        for (let i = 0; i < n; i++) {
          const m = marcas[i];
          // la escala de la pantalla marca la altura real: la sombra cae a la altura y del balín
          if (m.y < dS * 0.5 || m.y > altoPantalla) continue;
          o.position.set(xp, m.y, 0).addScaledVector(nPantalla, 0.045); o.quaternion.copy(qPantalla); o.scale.set(dS, dS, 1); o.updateMatrix();
          sp.setMatrixAt(k++, o.matrix);
        }
        sp.count = k;
        sp.instanceMatrix.needsUpdate = true;
      }
    }
    const sb = sBola.current, sbp = sBolaP.current;
    if (sb) {
      sb.visible = hay && capas.sombras;
      if (sb.visible && b) sb.position.set(b.position.x, b.position.x >= 0 ? 0.035 : -DESNIVEL + 0.025, 0);
    }
    if (sbp) {
      const yb = b ? b.position.y : 0;
      sbp.visible = banco && hay && capas.sombras && yb >= dS * 0.5 && yb <= altoPantalla;
      if (sbp.visible) sbp.position.set(xPantalla.current, yb, 0).addScaledVector(nPantalla, 0.05);
    }
  });
  return (
    <group>
      <mesh ref={bola} geometry={geoBola} material={mats.balin} userData={{ pieza: 'balin' }} />
      <instancedMesh ref={estela} args={[geoEstela, mats.fantasma, MAX_MARCAS]} frustumCulled={false} userData={{ pieza: 'estela' }} />
      <instancedMesh ref={sSuelo} args={[geoDisco, matSombra, MAX_MARCAS]} frustumCulled={false} renderOrder={2} userData={{ pieza: 'sombraSuelo' }} />
      <instancedMesh ref={sPantalla} args={[geoDisco, matSombra, MAX_MARCAS]} frustumCulled={false} renderOrder={2} userData={{ pieza: 'sombraPantalla' }} />
      <mesh ref={sBola} geometry={geoDisco} material={matSombraViva} quaternion={qSuelo} scale={[dS * 1.05, dS * 1.05, 1]} renderOrder={3} userData={{ pieza: 'sombraSuelo' }} />
      <mesh ref={sBolaP} geometry={geoDisco} material={matSombraViva} quaternion={qPantalla} scale={[dS * 1.05, dS * 1.05, 1]} renderOrder={3} userData={{ pieza: 'sombraPantalla' }} />
    </group>
  );
}

// ───────────────────────────── vectores ─────────────────────────────

function Flecha({ refG, mat, grosor }: { refG: React.RefObject<THREE.Group | null>; mat: THREE.Material; grosor: number }) {
  const cuerpo = useMemo(() => { const g = new THREE.CylinderGeometry(grosor, grosor, 1, 12); g.translate(0, 0.5, 0); return g; }, [grosor]);
  const punta = useMemo(() => { const g = new THREE.ConeGeometry(grosor * 2.8, grosor * 7, 18); g.translate(0, -grosor * 3.5, 0); return g; }, [grosor]);
  useEffect(() => () => { cuerpo.dispose(); punta.dispose(); }, [cuerpo, punta]);
  return (
    <group ref={refG} visible={false}>
      <mesh name="cuerpo" geometry={cuerpo} material={mat} renderOrder={5} />
      <mesh name="punta" geometry={punta} material={mat} renderOrder={5} />
    </group>
  );
}
function ponFlecha(g: THREE.Group | null, x: number, y: number, vx: number, vy: number, esc: number, grosor: number) {
  if (!g) return;
  const L = Math.hypot(vx, vy) * esc;
  if (L < grosor * 9) { g.visible = false; return; }
  g.visible = true;
  g.position.set(x, y, 0.02);
  g.rotation.set(0, 0, Math.atan2(vy, vx) - Math.PI / 2);
  const c = g.getObjectByName('cuerpo')!, p = g.getObjectByName('punta')!;
  c.scale.set(1, L - grosor * 6.5, 1);
  p.position.set(0, L, 0);
}

export const COL_VEC = { v: '#f6f8fb', x: '#ffb547', y: '#5fe0c4' };

function Vectores({ reloj, visible, escala }: { reloj: RelojTiro; visible: boolean; escala: { esc: number; grosor: number } }) {
  const fv = useRef<THREE.Group>(null), fx = useRef<THREE.Group>(null), fy = useRef<THREE.Group>(null);
  const mats = useMemo(() => [COL_VEC.v, COL_VEC.x, COL_VEC.y].map((c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c), toneMapped: false, depthTest: true })), []);
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  useFrame(() => {
    const e = reloj.estado();
    const en = visible && !!e && reloj.fase === 'vuelo' || (visible && !!e && reloj.pausa && reloj.modo === 'banco' && reloj.t > 0 && reloj.t < (reloj.tiro?.T ?? 0));
    if (!en || !e) { [fv, fx, fy].forEach((r) => { if (r.current) r.current.visible = false; }); return; }
    ponFlecha(fx.current, e.x, e.y, e.vx, 0, escala.esc, escala.grosor * 0.8);
    ponFlecha(fy.current, e.x, e.y, 0, e.vy, escala.esc, escala.grosor * 0.8);
    ponFlecha(fv.current, e.x, e.y, e.vx, e.vy, escala.esc, escala.grosor);
  });
  return (
    <group userData={{ pieza: 'vectores' }}>
      <Flecha refG={fx} mat={mats[1]} grosor={escala.grosor * 0.8} />
      <Flecha refG={fy} mat={mats[2]} grosor={escala.grosor * 0.8} />
      <Flecha refG={fv} mat={mats[0]} grosor={escala.grosor} />
    </group>
  );
}

// ───────────────────────────── bocanadas ─────────────────────────────

/** Bocanada de aire en la boca al disparar y polvo donde cae (sprites, ≤ 0,9 s). */
function Bocanadas({ reloj, y0, reducido }: { reloj: RelojTiro; y0: number; reducido: boolean }) {
  const tex = useMemo(() => texBocanada(), []);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  const N = 9;
  const mats = useMemo(() => Array.from({ length: N }, () => new THREE.SpriteMaterial({ map: tex ?? undefined, transparent: true, depthWrite: false, opacity: 0 })), [tex]);
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const vivos = useRef<{ t: number; dur: number; p: THREE.Vector3; v: THREE.Vector3; r0: number; r1: number; col: THREE.Color; a: number }[]>(
    Array.from({ length: N }, () => ({ t: 1, dur: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), r0: 0, r1: 0, col: new THREE.Color(), a: 0 })));
  const visto = useRef({ d: reloj.disparos, a: reloj.aterrizajes });
  const de = useRef(reloj);
  useFrame((_, dt) => {
    const h = Math.min(dt, 0.1);
    // al cambiar de modo cambia el reloj: sus contadores no son un disparo nuevo
    if (de.current !== reloj) { de.current = reloj; visto.current = { d: reloj.disparos, a: reloj.aterrizajes }; }
    const lanzar = (k0: number, k1: number, f: (i: number, s: (typeof vivos.current)[number]) => void) => { for (let i = k0; i < k1; i++) { const s = vivos.current[i]; s.t = 0; f(i, s); } };
    if (reloj.disparos !== visto.current.d) {
      visto.current.d = reloj.disparos;
      if (!reducido && reloj.tiro && reloj.tiro.T > 0) {
        const a = reloj.tiro.d.angulo * GRAD, u = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
        lanzar(0, 4, (i, s) => {
          s.dur = 0.55 + i * 0.08; s.p.set(0, y0, 0).addScaledVector(u, 0.25 + i * 0.35); s.v.copy(u).multiplyScalar(1.6 - i * 0.2).add(new THREE.Vector3(0, 0.25, (i - 1.5) * 0.25));
          s.r0 = 0.35; s.r1 = 1.5 + i * 0.25; s.col.set('#f4f6f8'); s.a = 0.5;
        });
      }
    }
    if (reloj.aterrizajes !== visto.current.a) {
      visto.current.a = reloj.aterrizajes;
      const tr = reloj.tiro;
      if (!reducido && tr) {
        const muro = tr.vuelo.fin === 'muro';
        const x = tr.vuelo.hitX - (muro ? 0.3 : 0), y = muro ? tr.vuelo.yImpacto : 0.25;
        lanzar(4, N, (i, s) => {
          const k = i - 4, ang = (k / 5) * Math.PI * 2;
          s.dur = 0.8 + k * 0.05; s.p.set(x, y, 0); s.v.set(Math.cos(ang) * 1.1 - (muro ? 0.8 : 0), 0.9 + (k % 2) * 0.5, Math.sin(ang) * 1.1);
          s.r0 = 0.4; s.r1 = 2.2; s.col.set(muro ? '#c9c2b6' : '#b9ab8f'); s.a = 0.55;
        });
      }
    }
    vivos.current.forEach((s, i) => {
      const sp = refs.current[i]; if (!sp) return;
      if (s.t >= s.dur) { sp.visible = false; return; }
      s.t += h;
      const f = Math.min(1, s.t / s.dur);
      s.p.addScaledVector(s.v, h * (1 - f));
      sp.visible = true;
      sp.position.copy(s.p);
      sp.scale.setScalar(s.r0 + (s.r1 - s.r0) * (1 - (1 - f) * (1 - f)));
      mats[i].opacity = s.a * (1 - f) * Math.min(1, f * 6);
      mats[i].color.copy(s.col);
    });
  });
  return (
    <group>
      {mats.map((m, i) => <sprite key={i} ref={(el) => { refs.current[i] = el; }} material={m} visible={false} renderOrder={6} />)}
    </group>
  );
}

// ───────────────────────────── destellos del estroboscopio ─────────────────────────────

/**
 * La lente de la lámpara destella cada vez que el reloj pasa por un t = k·Δt (la imagen nueva
 * de la estela). Si los destellos fueran más seguidos que cada 0,18 s de pantalla, la lámpara
 * queda encendida fija durante el vuelo (sin parpadeo); con movimiento reducido, nunca destella.
 */
function Destellos({ reloj, mat, reducido }: { reloj: RelojTiro; mat: THREE.MeshStandardMaterial; reducido: boolean }) {
  const ultimo = useRef(-1), luz = useRef(0), de = useRef<RelojTiro | null>(null);
  useFrame((_, dt) => {
    const n = reloj.marcasVisibles;
    if (de.current !== reloj) { de.current = reloj; ultimo.current = n; }
    const vuela = reloj.fase === 'vuelo' && !(reloj.pausa && reloj.modo === 'banco');
    const lento = reloj.dtEstrobo / Math.max(1e-6, reloj.factor) >= 0.18;
    if (n !== ultimo.current) { if (n > ultimo.current && vuela && lento) luz.current = 1; ultimo.current = n; }
    luz.current = Math.max(0, luz.current - Math.min(dt, 0.1) / 0.09);
    const fijo = vuela && !lento ? 0.5 : 0;
    mat.emissiveIntensity = 0.25 + (reducido ? 0 : Math.max(fijo, luz.current) * 6);
  });
  return null;
}

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export interface RotuloF01 { id: string; texto: string; ancla: [number, number, number] }
export type DatoRotulo = { texto: string; x: number; y: number } | null;
const ROT_ARRIBA = 46, ROT_ABAJO = 40;

function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloF01[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (rotulos.length === 0) return;
    const cajas: { x: number; y: number; w: number; h: number }[] = [];
    const lista = rotulos.slice(0, 8).map((r) => {
      v.set(...r.ancla).project(camera);
      return { r, x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, z: v.z };
    }).sort((a, b) => a.y - b.y);
    for (const it of lista) {
      const el = nodos.current.get(it.r.id); if (!el) continue;
      const dentro = it.z < 1 && it.x > 0 && it.x < size.width && it.y > 0 && it.y < size.height;
      el.style.opacity = dentro ? '1' : '0';
      if (!dentro) continue;
      const w = el.offsetWidth || 120, h = el.offsetHeight || 22;
      const x = Math.min(size.width - w - 4, Math.max(4, it.x - w / 2));
      let y = Math.max(ROT_ARRIBA, it.y - h - 8);
      for (let k = 0; k < 12; k++) {
        const choca = cajas.find((c) => x < c.x + c.w + 4 && x + w + 4 > c.x && y < c.y + c.h + 3 && y + h + 3 > c.y);
        if (!choca) break;
        y = choca.y + choca.h + 4;
      }
      y = Math.min(size.height - h - ROT_ABAJO, y);
      cajas.push({ x, y, w, h });
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }
  });
  return null;
}

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[280px] rounded-md border border-white/15 bg-[#0b1220]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-f01="">
      {d.texto}
    </div>
  );
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function DiagnosticoDev({ reloj, calidad, def }: { reloj: RelojTiro; calidad: Calidad; def: DefEncuadre }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const medida = useRef({ llamadas: 0, triangulos: 0, fps: 0, n: 0, t0: 0 });
  useEffect(() => {
    if (!DEV) return;
    const antes = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = antes; };
  }, [gl]);
  // prioridad NEGATIVA: con > 0 r3f deja de dibujar solo y el lienzo sale negro
  useFrame(() => {
    if (!DEV) return;
    const r = gl.info.render, m = medida.current;
    m.llamadas = r.calls; m.triangulos = r.triangles;
    gl.info.reset();
    const ahora = performance.now();
    m.n++;
    if (!m.t0) m.t0 = ahora;
    if (ahora - m.t0 >= 1000) { m.fps = (m.n * 1000) / (ahora - m.t0); m.n = 0; m.t0 = ahora; }
  }, -20);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __fis01?: unknown };
    w.__fis01 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulosDibujados: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj, l = r.lectura();
        return { modo: r.modo, fase: r.fase, t: r.t, factor: r.factor, dtEstrobo: r.dtEstrobo, marcas: r.marcas.length, visibles: r.marcasVisibles, p: r.p, lectura: l, optimo: r.optimo, disparos: r.disparos, pausa: r.pausa, mision: r.mision };
      },
      /** sólo desarrollo: pausa y fija el tiempo del vuelo (capturas) */
      t(seg: number) {
        reloj.pausa = true; reloj.fase = 'vuelo'; reloj.t = Math.min(seg, reloj.tiro?.T ?? 0);
        (reloj as unknown as { avisar(): void }).avisar();
        return reloj.t;
      },
      /** sólo desarrollo (pruebas del reto): el (θ, v₀) entero más bajo que cae a < 1 m del centro de la diana */
      solucion() {
        const m = reloj.mision; if (!m) return null;
        const c = condicionesMision(m);
        let mejor: { angulo: number; velocidad: number; error: number; H: number } | null = null;
        for (let a = 15; a <= 89; a++) for (let v = 5; v <= 100; v++) {
          const r = volarTiro(c, { angulo: a, velocidad: v });
          if (r.fin !== 'suelo') continue;
          const e = Math.abs(r.hitX - m.targetX);
          if (e > 1) continue;
          if (!mejor || r.maxY < mejor.H) mejor = { angulo: a, velocidad: v, error: e, H: r.maxY };
        }
        return mejor;
      },
      pausa(p: boolean) { reloj.pausa = p; },
      /** fracción del alto y del ancho del lienzo que ocupan los puntos del encuadre */
      fraccion() {
        const v = new THREE.Vector3();
        let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
        for (const p of def.puntos) { v.copy(p).project(camera); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); }
        return { alto: (y1 - y0) / 2, ancho: (x1 - x0) / 2, lienzo: { w: size.width, h: size.height } };
      },
      camara() { return { pos: camera.position.toArray(), fov: (camera as THREE.PerspectiveCamera).fov }; },
      escena: scene,
    };
    return () => { delete w.__fis01; };
  }, [gl, scene, reloj, calidad, camera, def, size]);
  return null;
}

function AvisarListo({ onListo }: { onListo?: () => void }) {
  const n = useRef(0);
  useFrame(() => {
    if (n.current > 3) return;
    n.current++;
    if (n.current === 3) onListo?.();
  });
  return null;
}

// ───────────────────────────── el polígono ─────────────────────────────

function Poligono({ p, mats, rotulo, publicarRotulos, nodos, mundo }: {
  p: TiroSceneProps; mats: MatsTiro; mundo: Mundo;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloF01[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { reloj, modo, mision, capas, reducido, encuadre = 0 } = p;
  const banco = modo === 'banco';
  const y0 = banco ? 0 : mision?.y0 ?? 20;

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.paso(dt); }, -1);
  // re-render cuando cambian las trayectorias (disparo nuevo, mandos, misión)
  const [, setVer] = useState(0);
  const firma = useRef('');
  useEffect(() => reloj.suscribir(() => {
    const f = `${reloj.disparos}|${reloj.tiro?.T ?? -1}|${reloj.tiro?.vuelo.hitX ?? 0}|${reloj.comp?.T ?? 0}|${reloj.vacio?.T ?? 0}|${reloj.fase === 'vacio'}`;
    if (f !== firma.current) { firma.current = f; setVer((v) => v + 1); }
  }), [reloj]);
  const tiro = reloj.tiro, vacio = reloj.vacio, comp = reloj.comp;

  // ángulo del cañón (suavizado) y retroceso
  const angulo = useRef(p.angulo);
  const retroceso = useRef(0);
  const disparoVisto = useRef(reloj.disparos);
  useFrame((_, dt) => {
    const meta = p.angulo;
    angulo.current = reducido ? meta : angulo.current + (meta - angulo.current) * Math.min(1, dt * 12);
    if (reloj.disparos !== disparoVisto.current) { disparoVisto.current = reloj.disparos; if (!reducido) retroceso.current = 0.05; }
    retroceso.current = Math.max(0, retroceso.current - dt * 0.12);
  });
  const matCuadrante = useMatCuadrante(p.calidad);

  // racor de la válvula en el mundo (la manguera lo sigue al cambiar el ángulo)
  const valvula = useMemo(() => {
    const a = p.angulo * GRAD, c = Math.cos(a), s = Math.sin(a);
    const lx = -0.37, ly = -0.145;
    return new THREE.Vector3((lx * c - ly * s) * K, (lx * s + ly * c) * K + y0, 0);
  }, [p.angulo, y0]);

  // pantalla: rueda hasta detrás de la caída y crece hasta la altura máxima
  const alcanceMax = Math.max(tiro?.vuelo.hitX ?? 0, vacio?.vuelo.hitX ?? 0, capas.complementario ? comp?.vuelo.hitX ?? 0 : 0);
  const altMax = Math.max(tiro?.vuelo.maxY ?? 0, vacio?.vuelo.maxY ?? 0, capas.complementario ? comp?.vuelo.maxY ?? 0 : 0);
  const xMeta = Math.max(8, alcanceMax + 3.2);
  const altoPantalla = Math.max(6, Math.ceil((altMax + 1.6) / 2) * 2);
  const xPantalla = useRef(xMeta);
  const pantalla = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    xPantalla.current = reducido ? xMeta : xPantalla.current + (xMeta - xPantalla.current) * Math.min(1, dt * 4);
    if (pantalla.current) pantalla.current.position.set(xPantalla.current, 0, 0);
  });

  // encuadre: lo que cuenta el fenómeno
  const def = useMemo<DefEncuadre>(() => {
    const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const pts: THREE.Vector3[] = [];
    if (banco) {
      pts.push(P(-2.6, -DESNIVEL, 1.1), P(-2.6, 0.6, -1.1), P(0.6, -DESNIVEL * 0.6, 1.1), P(2.6, 1.9, 6.4));
      puntosTray(tiro, pts); puntosTray(vacio, pts);
      if (capas.complementario) puntosTray(comp, pts);
      pts.push(P(xMeta + 0.8, 0, 1.2), P(xMeta - 0.8, altoPantalla + 0.2, -0.9), P(xMeta, 0, -1.2));
      const c = pts.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / pts.length);
      return { dir: direccion(-24, 12), objetivo: c, puntos: pts, mx: 0.9, my: 0.66 };
    }
    const m = mision;
    const yy = m?.y0 ?? 20;
    pts.push(P(-3.8, -DESNIVEL, 1.7), P(-3.8, yy + 1.6, -1.7), P(0.8, yy + 0.8, 0));
    if (m) {
      pts.push(P(m.obsX, 0, 3), P(m.obsX + 1.2, m.obsY + 0.3, -3), P(m.targetX + RADIO_DIANA + 2, 0, 3), P(m.targetX - RADIO_DIANA, 0, -3), P(m.targetX, 3, 0));
    }
    if (tiro) {
      const lim = m ? 1.35 * m.targetX + 10 : 140;
      const t: THREE.Vector3[] = [];
      puntosTray(tiro, t);
      for (const q of t) if (q.x <= lim) pts.push(q);
    }
    const c = pts.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    return { dir: direccion(-30, 13), objetivo: c, puntos: pts, mx: 0.92, my: 0.66 };
  }, [banco, tiro, vacio, comp, capas.complementario, xMeta, altoPantalla, mision]);

  // vectores: escala con el tamaño de la escena
  const escVec = useMemo(() => {
    // la flecha de v₀ mide ~1/4 del tamaño del disparo; el grosor, proporcional
    const v0 = tiro ? Math.hypot(tiro.muestras[0].vx, tiro.muestras[0].vy) : 15;
    const span = Math.max(12, tiro ? Math.max(tiro.vuelo.hitX, tiro.vuelo.maxY * 1.6) : 20);
    return { esc: Math.min(0.6, (0.26 * span) / Math.max(1, v0)), grosor: Math.max(0.06, span * 0.0034) };
  }, [tiro]);

  // guía de salida del reto (sólo la dirección): cinta recta a trazos
  const guia = useMemo(() => {
    if (banco) return null;
    const a = p.angulo * GRAD;
    const L = 9;
    const tr: Trayectoria = {
      cond: { g: 0, k: 0, viento: 0, y0, muro: null }, d: { angulo: p.angulo, velocidad: 1 }, T: L,
      vuelo: { fin: 'tiempo', hitX: 0, yImpacto: 0, t: L, maxY: y0, muestras: [] },
      muestras: [{ t: 0, x: 0, y: y0, vx: Math.cos(a), vy: Math.sin(a) }, { t: L, x: Math.cos(a) * L, y: y0 + Math.sin(a) * L, vx: Math.cos(a), vy: Math.sin(a) }],
    };
    return tr;
  }, [banco, p.angulo, y0]);

  // rótulo al pasar el ratón
  const textoPieza = useCallback((o: THREE.Object3D | null): string | null => {
    let x: THREE.Object3D | null = o;
    while (x && !x.userData?.pieza) x = x.parent;
    if (!x) return null;
    const m = mision;
    switch (x.userData.pieza) {
      case 'canon': return 'Cañón neumático: pivota en la boca, el punto de salida';
      case 'sector': return 'Montaje de sector: ranura en arco y perno de apriete';
      case 'cuadrante': return `Cuadrante de latón · θ = ${cifra(p.angulo, 0)}°`;
      case 'calderin': return 'Calderín de aire comprimido con manómetro';
      case 'manguera': return 'Manguera de aire a la válvula';
      case 'pantalla': return 'Pantalla: la sombra con luz horizontal sólo sube y baja: y(t)';
      case 'regla': return 'Regla de acero: la sombra con luz vertical sólo avanza: x(t)';
      case 'pista': return 'Pista de concreto, juntas cada 5 m';
      case 'explanada': return `Explanada hundida ${cifra(DESNIVEL, 1)} m: la boca queda a ras del campo`;
      case 'balin': return `Balín de acero: 1 kg, Ø 12 cm (dibujado ×${K})`;
      case 'estela': return `Estroboscopio: una imagen cada ${cifra(reloj.dtEstrobo, reloj.dtEstrobo < 0.1 ? 2 : 1)} s`;
      case 'lampara': return `Lámpara estroboscópica: un destello cada ${cifra(reloj.dtEstrobo, reloj.dtEstrobo < 0.1 ? 2 : 1)} s`;
      case 'sombraSuelo': return 'Sombra en el suelo: el movimiento horizontal';
      case 'sombraPantalla': return 'Sombra en la pantalla: el movimiento vertical';
      case 'vectores': return 'Velocidad v y sus componentes vx, vy';
      case 'trayectoria': return 'Trayectoria (integrada con RK4)';
      case 'vacio': return 'Sin aire: la parábola ideal';
      case 'complementario': return `Ángulo complementario: ${cifra(90 - p.angulo, 0)}°`;
      case 'torre': return m ? `Torre: la boca a y₀ = ${cifra(m.y0, 0)} m` : 'Torre de tiro';
      case 'muro': return m ? `Muro: cara en x = ${cifra(m.obsX, 0)} m, alto ${cifra(m.obsY, 0)} m` : 'Muro';
      case 'mastil': return 'Mástil de altura: franjas de 5 m';
      case 'diana': return m ? `Diana: radio ${cifra(RADIO_DIANA, 1)} m en x = ${cifra(m.targetX, 0)} m` : 'Diana';
      case 'dron': return 'Dron posado en el centro de la diana';
      case 'manga': return m ? `Manga de viento · ${cifra(m.viento, 1, true)} m/s` : 'Manga de viento';
      case 'campo': return null;
      default: return null;
    }
  }, [mision, p.angulo, reloj]);
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const t = textoPieza(e.object);
    rotulo.current(t ? { texto: t, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  // rótulos fijos (≤ 8)
  const rotulos = useMemo<RotuloF01[]>(() => {
    if (!capas.rotulos) return [];
    if (banco) {
      const r: RotuloF01[] = [
        { id: 'ca', texto: 'Cañón', ancla: [-1.4, 0.4, 0.8] },
        { id: 'cu', texto: 'Cuadrante', ancla: [-1.6, -1.6, 1.0] },
        { id: 'cl', texto: 'Calderín', ancla: [-5.4, -1.0, -2.3] },
        { id: 're', texto: 'Regla', ancla: [Math.max(6, alcanceMax * 0.45), 0, 0.7] },
        { id: 'la', texto: 'Estroboscopio', ancla: [2.6, 2.0, 6.4] },
        { id: 'pa', texto: 'Pantalla', ancla: [xMeta, altoPantalla * 0.8, 0] },
      ];
      if (tiro && tiro.T > 0) {
        const e = estadoEn(tiro, tiro.T * 0.3);
        r.push({ id: 'es', texto: 'Estela', ancla: [e.x, e.y + 0.6, 0] });
      }
      return r;
    }
    const m = mision;
    if (!m) return [];
    return [
      { id: 'ca', texto: 'Cañón', ancla: [-1.2, m.y0 + 0.8, 0] },
      { id: 'to', texto: 'Torre', ancla: [-2.1, m.y0 * 0.5, 1.7] },
      { id: 'mu', texto: 'Muro', ancla: [m.obsX, m.obsY + 0.4, 0] },
      { id: 'di', texto: 'Diana', ancla: [m.targetX, 1.2, 0] },
      { id: 'ma', texto: 'Manga', ancla: [14, 8, -9] },
    ];
  }, [capas.rotulos, banco, mision, tiro, alcanceMax, xMeta, altoPantalla]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  const matSuelo = useMemo(() => {
    if (mundo === MUNDOS.tierra) return mats.pasto;
    // regolito / polvo: color liso con variación de baja frecuencia en coordenadas de mundo
    const m = new THREE.MeshStandardMaterial({ color: mundo.suelo, roughness: 1, metalness: 0 });
    variacionMacro(m, 26, 0.16);
    return m;
  }, [mundo, mats.pasto]);
  useEffect(() => () => { if (matSuelo !== mats.pasto) matSuelo.dispose(); }, [matSuelo, mats.pasto]);
  const matColina = useMemo(() => { const m = (mats.colina as THREE.MeshStandardMaterial).clone(); m.color.set(mundo.colina); return m; }, [mats.colina, mundo]);
  useEffect(() => () => matColina.dispose(), [matColina]);

  // lámpara estroboscópica: en el campo, del lado de la cámara, apuntando al centro del vuelo
  const matLente = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1d1f22', emissive: '#fff1d2', emissiveIntensity: 0.25, roughness: 0.2, metalness: 0 }), []);
  useEffect(() => () => matLente.dispose(), [matLente]);
  const lampara = useMemo(() => {
    const pos: [number, number, number] = banco ? [2.6, 0, 6.4] : [Math.max(7, (mision?.obsX ?? 20) * 0.45), 0, 9.5];
    const meta = banco ? new THREE.Vector3(Math.max(4, alcanceMax * 0.45), Math.max(2, altMax * 0.5), 0) : new THREE.Vector3((mision?.targetX ?? 60) * 0.4, (mision?.y0 ?? 20) * 0.8, 0);
    const d = meta.clone().sub(new THREE.Vector3(pos[0], 1.66, pos[2]));
    return { pos, giro: Math.atan2(d.x, d.z), cabeceo: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
  }, [banco, mision, alcanceMax, altMax]);

  const foco = useMemo<[number, number, number, number]>(() => {
    if (banco) return [Math.max(10, xMeta / 2), 0, 0, Math.max(26, xMeta * 0.7)];
    const tx = mision?.targetX ?? 60;
    return [tx / 2, 0, 0, Math.max(40, tx * 0.68)];
  }, [banco, xMeta, mision]);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Ambiente mundo={mundo} calidad={p.calidad} />
      <Luces mundo={mundo} calidad={p.calidad} foco={foco} />
      <Camara def={def} reducido={reducido} encuadre={encuadre} clave={`${modo}|${mision?.targetX ?? 0}|${mision?.y0 ?? 0}`} />
      <Colinas material={matColina} />
      {mundo.arboles && <Arboleda mats={mats} />}
      <Terreno mats={mats} matSuelo={matSuelo} />
      <group position={[0, y0, 0]} scale={K}>
        <Canon mats={mats} angulo={angulo} retroceso={retroceso} matCuadrante={matCuadrante} />
      </group>
      {banco && <Calderin mats={mats} valvula={valvula} />}
      <Lampara mats={mats} matLente={matLente} position={lampara.pos} giro={lampara.giro} cabeceo={lampara.cabeceo} />
      <Destellos reloj={reloj} mat={matLente} reducido={reducido} />
      {banco && <Pantalla mats={mats} alto={altoPantalla} grupo={pantalla} />}
      {!banco && mision && (
        <>
          <Torre mats={mats} y0={mision.y0} />
          <Muro mats={mats} x={mision.obsX} alto={mision.obsY} />
          <Diana mats={mats} x={mision.targetX} radio={RADIO_DIANA} />
          <Dron mats={mats} x={mision.targetX} abatido={p.abatido} reducido={reducido} />
          {mision.escenario !== 'luna' && <MangaViento mats={mats} viento={mision.viento} position={[14, 0, -9]} reducido={reducido} />}
        </>
      )}
      {/* trayectorias */}
      <Cinta tr={tiro} color="#fff7e6" ancho={1.5} opacidad={0.95} reloj={reloj} crece pieza="trayectoria" />
      {/* colores saturados: el ACES del posproceso los aclara hacia los del dock */}
      {banco && <Cinta tr={vacio} color="#3f9dff" ancho={1.3} opacidad={0.95} trazo={0.55} reloj={reloj} crece={false} pieza="vacio" />}
      {banco && <Cinta tr={comp} color="#a06bff" ancho={1.3} opacidad={0.95} trazo={0.55} reloj={reloj} crece={false} visible={capas.complementario} pieza="complementario" />}
      {!banco && guia && reloj.fase !== 'vuelo' && <Cinta tr={guia} color="#e9eef3" ancho={1.1} opacidad={0.75} trazo={0.6} reloj={reloj} crece={false} pieza="guia" />}
      <Balin reloj={reloj} mats={mats} capas={capas} modo={modo} xPantalla={xPantalla} altoPantalla={altoPantalla} y0={y0} />
      <Vectores reloj={reloj} visible={capas.vectores} escala={escVec} />
      <Bocanadas reloj={reloj} y0={y0} reducido={reducido} />
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} />
      <DiagnosticoDev reloj={reloj} calidad={p.calidad} def={def} />
    </group>
  );
}

export default function TiroParabolico3DScene(props: TiroSceneProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const mats = useMemo(() => crearMateriales(calidad), [calidad]);
  useEffect(() => () => { mats.todos.forEach((m) => m.dispose()); mats.texturas.forEach((t) => t.dispose()); }, [mats]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloF01[]>([]);
  const escenario: Escenario = props.modo === 'reto' ? props.mision?.escenario ?? 'tierra' : 'tierra';
  const mundo = MUNDOS[escenario] ?? MUNDOS.tierra;
  const dprMedia = typeof window !== 'undefined' ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-f01="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="soft"
        dpr={alta ? [1, 2] : [dprMedia, dprMedia]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [10, 8, 60], fov: 32, near: 0.3, far: 7000 }}
        onPointerMissed={() => rotulo.current(null)}
      >
        <ControlesBanco objetivo={[14, 5, 0]} fondo="campo"
          limites={{ minDistancia: 3, maxDistancia: 520, maxPolar: 1.52, minPolar: 0.15, paneo: true, cajaObjetivo: [[-20, -3, -40], [160, 70, 40]] }} />
        <Poligono p={props} mats={mats} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} mundo={mundo} />
        <AvisarListo onListo={props.onListo} />
        {alta && <Posproceso />}
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1420]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-f01={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}

export { CANON };
