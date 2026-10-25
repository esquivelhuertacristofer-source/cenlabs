import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Separación centrífuga: ajuste del proceso",
  duracion: "40 min",
  teoria: "OT-207 · Entrega ≥3 L/min, separa en≤90 % de la residencia, con esfuerzo de aro ≤15 MPa y velocidad periférica ≤35 m/s. Tazón en corte, caudalímetro y trayectorias de partículas. Stokes centrífugo: dr/dt=Kω²r, K=Δρd²/(18µ), Δρ=1000 kg/m³,d=5 µm,µ=1 mPa·s. Migración entre 20 y 80 mm: ts=ln(4)/(Kω²). Volumen útil 0,5 L, residencia=V/Q. Aro equivalente de acero a 100 mm: σ=ρω²r². Partículas aisladas a velocidad terminal, sin turbulencia, concentración, paredes, arrastre entre fases ni CFD. El esfuerzo es de un aro ideal, no del tazón real. Las posiciones angulares son estroboscópicas; la migración radial conserva el tiempo del modelo.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/separacion-centrifuga-proceso.html"
};
export default catalogo;
