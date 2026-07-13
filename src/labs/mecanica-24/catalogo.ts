import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Pinza y shunt: mide corriente con y sin alterar el circuito",
  duracion: "40 min",
  teoria: "La pinza amperimétrica mide sin abrir el circuito: por efecto Hall (CD + CA) o por transformador de corriente / TC (solo CA, requiere flujo cambiante según la ley de Faraday). El shunt sí se inserta en serie y por eso perturba la corriente real — efecto de carga o error de inserción, cuantificable como %error = (I_sin − I_con)/I_sin. El alumno resuelve 3 casos (arranque + shunt, calefactor con cancelación de Ampère al abrazar vivo y neutro, y testigo con offset de cero) y explora el modo TC sobre CD (falla esperada). Norma IEC 61010-2-032 (seguridad de pinzas); no existe norma IEC/IEEE de exactitud para pinzas o shunts de uso general — la exactitud es de hoja de datos del fabricante.",
  estado: "activo",
  simuladorHtml: "/labs/pinza-shunt.html",
};

export default catalogo;
