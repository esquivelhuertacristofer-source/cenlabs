import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Control vectorial (FOC) del motor de tracción: de tres corrientes a dos números",
  duracion: "40 min",
  teoria: `El motor de un coche eléctrico recibe tres corrientes que giran; el control vectorial las mira desde el rotor con las transformadas de Clarke y Park y las convierte en dos números fijos: id (sobre el imán, mueve el campo) e iq (adelantada 90°, da la fuerza). El par es T = 3/2·p·(ψm·iq + (Ld − Lq)·id·iq): con p = 4, ψm = 0,085 Wb, Ld = 0,20 mH y Lq = 0,55 mH, id = −100 A e iq = 220 A dan 158,4 N·m, de los que 112,2 vienen de los imanes y 46,2 de la reluctancia. Un regulador PI de corriente por eje, con la tensión del inversor limitada a Vdc/√3 = 202 V, lleva id e iq a la consigna. A 4 000 rpm (267 Hz eléctricos) los imanes ya inducen 142 V: pedir 150 N·m con la mínima corriente exige 215 V, no cabe, el regulador se queda al tope y el par se queda en 74 N·m. Debilitar el campo (id = −174 A, iq = 171 A, 244 A de pico, 182 V) sí lo da. El par máximo con la corriente de 350 A baja de 267 N·m a 1 500 rpm a 192 N·m a 5 000 rpm. El reto pide seguir un escalón de par con cinco condiciones a la vez (par, sobreimpulso, rapidez, tensión al tope y calor del cobre) y sólo lo cumple el 20,5 % (ciudad), el 2,4 % (carretera) y el 1,7 % (autopista) de las combinaciones; en carretera la rapidez del lazo debe estar entre 100 y 168 Hz con la reserva de tensión al 90 %.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/control-vectorial-foc-motor.html",
};

export default catalogo;
