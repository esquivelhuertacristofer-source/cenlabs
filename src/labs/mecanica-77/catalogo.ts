import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Sistemas Digitales",
  titulo: "Síntesis Lógica y Simplificación con Mapas de Karnaugh",
  duracion: "30 min",
  teoria: "Una función lógica combinacional queda completamente definida por su tabla de verdad: para cada una de las 2ⁿ combinaciones de las n variables de entrada, la salida F vale 0 o 1. Los unos de la tabla son los mintérminos, y escribir la función como suma de todos ellos (forma canónica SOP) es correcto pero derrochador: cada término usa las n variables, con el máximo de literales y compuertas. El mapa de Karnaugh reorganiza la tabla en una rejilla ordenada con código Gray, de modo que dos celdas vecinas difieren en un solo bit; así, agrupar 2^k unos adyacentes elimina las k variables que cambian dentro del grupo, según el álgebra de Boole XY+XY′=X. Un lazo de 2 celdas elimina 1 variable; uno de 4, elimina 2; uno de 8, elimina 3. La forma mínima en suma de productos se obtiene cubriendo todos los unos con los mayores grupos válidos (los implicantes primos) usando la cobertura de menor coste en literales; el desempate favorece menos términos. Este proceso lo formaliza el algoritmo de Quine-McCluskey (generación de implicantes primos por combinación iterativa más una cobertura exacta de coste mínimo), que en el simulador se verificó numéricamente contra fuerza bruta en 1200 casos de 2 a 4 variables. Menos literales significa menos compuertas y más pequeñas: un circuito más barato, más rápido y con menor consumo. La lección honesta del método es que no toda función simplifica: la paridad (XOR de varias variables) dispone sus unos en tablero de ajedrez, sin celdas adyacentes agrupables, y su forma mínima coincide con la canónica. El laboratorio limita el mapa a 4 variables (más allá deja de ser práctico y se usan métodos tabulares o software de síntesis). Referencias: IEEE Std 91-1984, Mano & Ciletti (Diseño Digital), Wakerly (Digital Design), Quine (1952) y McCluskey (1956).",
  estado: "activo",
  simuladorHtml: "/labs/karnaugh-simplificacion.html",
};

export default catalogo;
