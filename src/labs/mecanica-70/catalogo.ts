import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Potencia en CA: Mide P, Q, S y el Factor de Potencia de Cargas Reales",
  duracion: "30 min",
  teoria: "En corriente alterna, una carga con impedancia Z=R+jX consume potencia activa P=S·cos θ (la que hace trabajo útil, en watts), potencia reactiva Q=S·sin θ (la que oscila entre la fuente y los campos magnético/eléctrico de la carga, en VAR) y potencia aparente S=V·I (la que realmente dimensiona cables y transformadores, en VA), donde θ es el ángulo entre voltaje y corriente. El factor de potencia FP=cos θ=P/S mide qué tan eficientemente se usa esa capacidad instalada. Cuando dos cargas reales comparten el mismo bus, sus potencias activa y reactiva se SUMAN directamente (P_total=P1+P2, Q_total=Q1+Q2), pero la potencia aparente total NO es la suma de las aparentes individuales — debe recalcularse como S_total=√(P_total²+Q_total²), porque S1 y S2 no están en fase entre sí. Este laboratorio combina dos cargas reales en paralelo, visualiza el triángulo de potencias resultante y mide P, Q, S y FP con un osciloscopio de dos canales.",
  estado: "activo",
  simuladorHtml: "/labs/potencia-ac.html",
};

export default catalogo;
