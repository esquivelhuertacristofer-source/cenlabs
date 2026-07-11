import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Fuente de Alimentación Lineal Regulada",
  duracion: "40 min",
  teoria: "Modela la cadena completa de una fuente lineal: transformador reductor ideal (5 taps de 6 a 18 V), puente rectificador de silicio con el mismo modelo de Shockley de dos uniones en serie (Is=8.4e-10 A, n=1.85) del banco de rectificación, capacitor de filtro (100 µF–4700 µF) integrado por Runge-Kutta de 4º orden exacto contra la corriente real demandada, y regulador lineal de 3 terminales tipo 7805 con dropout dependiente de corriente, pérdida de regulación muestra a muestra y limitación de corriente (foldback) ilustrativa. Calcula la disipación de potencia del regulador de dos formas (exacta y por fórmula de libro de texto) y la temperatura de unión en estado estable contra un disipador seleccionable, en cuatro modos: Explora, Predicción, Barrido y Reto de diseño térmico.",
  estado: "activo",
  simuladorHtml: "/labs/fuentelineal.html",
};

export default catalogo;
