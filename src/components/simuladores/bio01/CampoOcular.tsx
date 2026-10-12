'use client';
/**
 * bio01/CampoOcular.tsx — lo que se ve POR EL OCULAR (R3F, cámara ortográfica).
 *
 * Mundo en micrómetros. La cámara mira la preparación desde arriba, con luz
 * transmitida (telón claro detrás). Dos representaciones de la MISMA preparación
 * (las células salen del mismo hash, ver muestras.ts):
 *   · 4x y 10x  → mosaico dibujado en lienzo (a 4x no se resuelve una célula suelta:
 *                 sería un millón de triángulos que ningún ojo distingue)
 *   · 40x y 100x → geometría: paredes, citoplasma, vacuola, cloroplastos con ciclosis,
 *                 membranas y núcleos, bacilos y cocos instanciados.
 * El desenfoque y el brillo NO se calculan aquí: los aplica el contenedor con los
 * valores del dominio (desenfoqueB1, brilloEfectivoB1).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LabCanvas, useCalidad, crearLienzo, texturaDeLienzo, extruir, geoCache, azar } from '../_kit';
import {
  campoUm, celulasElodea, cloroplastosDe, posicionParietal, celulasMucosa, bacteriasYogur, ELODEA, hash,
  type Ventana, type CelulaVegetal,
} from './muestras';

export type Muestra = 'vegetal' | 'animal' | 'bacteria';

const FONDO: Record<Muestra, string> = { vegetal: '#f6f3e2', animal: '#ebe8f1', bacteria: '#f3e7ee' };
const TRAVESIA = 0.45; // el recorrido completo de la platina desplaza 0,45 campos

interface Props {
  muestra: Muestra;
  mag: number;
  posX: number;
  posY: number;
}

// ───────────────────────────── materiales ─────────────────────────────

function useMat<T extends THREE.Material>(crear: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(crear, deps);
  useEffect(() => () => { m.dispose(); }, [m]);
  return m;
}

/** Tejido translúcido: transmisión con atenuación en calidad alta; transparencia simple en media. */
function tejido(alta: boolean, o: { color: string; atenuacion: string; dist: number; grosor: number; opacidad: number; rug?: number }) {
  if (alta) {
    return new THREE.MeshPhysicalMaterial({
      color: o.color, roughness: o.rug ?? 0.3, transmission: 0.92, thickness: o.grosor, ior: 1.36,
      attenuationColor: new THREE.Color(o.atenuacion), attenuationDistance: o.dist,
      sheen: 0.5, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.5,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: o.color, roughness: o.rug ?? 0.35, transparent: true, opacity: o.opacidad, depthWrite: false,
    sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.5,
  });
}

// ───────────────────────────── instancias ─────────────────────────────

interface PropsInst {
  geo: THREE.BufferGeometry; mat: THREE.Material; n: number;
  rellenar: (k: number, d: THREE.Object3D, color: THREE.Color) => void;
  colores?: boolean; renderOrder?: number;
  /** referencia al InstancedMesh (para animar) */
  malla?: React.MutableRefObject<THREE.InstancedMesh | null>;
}
function Instancias({ geo, mat, n, rellenar, colores = false, renderOrder = 0, malla }: PropsInst) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    if (malla) malla.current = m;
    const d = new THREE.Object3D(); const c = new THREE.Color();
    for (let k = 0; k < n; k++) {
      d.position.set(0, 0, 0); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1);
      rellenar(k, d, c);
      d.updateMatrix(); m.setMatrixAt(k, d.matrix);
      if (colores) m.setColorAt(k, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    return () => { if (malla) malla.current = null; };
  }, [n, rellenar, colores, malla]);
  if (n <= 0) return null;
  return <instancedMesh key={n} ref={ref} args={[geo, mat, n]} frustumCulled={false} renderOrder={renderOrder} castShadow={false} receiveShadow={false} />;
}

const cajaUnidad = () => geoCache('bio01:caja', () => new THREE.BoxGeometry(1, 1, 1));
const esferaUnidad = () => geoCache('bio01:esf', () => new THREE.SphereGeometry(1, 12, 9));
const esferaLigera = () => geoCache('bio01:esf-lig', () => new THREE.SphereGeometry(1, 8, 6));
const capsulaUnidad = () => geoCache('bio01:cap', () => new THREE.CapsuleGeometry(0.5, 1, 3, 8));

// ───────────────────────────── 4x y 10x: mosaico ─────────────────────────────

function dibujarMosaico(ctx: CanvasRenderingContext2D, W: number, muestra: Muestra, semi: number, mag: number) {
  const s = W / (2 * semi);
  const X = (x: number) => (x + semi) * s, Y = (y: number) => (semi - y) * s;
  const v: Ventana = { cx: 0, cy: 0, semi };
  ctx.fillStyle = FONDO[muestra]; ctx.fillRect(0, 0, W, W);
  if (muestra === 'vegetal') {
    const rnd = azar(3);
    for (const c of celulasElodea(v)) {
      const x = X(c.x - c.w / 2), y = Y(c.y + c.h / 2), w = c.w * s, h = c.h * s;
      const tono = hash(c.i, c.j, 9);
      const rr = Math.min(w, h) * 0.18;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, rr);
      ctx.fillStyle = `rgb(${150 + tono * 18},${168 + tono * 14},${70 + tono * 12})`; ctx.fill(); // pared (más oscura)
      const t = Math.max(1, 3 * s);
      ctx.beginPath(); ctx.roundRect(x + t, y + t, w - 2 * t, h - 2 * t, rr * 0.8);
      ctx.fillStyle = `rgb(${214 + tono * 10},${230 + tono * 8},${158 + tono * 10})`; ctx.fill(); // citoplasma+vacuola
      if (mag >= 10) {
        // cloroplastos: puntos verdes en la capa parietal
        ctx.fillStyle = '#2f7a24';
        for (const cl of cloroplastosDe(c)) {
          const [px, py] = posicionParietal(c, cl.a, cl.r);
          ctx.beginPath(); ctx.ellipse(X(c.x + px), Y(c.y + py), Math.max(1.1, cl.L * 0.62 * s), Math.max(1, cl.A * 0.62 * s), 0, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // a 4x la hoja se ve verde por la suma de cloroplastos
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, 'rgba(70,140,50,0.55)'); g.addColorStop(0.5, 'rgba(110,170,70,0.25)'); g.addColorStop(1, 'rgba(70,140,50,0.55)');
        ctx.fillStyle = g; ctx.fillRect(x + t, y + t, w - 2 * t, h - 2 * t);
      }
    }
    void rnd;
  } else if (muestra === 'animal') {
    for (const c of celulasMucosa(v)) {
      ctx.save();
      ctx.translate(X(c.x), Y(c.y)); ctx.rotate(-c.rot); ctx.scale(s, s);
      ctx.beginPath();
      c.contorno.forEach(([px, py], k) => { if (k === 0) ctx.moveTo(px, -py); else ctx.lineTo(px, -py); });
      ctx.closePath();
      ctx.fillStyle = 'rgba(176,196,232,0.55)'; ctx.fill();
      ctx.lineWidth = Math.max(1.2 / s, 1.4); ctx.strokeStyle = 'rgba(78,100,166,0.9)'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(c.nx, -c.ny, c.nr * 1.1, c.nr, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#26398a'; ctx.fill();
      ctx.restore();
    }
  } else {
    // bacterias: demasiado pequeñas para resolverlas; se ven como un granulado violeta
    ctx.fillStyle = 'rgba(86,52,140,0.5)';
    const lado = mag >= 10;
    for (const b of bacteriasYogur(v)) {
      if (!lado && hash(Math.round(b.x), Math.round(b.y), 3) > 0.3) continue;
      ctx.beginPath();
      if (lado && !b.coco) {
        ctx.lineWidth = Math.max(1, 1.1 * s); ctx.strokeStyle = 'rgba(78,44,134,0.8)';
        const dx = Math.cos(b.rot) * b.L * 0.5 * s, dy = Math.sin(b.rot) * b.L * 0.5 * s;
        ctx.moveTo(X(b.x) - dx, Y(b.y) + dy); ctx.lineTo(X(b.x) + dx, Y(b.y) - dy); ctx.stroke();
      } else {
        ctx.arc(X(b.x), Y(b.y), Math.max(0.9, 0.55 * s * (lado ? 1 : 3)), 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

function Mosaico({ muestra, mag }: { muestra: Muestra; mag: number }) {
  const semi = campoUm(mag);
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = crearLienzo(2048, 2048);
    dibujarMosaico(c.getContext('2d')!, 2048, muestra, semi, mag);
    return texturaDeLienzo(c);
  }, [muestra, semi, mag]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  const mat = useMat(() => new THREE.MeshPhysicalMaterial({
    color: '#000000', emissive: '#ffffff', emissiveMap: tex ?? undefined, emissiveIntensity: 1,
    roughness: 1, sheen: 0.3, sheenColor: new THREE.Color('#ffffff'), toneMapped: false,
  }), [tex]);
  if (!tex) return null;
  return (
    <mesh material={mat} position={[0, 0, 0]}>
      <planeGeometry args={[2 * semi, 2 * semi]} />
    </mesh>
  );
}

// ───────────────────────────── 40x y 100x: vegetal ─────────────────────────────

function Elodea3D({ semi, alta }: { semi: number; alta: boolean }) {
  const celulas = useMemo(() => celulasElodea({ cx: 0, cy: 0, semi }), [semi]);
  const cloros = useMemo(() => {
    const out: { c: CelulaVegetal; a: number; r: number; L: number; A: number; w: number }[] = [];
    for (const c of celulas) for (const cl of cloroplastosDe(c)) out.push({ c, a: cl.a, r: cl.r, L: cl.L, A: cl.A, w: cl.w });
    return out;
  }, [celulas]);
  const tw = 3.6;
  const pared = useMat(() => new THREE.MeshPhysicalMaterial({
    color: '#8c9c3c', roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#eef4b0'), sheenRoughness: 0.4, clearcoat: 0.15,
  }), []);
  const cuerpo = useMat(() => tejido(alta, { color: '#f1f7d2', atenuacion: '#a6cf5c', dist: 70, grosor: 4, opacidad: 0.55 }), [alta]);
  const vacuola = useMat(() => tejido(alta, { color: '#fafde8', atenuacion: '#d8e8a8', dist: 160, grosor: 3, opacidad: 0.3, rug: 0.15 }), [alta]);
  const cloroMat = useMat(() => new THREE.MeshPhysicalMaterial({
    color: '#3c8a2c', roughness: 0.45, sheen: 0.8, sheenColor: new THREE.Color('#9fd97a'), sheenRoughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.4,
  }), []);
  const nucMat = useMat(() => new THREE.MeshPhysicalMaterial({
    color: '#c9d27c', roughness: 0.4, sheen: 0.5, sheenColor: new THREE.Color('#ffffff'), transparent: true, opacity: 0.9,
  }), []);
  const malla = useRef<THREE.InstancedMesh | null>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);

  const rParedes = useMemo(() => (k: number, d: THREE.Object3D) => {
    const c = celulas[k]; d.position.set(c.x, c.y, 0); d.scale.set(c.w, c.h, 4);
  }, [celulas]);
  const rCuerpo = useMemo(() => (k: number, d: THREE.Object3D) => {
    const c = celulas[k]; d.position.set(c.x, c.y, 0.9); d.scale.set(c.w - 2 * tw, c.h - 2 * tw, 3.4);
  }, [celulas]);
  const rVac = useMemo(() => (k: number, d: THREE.Object3D) => {
    const c = celulas[k]; d.position.set(c.x, c.y, 1.4); d.scale.set(c.w - 2 * (ELODEA.parietal + tw + 1), c.h - 2 * (ELODEA.parietal + tw + 1), 3.6);
  }, [celulas]);
  const rNuc = useMemo(() => (k: number, d: THREE.Object3D) => {
    const c = celulas[k];
    d.position.set(c.x + (hash(c.i, c.j, 11) - 0.5) * (c.w - 40), c.y + (c.h / 2 - 9) * (hash(c.i, c.j, 12) > 0.5 ? 1 : -1), 3.2);
    d.scale.set(5.2, 3.8, 2.2);
  }, [celulas]);

  // ciclosis: los cloroplastos recorren lentamente la capa parietal
  const fr = useRef(0);
  useFrame(({ clock }) => {
    const m = malla.current; if (!m) return;
    if ((fr.current++ & 1) !== 0) return;
    const t = clock.elapsedTime * 22; // 1 s real ≈ 22 «unidades de ciclosis»
    for (let k = 0; k < cloros.length; k++) {
      const q = cloros[k];
      const [px, py, rot] = posicionParietal(q.c, q.a + q.w * t, q.r);
      tmp.position.set(q.c.x + px, q.c.y + py, 3.5); tmp.rotation.set(0, 0, rot + Math.PI / 2 * 0 + (k % 3) * 0.3);
      tmp.scale.set(q.L * 0.5, q.A * 0.5, q.A * 0.5);
      tmp.updateMatrix(); m.setMatrixAt(k, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  const rClor = useMemo(() => (k: number, d: THREE.Object3D) => {
    const q = cloros[k]; const [px, py, rot] = posicionParietal(q.c, q.a, q.r);
    d.position.set(q.c.x + px, q.c.y + py, 3.5); d.rotation.z = rot; d.scale.set(q.L * 0.5, q.A * 0.5, q.A * 0.5);
  }, [cloros]);

  return (
    <group>
      <Instancias geo={cajaUnidad()} mat={pared} n={celulas.length} rellenar={rParedes} />
      <Instancias geo={cajaUnidad()} mat={cuerpo} n={celulas.length} rellenar={rCuerpo} renderOrder={1} />
      <Instancias geo={cajaUnidad()} mat={vacuola} n={celulas.length} rellenar={rVac} renderOrder={2} />
      <Instancias geo={esferaUnidad()} mat={nucMat} n={celulas.length} rellenar={rNuc} renderOrder={3} />
      <Instancias geo={esferaLigera()} mat={cloroMat} n={cloros.length} rellenar={rClor} malla={malla} />
    </group>
  );
}

// ───────────────────────────── 40x y 100x: mucosa ─────────────────────────────

function Mucosa3D({ semi, alta }: { semi: number; alta: boolean }) {
  const celulas = useMemo(() => celulasMucosa({ cx: 0, cy: 0, semi }), [semi]);
  const { membrana, cuerpo } = useMemo(() => {
    const lm: THREE.BufferGeometry[] = [], lc: THREE.BufferGeometry[] = [];
    for (const c of celulas) {
      const pts = c.contorno.map(([x, y]) => new THREE.Vector3(x, y, 0));
      const curva = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
      const forma = new THREE.Shape(curva.getPoints(44).map((p) => new THREE.Vector2(p.x, p.y)));
      const m = new THREE.Matrix4().compose(new THREE.Vector3(c.x, c.y, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, c.rot)), new THREE.Vector3(1, 1, 1));
      const g1 = extruir(forma, 1.6, 6); g1.scale(1.05, 1.05, 1); g1.applyMatrix4(m); lm.push(g1);
      const g2 = extruir(forma, 2.2, 6); g2.applyMatrix4(m); lc.push(g2);
    }
    const mm = lm.length ? mergeGeometries(lm, false) : null, mc = lc.length ? mergeGeometries(lc, false) : null;
    lm.forEach((g) => g.dispose()); lc.forEach((g) => g.dispose());
    return { membrana: mm, cuerpo: mc };
  }, [celulas]);
  useEffect(() => () => { membrana?.dispose(); cuerpo?.dispose(); }, [membrana, cuerpo]);

  const matMem = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#4e64a6', roughness: 0.4, sheen: 0.5, sheenColor: new THREE.Color('#aab8e6') }), []);
  const matCito = useMat(() => tejido(alta, { color: '#dfe7f8', atenuacion: '#7d97d6', dist: 10, grosor: 3, opacidad: 0.6, rug: 0.5 }), [alta]);
  const matNuc = useMat(() => new THREE.MeshPhysicalMaterial({
    color: '#27398a', roughness: 0.38, sheen: 0.7, sheenColor: new THREE.Color('#8ea2ec'), sheenRoughness: 0.4, clearcoat: 0.25,
  }), []);
  const matGran = useMat(() => new THREE.MeshPhysicalMaterial({ color: '#f3f6ff', roughness: 0.5, transparent: true, opacity: 0.75 }), []);

  const rNuc = useMemo(() => (k: number, d: THREE.Object3D) => {
    const c = celulas[k];
    const co = Math.cos(c.rot), si = Math.sin(c.rot);
    d.position.set(c.x + c.nx * co - c.ny * si, c.y + c.nx * si + c.ny * co, 2.4);
    d.scale.set(c.nr * 1.1, c.nr, c.nr * 0.55);
  }, [celulas]);
  const granulos = useMemo(() => {
    const out: [number, number, number][] = [];
    for (const c of celulas) for (let g = 0; g < 14; g++) {
      const a = hash(c.i, c.j, 300 + g) * Math.PI * 2, r = Math.sqrt(hash(c.i, c.j, 330 + g)) * 22;
      out.push([c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 0.4 + hash(c.i, c.j, 360 + g) * 0.6]);
    }
    return out;
  }, [celulas]);
  const rGran = useMemo(() => (k: number, d: THREE.Object3D) => {
    const g = granulos[k]; d.position.set(g[0], g[1], 2.3); d.scale.setScalar(g[2]);
  }, [granulos]);

  return (
    <group>
      {membrana && <mesh geometry={membrana} material={matMem} position={[0, 0, -0.1]} />}
      {cuerpo && <mesh geometry={cuerpo} material={matCito} renderOrder={1} />}
      <Instancias geo={esferaUnidad()} mat={matNuc} n={celulas.length} rellenar={rNuc} renderOrder={2} />
      <Instancias geo={esferaLigera()} mat={matGran} n={granulos.length} rellenar={rGran} renderOrder={3} />
    </group>
  );
}

// ───────────────────────────── 40x y 100x: bacterias ─────────────────────────────

function Yogur3D({ semi }: { semi: number }) {
  const bacterias = useMemo(() => bacteriasYogur({ cx: 0, cy: 0, semi }), [semi]);
  const matBac = useMat(() => new THREE.MeshPhysicalMaterial({
    color: '#4a2c88', roughness: 0.4, sheen: 0.8, sheenColor: new THREE.Color('#a58ae0'), sheenRoughness: 0.35, clearcoat: 0.3,
  }), []);
  const rBac = useMemo(() => (k: number, d: THREE.Object3D, col: THREE.Color) => {
    const b = bacterias[k];
    d.position.set(b.x, b.y, 1);
    if (b.coco) { d.scale.setScalar(b.r * 1.9); }
    else { d.rotation.z = b.rot - Math.PI / 2; d.scale.set(b.r * 2, b.L / 2, b.r * 2); }
    const t = hash(k, 7, 1);
    col.setRGB(0.55 + t * 0.35, 0.5 + t * 0.35, 0.75 + t * 0.2); // matiz casi blanco: multiplica el color del material
  }, [bacterias]);
  const cocos = useMemo(() => bacterias.filter((b) => b.coco), [bacterias]);
  const bacilos = useMemo(() => bacterias.filter((b) => !b.coco), [bacterias]);
  const rCoco = useMemo(() => (k: number, d: THREE.Object3D, col: THREE.Color) => {
    const b = cocos[k]; d.position.set(b.x, b.y, 1); d.scale.setScalar(b.r * 1.9); const t = hash(k, 7, 2); col.setRGB(0.6 + t * 0.4, 0.55 + t * 0.4, 0.8 + t * 0.2);
  }, [cocos]);
  const rBacilo = useMemo(() => (k: number, d: THREE.Object3D, col: THREE.Color) => {
    const b = bacilos[k]; d.position.set(b.x, b.y, 1); d.rotation.z = b.rot - Math.PI / 2; d.scale.set(b.r * 2, b.L / 2, b.r * 2);
    const t = hash(k, 7, 3); col.setRGB(0.6 + t * 0.4, 0.55 + t * 0.4, 0.8 + t * 0.2);
  }, [bacilos]);
  void rBac;
  return (
    <group>
      <Instancias geo={esferaLigera()} mat={matBac} n={cocos.length} rellenar={rCoco} colores />
      <Instancias geo={capsulaUnidad()} mat={matBac} n={bacilos.length} rellenar={rBacilo} colores />
    </group>
  );
}

// ───────────────────────────── cámara y composición ─────────────────────────────

/** Cámara ortográfica: el diámetro del campo ocupa todo el lienzo (zoom = píxeles por µm). */
function Rig({ mag }: { mag: number }) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  const campo = campoUm(mag);
  useLayoutEffect(() => {
    if (!camera.isOrthographicCamera) return;
    camera.zoom = Math.min(size.width, size.height) / campo;
    camera.position.set(0, 0, 600);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, campo]);
  return null;
}

/** La preparación: la platina la desplaza (el recorrido completo ≈ 0,45 campos). */
function Preparacion({ muestra, mag, posX, posY }: Props) {
  const alta = useCalidad() === 'alta';
  const camposemi = campoUm(mag);
  const grupo = useRef<THREE.Group>(null);
  const campo = campoUm(mag);
  useFrame(() => {
    const g = grupo.current; if (!g) return;
    g.position.x += ((posX / 500) * TRAVESIA * campo - g.position.x) * 0.2;
    g.position.y += ((-posY / 500) * TRAVESIA * campo - g.position.y) * 0.2;
  });
  const alto = mag >= 40;
  return (
    <group ref={grupo}>
      {!alto && <Mosaico muestra={muestra} mag={mag} />}
      {alto && muestra === 'vegetal' && <Elodea3D semi={camposemi} alta={alta} />}
      {alto && muestra === 'animal' && <Mucosa3D semi={camposemi} alta={alta} />}
      {alto && muestra === 'bacteria' && <Yogur3D semi={camposemi} />}
    </group>
  );
}

function Telon({ muestra }: { muestra: Muestra }) {
  const mat = useMat(() => new THREE.MeshBasicMaterial({ color: FONDO[muestra], toneMapped: false }), [muestra]);
  return (
    <mesh material={mat} position={[0, 0, -30]}>
      <planeGeometry args={[40000, 40000]} />
    </mesh>
  );
}

export default function CampoOcular({ muestra, mag, posX, posY }: Props) {
  return (
    <LabCanvas fondo="pizarron" controles={false} sombras={false} camara={{ posicion: [0, 0, 600], objetivo: [0, 0, 0], fov: 35 }}>
      <OrthographicCamera makeDefault position={[0, 0, 600]} near={1} far={4000} zoom={1} />
      <Rig mag={mag} />
      <Telon muestra={muestra} />
      <Preparacion muestra={muestra} mag={mag} posX={posX} posY={posY} />
    </LabCanvas>
  );
}
