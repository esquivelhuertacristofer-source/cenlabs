import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-152",
  titulo: "Ciberseguridad del bus CAN: autenticación de mensajes y ataque de reproducción",
  subtitulo: "Autotrónica · proteger los mensajes del coche para que un intruso no pueda mandar frenar",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Proteges los mensajes de los módulos del coche para que un intruso no pueda repetirlos y mandar frenar. Al abrir el laboratorio ya está funcionando: las tramas viajan por el cable del bus, el intruso está conectado al puerto de diagnóstico y un recorrido de seis pasos te lo explica sin siglas sin definir.

Cada trama tiene 64 bits: la orden, un contador que sube de uno en uno (cuadros amarillos) y una firma (cuadros verdes) que sólo conocen los módulos. El freno rechaza lo que trae un contador viejo o una firma que no cuadra.

Pero todo tiene un precio: una firma más larga deja menos sitio libre, mandar la orden más seguido ocupa más el bus, y una ventana de contador mal elegida deja al freno ciego demasiado tiempo o lo desincroniza con el ruido.

Tu misión es elegir el largo de la firma, la ventana y el periodo para bloquear al intruso sin pasarte del bus ni del espacio. La respuesta no está escrita: sale de la física, y no está en los extremos.

Es un modelo didáctico, no una implementación real de SecOC.`,
  conceptos: [
    { icono: '🚌', nombre: 'Bus CAN', descripcion: 'El cable compartido por donde los módulos del coche se mandan mensajes (tramas) a 500 000 bits por segundo. Cualquiera conectado puede escuchar y hablar.' },
    { icono: '✍️', nombre: 'Firma (MAC)', descripcion: 'Un código que se calcula con una clave secreta compartida y se pega a la trama. Si el intruso no la conoce sólo puede adivinarla: una firma de m bits se acierta con probabilidad 2 elevado a −m.' },
    { icono: '🔢', nombre: 'Contador y ventana', descripcion: 'Un número que sube con cada mensaje: uno repetido trae un número viejo y se descarta. La ventana son los números adelantados que acepta por si se pierde alguna orden.' },
    { icono: '📦', nombre: 'Sitio y bus', descripcion: 'La trama sólo tiene 64 bits y el bus es compartido: la firma y el contador ocupan sitio, y mandar la orden más seguido ocupa más bus. Hay que repartir.' },
  ],
  mision: [
    'Sigue el recorrido paso a paso: el bus, el intruso, la firma, el contador y el sitio limitado.',
    'En «Probar», mueve el largo de la firma, la ventana y el periodo, y mira cómo cambian la trama de 64 bits, el bus ocupado y los intentos del intruso.',
    'En el reto, calcula la probabilidad de que el intruso acierte una firma y luego ajusta los tres mandos para cumplir seis requisitos a la vez.',
    'Diagnostica una defensa que falla por sus lecturas y contesta la pregunta de cierre.',
  ],
  aplicaciones: [
    { area: 'Automoción conectada', ejemplo: 'Los coches actuales autentican los mensajes críticos (freno, dirección, motor) con firmas truncadas y contadores, siguiendo AUTOSAR SecOC y la norma ISO/SAE 21434.' },
    { area: 'Taller y diagnóstico', ejemplo: 'El puerto de diagnóstico da acceso directo al bus: las puertas de enlace filtran lo que entra por él y se revisan los códigos de fallo de firma y de contador.' },
  ],
};

export default briefing;
