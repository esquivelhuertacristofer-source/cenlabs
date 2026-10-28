import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Hidroformado de tubo: presión y alimentación axial",
  duracion: "40 min",
  teoria: "OT-247 · Llena la matriz hasta radio ≥25,8 mm con adelgazamiento ≤18 %, presión ≤16 MPa y cierre ≤160 kN. Celda de hidroformado seccionada con punzones axiales y espesor medido. Pared delgada uniforme: r0=20 mm,t0=1 mm,L0=200 mm. L=L0−2f, 2πrtL=constante. Deformación ε=ln(r/r0), tensión circunferencial=180 MPa+1000 MPa·ε. Equilibrio p=σθt/r en la rama creciente, radio limitado por matriz26 mm. Fuerza de cierre=p·2rL; empuje por extremo=pπr². Rampa3 s, sostén2 s y descarga2 s; expansión plástica conservada durante descarga. Modelo de membrana uniforme con endurecimiento sintético y espesor de pared delgada, no FEM, criterio de rotura, abultamiento localizado, fricción o arrugado. Alimentación axial prescrita. El volumen conservado es el volumen de membrana2πrtL, no el volumen exacto de una pared de espesor finito. Matriz abierta sólo para observar; ensayo real requiere cierre.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/hidroformado-tubo-espesor.html"
};
export default catalogo;
