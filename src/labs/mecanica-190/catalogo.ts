import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Ensayo virtual de aislamiento de motor",
  duracion: "40 min",
  teoria: "OT-190 · Simula450–500 V; lee con error≤5 % antes de25 s y energía≤0,3 J. Megóhmetro virtual, devanado en corte y registro de corriente. Fuente con Rs=1 MΩ alimenta R=180 MΩ en paralelo con C=2 µF. τ=(Rs||R)C; Vc=V R/(R+Rs)(1−exp(−t/τ)); Ifuente=(V−Vc)/Rs; Rap=Vc/Ifuente. Lectura al tiempo configurado. ModeloRC aislado virtual, sin absorción dieléctrica, humedad, temperatura ni procedimiento real de alta tensión. Valores didácticos; no son criterio normativo de aislamiento. Se acelera el tiempo de ensayo×5 en pantalla.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/ensayo-aislamiento-motor.html"
};
export default catalogo;
