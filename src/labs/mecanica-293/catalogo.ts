import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Lugar de las raíces de un servo",
  duracion: "40 min",
  teoria: "Denominador (1+τs)³+K. El polo real es (−1−∛K)/τ. El par tiene σ=(−1+∛K/2)/τ y ωd=√3∛K/(2τ). Se excita sólo el par. θ(t)=0,005 exp(σt) cos(ωdt). Si σ<0, t5%=ln(20)/(−σ). Modelo lineal equivalente de tres retardos y realimentación negativa unitaria. La respuesta representa un modo libre inicial. El indicador usa 0,9 tanh(θ/0,03) rad para mantener legible el recorrido. La traza muestra θ en grados. El ensayo dura 8 s.",
  estado: "activo",
  simuladorHtml: "/labs/lugar-raices-servo.html"
};
export default catalogo;
