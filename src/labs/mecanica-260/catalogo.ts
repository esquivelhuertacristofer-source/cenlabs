import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Fractura: grieta crítica y margen de inspección",
  duracion: "40 min",
  teoria: "OT-260 · Mantén reserva Kic/K ≥2, esfuerzo ≥90 MPa, grieta ≥5 mm y zona plástica ≤10 % de a. Grieta de borde pequeña en placa ancha, modo I. Y=1,12; K=Yσ√(πa), Kic=50 MPa√m. acr=(Kic/(Yσ))²/π. Zona plástica en tensión plana rp=(K/σy)²/(2π), σy=350 MPa. Mecánica de fractura lineal elástica, Y constante sólo para grieta pequeña en placa ancha. Tenacidad y fluencia sintéticas. No propagación de Paris, crecimiento temporal, cierre, corrosión ni dictamen real. Grieta geométrica a escala de placa de 250 mm; zona plástica ilustrada a escala, sin campo FEM. Trazo luminoso: localizador de grieta, no abertura física de ese grosor.",
  estado: "activo",
  simuladorHtml: "/labs/fractura-grieta-critica.html"
};
export default catalogo;
