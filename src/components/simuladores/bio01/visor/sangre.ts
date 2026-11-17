/**
 * Frotis de sangre periférica teñido con Giemsa, con Plasmodium falciparum.
 *   · eritrocitos de 7–8 µm, rosa asalmonado, con la palidez central del disco bicóncavo;
 *   · trofozoítos jóvenes en ANILLO: aro azul fino (≈ 1/5 del eritrocito) con uno o dos
 *     puntos de cromatina rojo púrpura; algunos pegados al borde (forma «appliqué») y
 *     algunos eritrocitos con dos anillos, como es típico de P. falciparum;
 *   · leucocitos: neutrófilos (núcleo en 3–4 lóbulos), linfocitos (núcleo redondo, ribete
 *     azul cielo), monocitos y algún eosinófilo (gránulos naranjas); plaquetas de 2–3 µm.
 */
import { SANGRE, eritrocitosSangre, leucocitosSangre, hs, ruido, type Eritrocito, type Leucocito } from '@/domain/microscopia/preparaciones';
import { TAU, circulo, grosor, mancha, rgba, type G, type Preparacion, type Vista } from './pincel';

function eritrocito(g: G, e: Eritrocito, sem: number, s: number) {
  const h = (k: number) => hs(sem, e.i, e.j, 100 + k);
  const rx = e.r * (1 + (h(0) - 0.5) * 0.1), ry = e.r * (1 + (h(1) - 0.5) * 0.1), rot = h(2) * Math.PI;
  const tono = h(3);
  g.save();
  g.translate(e.x, e.y); g.rotate(rot); g.scale(rx / e.r, ry / e.r);
  const gr = g.createRadialGradient(e.r * 0.08, -e.r * 0.06, 0, 0, 0, e.r);
  const R = 208 + tono * 14, Gc = 138 + tono * 16, Bc = 140 + tono * 14;
  gr.addColorStop(0, rgba(R + 22, Gc + 44, Bc + 40, 0.5));
  gr.addColorStop(0.36, rgba(R + 14, Gc + 28, Bc + 26, 0.66));
  gr.addColorStop(0.68, rgba(R, Gc, Bc, 0.9));
  gr.addColorStop(0.93, rgba(R - 16, Gc - 22, Bc - 16, 0.94));
  gr.addColorStop(1, rgba(R - 30, Gc - 34, Bc - 24, 0));
  g.fillStyle = gr;
  g.beginPath(); g.arc(0, 0, e.r, 0, TAU); g.fill();
  g.restore();
  if (!e.parasitos) return;
  // ── anillos de Plasmodium ──
  for (let p = 0; p < e.parasitos; p++) {
    const borde = h(10 + p) < 0.22; // forma «appliqué», pegada a la membrana
    const a = h(12 + p) * TAU + p * 2.4, d = borde ? e.r * 0.86 : e.r * (0.2 + h(14 + p) * 0.38);
    const px = e.x + Math.cos(a) * d, py = e.y + Math.sin(a) * d;
    const rr = borde ? 0.95 : 0.95 + h(16 + p) * 0.5;
    const ac = h(18 + p) * TAU; // dónde queda el punto de cromatina
    g.save();
    g.translate(px, py);
    if (borde) { g.rotate(a + Math.PI / 2); g.scale(1.35, 0.5); }
    // vacuola clara del parásito
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = rgba(244, 222, 220, 0.72);
    g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.fill();
    g.globalCompositeOperation = 'multiply';
    // aro de citoplasma azul: más grueso en el lado opuesto a la cromatina (anillo de sello)
    g.strokeStyle = rgba(64, 84, 178, 0.92); g.lineCap = 'round';
    g.lineWidth = grosor(0.26, s, 0.55);
    g.beginPath(); g.arc(0, 0, rr, ac + 0.5, ac + TAU - 0.5); g.stroke();
    g.lineWidth = grosor(0.44, s, 0.7);
    g.beginPath(); g.arc(0, 0, rr, ac + Math.PI - 1, ac + Math.PI + 1); g.stroke();
    // cromatina: uno o dos puntos rojo púrpura
    g.fillStyle = rgba(150, 16, 84, 0.97);
    const dos = h(20 + p) < 0.24;
    g.beginPath();
    circulo(g, Math.cos(ac - (dos ? 0.33 : 0)) * rr, Math.sin(ac - (dos ? 0.33 : 0)) * rr, 0.4);
    if (dos) circulo(g, Math.cos(ac + 0.4) * rr, Math.sin(ac + 0.4) * rr, 0.36);
    g.fill();
    g.restore();
  }
}

function nucleoLobulado(g: G, l: Leucocito, sem: number, lobulos: number, color: [number, number, number], s: number) {
  const h = (k: number) => hs(sem, l.i, l.j, 720 + k);
  const a0 = h(0) * TAU, radio = l.r * 0.5;
  const pts: [number, number, number][] = [];
  for (let k = 0; k < lobulos; k++) {
    const a = a0 + (k - (lobulos - 1) / 2) * (1.9 / Math.max(1, lobulos - 1)) * 1.7;
    pts.push([l.x + Math.cos(a) * radio, l.y + Math.sin(a) * radio, l.r * (0.33 + h(4 + k) * 0.08)]);
  }
  // filamentos de cromatina entre lóbulos
  g.strokeStyle = rgba(color[0], color[1], color[2], 0.9); g.lineWidth = grosor(0.7, s); g.lineCap = 'round';
  g.beginPath();
  for (let k = 0; k < pts.length - 1; k++) { g.moveTo(pts[k][0], pts[k][1]); g.lineTo(pts[k + 1][0], pts[k + 1][1]); }
  g.stroke();
  for (let k = 0; k < pts.length; k++) {
    const [x, y, r] = pts[k];
    const gr = g.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    gr.addColorStop(0, rgba(color[0] + 34, color[1] + 26, color[2] + 30, 0.94));
    gr.addColorStop(0.75, rgba(color[0], color[1], color[2], 0.97));
    gr.addColorStop(1, rgba(color[0] - 22, color[1] - 18, color[2] - 16, 0.97));
    g.fillStyle = gr;
    g.beginPath(); mancha(g, x, y, r, 9, 0.14, (q) => h(20 + k * 9 + q), h(60 + k) * 6, 0.85 + h(70 + k) * 0.3); g.fill();
    // grumos de cromatina condensada
    g.fillStyle = rgba(color[0] - 34, color[1] - 26, color[2] - 26, 0.5);
    g.beginPath();
    for (let q = 0; q < 4; q++) circulo(g, x + (h(80 + k * 5 + q) - 0.5) * r, y + (h(90 + k * 5 + q) - 0.5) * r, r * 0.22);
    g.fill();
  }
}

function leucocito(g: G, l: Leucocito, sem: number, s: number) {
  const h = (k: number) => hs(sem, l.i, l.j, 760 + k);
  g.globalCompositeOperation = 'source-over';
  const cito = (r: number, v: number, b: number, a: number, irregular = 0.07) => {
    const gr = g.createRadialGradient(l.x, l.y, l.r * 0.2, l.x, l.y, l.r);
    gr.addColorStop(0, rgba(r + 8, v + 8, b + 6, a)); gr.addColorStop(0.9, rgba(r, v, b, a)); gr.addColorStop(1, rgba(r - 26, v - 26, b - 16, a * 0.9));
    g.fillStyle = gr;
    g.beginPath(); mancha(g, l.x, l.y, l.r, 12, irregular, (q) => h(q), h(13) * 6); g.fill();
  };
  const granulos = (n: number, r: number, color: string) => {
    g.fillStyle = color; g.beginPath();
    for (let q = 0; q < n; q++) {
      const a = h(100 + q) * TAU, d = Math.sqrt(h(300 + q)) * l.r * 0.88;
      circulo(g, l.x + Math.cos(a) * d, l.y + Math.sin(a) * d, r);
    }
    g.fill();
  };
  if (l.tipo === 'neutrofilo') {
    cito(240, 214, 214, 0.93);
    g.globalCompositeOperation = 'multiply';
    if (s > 1.6) granulos(90, 0.2, rgba(190, 140, 190, 0.55));
    nucleoLobulado(g, l, sem, 3 + Math.floor(h(50) * 2.2), [86, 46, 142], s);
  } else if (l.tipo === 'eosinofilo') {
    cito(242, 190, 170, 0.95);
    g.globalCompositeOperation = 'multiply';
    granulos(s > 1.6 ? 150 : 50, s > 1.6 ? 0.42 : 0.7, rgba(226, 92, 58, 0.78));
    nucleoLobulado(g, l, sem, 2, [92, 54, 150], s);
  } else if (l.tipo === 'linfocito') {
    cito(158, 186, 232, 0.95, 0.05);
    g.globalCompositeOperation = 'multiply';
    const nx = l.x + (h(51) - 0.5) * l.r * 0.2, ny = l.y + (h(52) - 0.5) * l.r * 0.2, nr = l.r * 0.86;
    const gr = g.createRadialGradient(nx - nr * 0.3, ny - nr * 0.3, nr * 0.1, nx, ny, nr);
    gr.addColorStop(0, rgba(104, 64, 160, 0.96)); gr.addColorStop(0.8, rgba(70, 38, 126, 0.98)); gr.addColorStop(1, rgba(52, 26, 104, 0.98));
    g.fillStyle = gr;
    g.beginPath(); mancha(g, nx, ny, nr, 10, 0.05, (q) => h(60 + q), h(71) * 6); g.fill();
    g.fillStyle = rgba(44, 22, 92, 0.5); g.beginPath();
    for (let q = 0; q < 7; q++) circulo(g, nx + (h(80 + q) - 0.5) * nr * 1.2, ny + (h(90 + q) - 0.5) * nr * 1.2, nr * 0.17);
    g.fill();
  } else {
    cito(188, 196, 220, 0.93, 0.1);
    g.globalCompositeOperation = 'multiply';
    // núcleo arriñonado, de cromatina laxa
    const a = h(51) * TAU, nr = l.r * 0.62;
    g.save(); g.translate(l.x + Math.cos(a) * l.r * 0.12, l.y + Math.sin(a) * l.r * 0.12); g.rotate(a);
    g.fillStyle = rgba(120, 86, 170, 0.9);
    g.beginPath();
    g.moveTo(-nr, -nr * 0.2);
    g.bezierCurveTo(-nr, -nr * 1.25, nr, -nr * 1.25, nr, -nr * 0.2);
    g.bezierCurveTo(nr, nr * 0.75, nr * 0.35, nr * 0.2, 0, nr * 0.3);
    g.bezierCurveTo(-nr * 0.35, nr * 0.2, -nr, nr * 0.75, -nr, -nr * 0.2);
    g.fill();
    g.fillStyle = rgba(92, 60, 150, 0.4); g.beginPath();
    for (let q = 0; q < 6; q++) circulo(g, (h(80 + q) - 0.5) * nr * 1.5, -nr * 0.45 + (h(90 + q) - 0.5) * nr * 0.7, nr * 0.2);
    g.fill();
    g.restore();
  }
  g.globalCompositeOperation = 'multiply';
}

function plaquetas(g: G, v: Vista) {
  const P = 34, sem = v.semilla, { rect } = v;
  for (let j = Math.floor(rect.y0 / P) - 1; j <= Math.floor(rect.y1 / P) + 1; j++)
    for (let i = Math.floor(rect.x0 / P) - 1; i <= Math.floor(rect.x1 / P) + 1; i++) {
      if (hs(sem, i, j, 900) > 0.4) continue;
      const n = 1 + Math.floor(hs(sem, i, j, 901) ** 3 * 5);
      const cx = (i + hs(sem, i, j, 902)) * P, cy = (j + hs(sem, i, j, 903)) * P;
      for (let k = 0; k < n; k++) {
        const x = cx + (hs(sem, i, j, 910 + k) - 0.5) * 5, y = cy + (hs(sem, i, j, 920 + k) - 0.5) * 5, r = 0.9 + hs(sem, i, j, 930 + k) * 0.7;
        g.fillStyle = rgba(196, 150, 200, 0.75);
        g.beginPath(); mancha(g, x, y, r, 7, 0.22, (q) => hs(sem, i, j, 940 + k * 7 + q)); g.fill();
        g.fillStyle = rgba(120, 60, 150, 0.8);
        g.beginPath();
        for (let q = 0; q < 4; q++) circulo(g, x + (hs(sem, i, j, 960 + k * 4 + q) - 0.5) * r, y + (hs(sem, i, j, 980 + k * 4 + q) - 0.5) * r, r * 0.24);
        g.fill();
      }
    }
}

/** Disco rojo pequeño ya rasterizado: a 10× se estampa miles de veces (un trazado único con miles de arcos es lentísimo). */
function sello(px: number): HTMLCanvasElement {
  const n = Math.max(3, Math.ceil(px) + 2);
  const cv = document.createElement('canvas'); cv.width = cv.height = n;
  const h = cv.getContext('2d');
  if (h) {
    const gr = h.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, px / 2);
    gr.addColorStop(0, rgba(226, 172, 170, 0.62)); gr.addColorStop(0.45, rgba(212, 146, 146, 0.8)); gr.addColorStop(0.9, rgba(198, 124, 128, 0.88)); gr.addColorStop(1, rgba(198, 124, 128, 0));
    h.fillStyle = gr; h.fillRect(0, 0, n, n);
  }
  return cv;
}

function dibujar(g: G, v: Vista) {
  const { s, semilla: sem, rect } = v;
  g.globalCompositeOperation = 'multiply';
  if (s < 0.75) {
    // 4× y 10×: una célula ocupa de menos de 1 px a 5 px; no se resuelven ni la palidez central ni los parásitos
    const px = s * SANGRE.paso;
    if (px < 1.3) {
      // menos de un píxel por célula: se pinta la DENSIDAD del frotis (la misma función que deja los huecos)
      const B = 2 / s;
      for (let y = Math.floor(rect.y0 / B) * B; y < rect.y1; y += B) for (let x = Math.floor(rect.x0 / B) * B; x < rect.x1; x += B) {
        const hueco = 0.1 + 0.34 * ruido(sem, x / 260, y / 260, 5) ** 2;
        const grano = hs(sem, Math.round(x / B), Math.round(y / B), 990);
        g.fillStyle = rgba(206, 138, 140, (1 - hueco) * 0.6 * (0.66 + grano * 0.68));
        g.fillRect(x, y, B, B);
      }
    } else {
      const rojos = eritrocitosSangre(sem, rect, 8);
      if (px < 2.6) {
        const lado = Math.max(1 / s, 6.6);
        g.fillStyle = rgba(206, 140, 142, 0.74 * Math.min(1, (s * 6.6) ** 2 + 0.25));
        for (const e of rojos) g.fillRect(e.x - lado / 2, e.y - lado / 2, lado, lado);
      } else {
        const cv = sello(7.6 * s), lado = cv.width / s;
        for (const e of rojos) g.drawImage(cv, e.x - lado / 2, e.y - lado / 2, lado, lado);
      }
    }
    g.globalCompositeOperation = 'source-over';
    for (const l of leucocitosSangre(sem, rect, 20)) {
      const r = Math.max(l.r * 0.62, 0.9 / s);
      g.fillStyle = rgba(226, 206, 222, 0.95); g.fillRect(l.x - l.r, l.y - l.r, 2 * l.r, 2 * l.r);
      g.fillStyle = rgba(84, 46, 140, 0.95); g.fillRect(l.x - r, l.y - r, 2 * r, 2 * r);
    }
    return;
  }
  const rojos = eritrocitosSangre(sem, rect, 8);
  for (const e of rojos) eritrocito(g, e, sem, s);
  plaquetas(g, v);
  for (const l of leucocitosSangre(sem, rect, 20)) leucocito(g, l, sem, s);
}

export const SANGRE_PREP: Preparacion = {
  fondo: '#efe7e2',
  capas: [{ id: 'frotis', z: 0, dibujar }],
};
