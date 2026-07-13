import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Sonda de osciloscopio: atenuación, compensación, cursores y FFT",
  duracion: "45 min",
  teoria: "La sonda es el eslabón del sistema de medición donde más errores comete un técnico nuevo. El alumno resuelve 4 casos: atenuación 1X/10X de la sonda y el error de lectura ×10/÷10 cuando el ajuste de canal no coincide con la posición física del selector; compensación de una sonda 10X frente a una onda cuadrada de calibración (sub-compensada = esquinas redondeadas, sobre-compensada = pico de sobrepaso, correcta = flancos rectos); cursores manuales de voltaje y de tiempo (ΔV, Δt), incluido el error de mezclar cruces por cero de distinto tipo; y una FFT real —DFT calculada en vivo, no guionada— con resolución espectral Δf=F_s/N y aliasing genuino cuando la señal supera la frecuencia de Nyquist (f_alias=|f_real−F_s|). Norma IEC 61010-031 + IEC 61010-1 (seguridad de sondas de medición manuales); sin norma de exactitud — atenuación, ancho de banda y capacitancia de compensación son de hoja de datos del fabricante.",
  estado: "activo",
  simuladorHtml: "/labs/osciloscopio-fft.html",
};

export default catalogo;
