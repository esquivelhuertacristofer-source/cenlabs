import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Robot flexible: curvatura y tendones",
  duracion: "40 min",
  teoria: "OT-239 · Alcanza el objetivo patrón con error ≤5 mm, fuerza diferencial ≤7 N y flexión máxima ≤90°. Objetivo cartesiano: (71.78,247.84,124.32) mm. Robot continuo de tendones, guías, herramienta y objetivo espacial. Columna inextensible L=0,3 m; tendones a r=20 mm. Diferencia antagonista Δl=2rθ; curvatura κ=θ/L. Rigidez EI=0,03 N·m² y momento equivalente Fr=EIκ. Punta: [R(1−cosθ)cosφ,Rsinθ,R(1−cosθ)sinφ]. Objetivo de banco (x,y,z)=(0.071776,0.247835,0.124319) m. Barrido de ensayo entre0,5 y1 de la flexión solicitada; error del reto en extensión máxima. Curvatura constante, sin fuerzas externas, estiramiento de tendones, torsión, fricción de guiado o hiperelasticidad. Fuerza diferencial de un par antagonista ideal, no tensión total de todos los cables. Objetivo conocido para practicar cinemática, no calibración oculta ni robot médico. Movimiento prescrito de ensayo en8 s.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/robot-flexible-tendones.html"
};
export default catalogo;
