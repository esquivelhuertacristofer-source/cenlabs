import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Bus CAN: Diagnóstico con Osciloscopio",
  duracion: "45 min",
  teoria: "El bus CAN (Controller Area Network) conecta las ECU de un vehículo moderno por un solo par de hilos trenzados, CAN_H y CAN_L, en vez de un cableado dedicado por señal. La clave es la señalización diferencial: los receptores decodifican la diferencia de voltaje entre ambos hilos, no su valor absoluto, lo que vuelve al bus muy resistente al ruido eléctrico del compartimento del motor. En reposo (bit recesivo) ambos hilos convergen cerca de 2.5 V y la diferencial es ≈0 V; al transmitir un bit dominante, un nodo separa los hilos y la diferencial salta a valores del orden de 2 V. El bus físico requiere un resistor de 120 Ω en cada uno de sus dos extremos; vistos desde cualquier nodo intermedio, el par en paralelo equivale a una resistencia diferencial combinada de ≈60 Ω, efecto conjunto de los dos terminadores y no un componente instalado aparte. Un terminador faltante no calla el bus de inmediato, pero deja una firma de reflexión (ringing) visible en el osciloscopio antes de que la señal se asiente. Un cortocircuito entre CAN_H y CAN_L, en cambio, impide que la diferencial se desarrolle: el bus queda mudo. Finalmente, cuando dos nodos transmiten a la vez, CAN resuelve el conflicto por arbitraje bit a bit no destructivo: gana el identificador con más bits dominantes tempranos, y el nodo perdedor simplemente deja de transmitir sin que su mensaje se pierda como colisión — muy distinto al CSMA/CD de una red Ethernet clásica.",
  estado: "activo",
  simuladorHtml: "/labs/bus-can.html",
};

export default catalogo;
