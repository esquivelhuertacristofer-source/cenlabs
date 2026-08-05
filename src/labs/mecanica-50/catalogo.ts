import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Métodos de Arranque de Motores de Inducción: Corriente de Irrupción",
  duracion: "40 min",
  teoria:
    'Con el rotor detenido, un motor de inducción se comporta como un transformador con el secundario en corto: toma una corriente de irrupción varias veces mayor que la nominal (ILR) y entrega un par de arranque también múltiplo del nominal (TLR). El arranque directo (DOL) no reduce ninguno de los dos. El arranque estrella-delta reduce ambos a un tercio de forma fija (k=1/3), porque el devanado ve tensión de fase en vez de tensión de línea. El arranque por autotransformador con derivación a reduce ambos por a² (k=a²) del lado de línea, pero por solo a del lado del motor —una asimetría propia de que el autotransformador es él mismo un transformador— y existe una derivación exacta, a=1/√3≈0.577, en la que reproduce la misma reducción que estrella-delta. El laboratorio compara los tres métodos sobre el mismo motor y expone el compromiso central: toda reducción de corriente de irrupción cuesta par de arranque disponible.',
  estado: "activo",
  simuladorHtml: "/labs/arranque-motor-induccion.html",
};

export default catalogo;
