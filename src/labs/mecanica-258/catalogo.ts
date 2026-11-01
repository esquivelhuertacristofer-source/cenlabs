import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Recipiente a presión: aro y espesor mínimo",
  duracion: "40 min",
  teoria: "OT-258 · Trabaja a ≥1,8 MPa con aro entre 80 y 110 MPa, espesor ≤9 mm y r/t ≥20. Cilindro cerrado r=0,2 m. σθ=pr/t; σz=pr/(2t); σVM=√(σθ²+σz²−σθσz); tmin=pr/σadm con σadm=120 MPa. εr=(σθ−νσz)/E; E=210 GPa, ν=0,3. Pared delgada, presión uniforme, sin soldaduras, tapas calculadas, corrosión, fatiga, temperatura ni código de recipientes. Corte de carcasa para ver espesor, ampliado ×4; expansión radial ×30. Es una comparación de esfuerzos, no diseño certificable.",
  estado: "activo",
  simuladorHtml: "/labs/recipiente-aro-espesor.html"
};
export default catalogo;
