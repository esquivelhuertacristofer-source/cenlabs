import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Resonancia RLC: Sintoniza, Mide Q y Caracteriza el Ancho de Banda",
  duracion: "30 min",
  teoria: "Un circuito RLC tiene una frecuencia de resonancia f₀=1/(2π√LC) donde la reactancia inductiva XL=ωL se cancela exactamente con la capacitiva XC=1/(ωC). En serie, la impedancia cae a su mínimo (Z=R) en f₀; en paralelo, sube a su máximo (Z=R). Alrededor de f₀, las frecuencias de media potencia f₁ y f₂ —donde |Z| se aleja del extremo por un factor √2— definen el ancho de banda Δf=f₂−f₁, y su relación con f₀ da el factor de calidad Q=f₀/Δf, que en serie equivale a ω₀L/R y en paralelo a R/(ω₀L). Este laboratorio traza la curva |Z(f)| completa con un analizador de barrido, mide f₀ y Q con tres cursores, y usa esa medición para despejar un componente sellado en el modo Reto.",
  estado: "activo",
  simuladorHtml: "/labs/resonancia-rlc.html",
};

export default catalogo;
