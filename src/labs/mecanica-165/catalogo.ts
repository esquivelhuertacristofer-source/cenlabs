import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Soldadura por puntos robotizada: calor, fuerza y tamaño de la pepita en una línea de carrocerías",
  duracion: "40 min",
  teoria: "Un robot de seis ejes lleva una pinza con dos electrodos de cobre a la brida de una puerta, aprieta dos chapas de 0,8 mm con una fuerza F y pasa una corriente I durante n ciclos de 60 Hz. El calor de Joule Q = I²·R·t (con 9 kA, 182 µΩ y 12 ciclos salen 2 383 J, de los que sólo el 6,5 % llega a la pepita) calienta la zona bajo los electrodos hasta 1 500 °C y funde un volumen de acero de unos 110 J para una pepita de 4 mm. La resistencia de contacto baja al apretar más. La pepita debe medir al menos 4·√t = 3,6 mm; la fuerza contiene el baño fundido hasta √(4F/πp) (6,2 mm a 3 kN) y, si se supera, salpica; un pulso demasiado largo hunde el electrodo; un electrodo desgastado o un punto vecino a 15 mm piden más corriente. El reto exige corriente, tiempo y fuerza dentro de una ventana interior, y después diagnosticar por síntomas. Modelo de parámetros concentrados con constantes de orden de magnitud, sin elementos finitos ni ensayo normalizado.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/soldadura-por-puntos-robotizada.html",
};

export default catalogo;
