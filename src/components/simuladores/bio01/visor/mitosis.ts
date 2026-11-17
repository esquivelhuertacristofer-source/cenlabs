/**
 * Punta de raíz de cebolla (Allium cepa), corte longitudinal teñido con hematoxilina.
 *   · hileras de células de ≈ 21 µm de ancho; en el meristemo son casi cúbicas
 *     (≈ 22 µm) y por encima se alargan (zona de elongación) y dejan de dividirse;
 *   · la cofia, de células grandes y pálidas, cubre la punta;
 *   · interfase: núcleo redondo de ≈ 9 µm con nucléolos;
 *     profase: ovillo de cromosomas condensándose, sin nucléolo;
 *     metafase: placa ecuatorial; anafase: dos juegos en V hacia los polos;
 *     telofase: dos masas en los polos y la placa celular nueva en el ecuador.
 * La cebolla tiene 2n = 16 cromosomas, de unos 10 µm.
 */
import { RAIZ, celulasRaiz, contornoCofia, contornoRaiz, hs, ruido, type CelulaRaiz } from '@/domain/microscopia/preparaciones';
import { TAU, circulo, grosor, mancha, rgba, type G, type Preparacion, type Vista } from './pincel';

const CROMO = rgba(34, 20, 88, 0.95);

function nucleo(g: G, c: CelulaRaiz, sem: number, s: number, cx: number, cy: number) {
  const h = (k: number) => hs(sem, c.fila, c.k, 400 + k);
  const eje = (h(0) - 0.5) * 0.5; // el huso sigue el eje de la hilera, con algo de inclinación
  g.save(); g.translate(cx, cy);
  if (c.fase === 'interfase') {
    const r = c.zona === 'elongacion' ? 5 : c.zona === 'cofia' ? 3.8 : 4.9 + h(1) * 1.1;
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    gr.addColorStop(0, rgba(142, 128, 204, 0.9)); gr.addColorStop(0.8, rgba(104, 88, 176, 0.93)); gr.addColorStop(1, rgba(76, 60, 150, 0.95));
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    if (s > 0.9) {
      // cromatina granulosa y uno a tres nucléolos
      g.fillStyle = rgba(70, 54, 140, 0.35); g.beginPath();
      for (let q = 0; q < 9; q++) circulo(g, (h(10 + q) - 0.5) * r * 1.4, (h(20 + q) - 0.5) * r * 1.4, r * 0.16);
      g.fill();
      g.fillStyle = rgba(44, 28, 104, 0.9); g.beginPath();
      const nn = 1 + Math.floor(h(2) * 2.6);
      for (let q = 0; q < nn; q++) circulo(g, (h(30 + q) - 0.5) * r * 0.9, (h(34 + q) - 0.5) * r * 0.9, r * (0.2 + h(38 + q) * 0.08));
      g.fill();
    }
    g.restore(); return;
  }
  g.rotate(eje);
  g.strokeStyle = CROMO; g.lineCap = 'round'; g.lineJoin = 'round';
  const w = grosor(1.05, s, 1.1);
  g.lineWidth = w;
  const semiAncho = Math.min(c.w / 2 - 2.6, 6.4), semiLargo = Math.max(3.5, c.h / 2 - 2.5);
  if (c.fase === 'profase') {
    // núcleo hinchado: hebras gruesas enmarañadas, envoltura aún visible
    const r = 6.2;
    g.fillStyle = rgba(170, 160, 220, 0.5); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.beginPath();
    for (let q = 0; q < 17; q++) {
      const a = h(40 + q) * TAU, d = Math.sqrt(h(60 + q)) * r * 0.78, a2 = h(80 + q) * TAU, L = 1.6 + h(100 + q) * 1.7;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      g.moveTo(x - Math.cos(a2) * L, y - Math.sin(a2) * L);
      g.quadraticCurveTo(x + Math.cos(a2 + 1.4) * L * 0.8, y + Math.sin(a2 + 1.4) * L * 0.8, x + Math.cos(a2) * L, y + Math.sin(a2) * L);
    }
    g.stroke();
  } else if (c.fase === 'metafase') {
    // huso (apenas visible) y placa ecuatorial: los centrómeros en el ecuador, los brazos sueltos
    if (s > 0.9) {
      g.save(); g.strokeStyle = rgba(96, 84, 150, 0.2); g.lineWidth = grosor(0.3, s, 0.5); g.beginPath();
      for (let q = -3; q <= 3; q++) { g.moveTo(0, -semiLargo * 0.92); g.quadraticCurveTo(q * 2.1, 0, 0, semiLargo * 0.92); }
      g.stroke(); g.restore();
    }
    g.beginPath();
    for (let q = 0; q < 16; q++) {
      const x = ((q + 0.5) / 16 - 0.5) * 2 * semiAncho + (h(40 + q) - 0.5) * 0.8, y = (h(60 + q) - 0.5) * 1.1;
      const a = (h(80 + q) - 0.5) * 1.9, L1 = 1.6 + h(100 + q) * 2.4, L2 = 1.6 + h(120 + q) * 2.4;
      g.moveTo(x + Math.sin(a) * L1, y - Math.cos(a) * L1); g.lineTo(x, y); g.lineTo(x + Math.sin(a + 0.5) * L2, y + Math.cos(a + 0.5) * L2);
    }
    g.stroke();
  } else if (c.fase === 'anafase') {
    // dos juegos de cromátidas en V: el centrómero tira hacia el polo y los brazos se rezagan
    const sep = Math.min(semiLargo * 0.62, 2.8 + h(1) * 3.4);
    g.beginPath();
    for (const lado of [-1, 1]) for (let q = 0; q < 12; q++) {
      const x = ((q + 0.5) / 12 - 0.5) * 2 * semiAncho * 0.86 + (h(40 + q + (lado + 1) * 20) - 0.5), y = lado * sep;
      const brazo = 2.2 + h(80 + q + (lado + 1) * 20) * 2.2, ab = 0.28 + h(120 + q) * 0.3;
      g.moveTo(x - Math.sin(ab) * brazo, y - lado * Math.cos(ab) * brazo); g.lineTo(x, y); g.lineTo(x + Math.sin(ab) * brazo, y - lado * Math.cos(ab) * brazo);
    }
    g.stroke();
  } else {
    // telofase: dos masas compactas en los polos y la placa celular en el ecuador
    const sep = semiLargo * 0.66;
    g.strokeStyle = rgba(96, 84, 150, 0.75); g.lineWidth = grosor(0.6, s, 0.8);
    g.beginPath(); g.moveTo(-c.w / 2 * 0.78, 0); g.lineTo(c.w / 2 * 0.78, 0); g.stroke();
    g.fillStyle = CROMO;
    for (const lado of [-1, 1]) {
      g.beginPath(); mancha(g, 0, lado * sep, semiAncho * 0.84, 14, 0.16, (q) => h(40 + q + (lado + 1) * 20), 0, 0.36); g.fill();
    }
    // restos de brazos que asoman hacia el ecuador
    g.strokeStyle = CROMO; g.lineWidth = w * 0.8; g.beginPath();
    for (const lado of [-1, 1]) for (let q = 0; q < 6; q++) {
      const x = ((q + 0.5) / 6 - 0.5) * 2 * semiAncho * 0.7;
      g.moveTo(x, lado * sep); g.lineTo(x + (h(90 + q) - 0.5) * 1.5, lado * (sep - 1.6 - h(100 + q) * 1.2));
    }
    g.stroke();
  }
  g.restore();
}

function dibujar(g: G, v: Vista) {
  const { s, semilla: sem, rect } = v;
  g.globalCompositeOperation = 'multiply';
  const cels = celulasRaiz(sem, rect, 40);
  const fino = s >= 0.75;
  // Las hileras no son reglas: la pared entre dos hileras ondula y los tabiques van algo inclinados.
  const pared = (ib: number, y: number) => (ib - 0.5) * RAIZ.pasoFila + (ruido(sem, ib * 7.3, y / 46, 370) - 0.5) * 8.5;
  const inclin = (fila: number, k: number) => (hs(sem, fila, k, 371) - 0.5) * 4.4;
  const celda = (c: CelulaRaiz) => {
    const ya = c.y - c.h / 2, yb = c.y + c.h / 2, ia = inclin(c.fila, c.k + 1), ib = inclin(c.fila, c.k), ym = c.y;
    g.moveTo(pared(c.fila, ya + ia), ya + ia); g.lineTo(pared(c.fila + 1, ya - ia), ya - ia);
    g.lineTo(pared(c.fila + 1, ym), ym); g.lineTo(pared(c.fila + 1, yb - ib), yb - ib);
    g.lineTo(pared(c.fila, yb + ib), yb + ib); g.lineTo(pared(c.fila, ym), ym); g.closePath();
  };
  // ── citoplasma y paredes ──
  for (const c of cels) {
    const tono = hs(sem, c.fila, c.k, 390);
    const x0 = c.x - c.w / 2, y0 = c.y - c.h / 2;
    if (c.zona === 'cofia') {
      g.fillStyle = rgba(206, 200, 232, 0.4 + tono * 0.14);
      g.beginPath(); mancha(g, c.x, c.y, 14.5, 9, 0.12, (q) => hs(sem, c.fila, c.k, 380 + q), tono * 6, 1.05); g.fill();
      if (fino) { g.strokeStyle = rgba(120, 110, 170, 0.5); g.lineWidth = grosor(0.45, s, 0.6); g.stroke(); }
      continue;
    }
    // el meristemo es denso (mucho citoplasma); al alargarse la célula se llena de vacuola y palidece
    const dist = RAIZ.yApice - c.y;
    const denso = 0.62 - 0.3 * Math.min(1, Math.max(0, (dist - 560) / 620));
    g.fillStyle = rgba(184 + tono * 16, 176 + tono * 16, 222 + tono * 10, denso + tono * 0.14);
    if (fino) { g.beginPath(); celda(c); g.fill(); } else g.fillRect(x0, y0, c.w, c.h);
    if (c.zona === 'elongacion' && fino) {
      g.save(); g.globalCompositeOperation = 'source-over';
      g.fillStyle = rgba(246, 244, 252, 0.6);
      g.beginPath(); g.ellipse(c.x, c.y, c.w * 0.3, Math.max(2, c.h * 0.36), 0, 0, TAU); g.fill();
      g.restore();
    }
  }
  g.strokeStyle = rgba(104, 92, 160, fino ? 0.72 : 0.5); g.lineWidth = grosor(0.5, s, fino ? 0.8 : 0.5);
  g.beginPath();
  for (const c of cels) if (c.zona !== 'cofia' && (fino || c.h * s > 3)) { if (fino) celda(c); else g.rect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h); }
  g.stroke();
  if (s > 1.5) {
    // citoplasma granuloso (plastidios y vacuolas pequeñas del meristemo)
    g.fillStyle = rgba(120, 108, 176, 0.22); g.beginPath();
    for (const c of cels) if (c.zona !== 'cofia') for (let q = 0; q < 14; q++) {
      circulo(g, c.x + (hs(sem, c.fila, c.k, 440 + q) - 0.5) * c.w * 0.8, c.y + (hs(sem, c.fila, c.k, 460 + q) - 0.5) * c.h * 0.8, 0.5 + hs(sem, c.fila, c.k, 480 + q) * 0.7);
    }
    g.fill();
  }
  // ── núcleos y figuras de mitosis ──
  if (s * 9 < 2.4) {
    // 4×: el núcleo es un punto
    const lado = Math.max(1 / s, 6);
    g.fillStyle = rgba(84, 66, 156, 0.8);
    for (const c of cels) g.fillRect(c.x - lado / 2, c.y - lado / 2, lado, lado);
  } else {
    for (const c of cels) {
      const des = c.zona === 'elongacion' ? (hs(sem, c.fila, c.k, 391) - 0.5) * c.w * 0.34 : 0;
      nucleo(g, c, sem, s, c.x + des, c.y + (hs(sem, c.fila, c.k, 392) - 0.5) * Math.min(3, c.h * 0.12));
    }
  }
  // ── epidermis: contorno de la raíz y de la cofia ──
  const paso = Math.max(4, 3 / s);
  const yA = Math.max(rect.y0 - 20, RAIZ.yApice - 4000), yB = Math.min(rect.y1 + 20, RAIZ.yApice + RAIZ.cofia);
  if (yB > yA) {
    for (const [f, a] of [[contornoRaiz, 0.6], [contornoCofia, 0.42]] as const) {
      g.strokeStyle = rgba(92, 80, 150, a); g.lineWidth = grosor(1.1, s, 0.8);
      for (const lado of [-1, 1]) {
        g.beginPath();
        let empezado = false;
        for (let y = yA; y <= yB + paso; y += paso) {
          const hw = f(Math.min(y, f === contornoRaiz ? RAIZ.yApice : RAIZ.yApice + RAIZ.cofia));
          if (!empezado) { g.moveTo(lado * hw, y); empezado = true; } else g.lineTo(lado * hw, Math.min(y, f === contornoRaiz ? RAIZ.yApice : RAIZ.yApice + RAIZ.cofia));
        }
        g.stroke();
      }
    }
  }
}

export const MITOSIS_PREP: Preparacion = {
  fondo: '#f1eef2',
  capas: [{ id: 'raiz', z: 0, dibujar }],
};
