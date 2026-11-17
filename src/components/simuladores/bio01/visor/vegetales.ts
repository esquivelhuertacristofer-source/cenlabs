/**
 * Dos epidermis vegetales en montaje húmedo.
 *
 * CEBOLLA con lugol (yodo): una sola capa de células alargadas, de 190–310 µm de
 * largo por ≈ 64 µm de ancho, de extremos oblicuos; la pared de celulosa queda
 * marcada en pardo, el citoplasma amarillo pálido y el núcleo (≈ 18 µm) ámbar
 * oscuro, casi siempre empujado contra la pared por la vacuola. Burbujas de aire
 * (aro negro grueso) como en cualquier montaje hecho a mano.
 *
 * ESTOMAS en el envés de Tradescantia: células epidérmicas poligonales de
 * ≈ 100 µm, muchas con antocianina (magenta) en la vacuola; cada estoma son dos
 * células oclusivas arriñonadas (≈ 54 µm) con cloroplastos, alrededor del ostiolo,
 * rodeadas de células subsidiarias sin pigmento. Las celdas salen de un diagrama de
 * potencias sobre los mismos sitios con los que el juez cuenta.
 */
import { CEBOLLA, HOJA, celulasCebolla, hs, ruido, sitiosEpidermis, type SitioEpidermis } from '@/domain/microscopia/preparaciones';
import { TAU, circulo, grosor, mancha, rgba, type G, type Preparacion, type Vista } from './pincel';

// ───────────────────────────── cebolla ─────────────────────────────

function cebolla(g: G, v: Vista) {
  const { s, semilla: sem, rect } = v;
  g.globalCompositeOperation = 'multiply';
  const cels = celulasCebolla(sem, rect, 60);
  const fino = s >= 0.35;
  for (const c of cels) {
    const tono = hs(sem, c.j, c.k, 500);
    g.fillStyle = rgba(244, 222 + tono * 10, 150 + tono * 26, 0.36 + tono * 0.16);
    g.beginPath();
    g.moveTo(c.x0 - c.inc0 / 2, c.y0); g.lineTo(c.x1 - c.inc1 / 2, c.y0); g.lineTo(c.x1 + c.inc1 / 2, c.y1); g.lineTo(c.x0 + c.inc0 / 2, c.y1); g.closePath();
    g.fill();
  }
  if (fino) {
    // hebras de citoplasma que cruzan la vacuola desde el núcleo, y gránulos
    g.strokeStyle = rgba(190, 150, 70, 0.22); g.lineWidth = grosor(0.9, s, 0.5); g.beginPath();
    for (const c of cels) for (let q = 0; q < 4; q++) {
      const tx = c.x0 + (c.x1 - c.x0) * hs(sem, c.j, c.k, 510 + q), ty = q & 1 ? c.y0 + 2 : c.y1 - 2;
      g.moveTo(c.nx, c.ny); g.quadraticCurveTo((c.nx + tx) / 2 + (hs(sem, c.j, c.k, 520 + q) - 0.5) * 30, (c.ny + ty) / 2, tx, ty);
    }
    g.stroke();
    if (s > 0.8) {
      g.fillStyle = rgba(150, 110, 40, 0.3); g.beginPath();
      for (const c of cels) for (let q = 0; q < 26; q++) {
        circulo(g, c.x0 + (c.x1 - c.x0) * hs(sem, c.j, c.k, 530 + q), c.y0 + (c.y1 - c.y0) * (0.08 + hs(sem, c.j, c.k, 560 + q) * 0.84), 0.5 + hs(sem, c.j, c.k, 590 + q) * 0.6);
      }
      g.fill();
    }
  }
  // ── paredes: lámina media oscura con las dos paredes primarias más claras a los lados ──
  const pared = (ancho: number, color: string) => {
    g.strokeStyle = color; g.lineWidth = ancho; g.lineJoin = 'round'; g.beginPath();
    for (const c of cels) {
      g.moveTo(c.x0 + c.inc0 / 2, c.y1); g.lineTo(c.x0 - c.inc0 / 2, c.y0); g.lineTo(c.x1 - c.inc1 / 2, c.y0);
    }
    g.stroke();
  };
  pared(grosor(3.4, s, 1.2), rgba(206, 160, 70, 0.5));
  pared(grosor(1.1, s, 0.7), rgba(120, 80, 24, 0.86));
  // ── núcleos ──
  for (const c of cels) {
    if (!fino) { g.fillStyle = rgba(150, 96, 26, 0.8); const l = Math.max(1 / s, c.nr * 1.5); g.fillRect(c.nx - l / 2, c.ny - l / 2, l, l); continue; }
    const r = c.nr;
    const gr = g.createRadialGradient(c.nx - r * 0.3, c.ny - r * 0.3, r * 0.1, c.nx, c.ny, r);
    gr.addColorStop(0, rgba(214, 150, 50, 0.92)); gr.addColorStop(0.75, rgba(172, 108, 28, 0.95)); gr.addColorStop(1, rgba(120, 70, 14, 0.96));
    g.fillStyle = gr;
    g.beginPath(); mancha(g, c.nx, c.ny, r, 9, 0.07, (q) => hs(sem, c.j, c.k, 600 + q), 0, 0.82); g.fill();
    if (s > 0.8) {
      g.fillStyle = rgba(92, 50, 8, 0.85); g.beginPath();
      circulo(g, c.nx - r * 0.25, c.ny + r * 0.1, r * 0.2);
      if (hs(sem, c.j, c.k, 610) > 0.4) circulo(g, c.nx + r * 0.3, c.ny - r * 0.15, r * 0.16);
      g.fill();
    }
  }
}

/** Burbujas de aire atrapadas bajo el cubreobjetos: aro negro por la reflexión total en su borde. */
function burbujas(g: G, v: Vista) {
  const { semilla: sem, rect, s } = v;
  const P = 620;
  for (let j = Math.floor(rect.y0 / P) - 1; j <= Math.floor(rect.y1 / P) + 1; j++)
    for (let i = Math.floor(rect.x0 / P) - 1; i <= Math.floor(rect.x1 / P) + 1; i++) {
      if (hs(sem, i, j, 620) > 0.3 || (i === 0 && j === 0) || (i === -1 && j === 0) || (i === 0 && j === -1) || (i === -1 && j === -1)) continue;
      const x = (i + 0.2 + hs(sem, i, j, 621) * 0.6) * P, y = (j + 0.2 + hs(sem, i, j, 622) * 0.6) * P, r = 34 + hs(sem, i, j, 623) ** 2 * 120;
      const gr = g.createRadialGradient(x, y, r * 0.62, x, y, r);
      gr.addColorStop(0, rgba(255, 255, 255, 0)); gr.addColorStop(0.3, rgba(40, 34, 20, 0.5)); gr.addColorStop(0.62, rgba(14, 12, 8, 0.96)); gr.addColorStop(0.93, rgba(14, 12, 8, 0.97)); gr.addColorStop(1, rgba(14, 12, 8, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.fillStyle = rgba(250, 246, 226, 0.75); g.beginPath(); g.arc(x, y, r * 0.6, 0, TAU); g.fill();
      g.strokeStyle = rgba(255, 255, 255, 0.5); g.lineWidth = grosor(r * 0.035, s); g.beginPath(); g.arc(x, y, r * 0.83, 3.6, 4.6); g.stroke();
    }
}

export const CEBOLLA_PREP: Preparacion = {
  fondo: '#f6ecc8',
  capas: [{ id: 'epidermis', z: 0, dibujar: cebolla }, { id: 'burbujas', z: 5, dibujar: burbujas }],
};
void CEBOLLA;

// ───────────────────────────── estomas ─────────────────────────────

/** Recorta un polígono convexo con el semiplano a·x + b·y ≤ c. */
function recortar(p: number[], a: number, b: number, c: number): number[] {
  const out: number[] = [];
  const n = p.length / 2;
  for (let i = 0; i < n; i++) {
    const x1 = p[i * 2], y1 = p[i * 2 + 1], x2 = p[((i + 1) % n) * 2], y2 = p[((i + 1) % n) * 2 + 1];
    const d1 = a * x1 + b * y1 - c, d2 = a * x2 + b * y2 - c;
    if (d1 <= 0) out.push(x1, y1);
    if ((d1 < 0 && d2 > 0) || (d1 > 0 && d2 < 0)) { const t = d1 / (d1 - d2); out.push(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t); }
  }
  return out;
}

/** Celda del diagrama de potencias de un sitio frente a sus vecinos. */
function celda(p: SitioEpidermis, vecinos: Map<string, SitioEpidermis>): number[] {
  const ax = HOJA.pasoX * 1.7, ay = HOJA.pasoY * 1.9;
  let pol = [p.x - ax, p.y - ay, p.x + ax, p.y - ay, p.x + ax, p.y + ay, p.x - ax, p.y + ay];
  for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
    if (!di && !dj) continue;
    const q = vecinos.get(`${p.i + di},${p.j + dj}`); if (!q) continue;
    const a = 2 * (q.x - p.x), b = 2 * (q.y - p.y);
    const c = q.x * q.x + q.y * q.y - p.x * p.x - p.y * p.y + p.peso - q.peso;
    pol = recortar(pol, a, b, c);
    if (pol.length < 6) break;
  }
  return pol;
}

function estoma(g: G, p: SitioEpidermis, sem: number, s: number) {
  const h = (k: number) => hs(sem, p.i, p.j, 660 + k);
  const L = 25 + h(0) * 3.5, W = 17 + h(1) * 2.5, rot = (h(2) - 0.5) * 0.36;
  const poro = 2.2 + h(3) * 3.2; // semiancho del ostiolo: unos abiertos, otros casi cerrados
  g.save(); g.translate(p.x, p.y); g.rotate(rot);
  g.globalCompositeOperation = 'source-over';
  // dos células oclusivas arriñonadas
  const gr = g.createRadialGradient(0, 0, W * 0.2, 0, 0, L);
  gr.addColorStop(0, rgba(196, 222, 140, 0.95)); gr.addColorStop(0.7, rgba(150, 196, 104, 0.95)); gr.addColorStop(1, rgba(118, 168, 84, 0.95));
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, L, W, 0, 0, TAU); g.fill();
  g.globalCompositeOperation = 'multiply';
  g.strokeStyle = rgba(52, 78, 40, 0.9); g.lineWidth = grosor(1.3, s, 0.8);
  g.beginPath(); g.ellipse(0, 0, L, W, 0, 0, TAU);
  g.moveTo(-L, 0); g.lineTo(-L * 0.52, 0); g.moveTo(L * 0.52, 0); g.lineTo(L, 0);
  g.stroke();
  if (s > 0.55) {
    // cloroplastos: sólo las células oclusivas los tienen en la epidermis
    g.fillStyle = rgba(44, 132, 44, 0.86); g.beginPath();
    for (const lado of [-1, 1]) for (let q = 0; q < 9; q++) {
      const u = (q + 0.5) / 9 * 2 - 1, x = u * L * 0.78, borde = W * Math.sqrt(Math.max(0, 1 - u * u * 0.82));
      const y = lado * (poro + 2.4 + (borde - poro - 4.2) * (0.2 + h(10 + q + (lado + 1) * 10) * 0.7));
      circulo(g, x + (h(40 + q + lado) - 0.5) * 2, y, 1.7 + h(50 + q) * 0.5);
    }
    g.fill();
  }
  // ostiolo: lente oscura con el borde engrosado de las oclusivas
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = rgba(236, 240, 214, 0.96); g.beginPath(); g.ellipse(0, 0, L * 0.52, poro + 1.5, 0, 0, TAU); g.fill();
  g.globalCompositeOperation = 'multiply';
  g.strokeStyle = rgba(44, 70, 34, 0.92); g.lineWidth = grosor(1.5, s, 0.8);
  g.beginPath(); g.ellipse(0, 0, L * 0.52, poro + 1.5, 0, 0, TAU); g.stroke();
  g.fillStyle = rgba(30, 40, 24, 0.82); g.beginPath(); g.ellipse(0, 0, L * 0.44, poro * 0.62, 0, 0, TAU); g.fill();
  g.restore();
}

function epidermis(g: G, v: Vista) {
  const { s, semilla: sem, rect } = v;
  g.globalCompositeOperation = 'multiply';
  const margen = 150;
  const sitios = sitiosEpidermis(sem, rect, margen + 2.2 * HOJA.pasoX);
  const mapa = new Map(sitios.map((p) => [`${p.i},${p.j}`, p]));
  const visibles = sitios.filter((p) => p.x > rect.x0 - margen && p.x < rect.x1 + margen && p.y > rect.y0 - margen && p.y < rect.y1 + margen);
  const pols = visibles.map((p) => celda(p, mapa));
  // Paredes ligeramente curvas: la comba de cada lado sale de su punto medio, así las dos células
  // que comparten la pared dibujan exactamente la misma curva.
  const trazar = (pol: number[]) => {
    const n = pol.length / 2;
    g.moveTo(pol[0], pol[1]);
    for (let k = 0; k < n; k++) {
      const x1 = pol[k * 2], y1 = pol[k * 2 + 1], x2 = pol[((k + 1) % n) * 2], y2 = pol[((k + 1) % n) * 2 + 1];
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, largo = Math.hypot(x2 - x1, y2 - y1) || 1;
      const inv = x1 > x2 || (x1 === x2 && y1 > y2) ? -1 : 1;
      const comba = (hs(sem, Math.round(mx), Math.round(my), 650) - 0.5) * 0.3 * largo * inv;
      g.quadraticCurveTo(mx - ((y2 - y1) / largo) * comba, my + ((x2 - x1) / largo) * comba, x2, y2);
    }
    g.closePath();
  };
  // vacuolas con antocianina: el tono cambia de una célula a otra y por parches de la hoja
  visibles.forEach((p, k) => {
    const pol = pols[k]; if (pol.length < 6) return;
    if (p.estoma) { g.fillStyle = rgba(214, 232, 196, 0.5); g.beginPath(); trazar(pol); g.fill(); return; }
    const parche = ruido(sem, p.x / 520, p.y / 520, 640);
    const a = hs(sem, p.i, p.j, 641) < 0.14 ? 0.07 : 0.26 + hs(sem, p.i, p.j, 642) * 0.34 + parche * 0.3;
    const t = hs(sem, p.i, p.j, 643);
    // la vacuola con antocianina ocupa casi toda la célula: el pigmento se aclara hacia la pared
    const gr = g.createRadialGradient(p.x, p.y, 8, p.x, p.y, 92);
    gr.addColorStop(0, rgba(190 + t * 22, 50 + t * 34, 140 + t * 30, a * 1.12)); gr.addColorStop(0.7, rgba(198 + t * 22, 62 + t * 34, 150 + t * 30, a)); gr.addColorStop(1, rgba(214, 110, 176, a * 0.6));
    g.fillStyle = gr;
    g.beginPath(); trazar(pol); g.fill();
  });
  // paredes
  g.lineJoin = 'round';
  g.beginPath();
  for (const pol of pols) if (pol.length >= 6) trazar(pol);
  if (s > 0.3) { g.strokeStyle = rgba(236, 214, 226, 0.5); g.lineWidth = 6.5; g.stroke(); }
  g.strokeStyle = rgba(96, 52, 92, 0.8); g.lineWidth = grosor(1.5, s, 0.75); g.stroke();
  if (s > 0.3) {
    // núcleos: discos grisáceos, poco contrastados en la célula viva
    visibles.forEach((p) => {
      if (p.estoma) return;
      const x = p.x + (hs(sem, p.i, p.j, 644) - 0.5) * 26, y = p.y + (hs(sem, p.i, p.j, 645) - 0.5) * 18;
      g.fillStyle = rgba(150, 120, 150, 0.4); g.beginPath(); g.arc(x, y, 7.5, 0, TAU); g.fill();
      g.strokeStyle = rgba(104, 76, 110, 0.5); g.lineWidth = grosor(0.6, s, 0.5); g.stroke();
    });
  }
  for (const p of visibles) if (p.estoma) {
    if (s * 50 < 5) { g.fillStyle = rgba(70, 140, 60, 0.9); const l = Math.max(1.5 / s, 40); g.fillRect(p.x - l / 2, p.y - l * 0.32, l, l * 0.64); } else estoma(g, p, sem, s);
  }
}

/** Restos del mesófilo que quedaron pegados por debajo: manchas verdes fuera de foco. */
function mesofilo(g: G, v: Vista) {
  const { semilla: sem, rect } = v;
  const P = 380;
  g.globalCompositeOperation = 'multiply';
  for (let j = Math.floor(rect.y0 / P) - 1; j <= Math.floor(rect.y1 / P) + 1; j++)
    for (let i = Math.floor(rect.x0 / P) - 1; i <= Math.floor(rect.x1 / P) + 1; i++) {
      if (hs(sem, i, j, 680) > 0.3) continue;
      const cx = (i + hs(sem, i, j, 681)) * P, cy = (j + hs(sem, i, j, 682)) * P;
      for (let k = 0; k < 7; k++) {
        const x = cx + (hs(sem, i, j, 683 + k) - 0.5) * 150, y = cy + (hs(sem, i, j, 693 + k) - 0.5) * 110;
        g.fillStyle = rgba(120, 176, 84, 0.34);
        g.beginPath(); mancha(g, x, y, 22 + hs(sem, i, j, 703 + k) * 14, 8, 0.2, (q) => hs(sem, i, j, 713 + k * 8 + q)); g.fill();
      }
    }
}

export const ESTOMAS_PREP: Preparacion = {
  fondo: '#f3f0ea',
  capas: [{ id: 'mesofilo', z: -14, dibujar: mesofilo }, { id: 'epidermis', z: 0, dibujar: epidermis }],
};
