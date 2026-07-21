import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Curva V–I de Resistores y Validación de Tolerancias",
  duracion: "30 min",
  teoria:
    'La Ley de Ohm (Ohm, 1827) establece V = I·R: la recta V–I de un resistor ideal pasa por el origen con pendiente R. En la práctica, cada lectura de un multímetro trae su propia incertidumbre ±(% de lectura + dígitos) según su rango y resolución (6000 cuentas, autorrango) — un solo punto medido nunca es el valor exacto. Este laboratorio toma 8 pares (V, I) sobre un resistor con un multímetro simulado y ajusta una recta por mínimos cuadrados forzada por el origen (R̂ = Σ(V·I)/Σ(I²), Gauss/Legendre ca. 1805), que promedia el ruido de los 8 puntos en una sola estimación confiable. El veredicto de control de calidad —¿el resistor cumple su tolerancia?— se decide comparando R̂ contra el nominal ± tolerancia que codifican las bandas de color del componente (IEC 60062), con tolerancias tomadas de la serie de valores preferidos IEC 60063. El modo Explora usa 4 resistores conocidos (uno deliberadamente fuera de tolerancia); el modo Reto presenta un resistor con bandas ocultas que el estudiante debe caracterizar y calificar con sus propios puntos medidos.',
  estado: "activo",
  simuladorHtml: "/labs/curva-vi-resistores.html",
};

export default catalogo;
