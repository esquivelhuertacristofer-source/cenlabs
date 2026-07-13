import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Diagnóstico de la ECU: Alimentaciones, Tierras y Comunicación",
  duracion: "45 min",
  teoria: "El conector de diagnóstico estandariza solo una parte de lo que rodea a una ECU: el pin de alimentación de batería es siempre vivo, con o sin contacto, para que un escáner pueda energizarse con la llave apagada; otros pines, en cambio, dependen del estado de la llave, y leer 0 V en ellos con el motor apagado es exactamente el comportamiento esperado, no una falla de continuidad. Lo que el conector de diagnóstico NO estandariza es la referencia de 5 V que alimenta a los sensores analógicos (MAP, TPS): ese riel regulado vive en el conector propio de cada ECU, específico de fabricante, y suele compartirse entre varios sensores a la vez — un solo sensor con un corto interno a tierra puede arrastrar todo el riel compartido y producir códigos de falla simultáneos en sensores que en realidad están sanos. Algo similar ocurre con las tierras: la ECU mide cada sensor como una diferencia de voltaje contra su propia tierra de señal, dedicada y de baja resistencia, deliberadamente separada de las tierras de potencia que sí cargan corrientes grandes (inyectores, actuadores) y generan ruido. Si la tierra de señal gana resistencia por corrosión o un mal contacto, no apaga al sensor: desplaza silenciosamente cada una de sus lecturas, un desplazamiento que un voltímetro en reposo casi nunca revela, porque solo aparece cuando hay corriente real circulando por el punto dañado. Por eso la prueba de referencia es la caída de tensión bajo carga, no un voltaje estático: una tierra sana cae ≤0.1 V bajo carga, mientras que una caída mayor a 0.3 V indica corrosión o cableado defectuoso — valores típicos de la práctica de diagnóstico automotriz, no una cifra de norma única.",
  estado: "activo",
  simuladorHtml: "/labs/diagnostico-ecu.html",
};

export default catalogo;
