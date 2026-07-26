import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Sistemas Digitales",
  titulo: "Contadores Síncronos Módulo N",
  duracion: "30 min",
  teoria: "Un FLIP-FLOP es la celda de memoria de un bit, y su ECUACIÓN CARACTERÍSTICA define cómo cambia su salida Q en cada flanco de reloj: el D copia su entrada (Qn=D), el T conmuta o retiene (Qn=Q⊕T) y el JK hace las cuatro operaciones —retener, poner a 0, poner a 1 y conmutar— según Qn=J·Q'+K'·Q (con J=K equivale a un T). Para DISEÑAR se usa la TABLA DE EXCITACIÓN, que invierte la pregunta: dada la transición deseada Q→Qn, ¿qué entrada la produce? En el JK la mitad de esas celdas son \"don't care\" (x), y esa libertad produce circuitos con menos compuertas. Un CONTADOR SÍNCRONO encadena flip-flops gobernados por un RELOJ COMÚN —así todos cambian a la vez y ninguno acumula el retardo del anterior, a diferencia del contador asíncrono/ripple— y avanza el estado en cada flanco. Con n flip-flops el conteo natural es en MÓDULO 2ⁿ; con flip-flops T, el bit i conmuta sólo cuando todos los de menor peso valen 1 (T_i=Q0·Q1···Q(i-1)). Para un MÓDULO N arbitrario se detecta el estado terminal DET=N−1 y un BORRADO SÍNCRONO devuelve el contador a 0 en el siguiente flanco, dando la secuencia 0..N−1 de periodo N con n=⌈log₂N⌉ flip-flops. El error clásico es detectar N en vez de N−1: se cuenta un estado de más y queda un módulo N+1. Un buen diseño además es AUTOCORRECTIVO: desde cualquier estado no usado regresa al ciclo válido. Estos contadores son el corazón de relojes, temporizadores, divisores de frecuencia, contadores de programa y secuenciadores de control. Todo el comportamiento se verificó numéricamente de forma exhaustiva (ecuación característica JK 8/8, tablas de excitación D/T/JK con todas las resoluciones de don't-care, contador binario n=1..4 y contador módulo N para N=2..16). Referencias: IEEE Std 91-1984, Mano & Ciletti (Diseño Digital), Wakerly (Digital Design), Roth (Fundamentals of Logic Design), hojas de datos 74x161/163 (contador binario síncrono) y 74x190/191 (década/binario up/down).",
  estado: "activo",
  simuladorHtml: "/labs/contadores-sincronos.html",
};

export default catalogo;
