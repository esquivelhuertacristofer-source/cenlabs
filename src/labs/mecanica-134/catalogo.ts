import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Autonomía de un VE: Ecuación de Carga de Ruta",
  duracion: "40 min",
  teoria: "La fuerza en la rueda es F = m·g·C_rr·cosθ + ½ρC_dAv² + m·g·sinθ + m·a y la batería paga F·v más las pérdidas del tren y los auxiliares. Para el crossover del lab (1 750 kg, C_d = 0,27, A = 2,30 m², 45 kWh útiles) el consumo en llano es de 140 Wh/km a 90 km/h y de 191 Wh/km a 120 km/h, y la autonomía del 100 % al 10 % pasa de 289 a 212 km. El consumo por kilómetro tiene un mínimo interior (41,5 km/h, 101 Wh/km) porque a baja velocidad los auxiliares gastan más por cada kilómetro. En la ruta sintética de 240 km con un puerto de 2 350 m, a 100 km/h llegas con 17 % de carga en 2,41 h y a 120 km/h con 0,4 % en 2,01 h; la regeneración devuelve sólo una parte de lo que costó subir. La ruta no es un ciclo normalizado y el modelo no es un ensayo de homologación.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/autonomia-ve-carga-de-ruta.html",
};

export default catalogo;
