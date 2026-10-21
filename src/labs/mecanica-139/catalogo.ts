import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Dinámica del Vehículo",
  titulo: "Geometría de Dirección y Alineación: Ackermann, caída, avance y convergencia",
  duracion: "40 min",
  teoria: "En una curva lenta las perpendiculares de las dos ruedas delanteras deben cortarse sobre la línea del eje trasero: cot δe − cot δi = t/L. Un trapecio de cuatro barras (brazos, barra de acoplamiento y cremallera) sólo lo cumple de forma aproximada: en un sedán de 2,70 m de batalla y 1,50 m de vía, la geometría de Jeantaud con barra de 412,6 mm (brazo de 140 mm) da sólo 70 % de Ackermann a 30° interior y falla por 1,66°; afinada la barra a 399 mm el error máximo baja a 0,27°, pero el valle es estrecho: la barra tolera unos 4 mm antes de pasar de 0,5°. El avance (ε) da el brazo de arrastre que crea el par autoalineante M = F·(tp + Rw·tanε); en el modelo de cepillo el par de un neumático alcanza 26,7 N·m a 3,0° de deriva y se satura hacia 12°. Con el pivote inclinado, girar 20° con ε = 5° cambia la caída −1,71°. En recta, la convergencia óptima para el menor arrastre lateral es interior: 0,20° a 110 km/h con caída de −0,8°, no cero. Se declara lo que no se modela: la elasticidad de los bujes y la cinemática de la suspensión (sólo se usa el movimiento de la dirección).",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/alineacion-geometria-direccion.html",
};

export default catalogo;
