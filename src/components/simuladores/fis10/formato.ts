/**
 * fis10/formato.ts — cifras con coma decimal y espacio fino de millares (U+202F) desde
 * 10 000 (norma de la RAE: 1131 rpm, 11 077 rpm). es-MX formatea a la inglesa: no se usa.
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

/** Cifras significativas «de instrumento»: 3 para valores normales, sin notación científica. */
export function cifraSig(x: number, sig = 3): string {
  if (!Number.isFinite(x)) return '—';
  const a = Math.abs(x);
  if (a === 0) return '0';
  const d = Math.max(0, Math.min(4, sig - 1 - Math.floor(Math.log10(a))));
  return cifra(x, d);
}

/** Lee un número escrito con coma o punto decimal (null si no es un número finito). */
export function leerDecimal(texto: string): number | null {
  const t = texto.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
}
