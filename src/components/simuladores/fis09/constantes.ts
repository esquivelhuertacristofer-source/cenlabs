/**
 * fis09/constantes.ts — cotas del banco de Coulomb (sin three), compartidas por las piezas,
 * la geometría del campo y el encuadre de la cámara.
 *
 * ESCALA del kit: 1 u = 1 dm = 10 cm. La cubierta de la mesa está en y = 0; +Z mira al alumno.
 * El eje de las cargas es paralelo a X, a la altura Y_EJE; q₁ está fija en X_CERO (el 0 de la
 * regla) y q₂ en X_CERO + r/10.
 */
export const X_CERO = -2.0;            // u: centro de la esfera fija (0 cm de la regla)
export const LARGO_RIEL = 5.8;         // u (58 cm)
export const X_RIEL0 = X_CERO - 0.9;   // u: extremo izquierdo del riel
export const ALTO_RIEL = 0.3;          // u (3 cm)
export const ANCHO_RIEL = 0.62;        // u (6,2 cm, en Z)
export const ALTO_CARRO = 0.16;        // u
export const ALTO_CASQUILLO = 0.05;    // u (pie de POM de la columna)
export const ALTO_COLUMNA = 0.86;      // u (8,6 cm de acrílico)
export const ALTO_PORTAESFERA = 0.07;  // u (casquillo de latón)
export const R_ESFERA = 0.09;          // u (Ø 1,8 cm)
export const Y_BASE_COLUMNA = ALTO_RIEL + ALTO_CARRO;
export const Y_EJE = Y_BASE_COLUMNA + ALTO_CASQUILLO + ALTO_COLUMNA + ALTO_PORTAESFERA + R_ESFERA;
/** z de la regla de acero sobre el riel (cara superior, hacia el alumno) */
export const Z_REGLA = 0.2;

/** cm sobre el eje → x del mundo (u) */
export const xMundo = (s: number) => X_CERO + s / 10;
