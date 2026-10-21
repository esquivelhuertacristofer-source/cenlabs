import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Fusión de sensores con filtro de Kalman: seguir a un coche con radar y cámara",
  duracion: "40 min",
  teoria: `Un filtro de Kalman hace un promedio ponderado entre lo que esperaba (por la velocidad que llevaba el coche de adelante) y lo que midió cada sensor: x̂ = x⁻ + K·(z − x⁻), con K = P⁻/(P⁻ + R), y lleva la cuenta de su propia duda P. El radar mide bien la distancia (±0,8 m) y la velocidad por efecto Doppler, pero se equivoca de lado (1,31 m a 30 m); la cámara es al revés (0,21 m de lado a 30 m, pero 2,4 m de error en distancia). En el escenario de autopista, mezclar los dos deja 0,21 m de error de distancia y 0,17 m de lado, mientras que el radar solo da 0,66 m de lado y la cámara sola 0,88 m de distancia. Q fija cuánto puede cambiar la velocidad entre lecturas: con Q = 0,25 m/s² el filtro tarda 2,7 s en enterarse de un frenazo de 5 m/s² y su error llega a 4,0 m; con Q = 10 m/s² reacciona al instante pero la velocidad estimada tiembla 0,45 m/s. Sin lecturas durante 1,8 s (el rocío de un camión) la duda del filtro pasa de ±0,42 m a ±1,16 m. Un filtro bien ajustado es honesto: su NEES medio vale 2 y su innovación normalizada vale 1.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/fusion-sensores-kalman.html",
};

export default catalogo;
