import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Dinámica del Vehículo",
  titulo: "Subviraje, Sobreviraje y Control de Estabilidad (ESC)",
  duracion: "35 min",
  teoria: "Modelo de bicicleta con neumáticos de fórmula mágica: el gradiente de subviraje K = (m/L)(b/Cf − a/Cr) decide si el coche se abre o se cierra, y un sobrevirador pierde la estabilidad por encima de V_crit = √(−L/K) (112 km/h en seco con K = −1,5 °/g, 41 km/h en hielo). El ESC compara la guiñada real con la deseada r = V·δ/(L + K·V²) y frena una sola rueda: en una curva de 70 m sobre mojado, un sobrevirador sin ESC aguanta hasta ≈ 52 km/h y con ESC hasta ≈ 76 km/h. Pero no crea adherencia: el techo sigue siendo μ·g.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/dinamica-lateral-esc.html",
};

export default catalogo;
