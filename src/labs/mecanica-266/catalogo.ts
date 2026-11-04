import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Elementos de Máquina",
  titulo: "Rodamientos: selección por carga y vida",
  duracion: "40 min",
  teoria: "OT-266 · Selecciona un rodamiento para un eje de 25 mm, carga axial de 400 N y régimen de 1500 rpm. Datos de NSK Industrial Motor Bearings, PDF p23, misma edición: 6005 d/D/B=25/47/12 mm, C=10.600 N, C0=5850 N, f0=14,5; 6205 25/52/15 mm, C=14.700 N, C0=7850 N, f0=13,9; 6305 25/62/17 mm, C=21.600 N, C0=11.200 N, f0=13,2. Fa=400 N, n=1500 rpm. Se interpolan linealmente e,Y de la tabla con u=f0Fa/C0. Si Fa/Fr≤e: P=Fr; si supera e: P=max(Fr,0,56Fr+YFa), cota conservadora para el redondeo de la tabla. L10=(C/P)³ en millones de vueltas; L10h=10⁶L10/(60n). P0=max(Fr,0,6Fr+0,5Fa), s0=C0/P0. Cinemática ilustrativa radial sin deslizamiento, contacto α=0: Rp=(d+D)/4, radio bola rb=0,14(D−d); Ωc=Ωi(1−rb/Rp)/2 y giro absoluto de bola Ωb=−ΩcRp/rb. Giro ×1/200. L10 representa 90% de supervivencia de una población bajo carga constante y condiciones nominales, no fecha garantizada de fallo. No incluye contaminación, lubricación, confiabilidad modificada, juego, desalineación ni carga variable. Datos de una edición fija, sin mezclar capacidades actuales de otras variantes. El encabezado kN del PDF es inconsistente con sus cifras enteras: se usan como N (14.700 N=14,7 kN). Dimensiones exteriores y agujero a escala; interiores, número de bolas (10/9/8), pistas y jaula esquemáticos, no CAD del fabricante. La carga axial entra en P, pero la escena usa cinemática radial ideal con α=0; no muestra deformación Hertz ni ángulo de contacto bajo carga. Flecha dorada radial, escala0,00030 unidades/N; turquesa axial, escala0,0008 unidades/N. No se anima una rotura al alcanzar L10.",
  estado: "activo",
  simuladorHtml: "/labs/rodamiento-carga-vida-l10.html"
};
export default catalogo;
