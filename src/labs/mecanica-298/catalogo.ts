import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Encoder incremental y absoluto",
  duracion: "40 min",
  teoria: "16 periodos A/B por revolución y decodificación X4, con 64 cuentas por vuelta. Secuencia 00, 10, 11, 01. Cambios adyacentes suman o restan una cuenta y un salto de dos estados se marca inválido. El disco absoluto de seis bits usa Gray=k XOR (k>>1), con sector de 5,625°. Se muestrea un segundo físico y se muestra en ocho segundos. Sensor ideal sin ruido, desalineación ni rebote. El contador incremental parte de cero. Gray indica el sector actual dentro de una vuelta. La frecuencia de muestreo se aplica a la lectura por software, no a un contador de flancos por hardware.",
  estado: "activo",
  simuladorHtml: "/labs/encoder-cuadratura-absoluto.html"
};
export default catalogo;
