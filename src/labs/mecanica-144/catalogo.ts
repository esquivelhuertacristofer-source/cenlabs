import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Postratamiento SCR con AdBlue: NOx, dosificación y amoníaco residual",
  duracion: "40 min",
  teoria: "Un diésel suelta óxidos de nitrógeno (NOx). El AdBlue (urea al 32,5 %) se rocía en el escape, el calor lo vuelve amoníaco y el catalizador SCR lo guarda en sus paredes y lo hace reaccionar 1 a 1 con el NOx. En el ciclo de arranque en frío de este laboratorio un motor de 120 kW suelta 4,91 g/kWh: con la dosis «justa» (100 %) salen 0,90 y con 115 %, inyección desde 190 °C y +20 °C de calentamiento salen 0,63 g/kWh con 2,2 ppm de amoníaco medio. El catalizador sólo trabaja bien entre unos 200 y 400 °C, la urea cristaliza por debajo de ~180 °C y el 100 % no siempre es lo mejor: en la subida de puerto, pasarse (115 %) suelta 38 ppm de amoníaco frente al límite de 10. Un litro de AdBlue da 11,8 mol de NH3 y a media carga el motor pide 0,58 L/h (3,9 % del diésel). Es un modelo didáctico en ocho celdas con ciclos sintéticos de 5 min, no un ensayo WHTC.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/scr-adblue-nox.html",
};

export default catalogo;
