import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Robot por impedancia: tocar sin golpear",
  duracion: "40 min",
  teoria: "OT-242 · Obtén fuerza final14–18 N, pico ≤22 N y establecimiento a2 % ≤1 s. Brazo articulado, palpador elástico y adquisición de fuerza. Eje cartesiano equivalente: m=2 kg, objetivo xd=40 mm dentro del cero de contacto. mẍ=K(xd−x)−Dẋ−Ke max(0,x), Ke=2000 N/m. Estado inicial x=−15 mm, v=0. RK4 con Δt=1 ms durante4 s. Fuerza=Ke max(0,x). Equilibrio F∞=KeKxd/(Ke+K). El brazo muestra la cinemática inversa prescrita del TCP; la dinámica es sólo del eje normal. Modelo de contacto unilateral sin adhesión, fricción tangencial o impacto rígido. Parámetros sintéticos, sin dinámica completa del robot ni certificación de colaboración. Desplazamiento normal ampliado×8; fuerza y reloj en segundos físicos. Retorno entre ensayos prescrito.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/robot-impedancia-contacto.html"
};
export default catalogo;
