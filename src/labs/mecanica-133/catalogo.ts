import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Dinámica del Vehículo",
  titulo: "Aerodinámica: Arrastre, Sustentación y Consumo",
  duracion: "35 min",
  teoria: "Las fuerzas del aire son F = ½·ρ·C·A·v²: a 200 km/h un coche de 2,05 m² con C_d = 0,315 sufre 1 219 N de arrastre y la potencia que gasta el aire pasa de 8,5 kW a 100 km/h a 67,7 kW a 200 km/h (×8). Un alerón a 12° con el coche a 55 mm del suelo da 2 783 N de carga a 200 km/h, pero cuesta C_d (+0,03): el consumo a 120 km/h sube de 6,95 a 7,51 L/100 km, la velocidad máxima baja de 270 a 261 km/h y la curva rápida de 250 m sube de 185 a 196 km/h, menos que proporcional porque el neumático pierde fricción al cargarse. Pasados 14° el alerón entra en pérdida (C_L cae y el arrastre sube) y por debajo de 50 mm el suelo se estrangula. El humo del 3D es una visualización didáctica, no CFD.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/aerodinamica-vehiculo.html",
};

export default catalogo;
