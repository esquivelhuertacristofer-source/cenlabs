/**
 * Gota de agua de estanque en montaje húmedo, sin teñir y EN VIVO.
 *
 * Capas (cada una se enfoca por separado, como al cortar ópticamente con el micrométrico):
 *   · fondo  (−6 µm): detritos, granos minerales y diatomeas pennadas (40–90 µm);
 *   · algas  ( 0 µm): filamentos de Spirogyra (≈ 34 µm de ancho, cloroplasto en cinta
 *     helicoidal con pirenoides) y de Oscillatoria;
 *   · vida   ( 0 µm): Paramecium caudatum (175–280 µm: cilios en onda metacrónica,
 *     surco oral, macronúcleo, vacuolas digestivas en ciclosis y dos vacuolas
 *     contráctiles que laten en contrafase), Euglena (≈ 52 µm: estigma rojo, flagelo,
 *     metabolia), ciliados pequeños, Amoeba proteus y bacterias en movimiento browniano.
 *
 * Simplificación declarada: los nadadores van frenados (como con metilcelulosa);
 * un paramecio libre cruza el campo de 40× en medio segundo.
 */
import { hs, largoParamecio, ruido } from '@/domain/microscopia/preparaciones';
import { TAU, caminoSuave, circulo, grosor, limitar, mancha, rgba, trazoSuave, type CapaViva, type G, type Preparacion, type Vista } from './pincel';

const MUNDO = 2700;           // semilado (µm) de la región donde vive la fauna
const CHUNK = 250;            // rejilla de los grumos de detrito

interface Grumo { x: number; y: number; r: number; i: number; j: number }
function grumosEn(sem: number, x0: number, y0: number, x1: number, y1: number): Grumo[] {
  const out: Grumo[] = [];
  for (let j = Math.floor(y0 / CHUNK) - 1; j <= Math.floor(y1 / CHUNK) + 1; j++)
    for (let i = Math.floor(x0 / CHUNK) - 1; i <= Math.floor(x1 / CHUNK) + 1; i++) {
      const casa = i === 0 && j === 0;
      if (!casa && hs(sem, i, j, 1000) > 0.42) continue;
      out.push({
        x: casa ? 12 : (i + 0.2 + hs(sem, i, j, 1001) * 0.6) * CHUNK, y: casa ? 4 : (j + 0.2 + hs(sem, i, j, 1002) * 0.6) * CHUNK,
        r: casa ? 46 : 22 + hs(sem, i, j, 1003) * 40, i, j,
      });
    }
  return out;
}

// ───────────────────────────── fondo: detritos y diatomeas ─────────────────────────────

function fondo(g: G, v: Vista) {
  const { s, semilla: sem, rect } = v;
  g.globalCompositeOperation = 'multiply';
  for (const c of grumosEn(sem, rect.x0 - 120, rect.y0 - 120, rect.x1 + 120, rect.y1 + 120)) {
    const h = (k: number) => hs(sem, c.i, c.j, 1010 + k);
    if (s < 0.3) { g.fillStyle = rgba(150, 124, 70, 0.5); g.beginPath(); mancha(g, c.x, c.y, c.r, 9, 0.3, h); g.fill(); continue; }
    const n = Math.round(c.r * 1.5);
    for (let k = 0; k < n; k++) {
      const a = h(20 + k) * TAU, d = (h(200 + k) + h(380 + k)) * 0.5 * c.r * 1.9;
      const x = c.x + Math.cos(a) * d * 1.15, y = c.y + Math.sin(a) * d * 0.85, r = 1.6 + h(560 + k) ** 2 * (c.r * 0.26);
      const t = h(740 + k);
      // materia orgánica: pardos, ocres y verdes apagados, translúcidos
      const col = t < 0.5 ? [150, 112, 56] : t < 0.78 ? [122, 128, 62] : t < 0.92 ? [96, 76, 44] : [70, 132, 60];
      g.fillStyle = rgba(col[0], col[1], col[2], 0.2 + h(920 + k) * 0.36);
      g.beginPath(); mancha(g, x, y, r, 8, 0.3, (q) => h(1100 + k * 8 + q), t * 6, 0.7 + t * 0.4); g.fill();
    }
    // granos minerales: angulosos, de borde oscuro e interior claro
    g.lineWidth = grosor(0.7, s);
    for (let k = 0; k < 5; k++) {
      const a = h(30 + k) * TAU, d = h(36 + k) * c.r * 1.5, x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d, r = 3 + h(42 + k) * 6;
      g.beginPath();
      for (let q = 0; q < 6; q++) { const aa = q / 6 * TAU + h(48 + k), rr = r * (0.6 + h(54 + k * 6 + q) * 0.6); if (q) g.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); else g.moveTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); }
      g.closePath();
      g.fillStyle = rgba(210, 200, 176, 0.3); g.fill();
      g.strokeStyle = rgba(60, 52, 40, 0.7); g.stroke();
    }
  }
  // diatomeas pennadas (Navicula): frústulo de sílice, dos plastos pardo dorados
  const P = 170;
  for (let j = Math.floor(rect.y0 / P) - 1; j <= Math.floor(rect.y1 / P) + 1; j++)
    for (let i = Math.floor(rect.x0 / P) - 1; i <= Math.floor(rect.x1 / P) + 1; i++) {
      if (hs(sem, i, j, 1300) > 0.3) continue;
      const h = (k: number) => hs(sem, i, j, 1310 + k);
      const x = (i + h(0)) * P, y = (j + h(1)) * P, L = 22 + h(2) * 24, W = L * (0.2 + h(3) * 0.06), rot = h(4) * TAU;
      g.save(); g.translate(x, y); g.rotate(rot);
      const forma = () => { g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(-L * 0.4, -W * 1.5, 0, -W); g.quadraticCurveTo(L * 0.4, -W * 1.5 + W * 0.5, L, 0); g.quadraticCurveTo(L * 0.4, W * 1.0, 0, W); g.quadraticCurveTo(-L * 0.4, W * 1.5, -L, 0); g.closePath(); };
      forma(); g.fillStyle = rgba(232, 222, 180, 0.45); g.fill();
      if (s > 0.3) {
        g.fillStyle = rgba(190, 136, 36, 0.66);
        g.beginPath(); g.ellipse(-L * 0.42, 0, L * 0.34, W * 0.62, 0, 0, TAU); g.ellipse(L * 0.42, 0, L * 0.34, W * 0.62, 0, 0, TAU); g.fill();
        if (s > 1.3) {
          g.strokeStyle = rgba(80, 70, 30, 0.3); g.lineWidth = grosor(0.25, s, 0.4); g.beginPath();
          for (let q = -L * 0.86; q < L * 0.86; q += 1.3) { const w = W * (1 - (q / L) ** 2) * 0.96; g.moveTo(q, -w); g.lineTo(q, w); }
          g.stroke();
        }
      }
      forma(); g.strokeStyle = rgba(70, 62, 30, 0.82); g.lineWidth = grosor(0.8, s, 0.7); g.stroke();
      g.beginPath(); g.moveTo(-L * 0.9, 0); g.lineTo(L * 0.9, 0); g.strokeStyle = rgba(70, 62, 30, 0.45); g.lineWidth = grosor(0.4, s, 0.4); g.stroke();
      g.restore();
    }
}

// ───────────────────────────── algas filamentosas ─────────────────────────────

interface Filamento { x: number; y: number; ang: number; ancho: number; celda: number; tipo: 0 | 1; cintas: number; vueltas: number; k: number; semi: number }
function filamentos(sem: number): Filamento[] {
  const out: Filamento[] = [
    // uno cruza siempre el campo de salida, para que la primera imagen ya tenga alga en foco
    { x: -60, y: 132, ang: -0.3, ancho: 34, celda: 118, tipo: 0, cintas: 1, vueltas: 3.2, k: 0, semi: 900 },
  ];
  for (let k = 1; k < 44; k++) {
    const tipo = hs(sem, k, 3, 1400) < 0.72 ? 0 : 1;
    const fx = (hs(sem, k, 0, 1401) - 0.5) * 2 * MUNDO, fy = (hs(sem, k, 1, 1402) - 0.5) * 2 * MUNDO, fa = hs(sem, k, 2, 1403) * Math.PI;
    // la escena de salida queda despejada: sólo la cruza el filamento fijo
    if (Math.abs(-(0 - fx) * Math.sin(fa) + (0 - fy) * Math.cos(fa)) < 430 && Math.hypot(fx, fy) < 1500) continue;
    out.push({
      x: fx, y: fy, ang: fa,
      ancho: tipo ? 9 + hs(sem, k, 4, 1404) * 3 : 28 + hs(sem, k, 4, 1404) * 12, celda: tipo ? 4.2 : 90 + hs(sem, k, 5, 1405) * 60, tipo,
      cintas: hs(sem, k, 6, 1406) < 0.3 ? 2 : 1, vueltas: 2.4 + hs(sem, k, 7, 1407) * 2, k, semi: 260 + hs(sem, k, 8, 1408) * 700,
    });
  }
  return out;
}

function algas(g: G, v: Vista) {
  const { s, semilla: sem, rect } = v;
  g.globalCompositeOperation = 'multiply';
  const cx = (rect.x0 + rect.x1) / 2, cy = (rect.y0 + rect.y1) / 2;
  const radio = Math.hypot(rect.x1 - rect.x0, rect.y1 - rect.y0) / 2;
  for (const f of filamentos(sem)) {
    const dx = Math.cos(f.ang), dy = Math.sin(f.ang);
    const lejos = Math.abs(-(cx - f.x) * dy + (cy - f.y) * dx);
    if (lejos > radio + f.ancho) continue;
    const t = (cx - f.x) * dx + (cy - f.y) * dy;
    if (t - radio > f.semi || t + radio < -f.semi) continue;
    // el filamento es un tramo finito: se dibujan sólo sus células enteras
    const nCel = Math.max(1, Math.round(f.semi / f.celda));
    const W = f.ancho, k0 = Math.max(-nCel, Math.floor((t - radio) / f.celda) - 1), k1 = Math.min(nCel - 1, Math.ceil((t + radio) / f.celda) + 1);
    if (k1 < k0) continue;
    const xa = k0 * f.celda, xb = (k1 + 1) * f.celda;
    g.save(); g.translate(f.x, f.y); g.rotate(f.ang);
    if (f.tipo === 1) {
      // Oscillatoria: tricoma fino verde azulado, de discos apilados
      g.fillStyle = rgba(88, 150, 132, 0.62); g.fillRect(xa, -W / 2, xb - xa, W);
      g.strokeStyle = rgba(40, 90, 80, 0.7); g.lineWidth = grosor(0.6, s, 0.6); g.strokeRect(xa, -W / 2, xb - xa, W);
      if (s > 0.9) {
        g.strokeStyle = rgba(40, 90, 80, 0.4); g.lineWidth = grosor(0.3, s, 0.4); g.beginPath();
        for (let k = k0; k <= k1 + 1; k++) { g.moveTo(k * f.celda, -W / 2); g.lineTo(k * f.celda, W / 2); }
        g.stroke();
      }
      g.restore(); continue;
    }
    // vaina y pared
    g.fillStyle = rgba(226, 240, 214, 0.42); g.fillRect(xa, -W / 2, xb - xa, W);
    if (s < 0.3) {
      g.fillStyle = rgba(86, 156, 62, 0.62); g.fillRect(xa, -W * 0.36, xb - xa, W * 0.72);
      g.restore(); continue;
    }
    for (let k = k0; k <= k1; k++) {
      const x0 = k * f.celda, Lc = f.celda, fase = hs(sem, f.k, k, 1420) * TAU;
      const A = W / 2 - 4.2, pasos = Math.max(24, Math.round(Lc * Math.min(s, 2) * 0.9));
      for (let cinta = 0; cinta < f.cintas; cinta++) {
        const ph = fase + cinta * Math.PI;
        // la cinta gira en hélice pegada a la pared: media vuelta pasa por delante y media por detrás
        for (const delante of [false, true]) {
          g.strokeStyle = delante ? rgba(52, 134, 40, 0.84) : rgba(124, 186, 86, 0.5);
          g.lineWidth = delante ? 7.4 : 6; g.lineCap = 'round';
          g.beginPath();
          let dentro = false;
          for (let q = 0; q <= pasos; q++) {
            const u = q / pasos, th = TAU * f.vueltas * u + ph;
            const x = x0 + 3 + u * (Lc - 6), y = A * Math.sin(th);
            if ((Math.cos(th) > 0) === delante) { if (dentro) g.lineTo(x, y); else { g.moveTo(x, y); dentro = true; } } else dentro = false;
          }
          g.stroke();
        }
        if (s > 0.8) {
          // pirenoides: cuentas oscuras a lo largo de la cinta
          g.fillStyle = rgba(30, 92, 30, 0.8); g.beginPath();
          const np = Math.round(f.vueltas * 4);
          for (let q = 0; q < np; q++) { const u = (q + 0.5) / np, th = TAU * f.vueltas * u + ph; if (Math.cos(th) > -0.2) circulo(g, x0 + 3 + u * (Lc - 6), A * Math.sin(th), 1.5); }
          g.fill();
        }
      }
      // núcleo colgado en el centro por hebras de citoplasma
      if (s > 0.8) {
        g.fillStyle = rgba(170, 170, 140, 0.4); g.beginPath(); g.arc(x0 + Lc / 2, 0, 4.6, 0, TAU); g.fill();
        g.strokeStyle = rgba(120, 130, 100, 0.3); g.lineWidth = grosor(0.4, s, 0.4); g.beginPath();
        for (const [ex, ey] of [[-9, -A], [9, -A], [-9, A], [9, A]]) { g.moveTo(x0 + Lc / 2, 0); g.lineTo(x0 + Lc / 2 + ex, ey); }
        g.stroke();
      }
    }
    // paredes: laterales y tabiques transversales
    g.lineCap = 'butt';
    g.strokeStyle = rgba(120, 150, 100, 0.3); g.lineWidth = 3.6;
    g.beginPath(); g.moveTo(xa, -W / 2); g.lineTo(xb, -W / 2); g.moveTo(xa, W / 2); g.lineTo(xb, W / 2); g.stroke();
    g.strokeStyle = rgba(52, 84, 44, 0.74); g.lineWidth = grosor(0.9, s, 0.7);
    g.beginPath();
    g.moveTo(xa, -W / 2); g.lineTo(xb, -W / 2); g.moveTo(xa, W / 2); g.lineTo(xb, W / 2);
    for (let k = k0; k <= k1 + 1; k++) { g.moveTo(k * f.celda, -W / 2); g.lineTo(k * f.celda, W / 2); }
    g.stroke();
    g.restore();
  }
}

// ───────────────────────────── fauna ─────────────────────────────

type Tipo = 'paramecio' | 'euglena' | 'ciliado' | 'ameba';
interface Bicho {
  tipo: Tipo; x: number; y: number; ang: number; vel: number; giro: number;
  L: number; k: number;
  /** fase propia: giro sobre el eje, latido, metabolia */
  fase: number;
  /** tiempo que le queda en su conducta actual (s) */
  reloj: number;
  /** 0 nada, 1 retrocede (reacción de evitación), 2 pasta junto a un grumo */
  modo: 0 | 1 | 2;
  gx: number; gy: number; gr: number;
}
interface Estanque { sem: number; bichos: Bicho[]; t: number; grumos: Grumo[] }

function crear(sem: number): Estanque {
  const Lp = largoParamecio(sem);
  const bichos: Bicho[] = [];
  const grumos = grumosEn(sem, -MUNDO, -MUNDO, MUNDO, MUNDO);
  const nuevo = (tipo: Tipo, k: number, L: number, vel: number): Bicho => ({
    tipo, k, L, vel, x: (hs(sem, k, 1, 1500) - 0.5) * 2 * MUNDO, y: (hs(sem, k, 2, 1501) - 0.5) * 2 * MUNDO, ang: hs(sem, k, 3, 1502) * TAU,
    giro: 0, fase: hs(sem, k, 4, 1503) * 40, reloj: 1 + hs(sem, k, 5, 1504) * 6, modo: 0, gx: 0, gy: 0, gr: 0,
  });
  // todos los paramecios de la muestra son de la misma especie: mismo largo (± 3 %)
  for (let k = 0; k < 64; k++) bichos.push(nuevo('paramecio', k, Lp * (0.97 + hs(sem, k, 6, 1505) * 0.06), 46 + hs(sem, k, 7, 1506) * 22));
  for (let k = 100; k < 250; k++) bichos.push(nuevo('euglena', k, 46 + hs(sem, k, 6, 1505) * 14, 22 + hs(sem, k, 7, 1506) * 16));
  for (let k = 300; k < 390; k++) bichos.push(nuevo('ciliado', k, 34 + hs(sem, k, 6, 1505) * 22, 70 + hs(sem, k, 7, 1506) * 60));
  for (let k = 400; k < 414; k++) bichos.push(nuevo('ameba', k, 80 + hs(sem, k, 6, 1505) * 40, 1.6));
  // escena de salida: dos paramecios pastando en el grumo central, euglenas cerca y una ameba
  const casa = grumos.find((c) => c.i === 0 && c.j === 0)!;
  const fijar = (b: Bicho, x: number, y: number, ang: number) => { b.x = x; b.y = y; b.ang = ang; };
  const pasta = (b: Bicho) => { b.modo = 2; b.reloj = 70 + b.k * 9; b.gx = casa.x; b.gy = casa.y; b.gr = casa.r; };
  fijar(bichos[0], -86, -52, 0.35); pasta(bichos[0]);
  fijar(bichos[1], 118, 56, 3.6); pasta(bichos[1]);
  fijar(bichos[2], 420, -260, 2.6);
  fijar(bichos[64], -150, 60, 5.4); fijar(bichos[65], 60, -150, 1.2); fijar(bichos[66], 170, -70, 2.9); fijar(bichos[67], -40, 175, 0.4);
  fijar(bichos[64 + 150], -210, -120, 0.8); fijar(bichos[64 + 151], 240, 150, 4);
  fijar(bichos[64 + 150 + 90], -330, 215, 0);
  return { sem, bichos, t: 0, grumos };
}

function paso(e: Estanque, dt: number) {
  e.t += dt;
  for (const b of e.bichos) {
    b.fase += dt;
    b.reloj -= dt;
    const azar = (q: number) => hs(e.sem, b.k, Math.floor(e.t * 3) + q, 1600 + Math.floor(b.fase));
    if (b.tipo === 'ameba') {
      b.ang += (ruido(e.sem, b.fase * 0.05, b.k, 1610) - 0.5) * dt * 0.6;
    } else if (b.modo === 1) {
      // reacción de evitación: marcha atrás un instante y cambio de rumbo
      if (b.reloj <= 0) { b.modo = 0; b.ang += (azar(1) - 0.5) * 2.6; b.reloj = 3 + azar(2) * 7; }
    } else if (b.modo === 2) {
      // pasta: rodea el grumo despacio, barriendo bacterias con el surco oral
      const dx = b.gx - b.x, dy = b.gy - b.y, d = Math.hypot(dx, dy), hacia = Math.atan2(dy, dx);
      const quiere = hacia + (d > b.gr + b.L * 0.42 ? 0.5 : d < b.gr + b.L * 0.2 ? 2.3 : 1.35) * (b.k & 1 ? 1 : -1);
      b.giro = Math.atan2(Math.sin(quiere - b.ang), Math.cos(quiere - b.ang)) * 1.4;
      if (b.reloj <= 0) { b.modo = 0; b.reloj = 5 + azar(3) * 6; }
    } else {
      b.giro += ((ruido(e.sem, b.fase * 0.35, b.k * 3.1, 1620) - 0.5) * 2.4 - b.giro) * Math.min(1, dt * 2);
      if (b.reloj <= 0) {
        if (b.tipo === 'paramecio') {
          // ¿hay comida cerca? se queda a pastar; si no, reacción de evitación
          let cerca: Grumo | null = null;
          for (const c of e.grumos) if (Math.hypot(c.x - b.x, c.y - b.y) < c.r + 190) { cerca = c; break; }
          if (cerca && azar(4) < 0.7) { b.modo = 2; b.reloj = 14 + azar(5) * 30; b.gx = cerca.x; b.gy = cerca.y; b.gr = cerca.r; } else { b.modo = 1; b.reloj = 0.35 + azar(6) * 0.3; }
        } else if (b.tipo === 'ciliado') { b.ang += (azar(7) - 0.5) * 3; b.reloj = 0.6 + azar(8) * 2.4; } else { b.reloj = 3 + azar(9) * 6; b.ang += (azar(10) - 0.5) * 0.9; }
      }
    }
    if (b.tipo !== 'ameba') b.ang += b.giro * dt;
    const v = b.modo === 1 ? -b.vel * 0.9 : b.modo === 2 ? b.vel * 0.3 : b.vel;
    b.x += Math.cos(b.ang) * v * dt; b.y += Math.sin(b.ang) * v * dt;
    if (Math.abs(b.x) > MUNDO || Math.abs(b.y) > MUNDO) { b.ang = Math.atan2(-b.y, -b.x); b.x = limitar(b.x, -MUNDO, MUNDO); b.y = limitar(b.y, -MUNDO, MUNDO); }
  }
}

/** Contorno de un paramecio: extremo anterior romo, máximo detrás del centro, cola en cono. */
function perfilParamecio(L: number, W: number, curva: number, n: number): Float32Array {
  const pts = new Float32Array(n * 4);
  for (let q = 0; q < n * 2; q++) {
    const arriba = q < n, u = arriba ? q / (n - 1) : 1 - (q - n) / (n - 1);
    // u = 0 punta anterior … 1 punta posterior
    // elipse (extremos redondos) ensanchada hacia atrás y rematada en un cono romo
    const cono = u < 0.7 ? 0 : ((u - 0.7) / 0.3) ** 2;
    const hw = (W / 2) * Math.sqrt(Math.max(0, 4 * u * (1 - u))) ** 0.8 * (0.8 + 0.42 * u) * (1 - 0.34 * cono);
    const x = L / 2 - u * L, y = (arriba ? -hw : hw) + curva * (x / L) ** 2 * L;
    pts[q * 2] = x; pts[q * 2 + 1] = y;
  }
  return pts;
}

function paramecio(g: G, b: Bicho, s: number, t: number) {
  const L = b.L, W = L * 0.27, f = b.fase;
  const rolido = f * 1.7;                         // gira sobre su eje al nadar
  const curva = limitar(b.giro * 0.05, -0.08, 0.08);
  const N = 40;
  const pts = perfilParamecio(L, W, curva, N);
  g.save(); g.translate(b.x, b.y); g.rotate(b.ang + Math.sin(f * 2.3) * 0.035);
  // ── cilios: onda metacrónica que recorre el cuerpo de delante atrás ──
  if (s > 0.85) {
    g.strokeStyle = rgba(52, 50, 40, 0.42); g.lineWidth = grosor(0.3, s, 0.5); g.lineCap = 'round';
    g.beginPath();
    const total = N * 2;
    for (let q = 0; q < total; q++) {
      const x0 = pts[q * 2], y0 = pts[q * 2 + 1], x1 = pts[((q + 1) % total) * 2], y1 = pts[((q + 1) % total) * 2 + 1];
      const tx = x1 - x0, ty = y1 - y0, lon = Math.hypot(tx, ty) || 1;
      let nx = ty / lon, ny = -tx / lon;
      if (nx * x0 + ny * y0 < 0) { nx = -nx; ny = -ny; }
      const sub = Math.max(1, Math.round(lon / 2.1));
      for (let w = 0; w < sub; w++) {
        const px = x0 + tx * (w / sub), py = y0 + ty * (w / sub);
        const onda = Math.sin((px / L) * 26 + t * (b.modo === 1 ? -22 : 17) + (py > 0 ? 1.3 : 0));
        const cola = px < -L * 0.44 ? 1.7 : 1;         // penacho caudal más largo
        // cada cilio se inclina hacia atrás (golpe eficaz) y se endereza (golpe de recuperación)
        const largo = (7.5 + onda * 1.6) * cola, atras = 0.55 + onda * 0.5;
        const dx = nx - atras, dy = ny, dn = Math.hypot(dx, dy) || 1;
        g.moveTo(px, py);
        g.lineTo(px + (dx / dn) * largo, py + (dy / dn) * largo);
      }
    }
    g.stroke();
  }
  // ── cuerpo translúcido: ectoplasma claro y endoplasma granuloso ──
  g.beginPath(); caminoSuave(g, pts, N * 2);
  const gr = g.createLinearGradient(0, -W / 2, 0, W / 2);
  gr.addColorStop(0, rgba(128, 122, 94, 0.66)); gr.addColorStop(0.28, rgba(176, 170, 138, 0.56)); gr.addColorStop(0.72, rgba(170, 164, 132, 0.58)); gr.addColorStop(1, rgba(120, 114, 86, 0.7));
  g.fillStyle = gr; g.fill();
  // borde: halo de refracción ancho y tenue, y la película en un trazo fino
  g.strokeStyle = rgba(60, 56, 40, 0.16); g.lineWidth = 3.4; g.stroke();
  g.strokeStyle = rgba(44, 42, 32, 0.78); g.lineWidth = grosor(0.8, s, 0.8); g.stroke();
  g.save(); g.clip();
  // capa de tricocistos bajo la película
  g.strokeStyle = rgba(96, 92, 70, 0.3); g.lineWidth = 3.2; g.beginPath(); caminoSuave(g, pts, N * 2); g.stroke();
  // surco oral: banda oblicua desde el extremo anterior hasta el citostoma (se ve girar con el rolido)
  const lado = Math.cos(rolido);
  g.strokeStyle = rgba(104, 98, 72, 0.34); g.lineWidth = L * 0.062; g.lineCap = 'round';
  g.beginPath(); g.moveTo(L * 0.44, -W * 0.26 * lado); g.quadraticCurveTo(L * 0.2, -W * 0.34 * lado, -L * 0.04, W * 0.1 * lado); g.stroke();
  g.fillStyle = rgba(84, 78, 56, 0.4); g.beginPath(); g.ellipse(-L * 0.06, W * 0.13 * lado, L * 0.035, L * 0.022, 0.5, 0, TAU); g.fill();
  // macronúcleo (arriñonado) y micronúcleo
  g.fillStyle = rgba(120, 124, 136, 0.42); g.beginPath(); g.ellipse(L * 0.03, -W * 0.05 * lado, L * 0.105, W * 0.2, 0.15, 0, TAU); g.fill();
  g.strokeStyle = rgba(80, 84, 96, 0.4); g.lineWidth = grosor(0.5, s, 0.5); g.stroke();
  g.fillStyle = rgba(90, 94, 110, 0.6); g.beginPath(); g.arc(L * 0.07, W * 0.15 * lado, L * 0.014, 0, TAU); g.fill();
  // vacuolas digestivas arrastradas por la ciclosis
  for (let q = 0; q < 9; q++) {
    const a = q * 0.7 + f * 0.16 + hs(b.k, q, 3, 1700) * 0.5;
    const vx = Math.cos(a) * L * (0.2 + (q % 3) * 0.06) - L * 0.05, vy = Math.sin(a) * W * (0.2 + (q % 2) * 0.08);
    const r = 2.6 + hs(b.k, q, 4, 1701) * 3.6, verde = hs(b.k, q, 5, 1702) < 0.4;
    g.fillStyle = verde ? rgba(94, 142, 58, 0.6) : rgba(128, 104, 52, 0.55);
    g.beginPath(); g.arc(vx, vy, r, 0, TAU); g.fill();
    g.strokeStyle = rgba(60, 54, 36, 0.5); g.lineWidth = grosor(0.4, s, 0.4); g.stroke();
  }
  // gránulos del endoplasma
  if (s > 0.9) {
    g.fillStyle = rgba(84, 80, 58, 0.34); g.beginPath();
    for (let q = 0; q < 240; q++) {
      const a = hs(b.k, q, 6, 1710) * TAU + f * 0.12, d = Math.sqrt(hs(b.k, q, 7, 1711));
      circulo(g, Math.cos(a) * d * L * 0.43 - L * 0.02, Math.sin(a) * d * W * 0.4, 0.5 + hs(b.k, q, 8, 1712) * 0.75);
    }
    g.fill();
  }
  // vacuolas contráctiles: se llenan despacio (diástole) y se vacían de golpe (sístole), en contrafase
  for (const [px, desfase] of [[L * 0.29, 0], [-L * 0.3, 0.5]] as const) {
    const p = ((f / 7 + desfase) % 1 + 1) % 1;
    const r = p < 0.86 ? L * 0.034 * Math.sqrt(p / 0.86) : L * 0.034 * (1 - (p - 0.86) / 0.14);
    const cy = W * 0.08;
    g.strokeStyle = rgba(70, 70, 56, 0.2 + (1 - p) * 0.4); g.lineWidth = grosor(0.7, s, 0.5); g.beginPath();
    for (let q = 0; q < 7; q++) { const a = q / 7 * TAU + 0.3; g.moveTo(px + Math.cos(a) * (r + 0.6), cy + Math.sin(a) * (r + 0.6)); g.lineTo(px + Math.cos(a) * L * 0.07, cy + Math.sin(a) * L * 0.07); }
    g.stroke();
    if (r > 0.3) {
      g.fillStyle = rgba(250, 250, 244, 0.92); g.beginPath(); g.arc(px, cy, r, 0, TAU); g.fill();
      g.strokeStyle = rgba(56, 56, 44, 0.66); g.lineWidth = grosor(0.6, s, 0.6); g.stroke();
    }
  }
  g.restore();
  g.restore();
}

function euglena(g: G, b: Bicho, s: number, t: number) {
  // metabolia: una onda de contracción recorre el cuerpo cuando se detiene
  const met = Math.max(0, Math.sin(b.fase * 0.5 + b.k)) ** 6;
  const L = b.L * (1 - met * 0.2), W = b.L * 0.25 * (1 + met * 0.5);
  const N = 14, pts = new Float32Array(N * 4);
  for (let q = 0; q < N * 2; q++) {
    const arriba = q < N, u = arriba ? q / (N - 1) : 1 - (q - N) / (N - 1);
    const bulto = 1 + met * 0.4 * Math.sin(u * 9 - b.fase * 3);
    const hw = (W / 2) * Math.sqrt(Math.max(0, 4 * u * (1 - u))) ** 0.75 * (u < 0.55 ? 1 : 1 - 0.75 * ((u - 0.55) / 0.45) ** 1.6) * bulto;
    pts[q * 2] = L / 2 - u * L; pts[q * 2 + 1] = arriba ? -hw : hw;
  }
  g.save(); g.translate(b.x, b.y); g.rotate(b.ang + Math.sin(b.fase * 5) * 0.09);
  if (s > 0.8) {
    // flagelo: látigo por delante, en onda
    g.strokeStyle = rgba(44, 60, 36, 0.5); g.lineWidth = grosor(0.35, s, 0.5);
    const fl = new Float32Array(20);
    for (let q = 0; q < 10; q++) { fl[q * 2] = L / 2 + q * 3.4; fl[q * 2 + 1] = Math.sin(q * 0.9 - t * 16) * q * 0.75; }
    g.beginPath(); trazoSuave(g, fl, 10); g.stroke();
  }
  g.beginPath(); caminoSuave(g, pts, N * 2);
  g.fillStyle = rgba(126, 180, 66, 0.72); g.fill();
  g.strokeStyle = rgba(40, 82, 30, 0.16); g.lineWidth = 2.4; g.stroke();
  g.strokeStyle = rgba(40, 82, 30, 0.8); g.lineWidth = grosor(0.6, s, 0.7); g.stroke();
  if (s > 0.5) {
    g.save(); g.clip();
    g.fillStyle = rgba(46, 128, 40, 0.72); g.beginPath();
    for (let q = 0; q < 16; q++) circulo(g, (hs(b.k, q, 1, 1720) - 0.56) * L * 0.74, (hs(b.k, q, 2, 1721) - 0.5) * W * 0.8, 2 + hs(b.k, q, 3, 1722) * 1.1);
    g.fill();
    // extremo anterior claro (reservorio) con el estigma rojo
    g.fillStyle = rgba(234, 244, 210, 0.85); g.beginPath(); g.arc(L * 0.39, 0, W * 0.2, 0, TAU); g.fill();
    g.fillStyle = rgba(214, 52, 26, 0.95); g.beginPath(); g.arc(L * 0.35, -W * 0.17, 1.5, 0, TAU); g.fill();
    g.restore();
  }
  g.restore();
}

function ciliado(g: G, b: Bicho, s: number, t: number) {
  const L = b.L, W = L * 0.52;
  g.save(); g.translate(b.x, b.y); g.rotate(b.ang);
  if (s > 0.85) {
    g.strokeStyle = rgba(52, 50, 40, 0.36); g.lineWidth = grosor(0.3, s, 0.5); g.beginPath();
    for (let q = 0; q < 44; q++) {
      const a = q / 44 * TAU, x = Math.cos(a) * L / 2, y = Math.sin(a) * W / 2, o = 4.6 + Math.sin(q * 0.9 + t * 24) * 1.2;
      g.moveTo(x, y); g.lineTo(x + Math.cos(a) * o - 2, y + Math.sin(a) * o);
    }
    g.stroke();
  }
  g.beginPath(); g.ellipse(0, 0, L / 2, W / 2, 0, 0, TAU);
  g.fillStyle = rgba(184, 180, 152, 0.46); g.fill();
  g.strokeStyle = rgba(52, 50, 40, 0.74); g.lineWidth = grosor(0.7, s, 0.7); g.stroke();
  if (s > 0.5) {
    g.fillStyle = rgba(120, 124, 136, 0.42); g.beginPath(); g.arc(-L * 0.05, 0, W * 0.2, 0, TAU); g.fill();
    g.fillStyle = rgba(128, 108, 56, 0.5); g.beginPath();
    for (let q = 0; q < 4; q++) circulo(g, (hs(b.k, q, 1, 1730) - 0.5) * L * 0.6, (hs(b.k, q, 2, 1731) - 0.5) * W * 0.5, 1.6 + hs(b.k, q, 3, 1732) * 1.6);
    g.fill();
    g.fillStyle = rgba(250, 250, 244, 0.9); g.beginPath(); g.arc(-L * 0.3, W * 0.1, W * 0.1 * Math.abs(Math.sin(b.fase * 0.9)), 0, TAU); g.fill();
  }
  g.restore();
}

function ameba(g: G, b: Bicho, s: number) {
  const R = b.L, N = 56, pts = new Float32Array(N * 2), dentro = new Float32Array(N * 2);
  const radio = (a: number) => {
    let r = 0.5;
    for (let q = 0; q < 5; q++) {
      const centro = q * 1.26 + hs(b.k, q, 1, 1740) * 0.6 + Math.sin(b.fase * 0.02 + q) * 0.3;
      const ext = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(b.fase * (0.05 + hs(b.k, q, 2, 1741) * 0.05) + q * 2.1));
      const d = Math.atan2(Math.sin(a - centro), Math.cos(a - centro));
      r += ext * Math.exp(-(d * d) / 0.11);
    }
    return r * R;
  };
  for (let q = 0; q < N; q++) {
    const a = q / N * TAU, r = radio(a);
    pts[q * 2] = Math.cos(a) * r; pts[q * 2 + 1] = Math.sin(a) * r;
    dentro[q * 2] = Math.cos(a) * r * 0.84; dentro[q * 2 + 1] = Math.sin(a) * r * 0.84;
  }
  g.save(); g.translate(b.x, b.y); g.rotate(b.ang);
  // ectoplasma hialino y endoplasma granuloso
  g.beginPath(); caminoSuave(g, pts, N);
  g.fillStyle = rgba(208, 208, 190, 0.34); g.fill();
  g.strokeStyle = rgba(60, 60, 50, 0.6); g.lineWidth = grosor(0.8, s, 0.7); g.stroke();
  g.beginPath(); caminoSuave(g, dentro, N);
  g.fillStyle = rgba(160, 154, 126, 0.34); g.fill();
  if (s > 0.5) {
    g.save(); g.clip();
    g.fillStyle = rgba(76, 72, 54, 0.4); g.beginPath();
    for (let q = 0; q < 150; q++) {
      const a = hs(b.k, q, 3, 1750) * TAU + Math.sin(b.fase * 0.1 + q) * 0.1, d = Math.sqrt(hs(b.k, q, 4, 1751)) * 0.8 * radio(a);
      circulo(g, Math.cos(a) * d, Math.sin(a) * d, 0.7 + hs(b.k, q, 5, 1752) * 0.9);
    }
    g.fill();
    g.fillStyle = rgba(96, 142, 60, 0.55); g.beginPath();
    for (let q = 0; q < 5; q++) circulo(g, (hs(b.k, q, 6, 1753) - 0.5) * R * 0.7, (hs(b.k, q, 7, 1754) - 0.5) * R * 0.7, 3.5 + hs(b.k, q, 8, 1755) * 3);
    g.fill();
    g.fillStyle = rgba(120, 124, 132, 0.5); g.beginPath(); g.arc(R * 0.12, -R * 0.08, R * 0.15, 0, TAU); g.fill();
    g.strokeStyle = rgba(80, 84, 92, 0.5); g.lineWidth = grosor(0.5, s, 0.5); g.stroke();
    const p = (b.fase / 11) % 1, rv = R * 0.11 * (p < 0.9 ? Math.sqrt(p / 0.9) : 1 - (p - 0.9) / 0.1);
    g.fillStyle = rgba(250, 250, 244, 0.9); g.beginPath(); g.arc(-R * 0.22, R * 0.16, rv, 0, TAU); g.fill();
    g.strokeStyle = rgba(56, 56, 44, 0.55); g.stroke();
    g.restore();
  }
  g.restore();
}

function vida(g: G, v: Vista, e: Estanque, t: number) {
  const { s, rect } = v;
  g.globalCompositeOperation = 'source-over';
  // bacterias y partículas en movimiento browniano
  if (s > 0.7) {
    const P = 64;
    g.fillStyle = rgba(60, 58, 46, 0.5);
    for (let j = Math.floor(rect.y0 / P); j <= Math.floor(rect.y1 / P); j++)
      for (let i = Math.floor(rect.x0 / P); i <= Math.floor(rect.x1 / P); i++)
        for (let q = 0; q < 5; q++) {
          const f1 = hs(e.sem, i, j, 1800 + q) * 9 + 2, f2 = hs(e.sem, i, j, 1810 + q) * 9 + 2;
          const x = (i + hs(e.sem, i, j, 1820 + q)) * P + Math.sin(t * f1 + q) * 1.6 + Math.sin(t * 0.21 * f2) * 5;
          const y = (j + hs(e.sem, i, j, 1830 + q)) * P + Math.cos(t * f2 + q) * 1.6 + Math.cos(t * 0.17 * f1) * 5;
          const l = 0.9 + hs(e.sem, i, j, 1840 + q) * 1.4;
          g.fillRect(x, y, l, Math.max(0.7, 0.8 / s));
        }
  }
  const margen = 320;
  const orden: Tipo[] = ['ameba', 'euglena', 'ciliado', 'paramecio'];
  for (const tipo of orden) for (const b of e.bichos) {
    if (b.tipo !== tipo || b.x < rect.x0 - margen || b.x > rect.x1 + margen || b.y < rect.y0 - margen || b.y > rect.y1 + margen) continue;
    if (s * b.L < 3) { g.fillStyle = rgba(70, 70, 54, 0.6); g.fillRect(b.x - 1 / s, b.y - 1 / s, 2 / s, 2 / s); continue; }
    if (tipo === 'paramecio') paramecio(g, b, s, t); else if (tipo === 'euglena') euglena(g, b, s, t); else if (tipo === 'ciliado') ciliado(g, b, s, t); else ameba(g, b, s);
  }
}

const VIVA: CapaViva<Estanque> = { z: 0, crear, paso, dibujar: vida };

export const ESTANQUE_PREP: Preparacion = {
  fondo: '#ecebe2',
  capas: [{ id: 'fondo', z: -6, dibujar: fondo }, { id: 'algas', z: 0, dibujar: algas }],
  viva: VIVA as CapaViva,
};
