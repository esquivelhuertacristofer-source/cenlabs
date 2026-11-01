import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Concentración de esfuerzos: agujero y filete",
  duracion: "40 min",
  teoria: "OT-256 · Mantén ambos picos ≤110 MPa, radio ≥3 mm y ancho ≤115 mm. Agujero: placa t=6 mm, F=20 kN, d=2r, η=d/W; Kt=3−3,14η+3,667η²−1,527η³; σnom=F/[(W−d)t]. Filete de hombro doble: D=W, d=D−20 mm, h=10 mm, r variable; Kt=C1+C2z+C3z²+C4z³, z=2h/D. Coeficientes por h/r de Roark, tabla 6-1 III-1a, tracción axial; σnom=F/(6d). Longitud remota L=800 mm, L/D supera el límite de la tabla. Factores elásticos tabulados; no FEM ni campo de esfuerzos calculado, plasticidad o fatiga. Se resaltan sólo las posiciones de pico. El 3D muestra el detalle central y acorta las regiones remotas del filete; no es un plano a escala longitudinal ni un modelo de contacto de mordazas. Espesor visual ampliado.",
  estado: "activo",
  simuladorHtml: "/labs/concentracion-agujero-entalla.html"
};
export default catalogo;
