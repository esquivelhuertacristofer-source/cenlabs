import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Polarización de BJT: Punto de Operación Q",
  duracion: "35 min",
  teoria: "Compara polarización fija (una resistencia RB desde VCC) y por divisor de voltaje (R1/R2 más resistencia de emisor RE) sobre el mismo transistor NPN (BC547B o 2N3904), usando el modelo estándar de VBE(on)=0.7 V constante y una fórmula unificada de Thevenin IB=(VBB−VBE(on))/(RBB+(β+1)·RE) evaluada por regiones de operación (corte, activa, saturación) para ubicar el punto Q real sobre la recta de carga. El criterio de 'divisor rígido' (RBB≤0.1·β·RE) muestra por qué el divisor de voltaje estabiliza el punto Q frente a la dispersión real de fábrica de β, mientras que la polarización fija no. Cuatro modos: Explora, Predicción, Barrido de β y Reto de diseño de divisor rígido.",
  estado: "activo",
  simuladorHtml: "/labs/polarizacionbjt.html",
};

export default catalogo;
