/**
 * fis09/grafica.ts — la gráfica F–r del dock, como función PURA sobre un contexto 2D
 * (sin React ni three): la prueba jest la ejecuta con un contexto que graba las llamadas
 * y comprueba que, antes de validar, no se escribe ni una cifra de fuerza.
 *
 * Ejes logarítmicos: r de 2 a 40 cm y F en una ventana FIJA de cinco décadas que cubre todo
 * el banco (0,025 N … 2500 N). En log–log la ley de Coulomb es una recta de pendiente −2;
 * al cambiar |q₁q₂| la recta sube o baja sin cambiar de pendiente.
 *
 * NO REGALAR: el reto pide calcular |F| en newtons, y el banco puede ponerse en la
 * configuración del reto. Por eso, ANTES de validar, el eje F no lleva cifras (sólo
 * «cada línea ×10») ni hay valores en N en ningún sitio: se ven la forma (pendiente −2),
 * las razones (÷4 al duplicar r) y las mediciones del alumno como puntos. Tras validar
 * aparecen las cifras en N y el punto del reto.
 */
import { K_COULOMB } from '@/domain/fisica';
import { VENTANA_F, VENTANA_R, fmtNum, fmtFuerza } from './campo';

export interface PuntoMedido { r: number; q1: number; q2: number }

export interface DatosGrafica {
  /** r visible (cm), del reloj */
  r: number;
  /** cargas del banco (μC) */
  q1: number;
  q2: number;
  puntos: PuntoMedido[];
  validado: boolean;
  reto?: { q1: number; q2: number; r: number };
  fuente?: string;
}

/** Subconjunto de CanvasRenderingContext2D que usa la gráfica (para poder grabarlo en jest). */
export type Ctx2D = Pick<CanvasRenderingContext2D,
  'save' | 'restore' | 'beginPath' | 'moveTo' | 'lineTo' | 'stroke' | 'fill' | 'arc' | 'fillRect' | 'fillText' | 'setLineDash' | 'closePath' | 'rect' | 'clip'
> & {
  fillStyle: string | CanvasGradient | CanvasPattern; strokeStyle: string | CanvasGradient | CanvasPattern; lineWidth: number;
  font: string; textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline; globalAlpha: number;
  shadowColor: string; shadowBlur: number;
};

/** |F| (N) con q en μC y r en cm (la misma expresión que el dominio). */
export const fuerza = (q1: number, q2: number, r: number) => (K_COULOMB * Math.abs(q1 * q2) * 1e-12) / ((r / 100) ** 2);

export const COLORES = {
  fondo: '#0b1422', rejilla: 'rgba(148,163,184,0.16)', rejillaFina: 'rgba(148,163,184,0.07)', eje: 'rgba(203,213,225,0.55)',
  texto: '#94a3b8', textoClaro: '#e2e8f0', curva: '#ffb547', marcador: '#ffd27a', reto: '#4ade80',
};
/** color de cada medición según |q₁q₂| (el mismo producto → el mismo color) */
export function colorProducto(p: number): string {
  const paleta = ['#7dd3fc', '#c4b5fd', '#f9a8d4', '#86efac', '#fde68a', '#fdba74', '#a5b4fc', '#5eead4'];
  return paleta[Math.abs(Math.round(p)) % paleta.length];
}

export function dibujarGraficaFr(ctx: Ctx2D, w: number, h: number, d: DatosGrafica) {
  const fam = d.fuente ?? 'system-ui, sans-serif';
  // arriba, fuera del área de trazado: el título y, tras validar, la leyenda del reto (así la recta
  // y los puntos nunca los tachan, tampoco en el dock estrecho)
  const conReto = d.validado && !!d.reto;
  const izq = d.validado ? 46 : 30, der = 10, arr = conReto ? 38 : 24, aba = 30;
  const W = w - izq - der, H = h - arr - aba;
  const [lr0, lr1] = VENTANA_R.map(Math.log10);
  const [lf0, lf1] = VENTANA_F.map(Math.log10);
  const X = (r: number) => izq + ((Math.log10(r) - lr0) / (lr1 - lr0)) * W;
  const Y = (F: number) => arr + (1 - (Math.log10(F) - lf0) / (lf1 - lf0)) * H;

  ctx.save();
  ctx.fillStyle = COLORES.fondo;
  ctx.fillRect(0, 0, w, h);

  // rejilla: décadas de F y marcas de r
  ctx.lineWidth = 1;
  for (let e = Math.ceil(lf0); e <= Math.floor(lf1); e++) {
    ctx.strokeStyle = COLORES.rejilla;
    ctx.beginPath(); ctx.moveTo(izq, Y(10 ** e)); ctx.lineTo(izq + W, Y(10 ** e)); ctx.stroke();
    for (const m of [2, 5]) {
      const F = m * 10 ** e;
      if (F > VENTANA_F[1]) continue;
      ctx.strokeStyle = COLORES.rejillaFina;
      ctx.beginPath(); ctx.moveTo(izq, Y(F)); ctx.lineTo(izq + W, Y(F)); ctx.stroke();
    }
  }
  const marcasR = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40];
  for (const r of marcasR) {
    ctx.strokeStyle = [2, 5, 10, 20, 40].includes(r) ? COLORES.rejilla : COLORES.rejillaFina;
    ctx.beginPath(); ctx.moveTo(X(r), arr); ctx.lineTo(X(r), arr + H); ctx.stroke();
  }
  // ejes
  ctx.strokeStyle = COLORES.eje;
  ctx.beginPath(); ctx.moveTo(izq, arr); ctx.lineTo(izq, arr + H); ctx.lineTo(izq + W, arr + H); ctx.stroke();

  ctx.fillStyle = COLORES.texto;
  ctx.font = `600 10.5px ${fam}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const r of [2, 5, 10, 20, 40]) ctx.fillText(String(r), X(r), arr + H + 4);
  ctx.fillText('separación r (cm, escala log)', izq + W / 2, arr + H + 16);

  // eje F: sin cifras antes de validar
  ctx.save();
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  if (d.validado) {
    for (let e = Math.ceil(lf0); e <= Math.floor(lf1); e++) ctx.fillText(e < 0 ? fmtNum(10 ** e, -e) : fmtNum(10 ** e, 0), izq - 5, Y(10 ** e));
  } else {
    // llave «×10» entre dos líneas de la rejilla
    const ya = Y(10 ** Math.floor(lf1)), yb = Y(10 ** (Math.floor(lf1) - 1));
    ctx.strokeStyle = COLORES.texto;
    ctx.beginPath(); ctx.moveTo(izq - 10, ya + 1); ctx.lineTo(izq - 13, ya + 1); ctx.lineTo(izq - 13, yb - 1); ctx.lineTo(izq - 10, yb - 1); ctx.stroke();
    ctx.fillText('×10', izq - 4, (ya + yb) / 2 + 13);
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.rect(izq, arr, W, H); ctx.clip();

  // recta de Coulomb del banco: |F| = k|q₁q₂|/r²
  const prod = Math.abs(d.q1 * d.q2);
  if (prod > 0) {
    ctx.strokeStyle = COLORES.curva; ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(255,181,71,0.55)'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(X(VENTANA_R[0]), Y(fuerza(d.q1, d.q2, VENTANA_R[0]))); ctx.lineTo(X(VENTANA_R[1]), Y(fuerza(d.q1, d.q2, VENTANA_R[1]))); ctx.stroke();
    ctx.shadowBlur = 0;
    // triángulo de pendiente: al duplicar r, F se divide entre 4 (sobre el tramo 10 → 20 cm)
    const ra = 10, rb = 20;
    const ya = Y(fuerza(d.q1, d.q2, ra)), yb = Y(fuerza(d.q1, d.q2, rb));
    ctx.strokeStyle = 'rgba(255,210,122,0.55)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(X(ra), ya); ctx.lineTo(X(rb), ya); ctx.lineTo(X(rb), yb); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,224,170,0.95)'; ctx.font = `700 10px ${fam}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('r ×2', (X(ra) + X(rb)) / 2, ya - 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('F ÷4', X(rb) + 4, (ya + yb) / 2);
  }

  // mediciones del alumno
  for (const p of d.puntos) {
    const F = fuerza(p.q1, p.q2, p.r);
    ctx.fillStyle = colorProducto(p.q1 * p.q2);
    ctx.strokeStyle = '#0b1422'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(X(p.r), Y(F), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // el punto del reto, sólo tras validar
  if (d.validado && d.reto) {
    const F = fuerza(d.reto.q1, d.reto.q2, d.reto.r);
    const x = X(d.reto.r), y = Y(F);
    ctx.strokeStyle = COLORES.reto; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
  }

  // marcador del banco en la r del reloj
  if (prod > 0) {
    const x = X(Math.min(VENTANA_R[1], Math.max(VENTANA_R[0], d.r))), y = Y(fuerza(d.q1, d.q2, d.r));
    ctx.fillStyle = 'rgba(255,210,122,0.25)';
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORES.marcador; ctx.strokeStyle = '#0b1422'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = COLORES.textoClaro; ctx.font = `700 11px ${fam}`;
  ctx.fillText(d.validado ? '|F| (N, escala log)' : '|F| (escala log)', 4, 5);
  if (conReto && d.reto) {
    ctx.fillStyle = COLORES.reto; ctx.font = `700 10.5px ${fam}`;
    ctx.fillText(`✚ reto ${fmtFuerza(fuerza(d.reto.q1, d.reto.q2, d.reto.r))} N`, 4, 19);
  }
  ctx.restore();
  ctx.restore();
}
