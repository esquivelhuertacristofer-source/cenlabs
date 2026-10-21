import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Tren Híbrido de División de Potencia: el Engranaje Planetario",
  duracion: "45 min",
  teoria: "Un solo engranaje planetario (solar 30, satélites 24, corona 78) reparte la potencia de un motor Atkinson entre el camino mecánico y el eléctrico. La relación de Willis, 30·ωs + 78·ωr = 108·ωc, fija la tercera velocidad en cuanto se eligen dos, y el motor en el portasatélites reparte su par 28 % al solar y 72 % a la corona. A 130 km/h con 30 kW en la rueda el solar queda casi parado (−35 rpm) y toda la potencia viaja por el engranaje; a 150 km/h gira al revés (−1 505 rpm) aunque el motor empuja, y MG1 hace de motor. Con la batería neutra, el régimen óptimo a 80 km/h y 18 kW es 2 036 rpm (231 g/kWh, 7,8 L/100 km); a 3 000 rpm el mismo trabajo cuesta un 10,7 % más.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/tren-hibrido-planetario.html",
};

export default catalogo;
