import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Amplificador BJT en Emisor Común: Ganancia de Pequeña Señal",
  duracion: "35 min",
  teoria: "Un BJT polarizado en la región activa por un divisor de voltaje (VBE=0.7V constante, β dentro del rango de hoja de datos, punto Q resuelto en forma cerrada) puede amplificar una señal AC pequeña superpuesta a ese punto de operación mediante el modelo de pequeña señal hybrid-π (gm=ICQ/VT, rπ=β/gm, VT=25mV). Con RE bypaseada por capacitor, la ganancia de voltaje Av=−gm·(RC‖RL) depende de una propiedad interna del transistor; sin bypass, Av=−β·(RC‖RL)/[rπ+(β+1)·RE] queda fijada casi enteramente por resistencias externas, mucho más predecible pero varias veces menor. El simulador resuelve además la recta de carga DC y la recta de carga AC (con pendientes distintas, pivotando ambas sobre el mismo punto Q) y muestra explícitamente el recorte de la señal de salida al exceder los límites de corte o saturación. Tres transistores con datos de hoja verificados (BC547B, 2N3904, 2N2222A) y un modo avanzado opcional con resistencia de salida Early (ro), declarado explícitamente como estimación de orden de magnitud y no como cifra de catálogo. Cuatro modos: Explora, Predicción, Medición del recorte contra la recta de carga AC, y Reto de diseño robusto a la variación completa de β.",
  estado: "activo",
  simuladorHtml: "/labs/amplificadorbjt.html",
};

export default catalogo;
