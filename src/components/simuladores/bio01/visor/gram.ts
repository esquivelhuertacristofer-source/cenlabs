/**
 * Extensión teñida con Gram (cristal violeta → lugol → decolorante → safranina).
 *   · Gram positivas, VIOLETA oscuro: estafilococos (cocos de ≈ 0,9 µm en racimos),
 *     estreptococos (cocos en cadena) y bacilos grandes (≈ 1 × 4–7 µm, en cadenas);
 *   · Gram negativas, ROSA-rojo: bacilos cortos (≈ 0,6 × 2–3 µm) y diplococos
 *     arriñonados (≈ 0,8 µm, de dos en dos).
 * De fondo, la película proteica y algún leucocito, que la safranina deja rosados.
 */
import { coloniasGram, hs, ruido, type ColoniaGram } from '@/domain/microscopia/preparaciones';
import { TAU, circulo, grosor, mancha, rgba, type G, type Preparacion, type Vista } from './pincel';

const VIOLETA = [58, 30, 124] as const;
const ROSA = [212, 58, 104] as const;
const esPositiva = (c: ColoniaGram) => c.tipo === 'estafilococo' || c.tipo === 'estreptococo' || c.tipo === 'bacilo_pos';

function colonia(g: G, c: ColoniaGram, sem: number, s: number) {
  const h = (k: number) => hs(sem, c.i * 7 + c.c, c.j, 200 + k);
  const col = esPositiva(c) ? VIOLETA : ROSA;
  const tinta = (a: number) => rgba(col[0] + (h(1) - 0.5) * 22, col[1] + (h(2) - 0.5) * 16, col[2] + (h(3) - 0.5) * 22, a);
  if (c.tipo === 'estafilococo') {
    // racimo: cada coco se apoya en uno anterior, como un racimo de uvas
    const xs: number[] = [c.x], ys: number[] = [c.y];
    for (let k = 1; k < c.n; k++) {
      const base = Math.floor(h(10 + k) * xs.length), a = h(60 + k) * TAU;
      xs.push(xs[base] + Math.cos(a) * 0.92); ys.push(ys[base] + Math.sin(a) * 0.92);
    }
    g.fillStyle = tinta(0.86); g.beginPath();
    for (let k = 0; k < xs.length; k++) circulo(g, xs[k], ys[k], 0.44 + h(120 + k) * 0.07);
    g.fill();
  } else if (c.tipo === 'estreptococo') {
    // cadena curva de cocos algo ovalados, a menudo de dos en dos
    let x = c.x, y = c.y, a = c.ang;
    const curva = (h(5) - 0.5) * 0.7;
    g.fillStyle = tinta(0.88); g.beginPath();
    for (let k = 0; k < c.n; k++) {
      g.save(); g.translate(x, y); g.rotate(a); g.moveTo(0.5, 0); g.ellipse(0, 0, 0.5, 0.42, 0, 0, TAU); g.restore();
      const paso = k % 2 ? 1.02 : 0.86;
      x += Math.cos(a) * paso; y += Math.sin(a) * paso; a += curva * 0.4 + (h(20 + k) - 0.5) * 0.5;
    }
    g.fill();
  } else if (c.tipo === 'bacilo_pos') {
    // bacilos gruesos de extremos rectos, encadenados
    let x = c.x, y = c.y, a = c.ang;
    g.strokeStyle = tinta(0.9); g.lineCap = 'butt'; g.lineWidth = grosor(1.0, s, 0.9);
    g.beginPath();
    for (let k = 0; k < c.n; k++) {
      const L = 3.6 + h(20 + k) * 3.2;
      g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
      x += Math.cos(a) * (L + 0.35); y += Math.sin(a) * (L + 0.35); a += (h(40 + k) - 0.5) * 0.5;
    }
    g.stroke();
  } else if (c.tipo === 'bacilo_neg') {
    // bacilos cortos y finos de extremos redondeados, sueltos y sin orden
    g.strokeStyle = tinta(0.84); g.lineCap = 'round'; g.lineWidth = grosor(0.58, s, 0.8);
    g.beginPath();
    for (let k = 0; k < c.n; k++) {
      const x = c.x + (h(20 + k) - 0.5) * 15, y = c.y + (h(40 + k) - 0.5) * 15, a = h(60 + k) * TAU, L = 1.2 + h(80 + k) * 1.5;
      g.moveTo(x - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2); g.lineTo(x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2);
    }
    g.stroke();
  } else {
    // diplococos: dos granos de café enfrentados por su cara plana
    g.fillStyle = tinta(0.88); g.beginPath();
    for (let k = 0; k < c.n; k++) {
      const x = c.x + (h(20 + k) - 0.5) * 9, y = c.y + (h(40 + k) - 0.5) * 9, a = h(60 + k) * TAU;
      for (const lado of [-1, 1]) {
        g.save(); g.translate(x + Math.cos(a) * 0.46 * lado, y + Math.sin(a) * 0.46 * lado); g.rotate(a);
        g.moveTo(0.36, 0); g.ellipse(0, 0, 0.36, 0.5, 0, 0, TAU); g.restore();
      }
    }
    g.fill();
  }
}

/** Leucocitos del exudado (rosados: no retienen el violeta) y película de fondo. */
function fondo(g: G, v: Vista) {
  const { semilla: sem, rect, s } = v;
  const P = 150;
  for (let j = Math.floor(rect.y0 / P) - 1; j <= Math.floor(rect.y1 / P) + 1; j++)
    for (let i = Math.floor(rect.x0 / P) - 1; i <= Math.floor(rect.x1 / P) + 1; i++) {
      const x = (i + hs(sem, i, j, 300)) * P, y = (j + hs(sem, i, j, 301)) * P, r = 50 + hs(sem, i, j, 302) * 90;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, rgba(236, 176, 196, 0.2 + ruido(sem, i / 3, j / 3, 303) * 0.22)); gr.addColorStop(1, rgba(236, 176, 196, 0));
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  const Q = 62;
  for (let j = Math.floor(rect.y0 / Q) - 1; j <= Math.floor(rect.y1 / Q) + 1; j++)
    for (let i = Math.floor(rect.x0 / Q) - 1; i <= Math.floor(rect.x1 / Q) + 1; i++) {
      if (hs(sem, i, j, 310) > 0.24) continue;
      const x = (i + hs(sem, i, j, 311)) * Q, y = (j + hs(sem, i, j, 312)) * Q, r = 6 + hs(sem, i, j, 313) * 1.6;
      const h = (k: number) => hs(sem, i, j, 320 + k);
      g.fillStyle = rgba(240, 190, 204, 0.5);
      g.beginPath(); mancha(g, x, y, r, 11, 0.12, h); g.fill();
      if (s < 0.5) continue;
      const lob = 2 + Math.floor(h(20) * 2.5), a0 = h(21) * TAU;
      g.fillStyle = rgba(214, 96, 132, 0.62);
      g.beginPath();
      for (let k = 0; k < lob; k++) {
        const a = a0 + k * 1.25;
        mancha(g, x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.36, 8, 0.16, (q) => h(30 + k * 8 + q));
      }
      g.fill();
    }
}

function dibujar(g: G, v: Vista) {
  const { s, semilla: sem, rect } = v;
  g.globalCompositeOperation = 'multiply';
  fondo(g, v);
  const cols = coloniasGram(sem, rect, 26);
  if (s < 0.7) {
    // 4× y 10×: una bacteria mide menos de 1 px; sólo se adivina dónde hay grupos
    for (const c of cols) {
      const col = esPositiva(c) ? VIOLETA : ROSA;
      const r = Math.max(0.55 / s, Math.sqrt(c.n) * 0.5);
      g.fillStyle = rgba(col[0], col[1], col[2], Math.min(0.75, 0.16 + s * 0.8));
      g.fillRect(c.x - r, c.y - r, 2 * r, 2 * r);
    }
    return;
  }
  for (const c of cols) colonia(g, c, sem, s);
}

export const GRAM_PREP: Preparacion = {
  fondo: '#f4ece6',
  capas: [{ id: 'gram', z: 0, dibujar }],
};
