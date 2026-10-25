import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Firma eléctrica de un motor bajo carga",
  duracion: "40 min",
  teoria: "OT-209 · Resuelve un tercio de la separación, registra señal lateral ≥0,4 A, corriente fundamental ≤11 A y carga ≥50 %. Pinza de corriente, banco de carga y analizador FFT. Señal sintética a 60 Hz: s=0,005+0,035·carga, I1=10(0,4+0,8·carga) A eficaces. Bandas en(1±2s)60 Hz, amplitud eficaz(0,02+0,06·carga)I1 y tercer armónico 0,1I1. Adquisición 2048 Hz, ventana Hann normalizada,FFT con relleno a potencia de dos. Resolución física 1/T. Patrón compatible con asimetría del rotor; no constituye diagnóstico definitivo. Otras perturbaciones pueden producir bandas similares. No simula transitorios eléctricos ni daño real. El indicador de la barra se revela sólo después de validar y responder la interpretación.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/firma-electrica-motor-mcsa.html"
};
export default catalogo;
