"use client";
/**
 * Q9 · Lupa atómica de la celda de Daniell (R3F). Dibuja el mundo de `atomico.ts` con
 * instancias (≈ 14 llamadas de dibujo) y lo mueve con la lectura del reloj de la celda:
 * la misma corriente, las mismas concentraciones y la misma pausa que el banco.
 *
 * Mientras esta vista está abierta, ELLA avanza el reloj (el banco no está montado).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { esfera, tuboPolilinea } from '../_kit';
import type { RelojCelda } from './reloj';
import { CABLE, GEO, MundoAtomico, OCTAEDRO, puntoRuta, reaccionesReales, ritmoVisible, rotar, sitio, type EntradaMundo, type V3 } from './atomico';
import { COLOR_ION } from './iones';

const TONO_ACES = 6;

/** Radios de dibujo (u ≈ 0,13 nm): esquemáticos, en proporción aproximada. */
const R = { metal: 1, ionM: 0.8, O: 0.5, H: 0.29, S: 0.78, K: 1.02, N: 0.55, e: 0.42 } as const;
const COS_H = 0.612, SIN_H = 0.791, OH = 0.72; // ángulo H–O–H de 104,5° y enlace O–H

const TETRA: V3[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(([x, y, z]) => [x / Math.sqrt(3), y / Math.sqrt(3), z / Math.sqrt(3)] as V3);
const TRIGONAL: V3[] = [0, 1, 2].map((k) => [Math.cos((k * 2 * Math.PI) / 3), Math.sin((k * 2 * Math.PI) / 3), 0] as V3);
/** perpendicular de cada dirección del octaedro (plano de los dos H de esa agua) */
const PERP: V3[] = [[0, 1, 0], [0, 1, 0], [0, 0, 1], [0, 0, 1], [1, 0, 0], [1, 0, 0]];

function entrada(reloj: RelojCelda): EntradaMundo {
  const l = reloj.lectura, e = reloj.estado;
  return { I: l.I, cerrado: l.cerrado && !reloj.agotada(), cAn: l.cIzq, cCa: l.cDer, c0An: e.c0Izq, c0Ca: e.c0Der };
}

// ───────────────────────────── ambiente ─────────────────────────────

function Ambiente() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.15;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(256, 230, 20, 256, 256, 400);
    grad.addColorStop(0, '#16304a'); grad.addColorStop(0.6, '#0b1828'); grad.addColorStop(1, '#050b14');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.75;
    return () => { scene.background = null; scene.environment = null; tex.dispose(); env.dispose(); pm.dispose(); };
  }, [gl, scene]);
  return (
    <>
      <hemisphereLight args={['#cfe2ff', '#0a0f18', 0.55]} />
      <directionalLight position={[18, 30, 42]} intensity={2.1} color="#fff3e2" />
      <directionalLight position={[-34, 12, -26]} intensity={1.1} color="#9cc8ff" />
      <directionalLight position={[30, -8, 20]} intensity={0.35} color="#ffd9c2" />
    </>
  );
}

/** Encuadre: todo el recuadro (de un electrodo al otro y el cable) cabe con margen. */
function Encuadre() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const movido = useRef(false);
  useEffect(() => {
    if (!controls) return;
    const f = () => { movido.current = true; };
    controls.addEventListener('start', f);
    return () => controls.removeEventListener('start', f);
  }, [controls]);
  useLayoutEffect(() => {
    if (!controls || movido.current) return;
    const asp = size.width / Math.max(1, size.height);
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const d = Math.max(32.5 / (t * asp), 21.5 / t);
    const dir = new THREE.Vector3(-0.1, 0.16, 1).normalize();
    controls.target.set(0, 5.5, 0);
    camera.position.copy(controls.target).addScaledVector(dir, d);
    controls.update();
  }, [camera, controls, size.width, size.height]);
  return null;
}

// ───────────────────────────── el recuadro ─────────────────────────────


function Escena({ reloj, reducido, onTick }: { reloj: React.MutableRefObject<RelojCelda>; reducido: boolean; onTick: (m: MundoAtomico) => void }) {
  const mundo = useRef<MundoAtomico>(new MundoAtomico(entrada(reloj.current)));
  const gen = useRef(reloj.current.generacion);

  const mats = useMemo(() => {
    const em = (color: string, intens: number) => new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.35), emissive: color, emissiveIntensity: intens, roughness: 0.3, metalness: 0 });
    return {
      zn: new THREE.MeshPhysicalMaterial({ color: '#b9c3cb', metalness: 0.92, roughness: 0.3, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
      cu: new THREE.MeshPhysicalMaterial({ color: '#dc8a5c', metalness: 0.95, roughness: 0.27, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
      ionZn: em(COLOR_ION.Zn, 1.6),
      ionCu: em(COLOR_ION.Cu, 1.7),
      O: new THREE.MeshPhysicalMaterial({ color: '#c9575b', roughness: 0.45, clearcoat: 0.2 }),
      H: new THREE.MeshPhysicalMaterial({ color: '#d9dee3', roughness: 0.45, clearcoat: 0.2 }),
      S: new THREE.MeshPhysicalMaterial({ color: '#f1c232', roughness: 0.35, clearcoat: 0.3 }),
      K: em(COLOR_ION.K, 0.7),
      N: new THREE.MeshPhysicalMaterial({ color: '#4c6fff', roughness: 0.35, clearcoat: 0.3 }),
      e: new THREE.MeshBasicMaterial({ color: new THREE.Color(COLOR_ION.e).multiplyScalar(3.2), toneMapped: false }),
      nucleoCable: new THREE.MeshPhysicalMaterial({ color: '#d98b5a', metalness: 1, roughness: 0.3 }),
      funda: new THREE.MeshPhysicalMaterial({ color: '#a9c3dc', roughness: 0.15, transparent: true, opacity: 0.16, depthWrite: false }),
      puente: new THREE.MeshPhysicalMaterial({ color: '#e4efe9', roughness: 0.5, transparent: true, opacity: 0.09, depthWrite: false }),
      aguaAn: new THREE.MeshBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.035, depthWrite: false }),
      aguaCa: new THREE.MeshBasicMaterial({ color: '#2a8fe0', transparent: true, opacity: 0.08, depthWrite: false }),
      borde: new THREE.LineBasicMaterial({ color: '#8fb3d1', transparent: true, opacity: 0.22 }),
    };
  }, []);
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()); }, [mats]);

  const geo = useMemo(() => ({ esf: esfera(1, 20), esfBaja: esfera(1, 12) }), []);
  const geoCable = useMemo(() => ({
    nucleo: tuboPolilinea(CABLE.flat(), 0.32, 10, true),
    funda: tuboPolilinea(CABLE.flat(), 0.95, 16, true),
  }), []);
  useEffect(() => () => { geoCable.nucleo.dispose(); geoCable.funda.dispose(); }, [geoCable]);
  const cajas = useMemo(() => {
    const anchoAn = GEO.xAnodo[1] - GEO.xAnodo[0] + 2.4, anchoCa = GEO.xCatodo[1] - GEO.xCatodo[0] + 2.4;
    const alto = GEO.y[1] - GEO.y[0] + 1, fondo = GEO.z[1] - GEO.z[0] + 1;
    return {
      an: new THREE.BoxGeometry(anchoAn, alto, fondo), ca: new THREE.BoxGeometry(anchoCa, alto, fondo),
      puente: new THREE.BoxGeometry(GEO.puente * 2, alto + 2, fondo + 1),
      bordePuente: new THREE.EdgesGeometry(new THREE.BoxGeometry(GEO.puente * 2, alto + 2, fondo + 1)),
      xAn: (GEO.xAnodo[0] + GEO.xAnodo[1]) / 2 - 0.6, xCa: (GEO.xCatodo[0] + GEO.xCatodo[1]) / 2 + 0.6,
    };
  }, []);
  useEffect(() => () => { cajas.an.dispose(); cajas.ca.dispose(); cajas.puente.dispose(); cajas.bordePuente.dispose(); }, [cajas]);

  const nRed = GEO.capas * GEO.filas * GEO.columnas;
  const mZn = useRef<THREE.InstancedMesh>(null), mCu = useRef<THREE.InstancedMesh>(null), mDep = useRef<THREE.InstancedMesh>(null);
  const mIZn = useRef<THREE.InstancedMesh>(null), mICu = useRef<THREE.InstancedMesh>(null), mO = useRef<THREE.InstancedMesh>(null), mH = useRef<THREE.InstancedMesh>(null);
  const mS = useRef<THREE.InstancedMesh>(null), mK = useRef<THREE.InstancedMesh>(null), mN = useRef<THREE.InstancedMesh>(null), mE = useRef<THREE.InstancedMesh>(null), mFl = useRef<THREE.InstancedMesh>(null);
  const flash = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe9b0').multiplyScalar(1.6), transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), []);
  useEffect(() => () => flash.dispose(), [flash]);

  // red de cobre: fija (capas 0…2 hacia +X)
  useLayoutEffect(() => {
    const m = mCu.current; if (!m) return;
    const t = new THREE.Matrix4();
    let n = 0;
    for (let capa = 0; capa < GEO.capas; capa++) for (let f = 0; f < GEO.filas; f++) for (let c = 0; c < GEO.columnas; c++) {
      const p = sitio('Cu', capa, f, c);
      t.makeScale(R.metal, R.metal, R.metal).setPosition(p[0], p[1], p[2]);
      m.setMatrixAt(n++, t);
    }
    m.count = n; m.instanceMatrix.needsUpdate = true;
  }, [mCu]);

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3() }), []);

  // el reloj de la celda avanza aquí (prioridad −1), antes de dibujar
  useFrame((_, dt) => { reloj.current.paso(dt); }, -1);

  useFrame((_, dt) => {
    const r = reloj.current;
    if (r.generacion !== gen.current) { gen.current = r.generacion; mundo.current = new MundoAtomico(entrada(r)); }
    const W = mundo.current;
    if (!r.pausa) W.paso(reducido ? dt * 0.6 : dt, entrada(r));
    mats.aguaCa.opacity = 0.03 + 0.07 * Math.min(1.2, r.lectura.cDer);

    const pon = (mesh: THREE.InstancedMesh, i: number, p: V3, rad: number) => {
      tmp.p.set(p[0], p[1], p[2]); tmp.s.set(rad, rad, rad); tmp.q.identity();
      tmp.m.compose(tmp.p, tmp.q, tmp.s); mesh.setMatrixAt(i, tmp.m);
    };
    const refs = [mZn, mDep, mIZn, mICu, mO, mH, mS, mK, mN, mE, mFl];
    if (refs.some((x) => !x.current)) return;
    const M = { zn: mZn.current!, dep: mDep.current!, iZn: mIZn.current!, iCu: mICu.current!, O: mO.current!, H: mH.current!, S: mS.current!, K: mK.current!, N: mN.current!, e: mE.current!, fl: mFl.current! };
    const n = { zn: 0, dep: 0, iZn: 0, iCu: 0, O: 0, H: 0, S: 0, K: 0, N: 0, e: 0, fl: 0 };
    const capO = 1100, capH = 1300;

    // red de zinc (con los huecos de los átomos que se oxidaron)
    for (let capa = 0; capa < GEO.capas; capa++) for (let f = 0; f < GEO.filas; f++) for (let c = 0; c < GEO.columnas; c++) {
      const i = (capa * GEO.filas + f) * GEO.columnas + c;
      if (!W.zn[i]) continue;
      pon(M.zn, n.zn++, sitio('Zn', capa, f, c), R.metal * W.znEscala[i]);
    }
    // depósito de cobre
    for (let i = 0; i < W.cu.length; i++) if (W.cu[i] === 2) pon(M.dep, n.dep++, W.posHuecoCu(i), R.metal * W.cuEscala[i]);

    const agua = (o: V3, d: V3, e: V3, s: number) => {
      if (n.O >= capO || n.H + 2 > capH) return;
      pon(M.O, n.O++, o, R.O * s);
      for (const sg of [1, -1]) pon(M.H, n.H++, [o[0] + OH * (d[0] * COS_H + sg * e[0] * SIN_H), o[1] + OH * (d[1] * COS_H + sg * e[1] * SIN_H), o[2] + OH * (d[2] * COS_H + sg * e[2] * SIN_H)], R.H * s);
    };

    for (const p of W.particulas) {
      const s = p.escala;
      if (s <= 0.001) continue;
      if (p.especie === 'Zn2' || p.especie === 'Cu2') {
        const mesh = p.especie === 'Zn2' ? M.iZn : M.iCu;
        const k = p.especie === 'Zn2' ? n.iZn++ : n.iCu++;
        if (k >= 48) continue;
        pon(mesh, k, p.p, R.ionM * s);
        if (p.capa > 0.02) {
          const sc = s * p.capa;
          OCTAEDRO.forEach((d0, j) => {
            const d = rotar(p.q, d0), e = rotar(p.q, PERP[j]);
            const rr = GEO.rHidratacion * (0.6 + 0.4 * p.capa);
            agua([p.p[0] + d[0] * rr, p.p[1] + d[1] * rr, p.p[2] + d[2] * rr], d, e, sc);
          });
        }
      } else if (p.especie === 'H2O') {
        agua(p.p, rotar(p.q, [0, 1, 0]), rotar(p.q, [1, 0, 0]), s);
      } else if (p.especie === 'SO4') {
        if (n.S >= 48) continue;
        pon(M.S, n.S++, p.p, R.S * s);
        for (const t of TETRA) { const d = rotar(p.q, t); if (n.O < capO) pon(M.O, n.O++, [p.p[0] + d[0] * 1.3, p.p[1] + d[1] * 1.3, p.p[2] + d[2] * 1.3], R.O * s); }
      } else if (p.especie === 'K') {
        if (n.K >= 24) continue;
        pon(M.K, n.K++, p.p, R.K * s);
      } else if (p.especie === 'NO3') {
        if (n.N >= 24) continue;
        pon(M.N, n.N++, p.p, R.N * s);
        for (const t of TRIGONAL) { const d = rotar(p.q, t); if (n.O < capO) pon(M.O, n.O++, [p.p[0] + d[0] * 1.15, p.p[1] + d[1] * 1.15, p.p[2] + d[2] * 1.15], R.O * s); }
      }
    }
    for (const el of W.electrones) { if (el.s < 0 || n.e >= 48) continue; pon(M.e, n.e++, puntoRuta(el), R.e); }
    for (const d of W.destellos) { if (n.fl >= 16) break; pon(M.fl, n.fl++, d.p, 0.8 + 1.5 * d.t); }


    for (const k of Object.keys(n) as (keyof typeof n)[]) { const mesh = M[k]; mesh.count = n[k]; mesh.instanceMatrix.needsUpdate = true; }
    onTick(W);
  });

  return (
    <group>
      <instancedMesh ref={mZn} args={[geo.esf, mats.zn, nRed]} frustumCulled={false} />
      <instancedMesh ref={mCu} args={[geo.esf, mats.cu, nRed]} frustumCulled={false} />
      <instancedMesh ref={mDep} args={[geo.esf, mats.cu, 2 * GEO.filas * GEO.columnas]} frustumCulled={false} />
      <instancedMesh ref={mIZn} args={[geo.esf, mats.ionZn, 48]} frustumCulled={false} />
      <instancedMesh ref={mICu} args={[geo.esf, mats.ionCu, 48]} frustumCulled={false} />
      <instancedMesh ref={mO} args={[geo.esfBaja, mats.O, 1100]} frustumCulled={false} />
      <instancedMesh ref={mH} args={[geo.esfBaja, mats.H, 1300]} frustumCulled={false} />
      <instancedMesh ref={mS} args={[geo.esf, mats.S, 48]} frustumCulled={false} />
      <instancedMesh ref={mK} args={[geo.esf, mats.K, 24]} frustumCulled={false} />
      <instancedMesh ref={mN} args={[geo.esf, mats.N, 24]} frustumCulled={false} />
      <instancedMesh ref={mE} args={[geo.esfBaja, mats.e, 48]} frustumCulled={false} />
      <instancedMesh ref={mFl} args={[geo.esfBaja, flash, 16]} frustumCulled={false} />
      {/* disoluciones, puente y cable */}
      <mesh geometry={cajas.an} material={mats.aguaAn} position={[cajas.xAn, 0, 0]} />
      <mesh geometry={cajas.ca} material={mats.aguaCa} position={[cajas.xCa, 0, 0]} />
      <mesh geometry={cajas.puente} material={mats.puente} />
      <lineSegments geometry={cajas.bordePuente} material={mats.borde} />
      <mesh geometry={geoCable.nucleo} material={mats.nucleoCable} />
      <mesh geometry={geoCable.funda} material={mats.funda} />
    </group>
  );
}

// ───────────────────────────── rótulos y cifras (DOM) ─────────────────────────────

function sci(x: number) {
  if (!(x > 0)) return '0';
  const e = Math.floor(Math.log10(x)), m = x / 10 ** e;
  const sup = String(e).split('').map((ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(ch)] ?? '⁻').join('');
  return `${m.toFixed(1).replace('.', ',')} × 10${sup}`;
}

function Tarjeta({ className, color, titulo, children }: { className: string; color: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className={`pointer-events-none absolute max-w-[40%] rounded-xl border bg-[#07111d]/80 px-3 py-1.5 shadow-lg backdrop-blur ${className}`} style={{ borderColor: `${color}66` }}>
      <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color }}>{titulo}</p>
      <div className="text-[14px] leading-snug text-slate-100">{children}</div>
    </div>
  );
}

export default function VistaAtomica({ reloj, reducido }: { reloj: React.MutableRefObject<RelojCelda>; reducido: boolean }) {
  const [cifras, setCifras] = useState({ I: 0, ritmo: 0, reales: 0, cerrado: true, reacciones: 0, pausa: false });
  const ultimo = useRef(0);
  const onTick = useMemo(() => (m: MundoAtomico) => {
    const ahora = performance.now();
    if (ahora - ultimo.current < 250) return;
    ultimo.current = ahora;
    const r = reloj.current, en = entrada(r);
    setCifras({ I: Math.abs(r.lectura.I), ritmo: en.cerrado ? ritmoVisible(en.I) : 0, reales: en.cerrado ? reaccionesReales(en.I) : 0, cerrado: en.cerrado, reacciones: m.reacciones, pausa: r.pausa });
  }, [reloj]);
  return (
    <div className="absolute inset-0" data-vista-atomica="">
      <Canvas dpr={[1, 1.75]} gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }} camera={{ position: [0, 8, 80], fov: 30, near: 1, far: 600 }}>
        <Ambiente />
        <OrbitControls makeDefault enablePan={false} enableDamping minDistance={35} maxDistance={140}
          minPolarAngle={0.7} maxPolarAngle={2.0} minAzimuthAngle={-0.9} maxAzimuthAngle={0.9} />
        <Encuadre />
        <Escena reloj={reloj} reducido={reducido} onTick={onTick} />
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <Bloom mipmapBlur intensity={0.75} luminanceThreshold={1.1} luminanceSmoothing={0.2} radius={0.6} />
          <ToneMapping mode={TONO_ACES} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      </Canvas>
      {/* lo que pasa en cada electrodo: la escena de la lupa no oculta nada (sólo se abre en la celda de Daniell) */}
      <Tarjeta className="left-3 top-12" color={COLOR_ION.Zn} titulo="Ánodo · oxidación">
        <span className="font-mono">Zn(s) → Zn²⁺(aq) + 2e⁻</span>
        <span className="block text-[13px] text-slate-300">El átomo deja 2 e⁻ en el metal y sale rodeado de 6 aguas.</span>
      </Tarjeta>
      <Tarjeta className="right-3 top-12 text-right" color={COLOR_ION.Cu} titulo="Cátodo · reducción">
        <span className="font-mono">Cu²⁺(aq) + 2e⁻ → Cu(s)</span>
        <span className="block text-[13px] text-slate-300">El ion suelta sus aguas, toma 2 e⁻ y queda como cobre.</span>
      </Tarjeta>
      <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center px-3">
        <div className="max-w-[640px] rounded-xl border border-white/10 bg-[#07111d]/80 px-3 py-2 text-center text-[13px] leading-snug text-slate-200 shadow-lg backdrop-blur" data-cifras-atomicas="">
          {cifras.pausa ? 'En pausa.' : !cifras.cerrado
            ? 'Sin corriente: con el circuito abierto los electrones no tienen por dónde ir y la reacción se detiene.'
            : <>La pila real hace <b className="text-white">{sci(cifras.reales)}</b> reacciones por segundo (I = {(cifras.I * 1000).toFixed(2).replace('.', ',')} mA). Aquí ves <b className="text-white">{cifras.ritmo.toFixed(1).replace('.', ',')}</b> por segundo.</>}
          <span className="block text-[13px] text-slate-300">
            <span style={{ color: COLOR_ION.e }}>e⁻</span> por el cable, del zinc al cobre · por el puente salino entran <span style={{ color: COLOR_ION.K }}>K⁺</span> al cobre y <span style={{ color: COLOR_ION.NO3 }}>NO₃⁻</span> al zinc
          </span>
          <span className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[13px] text-slate-300">
            <Punto c={COLOR_ION.Zn}>Zn²⁺</Punto><Punto c={COLOR_ION.Cu}>Cu²⁺</Punto><Punto c="#c9575b">O</Punto><Punto c="#d9dee3">H</Punto>
            <Punto c="#f1c232">S (SO₄²⁻)</Punto><Punto c={COLOR_ION.K}>K⁺</Punto><Punto c="#4c6fff">N (NO₃⁻)</Punto><Punto c={COLOR_ION.e}>e⁻</Punto>
          </span>
        </div>
      </div>
    </div>
  );
}

function Punto({ c, children }: { c: string; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />{children}</span>;
}
