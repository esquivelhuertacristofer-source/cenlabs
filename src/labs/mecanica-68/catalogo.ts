import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Impedancias RLC: Calcula y Mide un Circuito Serie o Paralelo",
  duracion: "30 min",
  teoria: "Un circuito con resistencia (R), inductancia (L) y capacitancia (C) presenta una impedancia compleja Z=R+jX que combina oposición resistiva y reactiva. En serie, los tres elementos comparten la misma corriente y Z=R+j(ωL−1/ωC); en paralelo comparten el mismo voltaje y se suman las admitancias, Y=1/R+j(ωC−1/ωL) con Z=1/Y. La magnitud |Z| limita la corriente (I=V/|Z|) y el ángulo θz es el desfase entre voltaje y corriente. Este laboratorio mide ese desfase con la misma técnica de osciloscopio de dos canales de la práctica anterior —canal 1 sobre el voltaje aplicado, canal 2 sobre el voltaje de un resistor shunt proporcional a la corriente— y usa la medición para despejar un componente sellado en el modo Reto.",
  estado: "activo",
  simuladorHtml: "/labs/impedancias-rlc.html",
};

export default catalogo;
