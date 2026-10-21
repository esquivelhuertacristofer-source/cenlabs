import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Estacionamiento automático en paralelo: geometría y sensores ultrasónicos",
  duracion: "40 min",
  teoria: `Un asistente de estacionamiento mide el hueco con un sensor ultrasónico lateral mientras el coche pasa y luego retrocede dibujando una «S» de dos arcos. El sensor mide el tiempo de vuelo del eco, d = c·t/2, con c = 331,3 + 0,606·T m/s (un metro de eco tarda 5,8 ms a 20 °C), dentro de un haz cónico de ±30°; pita 10 veces por segundo, así que a 8 km/h cada lectura está a 22 cm de la anterior y el borde de un coche se localiza con un error de hasta la mitad de esa separación. El coche se modela como bicicleta cinemática, con eje trasero de referencia: θ̇ = v·tan δ/L y radio R = L/tan δ; con L = 2,60 m y 33° en las ruedas (528° de volante) R = 4,0 m. Correr el coche h = 2,70 m de lado con dos arcos iguales exige h = 2R(1 − cos α) y un avance de 2R·sen α: 6,0 m con el volante a tope y 6,5 m con 470°. El hueco mínimo para estacionar en una sola maniobra es de 6,2 m con el volante a tope (1,4 veces el largo del coche de 4,40 m), 6,4 m con 475° y 7,5 m con 280°; con 470°, un hueco de 6,2 m pide 2 maniobras y uno de 5,9 m, 4. El reto pide detectar el hueco, no tocar a ningún vecino, respetar el número de maniobras, dejar al menos 15 cm libres y no pedir más del 90 % del giro: pasar muy rápido hace que el sensor se equivoque y frene tarde, girar poco no cabe, y detenerse mal obliga a más maniobras. Se simplifican las ruedas sin deslizamiento, el suelo plano y el sensor ideal con eco geométrico.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/estacionamiento-automatico-paralelo.html",
};

export default catalogo;
