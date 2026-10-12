'use client';
/**
 * bio06/piezas.tsx — selección natural en las polillas de Manchester (1 u = 1 dm).
 *
 * Piezas: tronco de roble con corteza (limpia con líquenes / ennegrecida por hollín),
 * rama, polilla Biston betularia (forma típica clara y forma carbonaria oscura) y el
 * ave depredadora (un carbonero).
 *
 * Honestidad: la polilla es IDÉNTICA en las dos formas salvo el dibujo de sus alas
 * (el mismo tamaño, la misma pose, el mismo material). Lo único que la delata es el
 * contraste con la corteza, que es justo lo que se estudia: ningún halo, brillo ni
 * marca distingue a la «conveniente».
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { geoCache, texturaCompartida, azar } from '../_kit';

export type Ambiente = 'limpio' | 'industrial';
type Ctx = CanvasRenderingContext2D;

// ───────────────────────────── geometría del tronco ─────────────────────────────

export const R_TRONCO = 4;          // radio del roble (0,8 m de diámetro)
export const Z_EJE = -R_TRONCO;     // el eje queda detrás: la cara visible está en z = 0
export const ALTO_TRONCO = 16;
const THETA_MAX = 0.95;             // arco de corteza donde se posan las polillas (± rad)
const H_MIN = 0.55, H_MAX = 6.15;   // franja de altura útil

/** Posición sobre el tronco a partir de los % del store (x: 0–100, y: 0–100, 0 arriba). */
export function puntoDeTronco(xPct: number, yPct: number): { theta: number; h: number } {
  return {
    theta: THREE.MathUtils.mapLinear(xPct, 0, 100, -THETA_MAX, THETA_MAX),
    h: THREE.MathUtils.mapLinear(yPct, 0, 100, H_MAX, H_MIN),
  };
}

/**
 * Separa un poco las polillas que el sorteo dejó encimadas (sólo la POSICIÓN dibujada;
 * no cambia el estado). Determinista: la misma lista da siempre la misma disposición.
 */
export function relajarPosiciones(puntos: { id: number; theta: number; h: number }[], dMin = 0.9): Map<number, { theta: number; h: number }> {
  const p = puntos.map((q) => ({ id: q.id, s: q.theta * R_TRONCO, h: q.h }));
  const sMax = THETA_MAX * R_TRONCO;
  for (let it = 0; it < 40; it++) {
    let mov = false;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const dx = p[j].s - p[i].s, dy = p[j].h - p[i].h;
        const d = Math.hypot(dx, dy);
        if (d < dMin) {
          const nx = d > 1e-6 ? dx / d : 1, ny = d > 1e-6 ? dy / d : 0;
          const f = (dMin - d) / 2;
          p[i].s -= nx * f; p[i].h -= ny * f; p[j].s += nx * f; p[j].h += ny * f;
          mov = true;
        }
      }
    }
    for (const q of p) { q.s = Math.min(sMax, Math.max(-sMax, q.s)); q.h = Math.min(H_MAX, Math.max(H_MIN, q.h)); }
    if (!mov) break;
  }
  return new Map(p.map((q) => [q.id, { theta: q.s / R_TRONCO, h: q.h }]));
}

export function posicionEnTronco(theta: number, h: number, sobre = 0): THREE.Vector3 {
  const r = R_TRONCO + sobre;
  return new THREE.Vector3(r * Math.sin(theta), h, Z_EJE + r * Math.cos(theta));
}

// ───────────────────────────── texturas de corteza ─────────────────────────────

const TAM = 512;

/** Dibuja `fn` en la posición y en sus copias desplazadas, para que la textura repita sin costura. */
function envolver(ctx: Ctx, w: number, h: number, x: number, y: number, r: number, fn: (dx: number, dy: number) => void) {
  fn(0, 0);
  if (x < r) fn(w, 0);
  if (x > w - r) fn(-w, 0);
  if (y < r) fn(0, h);
  if (y > h - r) fn(0, -h);
  void ctx;
}

function dibujarCorteza(ctx: Ctx, w: number, h: number, a: Ambiente) {
  const limpio = a === 'limpio';
  const rnd = azar(limpio ? 31 : 47);
  const base = limpio ? '#a8a295' : '#2d2927';
  const cresta = limpio ? '#b9b3a5' : '#443e39';
  const grieta = limpio ? '#625c52' : '#0b0908';
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  // crestas verticales, más claras, con ondulación periódica en y (la textura repite)
  const franja = (x0: number, ancho: number, color: string, alfa: number, fase: number, k: number, amp: number, variar = false) => {
    ctx.strokeStyle = color; ctx.globalAlpha = alfa; ctx.lineCap = 'round';
    for (const off of [-w, 0, w]) {
      let xa = 0, ya = 0, anchoI = ancho;
      for (let y = 0; y <= h; y += 8) {
        const x = x0 + off + Math.sin((y / h) * Math.PI * 2 * k + fase) * amp;
        if (y > 0) { ctx.lineWidth = anchoI; ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(x, y); ctx.stroke(); }
        if (variar) anchoI = Math.max(ancho * 0.25, ancho * (0.55 + 0.9 * Math.abs(Math.sin(y * 0.05 + fase * 3))));
        xa = x; ya = y;
      }
    }
  };
  for (let i = 0; i < 34; i++) franja(rnd() * w, 12 + rnd() * 20, cresta, 0.5, rnd() * 6.28, 1 + Math.floor(rnd() * 2), 2 + rnd() * 5);
  // surcos profundos entre las crestas, de ancho irregular
  for (let i = 0; i < 46; i++) franja(rnd() * w, 3 + rnd() * 6, grieta, 0.85, rnd() * 6.28, 1 + Math.floor(rnd() * 2), 3 + rnd() * 7, true);
  // grietas cortas transversales
  ctx.strokeStyle = grieta; ctx.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const x = rnd() * w, y = rnd() * h, l = 6 + rnd() * 20;
    ctx.globalAlpha = 0.35 + rnd() * 0.3; ctx.lineWidth = 1 + rnd() * 1.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - 0.5) * l, y + (rnd() - 0.5) * 5); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // grano fino
  const granos = limpio ? ['#6b655a', '#d2cdbf'] : ['#000000', '#5a524b'];
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * w, y = rnd() * h, r = 0.6 + rnd() * 1.6;
    ctx.fillStyle = granos[i % 2]; ctx.globalAlpha = 0.18 + rnd() * 0.28;
    envolver(ctx, w, h, x, y, r, (dx, dy) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 6.283); ctx.fill(); });
  }
  ctx.globalAlpha = 1;
  if (limpio) {
    // líquenes foliosos y crustosos: manchas verde grisáceo y blanquecinas con borde irregular
    const tonos = ['#c9d0b4', '#d9dccb', '#b3bf9c', '#e3e2d6'];
    for (let i = 0; i < 38; i++) {
      const cx = rnd() * w, cy = rnd() * h, R = 9 + rnd() * 24;
      const tono = tonos[Math.floor(rnd() * tonos.length)];
      const n = 16 + Math.floor(R * 1.4);
      for (let k = 0; k < n; k++) {
        const ang = rnd() * 6.283, d = Math.sqrt(rnd()) * R;
        const x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d * 0.8, r = 2 + rnd() * 5.5;
        ctx.fillStyle = tono; ctx.globalAlpha = 0.72;
        envolver(ctx, w, h, x, y, r, (dx, dy) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 6.283); ctx.fill(); });
        ctx.fillStyle = '#7f8a69'; ctx.globalAlpha = 0.28;
        envolver(ctx, w, h, x + 1.2, y + 1.2, r * 0.55, (dx, dy) => { ctx.beginPath(); ctx.arc(x + 1.2 + dx, y + 1.2 + dy, r * 0.55, 0, 6.283); ctx.fill(); });
      }
    }
  } else {
    // hollín: vetas más negras y muy pocos restos de liquen muerto, grises y opacos
    for (let i = 0; i < 14; i++) {
      const cx = rnd() * w, cy = rnd() * h, R = 5 + rnd() * 9;
      for (let k = 0; k < 14; k++) {
        const ang = rnd() * 6.283, d = Math.sqrt(rnd()) * R;
        const x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d, r = 1.6 + rnd() * 3.2;
        ctx.fillStyle = '#4a4a43'; ctx.globalAlpha = 0.6;
        envolver(ctx, w, h, x, y, r, (dx, dy) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 6.283); ctx.fill(); });
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** Textura de corteza (compartida y cacheada por ambiente). */
export function texturaCorteza(a: Ambiente): THREE.Texture | null {
  return texturaCompartida('bio06:corteza:' + a, TAM, TAM, (ctx, w, h) => dibujarCorteza(ctx, w, h, a), { repetir: [5, 3] });
}

// ───────────────────────────── polilla ─────────────────────────────

export type FenotipoPolilla = 'clara' | 'oscura';
const W_ALAS = 0.75; // envergadura (≈ 7 cm, un poco exagerada para que se lea)

/** Contorno de las alas extendidas en coordenadas de textura [0,1]² (la cabeza hacia +y). */
function formaAlas(): THREE.Shape {
  const X = (u: number) => 0.5 + u, Y = (v: number) => 0.5 + v;
  const s = new THREE.Shape();
  s.moveTo(X(0), Y(0.3));
  s.quadraticCurveTo(X(0.26), Y(0.31), X(0.5), Y(0.13));       // borde costal hasta el ápice
  s.quadraticCurveTo(X(0.51), Y(-0.04), X(0.42), Y(-0.17));      // margen externo
  s.quadraticCurveTo(X(0.38), Y(-0.31), X(0.22), Y(-0.28));      // ala posterior
  s.quadraticCurveTo(X(0.1), Y(-0.34), X(0), Y(-0.25));
  s.quadraticCurveTo(X(-0.1), Y(-0.34), X(-0.22), Y(-0.28));
  s.quadraticCurveTo(X(-0.38), Y(-0.31), X(-0.42), Y(-0.17));
  s.quadraticCurveTo(X(-0.51), Y(-0.04), X(-0.5), Y(0.13));
  s.quadraticCurveTo(X(-0.26), Y(0.31), X(0), Y(0.3));
  return s;
}
const geoAlas = () => geoCache('bio06:alas', () => {
  const g = new THREE.ShapeGeometry(formaAlas(), 14);
  g.translate(-0.5, -0.5, 0);
  return g;
});
const geoCuerpo = () => geoCache('bio06:cuerpo', () => new THREE.SphereGeometry(1, 14, 10));
const geoDisco = () => geoCache('bio06:disco', () => new THREE.CircleGeometry(1, 20));

function dibujarAlas(ctx: Ctx, w: number, h: number, f: FenotipoPolilla) {
  const rnd = azar(f === 'clara' ? 5 : 9);
  const clara = f === 'clara';
  ctx.fillStyle = clara ? '#e4e0d2' : '#1b1a19'; ctx.fillRect(0, 0, w, h);
  // la «sal y pimienta» de la forma típica / el tenue moteado de la carbonaria
  const motas = clara ? ['#2a2825', '#8a857a'] : ['#33312d', '#0c0b0a'];
  for (let i = 0; i < (clara ? 520 : 380); i++) {
    const x = rnd() * w, y = rnd() * h, r = 0.8 + rnd() * (clara ? 2.4 : 2.0);
    ctx.fillStyle = motas[i % 2]; ctx.globalAlpha = clara ? 0.55 + rnd() * 0.35 : 0.35 + rnd() * 0.3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }
  // bandas transversales onduladas, comunes a ambas formas
  ctx.lineCap = 'round';
  for (const [yy, ancho] of [[0.36, 9], [0.56, 7]] as const) {
    ctx.strokeStyle = clara ? '#6e6a60' : '#2c2a27'; ctx.globalAlpha = clara ? 0.55 : 0.6; ctx.lineWidth = ancho * (w / 256);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y = h * yy + Math.sin((x / w) * 12.5 + yy * 9) * h * 0.022;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function texturaAlas(f: FenotipoPolilla): THREE.Texture | null {
  return texturaCompartida('bio06:alas:' + f, 256, 256, (ctx, w, h) => dibujarAlas(ctx, w, h, f), {});
}

/**
 * Polilla posada con las alas abiertas sobre el plano local XY (la cabeza hacia +Y,
 * la superficie del tronco en z = 0). `onClick` hace de blanco de caza.
 */
export function Polilla({ fenotipo, onClick, escala = 1, objetivo = true }: {
  fenotipo: FenotipoPolilla; onClick?: () => void; escala?: number; objetivo?: boolean;
}) {
  const tex = texturaAlas(fenotipo);
  const mats = useMemo(() => {
    const clara = fenotipo === 'clara';
    return {
      alas: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0, side: THREE.DoubleSide }),
      cuerpo: new THREE.MeshStandardMaterial({ color: clara ? '#d3cfc1' : '#242321', roughness: 0.95 }),
      antena: new THREE.MeshBasicMaterial({ color: clara ? '#6b675d' : '#3a3835' }),
      blanco: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    };
  }, [fenotipo, tex]);
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()); }, [mats]);
  const W = W_ALAS * escala;
  return (
    <group scale={escala}>
      <mesh geometry={geoAlas()} material={mats.alas} scale={[W_ALAS, W_ALAS, 1]} />
      {/* abdomen, tórax y cabeza */}
      <mesh geometry={geoCuerpo()} material={mats.cuerpo} position={[0, -0.09, 0.025]} scale={[0.055, 0.2, 0.05]} />
      <mesh geometry={geoCuerpo()} material={mats.cuerpo} position={[0, 0.13, 0.03]} scale={[0.07, 0.085, 0.06]} />
      <mesh geometry={geoCuerpo()} material={mats.cuerpo} position={[0, 0.235, 0.03]} scale={[0.05, 0.045, 0.045]} />
      {/* antenas plumosas */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geoCuerpo()} material={mats.antena} position={[s * 0.07, 0.31, 0.02]} rotation={[0, 0, -s * 0.5]} scale={[0.008, 0.1, 0.008]} />
      ))}
      {objetivo && (
        <mesh geometry={geoDisco()} material={mats.blanco} position={[0, 0, 0.05]} scale={[W * 0.62, W * 0.62, 1]}
          onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
          onPointerOver={onClick ? (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; } : undefined}
          onPointerOut={onClick ? () => { document.body.style.cursor = ''; } : undefined} />
      )}
    </group>
  );
}

// ───────────────────────────── tronco y rama ─────────────────────────────

export function Tronco({ ambiente }: { ambiente: Ambiente }) {
  const mat = useCorteza(ambiente);
  const geo = geoCache('bio06:tronco', () => new THREE.CylinderGeometry(R_TRONCO, R_TRONCO, ALTO_TRONCO, 72, 1, false));
  return (
    <group>
      <mesh geometry={geo} material={mat} position={[0, ALTO_TRONCO / 2 - 0.2, Z_EJE]} castShadow receiveShadow />
    </group>
  );
}

function useCorteza(a: Ambiente): THREE.MeshStandardMaterial {
  const tex = texturaCorteza(a);
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 3, roughness: 1, metalness: 0 }), [tex]);
  useEffect(() => () => { m.dispose(); }, [m]);
  return m;
}

/** Rama gruesa que sale del tronco hacia la derecha; el ave se posa en `PERCHA`. */
export const RAMA_A = new THREE.Vector3(2.6, 6.4, -3.1);
export const RAMA_B = new THREE.Vector3(7.4, 7.5, -1.5);
export const PERCHA = RAMA_A.clone().lerp(RAMA_B, 0.82);

export function Rama({ ambiente }: { ambiente: Ambiente }) {
  const mat = useCorteza(ambiente);
  const { pos, quat, largo } = useMemo(() => {
    const d = RAMA_B.clone().sub(RAMA_A);
    const largo = d.length();
    return {
      pos: RAMA_A.clone().add(RAMA_B).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()),
      largo,
    };
  }, []);
  const geo = geoCache('bio06:rama', () => new THREE.CylinderGeometry(0.12, 0.3, 1, 14, 1));
  return <mesh geometry={geo} material={mat} position={pos} quaternion={quat} scale={[1, largo, 1]} castShadow />;
}

// ───────────────────────────── el ave (carbonero) ─────────────────────────────

export interface RefsAve {
  alaI: React.RefObject<THREE.Group | null>;
  alaD: React.RefObject<THREE.Group | null>;
  cabeza: React.RefObject<THREE.Group | null>;
  presa: React.RefObject<THREE.Group | null>;
}

/**
 * Carbonero: cabeza negra con mejilla blanca, dorso verde oliva, pecho amarillo.
 * Mira hacia +Z local. Las alas (pivotes en `alaI`/`alaD`) las anima la escena:
 * plegadas hacia atrás al posarse, abiertas y batiendo en vuelo.
 */
export function Ave({ refs, children }: { refs: RefsAve; children?: React.ReactNode }) {
  const m = useMemo(() => ({
    dorso: new THREE.MeshStandardMaterial({ color: '#7b8a4a', roughness: 0.85 }),
    pecho: new THREE.MeshStandardMaterial({ color: '#e8c63a', roughness: 0.85 }),
    cabeza: new THREE.MeshStandardMaterial({ color: '#16191d', roughness: 0.7 }),
    mejilla: new THREE.MeshStandardMaterial({ color: '#f4f4ef', roughness: 0.8 }),
    ala: new THREE.MeshStandardMaterial({ color: '#5e7186', roughness: 0.85, side: THREE.DoubleSide }),
    pico: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.5 }),
    pata: new THREE.MeshStandardMaterial({ color: '#4c4f55', roughness: 0.8 }),
  }), []);
  useEffect(() => () => { Object.values(m).forEach((x) => x.dispose()); }, [m]);
  const esf = geoCuerpo();
  const cono = geoCache('bio06:pico', () => new THREE.ConeGeometry(1, 1, 8));
  const cil = geoCache('bio06:pata', () => new THREE.CylinderGeometry(1, 1, 1, 6));
  return (
    <group>
      <mesh geometry={esf} material={m.dorso} position={[0, 0.02, 0]} scale={[0.27, 0.25, 0.56]} castShadow />
      <mesh geometry={esf} material={m.pecho} position={[0, -0.06, 0.08]} scale={[0.25, 0.2, 0.47]} />
      <mesh geometry={esf} material={m.ala} position={[0, -0.02, -0.78]} rotation={[-0.12, 0, 0]} scale={[0.13, 0.05, 0.38]} castShadow />
      <group ref={refs.cabeza} position={[0, 0.2, 0.46]}>
        <mesh geometry={esf} material={m.cabeza} scale={[0.19, 0.19, 0.19]} castShadow />
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh geometry={esf} material={m.mejilla} position={[s * 0.115, -0.04, 0.06]} scale={[0.07, 0.1, 0.11]} />
            <mesh geometry={esf} material={m.pico} position={[s * 0.135, 0.04, 0.115]} scale={[0.02, 0.02, 0.02]} />
          </group>
        ))}
        <mesh geometry={cono} material={m.pico} position={[0, -0.01, 0.23]} rotation={[Math.PI / 2, 0, 0]} scale={[0.05, 0.16, 0.05]} />
        <group ref={refs.presa} position={[0, -0.03, 0.34]} rotation={[0, 0, 0]} visible={false}>{children}</group>
      </group>
      {/* alas: pivote en el hombro; eje largo del ala hacia ±X cuando está abierta */}
      <group ref={refs.alaD} position={[0.2, 0.1, 0.1]}>
        <mesh geometry={esf} material={m.ala} position={[0.26, 0, -0.04]} scale={[0.3, 0.03, 0.17]} castShadow />
      </group>
      <group ref={refs.alaI} position={[-0.2, 0.1, 0.1]}>
        <mesh geometry={esf} material={m.ala} position={[-0.26, 0, -0.04]} scale={[0.3, 0.03, 0.17]} castShadow />
      </group>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={cil} material={m.pata} position={[s * 0.09, -0.3, 0.04]} scale={[0.018, 0.2, 0.018]} />
      ))}
    </group>
  );
}
