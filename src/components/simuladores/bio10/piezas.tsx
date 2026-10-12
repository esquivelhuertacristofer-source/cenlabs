'use client';
/**
 * bio10/piezas.tsx — depredador–presa de Lotka-Volterra (1 u = 1 dm; modelo a escala de un prado).
 *
 * Piezas: liebres y linces como modelos 3D instanciados (cada liebre vale `PRESAS_POR_LIEBRE`
 * presas; cada lince, un depredador), y dos tableros con las gráficas del experimento:
 *   · N(t): poblaciones frente al tiempo, con ejes y escala legibles;
 *   · plano de fase x–y: la órbita (sentido de giro) alrededor del punto de equilibrio.
 *
 * Honestidad: el modelo del dominio es el clásico (sin capacidad de carga): no se dibuja
 * ninguna asíntota ni hacinamiento artificial. Las gráficas muestran sólo lo simulado.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  useMateriales, geoCache, cajaRedondeada, useTexturaLienzo, familiaTexto, FAMILIA_MONO, azar, pasoBonito, numeroEje,
} from '../_kit';

type V3 = [number, number, number];
export type Punto = { t: number; presas: number; depredadores: number };

export const PRESAS_POR_LIEBRE = 4;
export const MAX_LIEBRES = 160;
export const DEPRED_POR_LINCE = 2;
export const MAX_LINCES = 100;

// ───────────────────────────── modelos ─────────────────────────────

function pieza(g: THREE.BufferGeometry, color: string, pos: V3, escala: V3, rot: V3 = [0, 0, 0]): THREE.BufferGeometry {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...escala));
  const c = g.clone();
  c.applyMatrix4(m);
  c.deleteAttribute('uv');
  const col = new THREE.Color(color), n = c.getAttribute('position').count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
  c.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return c;
}
const ESF = new THREE.SphereGeometry(1, 14, 10);
const CIL = new THREE.CylinderGeometry(1, 1, 1, 8);
const CONO = new THREE.ConeGeometry(1, 1, 8);

/** Liebre (Lepus): mira hacia +Z, apoyada en y = 0, ~1,9 u de largo. */
function geoLiebre(): THREE.BufferGeometry {
  const P: THREE.BufferGeometry[] = [
    pieza(ESF, '#8b857a', [0, 0.58, 0], [0.4, 0.4, 0.85]),
    pieza(ESF, '#e9dcc4', [0, 0.4, 0.06], [0.32, 0.24, 0.7]),
    pieza(ESF, '#76705f', [0.3, 0.46, -0.5], [0.2, 0.34, 0.42]),
    pieza(ESF, '#76705f', [-0.3, 0.46, -0.5], [0.2, 0.34, 0.42]),
    pieza(ESF, '#6f6a5c', [0.3, 0.07, -0.18], [0.1, 0.07, 0.5]),
    pieza(ESF, '#6f6a5c', [-0.3, 0.07, -0.18], [0.1, 0.07, 0.5]),
    pieza(CIL, '#857f72', [0.16, 0.28, 0.52], [0.065, 0.56, 0.065]),
    pieza(CIL, '#857f72', [-0.16, 0.28, 0.52], [0.065, 0.56, 0.065]),
    pieza(ESF, '#948e82', [0, 0.9, 0.8], [0.25, 0.25, 0.36]),
    pieza(ESF, '#e7b8b8', [0, 0.82, 1.12], [0.065, 0.06, 0.06]),
    pieza(ESF, '#111111', [0.15, 0.97, 0.94], [0.04, 0.04, 0.04]),
    pieza(ESF, '#111111', [-0.15, 0.97, 0.94], [0.04, 0.04, 0.04]),
    pieza(ESF, '#8b857a', [0.1, 1.4, 0.62], [0.07, 0.5, 0.14], [-0.28, 0, 0.08]),
    pieza(ESF, '#8b857a', [-0.1, 1.4, 0.62], [0.07, 0.5, 0.14], [-0.28, 0, -0.08]),
    pieza(ESF, '#1a1a1a', [0.12, 1.84, 0.5], [0.065, 0.11, 0.12], [-0.28, 0, 0.08]),
    pieza(ESF, '#1a1a1a', [-0.12, 1.84, 0.5], [0.065, 0.11, 0.12], [-0.28, 0, -0.08]),
    pieza(ESF, '#f4f1ea', [0, 0.68, -0.92], [0.14, 0.14, 0.14]),
  ];
  const g = mergeGeometries(P, false)!;
  P.forEach((x) => x.dispose());
  return g;
}

/** Lince (Lynx): mira hacia +Z, ~3,2 u de largo, orejas con mechón negro y collar de pelo claro. */
function geoLince(): THREE.BufferGeometry {
  const rnd = azar(14);
  const P: THREE.BufferGeometry[] = [
    pieza(ESF, '#d38d3f', [0, 1.2, 0], [0.5, 0.56, 1.25]),
    pieza(ESF, '#e6d8bc', [0, 0.98, 0.1], [0.4, 0.3, 1.0]),
    ...([[0.34, 0.68], [-0.34, 0.68], [0.34, -0.7], [-0.34, -0.7]] as [number, number][]).flatMap(([x, z]) => [
      pieza(CIL, '#bf7a2e', [x, 0.52, z], [0.13, 1.04, 0.13]),
      pieza(ESF, '#e6d9bf', [x, 0.06, z + 0.06], [0.16, 0.09, 0.22]),
    ]),
    pieza(CIL, '#d38d3f', [0, 1.55, 1.05], [0.28, 0.5, 0.28], [0.9, 0, 0]),
    pieza(ESF, '#d99a4e', [0, 1.72, 1.5], [0.42, 0.4, 0.45]),
    pieza(ESF, '#efe6d3', [0.38, 1.58, 1.46], [0.22, 0.3, 0.11], [0, 0.4, 0]),
    pieza(ESF, '#efe6d3', [-0.38, 1.58, 1.46], [0.22, 0.3, 0.11], [0, -0.4, 0]),
    pieza(ESF, '#e9dcc6', [0, 1.58, 1.9], [0.18, 0.14, 0.2]),
    pieza(ESF, '#5a3a3a', [0, 1.66, 2.08], [0.06, 0.045, 0.05]),
    pieza(ESF, '#f2d21a', [0.17, 1.8, 1.88], [0.05, 0.05, 0.05]),
    pieza(ESF, '#f2d21a', [-0.17, 1.8, 1.88], [0.05, 0.05, 0.05]),
    pieza(CONO, '#bf7a2e', [0.25, 2.2, 1.4], [0.14, 0.4, 0.12], [-0.1, 0, -0.12]),
    pieza(CONO, '#bf7a2e', [-0.25, 2.2, 1.4], [0.14, 0.4, 0.12], [-0.1, 0, 0.12]),
    pieza(CONO, '#111111', [0.28, 2.5, 1.38], [0.05, 0.22, 0.05], [-0.1, 0, -0.12]),
    pieza(CONO, '#111111', [-0.28, 2.5, 1.38], [0.05, 0.22, 0.05], [-0.1, 0, 0.12]),
    pieza(CIL, '#bf7a2e', [0, 1.12, -1.42], [0.12, 0.55, 0.12], [-1.15, 0, 0]),
    pieza(ESF, '#161616', [0, 0.93, -1.66], [0.12, 0.12, 0.13]),
    // manchas oscuras del pelaje
    ...Array.from({ length: 16 }, () => {
      const a = rnd() * Math.PI - Math.PI / 2, z = (rnd() - 0.5) * 2.0;
      return pieza(ESF, '#3b2512', [Math.sin(a) * 0.5 * 0.96, 1.2 + Math.cos(a) * 0.56 * 0.96, z], [0.07, 0.07, 0.05]);
    }),
  ];
  const g = mergeGeometries(P, false)!;
  P.forEach((x) => x.dispose());
  return g;
}

// ───────────────────────────── fauna ─────────────────────────────

interface Agente { hx: number; hz: number; ax: number; az: number; w: number; fase: number; esc: number }

function agentes(n: number, semilla: number, zona: { x: number; z0: number; z1: number }, esc: number): Agente[] {
  const rnd = azar(semilla);
  return Array.from({ length: n }, (_, i) => {
    // reparto uniforme con ángulo áureo en una franja de prado
    const u = (i + 0.5) / n;
    return {
      hx: (((i * 0.6180339887) % 1) - 0.5) * 2 * zona.x,
      hz: zona.z0 + ((u * 7.13) % 1) * (zona.z1 - zona.z0),
      ax: 0.8 + rnd() * 1.4, az: 0.5 + rnd() * 1.0, w: 0.18 + rnd() * 0.22, fase: rnd() * 6.283, esc: esc * (0.9 + rnd() * 0.2),
    };
  });
}

export function Fauna({ presas, depredadores }: { presas: number; depredadores: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 }), []);
  useEffect(() => () => { mat.dispose(); }, [mat]);
  const nL = presas < 1 ? 0 : Math.min(MAX_LIEBRES, Math.max(1, Math.round(presas / PRESAS_POR_LIEBRE)));
  const nC = depredadores < 1 ? 0 : Math.min(MAX_LINCES, Math.max(1, Math.round(depredadores / DEPRED_POR_LINCE)));
  const liebres = useRef<THREE.InstancedMesh>(null), linces = useRef<THREE.InstancedMesh>(null);
  const gL = geoCache('bio10:liebre', geoLiebre), gC = geoCache('bio10:lince', geoLince);
  const aL = useMemo(() => agentes(MAX_LIEBRES, 3, { x: 10.5, z0: 1.5, z1: 9.0 }, 0.8), []);
  const aC = useMemo(() => agentes(MAX_LINCES, 9, { x: 10.5, z0: 1.0, z1: 9.5 }, 0.7), []);
  const d = useMemo(() => new THREE.Object3D(), []);
  const nRef = useRef({ nL, nC }); nRef.current = { nL, nC };
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const { nL: l, nC: c } = nRef.current;
    const pinta = (im: THREE.InstancedMesh | null, ag: Agente[], n: number, salto: boolean) => {
      if (!im) return;
      im.count = n;
      for (let i = 0; i < n; i++) {
        const a = ag[i];
        const x = a.hx + Math.sin(t * a.w + a.fase) * a.ax, z = a.hz + Math.cos(t * a.w * 0.8 + a.fase * 1.3) * a.az;
        const vx = Math.cos(t * a.w + a.fase) * a.ax * a.w, vz = -Math.sin(t * a.w * 0.8 + a.fase * 1.3) * a.az * a.w * 0.8;
        const salta = salto ? Math.abs(Math.sin(t * 5 + a.fase * 3)) : 0;
        d.position.set(x, salto ? salta * 0.35 : 0, z);
        d.rotation.set(salto ? -salta * 0.18 : 0, Math.atan2(vx, vz), 0);
        d.scale.setScalar(a.esc);
        d.updateMatrix();
        im.setMatrixAt(i, d.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    };
    pinta(liebres.current, aL, l, true);
    pinta(linces.current, aC, c, false);
  });
  return (
    <group>
      <instancedMesh ref={liebres} args={[gL, mat, MAX_LIEBRES]} castShadow frustumCulled={false} />
      <instancedMesh ref={linces} args={[gC, mat, MAX_LINCES]} castShadow frustumCulled={false} />
    </group>
  );
}

// ───────────────────────────── gráficas ─────────────────────────────

export const COLOR_PRESAS = '#d61f6b', COLOR_DEPRED = '#0a7e9c';
const AN = 1024, AL = 800;

interface Datos { historial: Punto[]; presas: number; depredadores: number; inicial: { x: number; y: number }; equilibrio: { x: number; y: number }; tMax: number; extincion: false | 'presas' | 'depredadores' | null }

function escalaEje(max: number): { tope: number; paso: number } {
  const paso = pasoBonito(Math.max(max, 1), 5);
  return { tope: Math.max(paso, Math.ceil((max * 1.05) / paso) * paso), paso };
}

function marco(ctx: CanvasRenderingContext2D, titulo: string) {
  const fam = familiaTexto();
  ctx.fillStyle = '#fbfbf7'; ctx.fillRect(0, 0, AN, AL);
  ctx.fillStyle = '#10212b'; ctx.font = `700 50px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(titulo, 40, 62);
}

function ejes(ctx: CanvasRenderingContext2D, area: { x: number; y: number; w: number; h: number }, xTope: number, xPaso: number, yTope: number, yPaso: number, xTit: string, yTit: string) {
  const fam = familiaTexto();
  ctx.lineWidth = 1.5; ctx.font = `600 44px ${FAMILIA_MONO}`; ctx.fillStyle = '#334155';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let v = 0; v <= xTope + 1e-9; v += xPaso) {
    const x = area.x + (v / xTope) * area.w;
    ctx.strokeStyle = 'rgba(16,33,43,0.14)'; ctx.beginPath(); ctx.moveTo(x, area.y); ctx.lineTo(x, area.y + area.h); ctx.stroke();
    ctx.fillText(numeroEje(v), x, area.y + area.h + 10);
  }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let v = 0; v <= yTope + 1e-9; v += yPaso) {
    const y = area.y + area.h - (v / yTope) * area.h;
    ctx.strokeStyle = 'rgba(16,33,43,0.14)'; ctx.beginPath(); ctx.moveTo(area.x, y); ctx.lineTo(area.x + area.w, y); ctx.stroke();
    ctx.fillText(numeroEje(v), area.x - 10, y);
  }
  ctx.strokeStyle = '#10212b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(area.x, area.y); ctx.lineTo(area.x, area.y + area.h); ctx.lineTo(area.x + area.w, area.y + area.h); ctx.stroke();
  ctx.fillStyle = '#10212b'; ctx.font = `600 44px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(xTit, area.x + area.w / 2, AL - 18);
  ctx.save(); ctx.translate(44, area.y + area.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yTit, 0, 0); ctx.restore();
}

export function dibujarSerie(ctx: CanvasRenderingContext2D, d: Datos) {
  const fam = familiaTexto();
  marco(ctx, 'Poblaciones en el tiempo');
  const area = { x: 190, y: 160, w: AN - 190 - 44, h: AL - 160 - 140 };
  const pts: Punto[] = d.historial.length ? d.historial : [{ t: 0, presas: d.inicial.x, depredadores: d.inicial.y }];
  const maxY = Math.max(d.inicial.x, d.inicial.y, d.equilibrio.x, d.equilibrio.y, ...pts.map((p) => Math.max(p.presas, p.depredadores)));
  const { tope: yTope, paso: yPaso } = escalaEje(maxY);
  ejes(ctx, area, d.tMax, 10, yTope, yPaso, 'Tiempo (años)', 'Individuos');
  const X = (t: number) => area.x + (t / d.tMax) * area.w, Y = (v: number) => area.y + area.h - (Math.max(0, v) / yTope) * area.h;
  for (const [clave, color] of [['presas', COLOR_PRESAS], ['depredadores', COLOR_DEPRED]] as const) {
    ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath();
    pts.forEach((p, i) => { const x = X(p.t), y = Y(p[clave]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();
    const u = pts[pts.length - 1];
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X(u.t), Y(u[clave]), 9, 0, 6.283); ctx.fill();
  }
  // leyenda
  ctx.font = `600 40px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR_PRESAS; ctx.fillRect(40, 108, 40, 12); ctx.fillText('Presas', 90, 115);
  ctx.fillStyle = COLOR_DEPRED; ctx.fillRect(260, 108, 40, 12); ctx.fillText('Depredadores', 310, 115);
  if (d.extincion) {
    ctx.fillStyle = '#b91c1c'; ctx.font = `700 40px ${fam}`; ctx.textAlign = 'right';
    ctx.fillText(`se extinguieron las ${d.extincion}`, area.x + area.w - 12, area.y + 30);
  }
}

export function dibujarFase(ctx: CanvasRenderingContext2D, d: Datos) {
  const fam = familiaTexto();
  marco(ctx, 'Plano de fase');
  const area = { x: 190, y: 160, w: AN - 190 - 44, h: AL - 160 - 140 };
  const pts: Punto[] = d.historial.length ? d.historial : [{ t: 0, presas: d.inicial.x, depredadores: d.inicial.y }];
  const maxX = Math.max(d.inicial.x, d.equilibrio.x * 1.4, ...pts.map((p) => p.presas));
  const maxY = Math.max(d.inicial.y, d.equilibrio.y * 1.4, ...pts.map((p) => p.depredadores));
  const ex = escalaEje(maxX), ey = escalaEje(maxY);
  ejes(ctx, area, ex.tope, ex.paso, ey.tope, ey.paso, 'Presas', 'Depredadores');
  const X = (v: number) => area.x + (v / ex.tope) * area.w, Y = (v: number) => area.y + area.h - (v / ey.tope) * area.h;
  // punto de equilibrio
  const qx = X(d.equilibrio.x), qy = Y(d.equilibrio.y);
  ctx.setLineDash([10, 8]); ctx.strokeStyle = 'rgba(16,33,43,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(qx, area.y); ctx.lineTo(qx, area.y + area.h); ctx.moveTo(area.x, qy); ctx.lineTo(area.x + area.w, qy); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#10212b'; ctx.beginPath(); ctx.arc(qx, qy, 8, 0, 6.283); ctx.fill();
  ctx.font = `600 40px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('equilibrio', qx + 14, qy - 8);
  // órbita: del color pálido (antiguo) al intenso (reciente), con flechas
  const n = pts.length;
  if (n > 1) {
    for (let i = 1; i < n; i++) {
      ctx.strokeStyle = `rgba(110,52,170,${0.25 + 0.75 * (i / n)})`; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(pts[i - 1].presas), Y(pts[i - 1].depredadores)); ctx.lineTo(X(pts[i].presas), Y(pts[i].depredadores)); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(110,52,170,0.95)';
    for (let i = 12; i < n; i += 24) {
      const a = pts[i - 1], b = pts[i];
      const ang = Math.atan2(Y(b.depredadores) - Y(a.depredadores), X(b.presas) - X(a.presas)), px = X(b.presas), py = Y(b.depredadores);
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  // inicio y estado actual
  ctx.strokeStyle = '#10212b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(d.inicial.x), Y(d.inicial.y), 10, 0, 6.283); ctx.stroke();
  ctx.fillStyle = '#10212b'; ctx.font = `600 40px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('inicio', X(d.inicial.x) + 16, Y(d.inicial.y) + 6);
  const u = pts[pts.length - 1];
  ctx.fillStyle = '#6e34aa'; ctx.beginPath(); ctx.arc(X(u.presas), Y(u.depredadores), 10, 0, 6.283); ctx.fill();
}

/** Tablero con una gráfica dibujada en lienzo, sobre dos postes. */
export function Tablero({ dibujar, datos, ancho = 9.8, alto = 7.65625, ...g }: {
  dibujar: (ctx: CanvasRenderingContext2D, d: Datos) => void; datos: Datos; ancho?: number; alto?: number;
} & React.ComponentProps<'group'>) {
  const m = useMateriales();
  const tex = useTexturaLienzo(AN, AL, (ctx) => dibujar(ctx, datos), [datos.historial, datos.presas, datos.depredadores, datos.inicial.x, datos.inicial.y, datos.equilibrio.x, datos.equilibrio.y, datos.extincion], { mipmaps: false });
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  useEffect(() => () => { mat.dispose(); }, [mat]);
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(ancho + 0.5, alto + 0.5, 0.18, 0.08)} material={m.carcasaOscura} castShadow />
      <mesh position={[0, 0, 0.095]} material={mat}><planeGeometry args={[ancho, alto]} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geoCache('bio10:poste', () => new THREE.BoxGeometry(0.22, 1, 0.22))} material={m.madera} position={[s * (ancho / 2 - 0.5), -alto / 2 - 1.9, -0.05]} scale={[1, 4.0, 1]} castShadow />
      ))}
    </group>
  );
}

export type { Datos };
