import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Climatiza un Vehículo Eléctrico: Bomba de Calor de R134a y Autonomía",
  duracion: "45 min",
  teoria: "Ciclo de compresión de vapor de R134a con las propiedades de la ecuación de estado de Peng–Robinson (saturación por igualdad de fugacidad: p_sat(0 °C) = 0,292 MPa frente a 0,293 de libro, con error máximo de 0,4 % entre −30 y 60 °C). A −10 °C la cabina pide 3,1 kW de calor y la bomba de calor lo da con 1,60 kW eléctricos (COP 1,93, descarga a 99 °C y 4 308 rpm) frente a los 3,17 kW del calentador resistivo; el caudal de aire de la cabina y del exterior y el subenfriamiento tienen un óptimo interior (1,52 kW, COP 2,04) porque los ventiladores gastan con el cubo del caudal. A 60 km/h eso son unos 82 km más de autonomía (463 km frente a 381 km).",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/bomba-calor-hvac-ve.html",
};

export default catalogo;
