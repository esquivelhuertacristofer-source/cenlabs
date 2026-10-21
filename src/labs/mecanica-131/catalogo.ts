import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "ADAS: Radar, Cámara y Frenado Autónomo (AEB)",
  duracion: "35 min",
  teoria: "Un radar mide la distancia con ruido (σ = 0,25 m a 20 Hz) y un filtro alfa-beta (α = 0,5, β = 0,167) la deja en 0,16 m y estima la velocidad de cierre; con ellas el AEB calcula el TTC = d/v y frena por etapas. A 50 km/h la parada necesita 14,9 m en seco (12,3 m sin la latencia de 0,12 s y la rampa del freno), 20,2 m en mojado y 41,3 m en nieve: crece con v² y se divide por μ. Sin AEB, un peatón a 3 s provoca un choque a 50 km/h; con un umbral de 0,9 s el choque baja a 28 km/h y sólo un umbral de unos 1,6 s a 2,1 s evita los tres choques del reto sin frenar en falso por un peatón que se detiene en la acera.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/adas-frenado-emergencia.html",
};

export default catalogo;
