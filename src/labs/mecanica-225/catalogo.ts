import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Robot de orugas: giro y esfuerzo de tracción",
  duracion: "40 min",
  teoria: "OT-225 · Avanza ≥0,5 m/s en un radio de 1–1,6 m, con par ≤20 N·m y potencia ≤250 W. Robot de orugas, transmisión independiente y trayectoria del centro. v=(vR+vL)/2; ψ̇=(vR−vL)/b, b=0,45 m. Masa 60 kg, contacto 0,6 m. Resistencia longitudinal=0,04mg. Momento lateral sintético M=0,6mg·0,6/4·tanh(ψ̇/0,25). FL+FR=0,04mg; (FR−FL)b/2=M. Radio motriz 0,09 m; eficiencia motriz 0,8 y regenerativa 0,6. Pose por integración exacta del arco. Cinemática ideal sin deslizamiento; resistencia lateral cuasiestática regularizada, no dinámica de suelo ni modelo predictivo de consumo real. Sólo avance positivo. Cámara solidaria al centro: el suelo se desplaza como referencia. Demostración ×1/5; trayectoria y fuerzas numéricas en unidades físicas.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/robot-orugas-giro-traccion.html"
};
export default catalogo;
