import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "PROFINET e IO-Link: del sensor al PLC",
  duracion: "40 min",
  teoria: "Capturas IO-Link de periodo Tio. Preparación del dato en el maestro de 0,25 ms. PROFINET actualiza en múltiplos de Tpn más 0,5 ms. El programa consume en múltiplos de 4 ms más 0,75 ms. Se enumeran las capturas de un hiperperiodo mcm(Tio,Tpn,4). El peor caso toma un evento inmediatamente posterior a la captura anterior. Cota conservadora Tio+0,25+Tpn+4. Calendario determinista del banco con fases fijas. Los periodos y demoras son hipótesis del ejercicio. No se modelan jitter, reintentos ni congestión. IO-Link une el sensor al maestro. El maestro actúa como dispositivo PROFINET ante el PLC a través del switch.",
  estado: "activo",
  simuladorHtml: "/labs/profinet-io-link-tiempo-ciclo.html"
};
export default catalogo;
