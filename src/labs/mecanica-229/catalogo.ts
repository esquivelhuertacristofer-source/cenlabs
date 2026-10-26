import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Bobinado de banda: tensión y rodillo bailarín",
  duracion: "40 min",
  teoria: "OT-229 · Produce ≥0,5 m/s con tensión ≥12 N, esfuerzo ≤3,5 MPa, par ≤2,5 N·m, potencia ≤30 W y descenso del bailarín 50–180 mm. Dos bobinas, banda continua, bailarín por gravedad y balance de par. Núcleo R0=40 mm, radio final100 mm, espesor0,1 mm, ancho60 mm, densidad1200 kg/m³. R²=R0²+hvτ/π; ω=v/R. J=Jnúcleo+mbanda(R²+R0²)/2. Par=FR+Jω̇+0,08 N·m; entrada de momento del material cancela J̇ω. Bailarín de peso20 N: d=0,15·20/√(4F²−400) m. Eficiencia0,85. Se evalúa el máximo del ciclo. Banda inextensible y equilibrio estático del bailarín, sin control PID ni transitorios elásticos. F≤10 N no puede equilibrar el peso. Volumen conservado entre bobinas. La banda se dibuja como superficie; rodillos de radio ampliado y tangencias esquemáticas. bobinado acelerado ×40. No dimensiona una línea comercial.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/bobinado-tension-bailarin.html"
};
export default catalogo;
