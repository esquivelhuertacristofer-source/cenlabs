/**
 * fis01/formato.ts — cifras con coma decimal, signo menos tipográfico y espacio fino de
 * millares (U+202F) desde 10 000 (norma de la RAE). es-MX formatea a la inglesa: no se usa.
 */
const MENOS = '−';
const FINO = ' ';

export function cifra(x: number, d = 2, signo = false): string {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x).toFixed(d);
  const [ent0, dec] = abs.split('.');
  const ent = ent0.length > 4 ? ent0.replace(/\B(?=(\d{3})+(?!\d))/g, FINO) : ent0;
  const cuerpo = dec ? `${ent},${dec}` : ent;
  const cero = Number(abs) === 0;
  return (x < 0 && !cero ? MENOS : signo && !cero ? '+' : '') + cuerpo;
}

/** Cifras significativas «de instrumento», sin notación científica. */
export function cifraSig(x: number, sig = 3): string {
  if (!Number.isFinite(x)) return '—';
  const a = Math.abs(x);
  if (a === 0) return '0';
  const d = Math.max(0, Math.min(4, sig - 1 - Math.floor(Math.log10(a))));
  return cifra(x, d);
}

/** Factor de tiempo rotulado: «×1 · tiempo real», «×2,2 · acelerado», «×1/2 · cámara lenta». */
export function rotuloFactor(f: number): string {
  if (!(f > 0)) return '';
  if (f > 1.05) return `×${cifra(f, f < 10 ? 1 : 0)} · acelerado`;
  if (f < 0.95) return `×1/${cifra(1 / f, 1 / f < 10 ? 1 : 0)} · cámara lenta`;
  return '×1 · tiempo real';
}
