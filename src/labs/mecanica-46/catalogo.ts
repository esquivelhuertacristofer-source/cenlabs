import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Grupo Vectorial: Bancos Trifásicos y Desfase Angular",
  duracion: "45 min",
  teoria:
    'Un banco trifásico de tres transformadores monofásicos idénticos se arma conectando cada lado (primario o secundario) en estrella (Y) o en delta (D). La topología de cada lado aporta un ángulo de referencia θ_ref: 0° en estrella (la tensión de línea coincide en fase con la de fase) y 30° en delta (la tensión de línea es la resta fasorial de dos tensiones de fase). Invertir la polaridad de referencia del lado de alta tensión (cuál extremo se llama H1) gira ese fasor de referencia 180° adicionales. El ángulo de salida es θ1−θ_ref(secundario), donde θ1=θ_ref(primario)+180°·(polaridad invertida); el desfase que "atrasa" baja tensión respecto de alta tensión es ((−ángulo_salida) mod 360)°, y la hora del reloj es ese desfase dividido entre 30° y redondeado. El rótulo del grupo vectorial combina la letra de la topología primaria, la letra de la topología secundaria (con "n" si tiene neutro accesible) y la hora calculada — por ejemplo, delta en alta y estrella con neutro en baja, con polaridad normal, produce Dyn11 (IEC 60076-1:2011, Cláusula 3.10.6 y su Nota 2, Cláusula 7.1.5).',
  estado: "activo",
  simuladorHtml: "/labs/grupo-vectorial-transformador.html",
};

export default catalogo;
