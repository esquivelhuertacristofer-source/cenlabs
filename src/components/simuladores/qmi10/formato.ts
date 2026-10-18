/**
 * qmi10/formato.ts — cifras con coma decimal y signo menos tipográfico (módulo puro).
 */
const MENOS = '−';
/** Cifra con `d` decimales y coma decimal. */
export function cifra(x: number, d = 2, signo = false): string {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x).toFixed(d);
  const cero = Number(abs) === 0;
  return (x < 0 && !cero ? MENOS : signo && !cero ? '+' : '') + abs.replace('.', ',');
}
