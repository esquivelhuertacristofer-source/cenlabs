import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Sistemas Digitales",
  titulo: "Multiplexores, Decodificadores y Display de 7 Segmentos",
  duracion: "30 min",
  teoria: "Tres bloques combinacionales de mediana escala aparecen una y otra vez en el diseño digital, y una sola idea los unifica. El MULTIPLEXOR (MUX 2ⁿ:1) es un conmutador controlado: lleva a su única salida Y la entrada de datos que indica la palabra de SELECCIÓN de n bits, y solo si la HABILITACIÓN está activa —Y = D[sel]·EN—; con EN=0 la salida es 0 pase lo que pase, y ese es el error clásico de 'todo bien pero no sale nada'. El DECODIFICADOR (n→2ⁿ) hace lo complementario: activa UNA y solo una de sus 2ⁿ salidas (patrón 'one-hot'), la correspondiente al número de entrada; como cada salida es exactamente un mintérmino, sirve para chip-select por dirección y, con una OR, para realizar cualquier función en suma de mintérminos. El DISPLAY DE 7 SEGMENTOS se maneja con un decodificador especial BCD→7seg que traduce un dígito 0-9 al patrón de segmentos a-g que lo dibuja; la lógica de cada segmento es una función booleana de los 4 bits BCD, minimizable con Karnaugh aprovechando que los códigos 10-15 no son válidos y actúan como 'don't care'. La idea profunda que unifica todo: un MUX 2ⁿ:1 con las n variables en la selección realiza CUALQUIER función booleana de n variables sin lógica adicional, sin más que cablear D_i = f(i) —la selección recorre las filas de la tabla de verdad y la salida es, en cada fila, el dato que se puso; el MUX 'es' la tabla de verdad hecha hardware, y esa misma idea sobrevive hoy en las LUTs de las FPGA—. Todo el comportamiento se verificó numéricamente (MUX y decodificador exhaustivos, 400 funciones aleatorias reproducidas por el MUX universal, decodificador+OR = SOP y el SOP mínimo de los 7 segmentos por Quine-McCluskey), coincidente con Mano & Ciletti. Referencias: IEEE Std 91-1984, Mano & Ciletti (Diseño Digital), Wakerly (Digital Design), hojas de datos 74151/74138/7447.",
  estado: "activo",
  simuladorHtml: "/labs/mux-decodificadores-7seg.html",
};

export default catalogo;
