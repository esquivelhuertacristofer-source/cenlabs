import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Fatiga de un eje: curva S–N y Goodman",
  duracion: "40 min",
  teoria: "OT-255 · Consigue reserva Goodman entre 1,5 y 2,2, diámetro ≤28 mm y tensión media ≥50 MPa. Flexión rotativa biapoyada L=1 m y carga central P=560 N: Mmax=PL/4=140 N·m; M(x)=P min(x,L−x)/2. Se evalúa fatiga en la sección central: σa=32Mmax/(πd³). Se=180 MPa, Sut=600 MPa; σeq=σa/(1−σm/Sut), U=σa/Se+σm/Sut; n=1/U. Basquin entre 10³ ciclos a 480 MPa y 10⁶ a 180 MPa. Por debajo de Se se muestra 10⁶ como referencia, no vida exacta. Material y curva sintéticos sin datos de fabricante, entallas, acabado, efecto de tamaño, dispersión, corrosión ni daño acumulado. No se dibuja la pequeña flecha de flexión. Giro demostrativo 0,25 Hz, sin velocidad de servicio ni propagación de grieta; no se garantiza vida infinita. Colores de fibras: σm+32M(x)cos(φ)/(πd³), sin FEM. El esfuerzo medio axial se prescribe, no se simula el equipo que lo genera.",
  estado: "activo",
  simuladorHtml: "/labs/fatiga-goodman-eje.html"
};
export default catalogo;
