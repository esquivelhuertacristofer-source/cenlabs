import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Radar FMCW de 77 GHz: Distancia y Velocidad con FFT",
  duracion: "40 min",
  teoria: "Un radar FMCW de 77 GHz emite un chirp de pendiente S = B/T_c y mide cada eco como una frecuencia de batido f_b = 2SR/c; una FFT de rango y otra de Doppler (sobre N chirps) dan distancia y velocidad. Con B = 1 GHz la celda de distancia mide 15 cm, y con T_c = 40 µs y N = 128 el radar llega a 120 m, mide hasta ±24,3 m/s sin ambigüedad y distingue 0,38 m/s. Ningún mando mejora todo a la vez: B grande afina la distancia pero acorta el alcance, T_c corto sube la velocidad máxima pero resta muestras, y N alto afina la velocidad hasta chocar con los 131 072 muestras de memoria y los 8 ms de ciclo. Un peatón de 1 m² a 100 m devuelve −22 dB de relación señal-ruido por muestra; sólo la integración de las FFT y un CA-CFAR con umbral de 11,6 dB sobre el ruido (P_fa = 10⁻⁶) lo sacan del ruido, y la ventana de Hann baja los lóbulos laterales a cambio de 1,8 dB de señal.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/radar-fmcw-automocion.html",
};

export default catalogo;
