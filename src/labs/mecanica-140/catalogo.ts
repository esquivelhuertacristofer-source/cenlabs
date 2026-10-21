import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Dinámica del Vehículo",
  titulo: "Convertidor de Par y Transmisión Automática",
  duracion: "35 min",
  teoria: "Un convertidor de par multiplica el par mientras la turbina va más lenta que el impulsor: con SR = ωt/ωi = 0 la relación de par vale 2,2 y cae a 1 en el punto de acoplamiento (SR = 0,85), con η = SR·TR. El motor se asienta donde su curva corta a la parábola k·ω²: con el calado diseñado a 2 400 rpm el coche de 1 500 kg hace 0 a 50 km/h en 3,80 s y el aceite recibe 64,8 kJ; con el calado en 1 600 rpm tarda 4,63 s y recibe 36,1 kJ, y con 3 200 rpm tarda 3,29 s pero recibe 92,9 kJ. El embrague de puenteo corta el deslizamiento a costa de la multiplicación, y el planetario (solar 20, satélite 10, corona 40) da 3 : 1 con la corona fija y 1 : 1 al unir solar y portasatélites. Las curvas del convertidor son correlaciones didácticas, no CFD.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/convertidor-par-transmision-automatica.html",
};

export default catalogo;
