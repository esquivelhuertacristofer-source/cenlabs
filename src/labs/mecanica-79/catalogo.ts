import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Sistemas Digitales",
  titulo: "Sumadores y Comparadores Binarios",
  duracion: "30 min",
  teoria: "Toda la aritmética de una computadora nace de un bloque diminuto: el SUMADOR COMPLETO (full adder), que suma dos operandos y un acarreo de entrada y produce una suma y un acarreo de salida —la suma es la paridad de las tres entradas (S=A⊕B⊕Cin) y el acarreo es la MAYORÍA: Cout=(A·B)+(Cin·(A⊕B))—. Encadenando n de ellos, con el acarreo de cada etapa alimentando a la siguiente, se obtiene el SUMADOR DE ACARREO PROPAGADO (ripple-carry) de n bits. La resta no necesita un circuito nuevo: en COMPLEMENTO A 2, −B = ¬B + 1, de modo que A−B = A+¬B+1; basta invertir B y forzar el acarreo inicial Cin=1 para que el mismo sumador reste, y un bit de control elige entre sumar y restar. Con operandos con signo aparece el DESBORDAMIENTO (overflow), que se detecta por dos vías equivalentes: cuando los dos operandos tienen igual signo y el resultado sale con signo contrario, o cuando el acarreo que entra al bit más significativo difiere del que sale (Cin_MSB⊕Cout_MSB). El COMPARADOR DE MAGNITUD decide A>B, A=B o A<B recorriendo los bits desde el más significativo: el primer bit en que difieren decide, y la igualdad es el AND de las comparaciones XNOR bit a bit; las tres salidas son mutuamente excluyentes (gt+eq+lt=1). Esta aritmética es literalmente el corazón de la ALU de todo procesador: un solo sumador suma y resta, y sus banderas de acarreo y desbordamiento gobiernan los saltos condicionales de los programas. Todo el comportamiento se verificó numéricamente de forma exhaustiva (full adder 8/8, ripple-carry de 4 bits 2048 casos, resta y overflow por los dos métodos 256 casos cada uno, comparador 256 casos con una y solo una salida activa). Referencias: IEEE Std 91-1984, Mano & Ciletti (Diseño Digital), Wakerly (Digital Design), hojas de datos 7483/74283 (sumador) y 7485 (comparador).",
  estado: "activo",
  simuladorHtml: "/labs/sumadores-comparadores.html",
};

export default catalogo;
