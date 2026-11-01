import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Círculo de Mohr: encuentra el plano principal",
  duracion: "40 min",
  teoria: "OT-254 · Reduce |cortante en el corte| a ≤3 MPa, con principal mayor ≤160 MPa y cortante aplicado ≥50 MPa. Esfuerzo plano σx=120 MPa, σy=40 MPa. C=(σx+σy)/2; R=√[((σx−σy)/2)²+τxy²]; σn=C+(σx−σy)cos2θ/2+τxy sin2θ; τnt=−(σx−σy)sin2θ/2+τxy cos2θ; σ1,2=C±R. Elemento homogéneo sin deformada ni criterio de falla. Las flechas son tracciones calculadas, no desplazamientos ni medición real. Longitudes de flecha 0,003 unidades/MPa; ángulos físicos sin exageración.",
  estado: "activo",
  simuladorHtml: "/labs/mohr-plano-critico.html"
};
export default catalogo;
