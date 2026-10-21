import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Dinámica del Vehículo",
  titulo: "Suspensión: Cuarto de Coche, Confort y Agarre",
  duracion: "35 min",
  teoria: "Un cuarto de coche de dos grados de libertad (320 kg suspendidos, 40 kg de rueda, resorte de 22 kN/m y neumático de 200 kN/m) tiene frecuencias propias de 1,27 Hz la carrocería y 11,7 Hz la rueda con c = 1 500 N·s/m. Sobre un camino ISO 8608 clase B a 80 km/h, la integral exacta en frecuencia da un confort a_w = 0,63 m/s² (ISO 2631-1, «un poco incómodo») y una variación de carga del neumático del 12,2 % del peso estático. El amortiguador lleva un compromiso: el mínimo de a_w está en c ≈ 570 N·s/m y el de carga dinámica en c ≈ 2 370 N·s/m; un amortiguador semiactivo skyhook desplaza esa frontera ≈ 5 %.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/suspension-cuarto-coche.html",
};

export default catalogo;
