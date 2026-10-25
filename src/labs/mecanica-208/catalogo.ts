import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Tensión de correa con medidor sónico",
  duracion: "40 min",
  teoria: "OT-208 · Ajusta 45–60 Hz, adherencia suficiente, carga radial ≤1000 N y potencia útil ≥1,8 kW. Sensor sónico, poleas, apoyos y comprobación de carga. Ramal detenido L=0,45 m y masa lineal 0,15 kg/m: f=(1/2L)√(T/µ). Poleas iguales de 60 mm a 1500 rpm: v=ωr; ΔT=P/v, Tt=T+ΔT/2, Ts=T−ΔT/2. Adherencia: Tt/Ts≤exp(0,3π). Carga radial ideal 2T. Pulso 1 mJ: amplitud A=√(4EL/(π²T)). Correa plana ideal, sin rigidez a flexión, fuerza centrífuga, deslizamiento dinámico, dientes ni cálculo de vida. Primera etapa: medición detenida; segunda: operación ideal impuesta y comprobación de adherencia. No aplicar la fórmula de ramal detenido como medición en marcha. La amplitud dibujada se amplía 25 veces; el tiempo vibratorio se ralentiza 20 veces.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/tension-correa-medidor-sonico.html"
};
export default catalogo;
