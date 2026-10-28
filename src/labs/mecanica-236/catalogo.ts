import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Engranaje magnético: transmisión sin contacto",
  duracion: "40 min",
  teoria: "OT-236 · Entrega ≥120 W con margen ≥2 N·m, par de entrada ≤3,5 N·m y entrehierro ≥1,5 mm. Acoplamiento magnético coaxial abierto, imanes alternos y freno de banco. Pares polares4 y11, modulador fijo15 polos; 4ωentrada+11ωsalida=0. Entrada600 rpm. Ley de banco Tmáx=14exp(−0,5(g−1)) N·m, g en mm. T=Tmáxsinδ; en sincronismo δ=asin(Tcarga/Tmáx). Tin=(4/11)Tcarga y balance ideal de potencia. Capacidad exponencial sintética, no FEM magnético ni curva de fabricante. Imanes y líneas representan el principio, sin histéresis ni pérdidas. Si la carga excede la capacidad, un freno externo retiene la salida para el ensayo de par; no se simula su dinámica de deslizamiento. Giro×1/120 y entrehierro visual ampliado.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/engranaje-magnetico-coaxial.html"
};
export default catalogo;
