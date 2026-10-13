/**
 * qmi01/glslOrbitales.ts — UNA sola fuente para ψ en TypeScript y en GLSL.
 *
 * Las funciones de onda hidrogenoides se escriben aquí UNA vez, como expresiones en
 * un mini-lenguaje común a los dos (sqrt, exp, PI, literales con «.0»). De ellas sale
 *   · el código GLSL que usan la cara del corte y el render volumétrico, y
 *   · un evaluador en JS que la prueba jest compara con psi() de orbitales.ts.
 * Así la densidad que se dibuja en la GPU es, por construcción, la de la física.
 *
 * Variables de las expresiones: Z (carga efectiva), x, y, z (posición en a₀) y
 * rho = Z·r. Resultado: ψ en a₀^(−3/2).
 */
import type { IdOrbital } from './orbitales';

/** Orden de los orbitales en los uniformes de los sombreadores (índice 0…4). */
export const ORDEN_GLSL: readonly IdOrbital[] = ['1s', '2s', '2px', '2py', '2pz'];

const N2 = 'sqrt(Z*Z*Z/(32.0*PI))*exp(-0.5*rho)';

/** ψ_nlm de cada orbital (mismas fórmulas que la cabecera de orbitales.ts). */
export const EXPRESIONES_PSI: Readonly<Record<IdOrbital, string>> = {
  '1s': 'sqrt(Z*Z*Z/PI)*exp(-rho)',
  '2s': `${N2}*(2.0-rho)`,
  '2px': `${N2}*Z*x`,
  '2py': `${N2}*Z*y`,
  '2pz': `${N2}*Z*z`,
};

const nombreGlsl = (id: IdOrbital) => `psi_${id}`;

/**
 * Código GLSL: una función por orbital y `float psiOrb(int i, vec3 q, float Z)`
 * (q en a₀, i según ORDEN_GLSL). Define la constante PSI_PI (no choca con el PI de
 * los chunks de three).
 */
export function glslPsi(): string {
  const funcs = ORDEN_GLSL.map((id) => {
    const expr = EXPRESIONES_PSI[id].replace(/\bPI\b/g, 'PSI_PI');
    return `float ${nombreGlsl(id)}(float Z, float x, float y, float z) {\n  float rho = Z * sqrt(x * x + y * y + z * z);\n  return ${expr};\n}`;
  });
  const sel = ORDEN_GLSL.map((id, i) => `  ${i === 0 ? 'if' : 'else if'} (i == ${i}) return ${nombreGlsl(id)}(Z, q.x, q.y, q.z);`).join('\n');
  return [
    'const float PSI_PI = 3.141592653589793;',
    ...funcs,
    `float psiOrb(int i, vec3 q, float Z) {\n${sel}\n  return 0.0;\n}`,
  ].join('\n');
}

/** Evaluador JS de la MISMA expresión (para la prueba de paridad TS ↔ GLSL). */
export function evaluadorPsi(id: IdOrbital): (Z: number, x: number, y: number, z: number) => number {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(
    'Z', 'x', 'y', 'z',
    `const sqrt = Math.sqrt, exp = Math.exp, PI = Math.PI;\nconst rho = Z * sqrt(x * x + y * y + z * z);\nreturn ${EXPRESIONES_PSI[id]};`,
  ) as (Z: number, x: number, y: number, z: number) => number;
}
