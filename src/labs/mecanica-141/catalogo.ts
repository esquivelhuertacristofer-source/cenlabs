import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Dinámica del Vehículo",
  titulo: "Frenos de Disco: Reparto de Frenado y Fade Térmico",
  duracion: "40 min",
  teoria: "Al frenar, la carga pasa al eje delantero: F_f/F = (b + z·h)/L. Con μ = 0,90 el reparto que bloquea los dos ejes a la vez es β* = 0,739 (74 : 26); con 60 : 40 el trasero se bloquea primero a 0,69 g. Cada frenada convierte ½·m·v² en calor: desde 160 km/h son unos 1 480 kJ por frenada (unos 1 055 kJ al disco delantero), y con un disco delantero de 300 mm la quinta frenada seguida lo lleva a 580 °C, donde la pastilla pierde un 31 % de fricción y la distancia sube de 109 m a 119 m. Un disco de 260 mm llega a 704 °C y pierde 37 %; uno de 340 mm se queda en 480 °C y pierde 18 %. El disco se trata como masa concentrada con convección y radiación, comprobada contra la solución exacta con h constante. Es un modelo didáctico sin ABS, no un ensayo de homologación.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/frenos-disco-fade-termico.html",
};

export default catalogo;
