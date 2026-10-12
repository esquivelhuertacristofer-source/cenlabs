/**
 * Código de colores de los resistores de película metálica de 5 bandas (3 cifras, multiplicador, ±1 %).
 * Módulo sin dependencias de three: lo usan la escena (bandas del resistor) y el Piloto (panel de datos).
 */
const COD_DIGITO = ['#141414', '#6b3a1e', '#cc2a1f', '#ee7a1b', '#f0d223', '#2f9a3a', '#2d56b8', '#7a3fa0', '#8a8f94', '#eeeeee'];
const ORO = '#c9a227', PLATA = '#bfc4c8';

const NOMBRE_COLOR: Record<string, string> = {
  '#141414': 'negro', '#6b3a1e': 'café', '#cc2a1f': 'rojo', '#ee7a1b': 'naranja', '#f0d223': 'amarillo', '#2f9a3a': 'verde',
  '#2d56b8': 'azul', '#7a3fa0': 'violeta', '#8a8f94': 'gris', '#eeeeee': 'blanco', '#c9a227': 'dorado', '#bfc4c8': 'plateado',
};

/** Colores (hex) de las 5 bandas para `ohm` Ω. */
export function bandasResistor(ohm: number): string[] {
  let R = Math.max(1, Math.round(ohm * 10) / 10);
  let exp = 0;
  while (R >= 1000 - 1e-9) { R /= 10; exp++; }
  while (R < 100 - 1e-9 && exp > -2) { R *= 10; exp--; }
  const n = Math.round(R);
  const d = String(n).padStart(3, '0').split('').map(Number);
  const mult = exp === -1 ? ORO : exp === -2 ? PLATA : COD_DIGITO[Math.min(9, Math.max(0, exp))];
  return [COD_DIGITO[d[0]], COD_DIGITO[d[1]], COD_DIGITO[d[2]], mult, COD_DIGITO[1]];
}

/** Bandas con su color y nombre (para mostrar el código en el panel). */
export function bandasConNombre(ohm: number): { color: string; nombre: string }[] {
  return bandasResistor(ohm).map((c) => ({ color: c, nombre: NOMBRE_COLOR[c] ?? c }));
}
