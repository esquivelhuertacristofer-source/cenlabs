import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Ensayo modal con martillo instrumentado",
  duracion: "40 min",
  teoria: "OT-201 · Configura frecuencia natural ≤22 Hz, respuesta a 30 Hz ≤0,4 mm, caída de envolvente al 5 % ≤0,6 s y amortiguamiento 0,08–0,20. Martillo, acelerómetro, traza de caída y función de respuesta en frecuencia. Modelo equivalente de un grado de libertad: m x″+c x′+k x=Jδ(t), k=200 kN/m, J=4 N·s. x=J/(mωd)e^(−ct/2m)sin(ωdt). H(f)=1/(k−mω²+icω). La envolvente cae al 5 % en ln(20)/(c/2m); servicio con fuerza sinusoidal 100 N a 30 Hz. Impulso ideal y sistema lineal, sin identificación con ruido ni coherencia experimental. La forma de la viga es una deformada estática normalizada, no un modelo modal FEM. Se repite un impacto independiente cada 2 s. Deflexión visual ampliada 30 veces.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/ensayo-modal-martillo.html"
};
export default catalogo;
