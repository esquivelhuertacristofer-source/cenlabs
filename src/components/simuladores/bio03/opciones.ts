/**
 * bio03/opciones.ts — las cuatro opciones de ARNt que ve el alumno para un codón (sin three).
 *
 * La correcta (el anticodón complementario, o el factor de liberación en un paro) y tres
 * anticodones distractores de otros aminoácidos, en un orden que cambia con el codón y
 * su posición (no hay una casilla fija para la respuesta). Es la misma regla que tenía
 * el Piloto: sólo se movió aquí para poder probarla.
 */
import { CODIGO_GENETICO, anticodonB3, LIBERACION_B3 } from '@/domain/biologia';

export function opcionesARNt(codon: string, indice: number): string[] {
  const correcta = CODIGO_GENETICO[codon]?.name === 'STOP' ? LIBERACION_B3 : anticodonB3(codon);
  const codones = Object.keys(CODIGO_GENETICO).filter((c) => CODIGO_GENETICO[c].name !== 'STOP' && anticodonB3(c) !== correcta);
  const distractores: string[] = [];
  let k = (indice * 7 + codon.charCodeAt(0) + codon.charCodeAt(2)) % codones.length;
  while (distractores.length < 3) {
    const a = anticodonB3(codones[k % codones.length]);
    if (!distractores.includes(a)) distractores.push(a);
    k += 11;
  }
  const todas = [correcta, ...distractores];
  const giro = (indice / 3 + codon.charCodeAt(1)) % 4;
  return [...todas.slice(giro), ...todas.slice(0, giro)];
}
