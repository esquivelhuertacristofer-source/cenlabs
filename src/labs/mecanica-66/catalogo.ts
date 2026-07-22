import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Diagnóstico de Fallas en CD: Localización por Bisección de Mediciones",
  duracion: "30 min",
  teoria: "En una cadena de resistores en serie, un circuito abierto detiene la corriente y absorbe todo el voltaje de la fuente de un solo salto, produciendo un escalón limpio de voltaje en el nodo fallado — una firma que permite localizar la falla midiendo el punto medio del tramo sospechoso primero (bisección), en vez de resistor por resistor. Un corto o una deriva de valor alteran el perfil de voltaje completo de forma más sutil. Este laboratorio practica la localización por bisección sobre circuitos abiertos y explora las tres firmas de falla con el circuito energizado.",
  estado: "activo",
  simuladorHtml: "/labs/diagnostico-fallas-cd.html",
};

export default catalogo;
