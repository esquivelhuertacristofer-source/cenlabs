/**
 * fis03/formato.ts — cifras con coma decimal y espacio fino de millares (U+202F) desde
 * 10 000 (norma de la RAE). es-MX formatea a la inglesa: no se usa toLocaleString.
 */
const MENOS = '−';
const FINO = ' ';

export function cifra(x: number, d = 2, signo = false): string {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x).toFixed(d);
  const [ent0, dec] = abs.split('.');
  const ent = ent0.length > 4 ? ent0.replace(/\B(?=(\d{3})+(?!\d))/g, FINO) : ent0;
  const cuerpo = dec ? `${ent},${dec}` : ent;
  const cero = Number(abs) === 0;
  return (x < 0 && !cero ? MENOS : signo && !cero ? '+' : '') + cuerpo;
}

/** Lee un número escrito con coma o punto decimal (null si no es un número finito). */
export function leerDecimal(texto: string): number | null {
  const t = texto.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
}

/** Cronómetro «mm:ss,cc». */
export function crono(segundos: number): string {
  const s = Math.max(0, segundos);
  const m = Math.floor(s / 60);
  const resto = s - m * 60;
  const cc = Math.floor(resto * 100 + 1e-6);
  const ss = Math.floor(cc / 100), c = cc % 100;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')},${String(c).padStart(2, '0')}`;
}
