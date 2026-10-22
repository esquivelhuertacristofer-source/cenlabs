import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Faros matriciales adaptativos: ver mucho sin deslumbrar",
  duracion: "40 min",
  teoria: `La luz de un faro llega a un punto como E = I·cosθ/r²: al doble de distancia, cuatro veces menos. En calle recta, las luces bajas dan luz suficiente para ver a un peatón de ropa clara hasta 55 m y las altas (32 segmentos al 80 %) hasta 149 m, pero las altas le dejan 16,8 lx al conductor que viene, contra un límite didáctico de 1 lx. Un faro matricial apaga sólo los segmentos que apuntan al coche y deja 0,07 lx. La cámara tarda: con 0,30 s y 64 LED, un margen de 0° deja 12,9 lx y uno de 1,5° baja a 0,58 lx; un margen demasiado ancho apaga también al peatón.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/faros-matriciales-adaptativos.html",
};

export default catalogo;
