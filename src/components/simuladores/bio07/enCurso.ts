/**
 * bio07/enCurso.ts — ¿hay un ensayo del arco reflejo animándose? Lo fija el piloto y lo
 * lee la bitácora: la latencia de un golpe no se enseña en la tabla antes de que el EMG
 * la muestre (el dominio la registra en el instante del golpe).
 */
let enCurso = false;
const oyentes = new Set<() => void>();

export const ensayoEnCurso = {
  get: (): boolean => enCurso,
  fijar(v: boolean) {
    if (v === enCurso) return;
    enCurso = v;
    oyentes.forEach((f) => f());
  },
  suscribir(f: () => void) {
    oyentes.add(f);
    return () => { oyentes.delete(f); };
  },
};
