import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "LiDAR automotriz: tiempo de vuelo, nube de puntos y detección de obstáculos",
  duracion: "40 min",
  teoria: "Un LiDAR lanza destellos láser y mide cuánto tardan en volver: la distancia es d = c·t/2, así que cada nanosegundo de ida y vuelta son 15 cm. Cada eco es un punto y miles de puntos forman la nube. La luz que vuelve cae con 1/R² y con la reflectividad: con 60 W un peatón de ropa oscura (ρ = 10 %) se ve hasta 93 m con aire limpio, 83 m con lluvia y 50 m con niebla, y la potencia no puede subir de 100 W por seguridad de los ojos. La densidad la fijan los mandos: 32 láseres con 0,20° y 10 barridos/s dan 192 000 puntos/s, con 21 cm entre puntos horizontales y 1,08 m entre anillos a 60 m; con 128 láseres y 0,10° son 1,5 millones de puntos/s y 26 cm entre anillos. El peatón mide 0,5 m (0,48° a 60 m), así que con 32 láseres le caen unos 4 puntos y con 128, unos 22 (a 62 m, aire limpio). Un filtro separa el suelo y un agrupamiento junta los puntos cercanos en objetos; la niebla y la lluvia además devuelven falsos ecos cerca del sensor.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/lidar-nube-puntos.html",
};

export default catalogo;
