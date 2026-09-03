import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Motor de Combustión Interna",
  titulo: "El Arranque: Caídas de Tensión y Arranque en Frío",
  duracion: "50 min",
  teoria: "Doce y medio en los bornes no significa doce y medio en el arranque. Ocho de los nueve montajes dan EXACTAMENTE 12,59 V en reposo: sin corriente no hay caída, y una avería de conexión no puede verse con la llave quitada. El límite de 0,20 V es POR CONEXIÓN, y una furgoneta sana con 3,5 m de cable cae 0,30 V sin estar averiada. Y hay una avería —las escobillas gastadas— que este procedimiento no puede encontrar: las cinco caídas salen bien y el coche gira a 191 rpm en vez de 216.",
  estado: "activo",
  simuladorHtml: "/labs/arranque-caidas-de-tension.html",
};

export default catalogo;
