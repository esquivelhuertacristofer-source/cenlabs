import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Diagnóstico de rodamientos: muestreo, FFT y frecuencias de defecto",
  duracion: "40 min",
  teoria: "OT-181 · Investiga una vibración en un motor de1800 rpm. Ajusta el analizador, registra la señal y compara el pico con la cinemática del rodamiento. Acelerómetro, tacómetro y analizador FFT virtuales; ventana Hann y registro ajustable. Eje30 Hz; rodamiento ideal de8 bolas, diámetro8 mm, diámetro de paso40 mm y contacto0°. BPFO=4fr(1−0,2)=96 Hz; BPFI=144 Hz; BSF=72 Hz; FTF=12 Hz. Señal sintética: senos a30,96,100,192,288,900 y17 Hz, con amplitudes0,45;1,4;0,6;0,25;0,15;0,2;0,03 m/s². FFT radix2 con ventana Hann, normalización por ganancia coherente y relleno de ceros. Resolución física1/T; el espaciado de bins después del relleno no la mejora. Señal sintética conocida para aprender adquisición y comparación de frecuencias, no datos de una máquina real ni estimación de vida. Sin señal de impactos, resonancia de montaje, demodulación de envolvente, anti-alias analógico o clasificación automática comercial. No se deduce severidad a partir del color de la pieza. La vibración visible es una amplificación ilustrativa del desplazamiento equivalente a96 Hz.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/analizador-vibraciones-rodamiento.html"
};
export default catalogo;
