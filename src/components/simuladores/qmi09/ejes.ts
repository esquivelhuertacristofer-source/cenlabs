/**
 * qmi09/ejes.ts — marcas y rótulos de los ejes de las gráficas del dock (módulo puro,
 * sin React: lo contrasta `src/__tests__/qmi09-galvanica.test.ts`).
 *
 * El fallo que corrige: el eje de «Descarga» rotulaba en kC con un decimal fijo, y con
 * una disolución diluida (qMax = 48 C = 0,048 kC) las marcas 0,01 · 0,02 · 0,03 · 0,04
 * salían todas «0,0». Aquí los decimales salen del PASO entre marcas (nunca dos marcas
 * con el mismo rótulo) y la carga elige su unidad (C o kC) según su tamaño.
 */

/** Marcas «redondas» (1, 2, 5 × 10ⁿ) entre a y b, con su paso. */
export function marcasEje(a: number, b: number, n = 4): { marcas: number[]; paso: number } {
  if (!(b > a) || !Number.isFinite(a) || !Number.isFinite(b)) return { marcas: [a], paso: 1 };
  const paso0 = (b - a) / Math.max(1, n);
  const p = 10 ** Math.floor(Math.log10(paso0));
  const bonitos = [0.5, 1, 2, 5, 10].map((k) => k * p);
  const enPaso = (paso: number) => {
    const marcas: number[] = [];
    for (let i = Math.ceil(a / paso - 1e-9); i * paso <= b + paso * 1e-6; i++) {
      const v = i * paso;
      marcas.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    }
    return marcas;
  };
  // el paso bonito más pequeño que no baja de (b − a)/n… salvo que deje menos de 3 marcas
  // (p. ej. 0…9 con paso 5): entonces, el anterior
  let i = bonitos.findIndex((s) => s >= paso0 * (1 - 1e-9));
  if (i < 0) i = bonitos.length - 1;
  while (i > 0 && enPaso(bonitos[i]).length < 3) i--;
  return { marcas: enPaso(bonitos[i]), paso: bonitos[i] };
}

/** Decimales que hacen falta para que marcas separadas `paso` no se rotulen igual (0…6). */
export function decimalesDePaso(paso: number): number {
  if (!(paso > 0) || !Number.isFinite(paso)) return 0;
  // 1 → 0; 0,5 → 1; 0,25 → 2; 0,02 → 2; 2,5 → 1
  for (let d = 0; d <= 6; d++) {
    const esc = paso * 10 ** d;
    if (Math.abs(esc - Math.round(esc)) < 1e-6 * Math.max(1, esc)) return d;
  }
  return 6;
}

/** Número con `d` decimales y coma decimal; el cero nunca lleva signo. */
export function rotuloNumero(v: number, d: number): string {
  if (!Number.isFinite(v)) return '—';
  const t = Math.abs(v).toFixed(d);
  const cero = Number(t) === 0;
  return (v < 0 && !cero ? '−' : '') + (cero ? '0' : t.replace('.', ','));
}

export interface EjeRotulado {
  /** posiciones de las marcas, en la unidad del eje */
  marcas: number[];
  /** un rótulo por marca, todos distintos */
  rotulos: string[];
  paso: number;
  decimales: number;
}

/** Marcas de un eje con sus rótulos, con los decimales justos para distinguirlas. */
export function ejeRotulado(a: number, b: number, n = 4): EjeRotulado {
  const { marcas, paso } = marcasEje(a, b, n);
  const decimales = decimalesDePaso(paso);
  return { marcas, rotulos: marcas.map((v) => rotuloNumero(v, decimales)), paso, decimales };
}

export interface EjeCarga extends EjeRotulado {
  /** unidad elegida para el eje */
  unidad: 'C' | 'kC';
  /** culombios por unidad del eje (1 o 1000) */
  porUnidad: number;
  /** extremo del eje, en la unidad elegida */
  max: number;
}

/**
 * Eje de carga de la gráfica de descarga: de 0 a `qMaxC` culombios. Por debajo de
 * 2 kC se rotula en C (48 C → 0 · 10 · 20 · 30 · 40); por encima, en kC.
 */
export function ejeCarga(qMaxC: number, n = 4): EjeCarga {
  const q = Number.isFinite(qMaxC) && qMaxC > 0 ? qMaxC : 1;
  const enKC = q >= 2000;
  const porUnidad = enKC ? 1000 : 1;
  const max = q / porUnidad;
  return { ...ejeRotulado(0, max, n), unidad: enKC ? 'kC' : 'C', porUnidad, max };
}
