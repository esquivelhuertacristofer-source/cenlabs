import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Ciberseguridad del bus CAN: autenticación de mensajes y ataque de reproducción",
  duracion: "40 min",
  teoria: "El bus CAN a 500 kbit/s lleva los mensajes del coche sin autenticarlos: quien se conecte al puerto de diagnóstico puede repetir o inventar una orden de frenado. Una defensa al estilo AUTOSAR SecOC añade a cada trama de 64 bits un contador (8 bits) y una firma truncada de m bits; adivinarla al azar acierta con 2^−m, así que con 20 000 intentos 24 bits dejan pasar 1 de cada 839 ataques y 28 bits 1 de 13 422. Pero cada bit cuesta sitio (con 28 bits quedan 12 libres), una trama de 8 bytes dura 270 µs en el peor caso y el resto del coche ya ocupa el 25,9 % del bus: mandar la orden cada 10 ms lleva el bus al 28,4 %. Con ruido del 3 %, una ventana de contador de 1 mensaje hace perder la sincronía 10 476 veces por hora y una de 40 deja al freno ciego 400 ms: la ventana buena está en el interior. Es un modelo didáctico, no una implementación de SecOC: la firma es una mezcla de bits sin valor criptográfico.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/ciberseguridad-can-secoc.html",
};

export default catalogo;
