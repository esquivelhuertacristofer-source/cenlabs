/**
 * _kit/texturas.ts — texturas de lienzo (canvas) para graduaciones, carátulas,
 * pantallas y superficies procedurales. TODO se dibuja en el navegador: ni una
 * petición de red (escuelas con filtro).
 *
 * Reglas de este proyecto:
 *  - Toda textura que se MINIFICA (graduaciones, superficies) lleva mipmaps,
 *    LinearMipmapLinearFilter y anisotropy 8; sin eso las rayas parpadean al
 *    girar la cámara.
 *  - El texto usa la familia tipográfica del <body> (Outfit, servida en local por
 *    next/font). troika (<Text> de drei) NO sirve: no acepta woff2 y, si falta un
 *    glifo, descarga fuentes de un CDN.
 */
import * as THREE from 'three';
import { useEffect, useMemo, useState } from 'react';

// ───────────────────────────── tipografía ─────────────────────────────

let familiaCache: string | null = null;
/** Familia del body (Outfit de next/font) con respaldo del sistema. */
export function familiaTexto(): string {
  if (familiaCache) return familiaCache;
  if (typeof document === 'undefined') return 'system-ui, sans-serif';
  const f = getComputedStyle(document.body).fontFamily;
  familiaCache = (f && f.length > 2 ? f : 'Outfit') + ', "Segoe UI", system-ui, sans-serif';
  return familiaCache;
}
export const FAMILIA_MONO = '"Consolas", "DejaVu Sans Mono", "Menlo", monospace';

let versionFuentes = 0;
const oyentes = new Set<() => void>();
let fuentesPedidas = false;
function pedirFuentes() {
  if (fuentesPedidas || typeof document === 'undefined' || !document.fonts) return;
  fuentesPedidas = true;
  const fam = familiaTexto();
  Promise.all([
    document.fonts.load(`400 32px ${fam}`), document.fonts.load(`600 32px ${fam}`), document.fonts.load(`700 32px ${fam}`),
  ]).catch(() => undefined).then(() => document.fonts.ready).then(() => {
    versionFuentes++;
    oyentes.forEach((f) => f());
  });
}
/** Número que cambia cuando terminan de cargar las fuentes (para redibujar lienzos). */
export function useVersionFuentes(): number {
  const [v, setV] = useState(versionFuentes);
  useEffect(() => {
    pedirFuentes();
    const f = () => setV(versionFuentes);
    oyentes.add(f);
    if (versionFuentes !== v) f();
    return () => { oyentes.delete(f); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

// ───────────────────────────── creación de texturas ─────────────────────────────

export interface OpcionesTextura {
  mipmaps?: boolean;
  srgb?: boolean;
  repetir?: [number, number];
}

export function crearLienzo(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
  return c;
}

/** CanvasTexture con los filtros correctos del proyecto. */
export function texturaDeLienzo(c: HTMLCanvasElement, { mipmaps = true, srgb = true, repetir }: OpcionesTextura = {}): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = mipmaps;
  t.minFilter = mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repetir[0], repetir[1]); }
  t.needsUpdate = true;
  return t;
}

export type Dibujo = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/**
 * Textura de lienzo de vida ligada al componente: se crea una vez por tamaño y se
 * REDIBUJA (sin crear otra) cuando cambian `deps` o terminan de cargar las fuentes.
 * Se libera al desmontar.
 */
export function useTexturaLienzo(w: number, h: number, dibujar: Dibujo, deps: unknown[], opciones?: OpcionesTextura): THREE.CanvasTexture | null {
  const vf = useVersionFuentes();
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return texturaDeLienzo(crearLienzo(w, h), opciones);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  useMemo(() => {
    if (!tex) return;
    const c = tex.image as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    dibujar(ctx, c.width, c.height);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, vf, ...deps]);
  return tex;
}

// caché de texturas procedurales compartidas (nunca se liberan: son pocas)
const cacheTex = new Map<string, THREE.Texture>();
export function texturaCompartida(clave: string, w: number, h: number, dibujar: Dibujo, opciones?: OpcionesTextura): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  let t = cacheTex.get(clave);
  if (!t) {
    const c = crearLienzo(w, h);
    dibujar(c.getContext('2d')!, c.width, c.height);
    t = texturaDeLienzo(c, opciones);
    cacheTex.set(clave, t);
  }
  return t;
}

// ───────────────────────────── ruido determinista ─────────────────────────────

/** Generador pseudoaleatorio determinista (mulberry32). */
export function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Moteado fino sobre un color base (resinas, pintura martillada, plástico). */
export function dibujarMoteado(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, puntos: { color: string; n: number; r: [number, number]; alfa: number }[], semilla = 1) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const rnd = azar(semilla);
  for (const p of puntos) {
    ctx.fillStyle = p.color;
    for (let i = 0; i < p.n; i++) {
      ctx.globalAlpha = p.alfa * (0.4 + 0.6 * rnd());
      const r = p.r[0] + (p.r[1] - p.r[0]) * rnd();
      const x = rnd() * w, y = rnd() * h;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      // envolver los bordes para que la textura repita sin costura
      if (x < r) { ctx.beginPath(); ctx.arc(x + w, y, r, 0, Math.PI * 2); ctx.fill(); }
      if (y < r) { ctx.beginPath(); ctx.arc(x, y + h, r, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  ctx.globalAlpha = 1;
}

// ───────────────────────────── 7 segmentos ─────────────────────────────

// segmentos: a b c d e f g
const SEG: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg',
  '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '', 'E': 'adefg', 'r': 'eg', 'o': 'cdeg',
  'L': 'def', 'H': 'bcefg', 'P': 'abefg', 'A': 'abcefg', 'C': 'adef', 'F': 'aefg', 'U': 'bcdef',
  'n': 'ceg', 'd': 'bcdeg', 'b': 'cdefg', 'O': 'abcdef', 'S': 'acdfg', 'u': 'cde', 't': 'defg', 'V': 'bcdef',
};

/**
 * Dibuja texto en estilo de 7 segmentos (LCD/LED). `alto` = altura del dígito.
 * Admite '.', ':' y los caracteres de SEG. Los segmentos apagados se dibujan con
 * `apagado` (el "fantasma" de las pantallas reales), si se da.
 */
export function dibujarSieteSegmentos(
  ctx: CanvasRenderingContext2D, texto: string, xDerecha: number, yArriba: number, alto: number,
  encendido: string, apagado?: string, inclinacion = 0.1, digitosMin = 0,
) {
  const ancho = alto * 0.52, g = alto * 0.12, sep = alto * 0.2;
  // separa en celdas: cada dígito puede llevar punto decimal
  const celdas: { c: string; punto: boolean; dosPuntos?: boolean }[] = [];
  for (const ch of texto) {
    if (ch === '.' || ch === ',') { if (celdas.length) celdas[celdas.length - 1].punto = true; else celdas.push({ c: ' ', punto: true }); }
    else if (ch === ':') celdas.push({ c: ':', punto: false, dosPuntos: true });
    else celdas.push({ c: ch, punto: false });
  }
  while (celdas.length < digitosMin) celdas.unshift({ c: ' ', punto: false });
  let x = xDerecha;
  const segmento = (x0: number, y0: number, x1: number, y1: number, on: boolean) => {
    if (!on && !apagado) return;
    ctx.fillStyle = on ? encendido : apagado!;
    const horiz = Math.abs(y1 - y0) < 1e-3;
    const sh = (yy: number) => (yArriba + alto - yy) * inclinacion;
    ctx.beginPath();
    if (horiz) {
      ctx.moveTo(x0 + g * 0.5 + sh(y0), y0);
      ctx.lineTo(x0 + g + sh(y0 - g / 2), y0 - g / 2);
      ctx.lineTo(x1 - g + sh(y0 - g / 2), y0 - g / 2);
      ctx.lineTo(x1 - g * 0.5 + sh(y0), y0);
      ctx.lineTo(x1 - g + sh(y0 + g / 2), y0 + g / 2);
      ctx.lineTo(x0 + g + sh(y0 + g / 2), y0 + g / 2);
    } else {
      ctx.moveTo(x0 + sh(y0 + g * 0.5), y0 + g * 0.5);
      ctx.lineTo(x0 + g / 2 + sh(y0 + g), y0 + g);
      ctx.lineTo(x0 + g / 2 + sh(y1 - g), y1 - g);
      ctx.lineTo(x0 + sh(y1 - g * 0.5), y1 - g * 0.5);
      ctx.lineTo(x0 - g / 2 + sh(y1 - g), y1 - g);
      ctx.lineTo(x0 - g / 2 + sh(y0 + g), y0 + g);
    }
    ctx.closePath(); ctx.fill();
  };
  for (let i = celdas.length - 1; i >= 0; i--) {
    const cel = celdas[i];
    if (cel.dosPuntos) {
      x -= sep * 1.6;
      ctx.fillStyle = encendido;
      const r = g * 0.6;
      ctx.beginPath(); ctx.arc(x + sep * 0.8 + (alto * 0.35) * inclinacion, yArriba + alto * 0.32, r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + sep * 0.8 + (alto * 0.15) * inclinacion, yArriba + alto * 0.7, r, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    x -= ancho + sep;
    const on = SEG[cel.c] ?? SEG[cel.c.toUpperCase()] ?? '';
    const L = x, R = x + ancho, T = yArriba, M = yArriba + alto / 2, B = yArriba + alto;
    segmento(L, T, R, T, on.includes('a'));
    segmento(R, T, R, M, on.includes('b'));
    segmento(R, M, R, B, on.includes('c'));
    segmento(L, B, R, B, on.includes('d'));
    segmento(L, M, L, B, on.includes('e'));
    segmento(L, T, L, M, on.includes('f'));
    segmento(L, M, R, M, on.includes('g'));
    if (cel.punto || apagado) {
      ctx.fillStyle = cel.punto ? encendido : apagado!;
      ctx.beginPath(); ctx.arc(R + sep * 0.5, B - g * 0.1, g * 0.8, 0, Math.PI * 2); ctx.fill();
    }
  }
}

/** Rectángulo redondeado en un lienzo. */
export function rectRed(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Formatea con coma decimal (es-MX usa punto; en el aula se escribe con punto y
 *  en los instrumentos también: se respeta el punto por defecto). */
export function fmt(v: number, dec: number): string {
  if (!Number.isFinite(v)) return '----';
  return v.toFixed(dec);
}
