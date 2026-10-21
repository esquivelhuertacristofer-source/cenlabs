import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Filtro de partículas (DPF/GPF): hollín, contrapresión y regeneración",
  duracion: "40 min",
  teoria: `El filtro de partículas atrapa el hollín en una torta sobre sus paredes: a plena carga la contrapresión sube de 6,61 kPa (limpio) a 11,10 kPa con 4 g/L y 14,55 kPa con 8 g/L (Darcy en la pared y en la torta, más pérdidas de canal). Cada gramo quemado libera 32,76 kJ y la cinética de Arrhenius (150 kJ/mol con O2, 55 kJ/mol con NO2) manda: la regeneración pasiva en carretera se equilibra hacia 2,98 g/L, y la activa (post-inyección a 630-680 °C) quema 4 g/L en unos 10 min con 0,54 L de diésel extra. Quemar tarde sube la contrapresión; quemar temprano gasta combustible; y una parada en ralentí en plena quema, con poco flujo que se lleve el calor, puede pasar de 1 000 °C.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/dpf-gpf-hollin-regeneracion.html",
};

export default catalogo;
