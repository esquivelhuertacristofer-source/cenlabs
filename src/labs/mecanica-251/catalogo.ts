import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Viga en flexión: cortante, momento y flecha",
  duracion: "40 min",
  teoria: "OT-251 · Soporta al menos 2800 N, con flecha ≤3 mm, esfuerzo ≤120 MPa y masa ≤50 kg. Viga biapoyada L=2 m, ancho b=50 mm, E=210 GPa, densidad 7850 kg/m³. I=bh³/12; RA=RB=P/2; V=±P/2; M=P min(x,L−x)/2. v=P u(3L²−4u²)/(48EI), u=min(x,L−x); vmax=PL³/(48EI); σmax=PLh/(8I). Euler–Bernoulli elástico de pequeña flecha, sin peso propio, cortante, plasticidad ni pandeo lateral. Flecha visual ×12; geometría transversal ×3 respecto de la longitud. Carga estática modulada de 50 a 100 % en una demostración de 8 s, no vibración.",
  estado: "activo",
  simuladorHtml: "/labs/viga-flexion-estatica.html"
};
export default catalogo;
