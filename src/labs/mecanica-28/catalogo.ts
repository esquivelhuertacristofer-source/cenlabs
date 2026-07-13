import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Fallo de Encendido: Árbol de Decisión P0300",
  duracion: "45 min",
  teoria: "Continuación del escáner OBD-II: un fallo de encendido nace como código PENDIENTE (Modo $07) y solo se CONFIRMA (Modo $03) si se repite en un ciclo de manejo posterior. Si la gran mayoría de los eventos proviene de un mismo cilindro, el código pasa de P0300 genérico a P030X específico. El testigo MIL distingue dos umbrales: fijo/continuo si se cruza el umbral de emisiones (Tipo B), parpadeante en tiempo real si se cruza el umbral de riesgo para el catalizador (Tipo A). Normas SAE J1979/J2012, CARB 13 CCR §1968.2, ISO 15031-5/6 y NOM-047-SEMARNAT-2014.",
  estado: "activo",
  simuladorHtml: "/labs/fallo-encendido.html",
};

export default catalogo;
