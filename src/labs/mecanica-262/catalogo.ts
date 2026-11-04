import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Elementos de Máquina",
  titulo: "Soldadura y remaches: carga excéntrica",
  duracion: "40 min",
  teoria: "OT-262 · Compara dos alternativas para una ménsula cargada fuera del centro de su unión. F vertical descendente aplicada en x=e; M=−Fe. Cuatro remaches iguales de d=8 mm en (±40,±60) mm; Jp=Σ(x²+y²). Fuerzas transmitidas: fx=−My/Jp, fy=−F/4+Mx/Jp; τ=|f|/(πd²/4). Dos cordones verticales de longitud L=120 mm en x=±40 mm y garganta a=4 mm; Jℓ=2Lx²+L³/6. τx=−My/(aJℓ), τy=−F/(2aL)+Mx/(aJℓ). Máximo en los extremos de los cordones. Utilización=max(τsold/60 MPa,τrem/100 MPa). Método elástico de grupo, placa rígida y carga en su plano. Soldadura idealizada como líneas de garganta uniforme; remaches iguales en cortante simple. No se evalúan aplastamiento, desgarro de placa, fatiga, deslizamiento, tensiones residuales ni resistencia última por centro instantáneo. Los límites de 60 y 100 MPa son del escenario, no valores normativos. Cordón ampliado para mostrar su superficie; flechas locales proporcionales al esfuerzo en los cordones (1×10⁻⁸ unidades/Pa) y a la fuerza en los remaches (6×10⁻⁵ unidades/N); no se comparan sus longitudes entre sistemas. Demostración cuasiestática de 8 s entre 50 y 100 % de carga; no deformación de rotura.",
  estado: "activo",
  simuladorHtml: "/labs/union-excentrica-soldadura-remache.html"
};
export default catalogo;
