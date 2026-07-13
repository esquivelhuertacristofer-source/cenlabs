import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: 'Instrumentación',
  titulo: 'Generador de funciones: carga, forma de onda, barrido en frecuencia y offset de CD',
  duracion: '45 min',
  teoria: 'El generador de funciones es el instrumento que crea la señal, no el que la recibe — y cada uno de sus ajustes puede introducir un error si se ignora su física. El Caso 1 muestra el efecto del ajuste de carga (Load: 50 Ω / Hi-Z): cuando no coincide con la impedancia realmente conectada, la amplitud medida puede duplicarse o reducirse a la mitad respecto de lo programado (factor ×2 verificado en hoja de fabricante, p. ej. Keysight 33500B/33600A). El Caso 2 compara el contenido espectral de una onda senoidal pura contra una onda cuadrada, calculando una FFT en vivo para mostrar los armónicos impares que predice la serie de Fourier. El Caso 3 barre la frecuencia a través de un filtro RC de un polo para ubicar su punto de −3 dB (≈70.7 % de la ganancia máxima), la definición convencional de ancho de banda. El Caso 4 suma un offset de CD a una señal alterna y expone el recorte (clipping) que ocurre cuando esa suma excede el rango disponible del circuito. Norma IEC 61010-1 (seguridad, generador de funciones — sin norma particular Parte 2 aplicable); sin norma de exactitud — impedancia de salida y exactitud de amplitud/frecuencia quedan en la hoja de datos de cada fabricante.',
  estado: 'activo',
  simuladorHtml: '/labs/generador-funciones.html',
};

export default catalogo;
