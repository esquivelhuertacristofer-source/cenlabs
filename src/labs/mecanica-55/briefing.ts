import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-55",
  titulo: "Curvas V del Motor Síncrono",
  subtitulo: "Máquinas eléctricas · Motor síncrono como compensador de factor de potencia",
  acento: "#4FD1C5",
  duracion: 35,
  videoUrl: '',
  bienvenida: `Casi cualquier máquina que gira absorbe reactivos de la red: un motor de inducción los necesita para magnetizarse, y eso empeora el factor de potencia de toda la planta. El motor síncrono es la excepción: sobreexcitando su devanado de campo, puede dejar de pedir reactivos y empezar a entregarlos — comportándose, ante la red, exactamente como un banco de capacitores que además hace trabajo mecánico útil.

Este laboratorio te pone frente al mismo control que usaría un operador de planta: un reóstato de campo que ajusta la corriente de excitación (If) de un motor síncrono, y un analizador de red que muestra en vivo cómo responde la corriente de armadura. Para cada nivel de carga mecánica descubrirás la misma forma de "V": una corriente mínima exacta en el punto de factor de potencia unitario, con subexcitación a un lado y sobreexcitación al otro. En el modo Reto llevarás esa idea a un caso real de planta: una carga industrial inductiva conectada al mismo bus, y tu tarea será usar el motor síncrono para corregir el factor de potencia total — hasta donde el límite térmico de la armadura lo permita.`,
  conceptos: [
    { icono: '🔀', nombre: 'La curva V: un mínimo de corriente en factor de potencia unitario', descripcion: 'Para una carga mecánica fija, la corriente de armadura del motor síncrono tiene un mínimo exacto en el punto donde toda la corriente está en fase con el voltaje (FP=1). Cualquier desviación de ese punto de campo, en cualquier dirección, aumenta la corriente sin aumentar el trabajo útil que entrega el motor.' },
    { icono: '⚡', nombre: 'Subexcitado pide reactivos, sobreexcitado los entrega', descripcion: 'A la izquierda del mínimo (If bajo) el motor se comporta como una carga inductiva y consume reactivos de la red, igual que un motor de inducción. A la derecha (If alto) el motor entrega reactivos a la red — el mismo efecto que produce un banco de capacitores, pero ajustable en tiempo real con un solo control.' },
    { icono: '🌡️', nombre: 'El límite no es magnético, es térmico', descripcion: 'Sobreexcitar más allá del punto de factor de potencia unitario sigue mejorando el factor de potencia de la red, pero también aumenta la corriente de armadura. El límite práctico de cuánto se puede sobreexcitar un motor síncrono es la corriente nominal de su devanado de armadura, no la saturación magnética del hierro.' },
    { icono: '🏭', nombre: 'Un motor que además compensa el factor de potencia de la planta', descripcion: 'En una planta con motores de inducción y otras cargas inductivas conectadas al mismo bus, un motor síncrono sobreexcitado —incluso operando sin carga mecánica, como "condensador síncrono"— puede cancelar buena parte de esos reactivos y mejorar el factor de potencia total que ve la compañía eléctrica.' },
  ],
  mision: [
    'EXPLORA · Mueve el reóstato de campo (If) con distintos niveles de carga mecánica y observa cómo la corriente de armadura baja hasta un mínimo y vuelve a subir.',
    'COMPARA · Observa las tres curvas V juntas y nota cómo se desplaza el mínimo de cada una según la carga mecánica.',
    'CONECTA · Une una carga industrial inductiva al mismo bus y observa cómo el factor de potencia total del sistema depende de la excitación del motor síncrono.',
    'RETO · Calcula a mano la corriente mínima de una curva V, o ajusta el reóstato hasta maximizar el factor de potencia total del bus sin exceder el límite térmico de la armadura.',
  ],
  aplicaciones: [
    { area: 'Corrección de factor de potencia en una planta industrial', ejemplo: 'Una planta con muchos motores de inducción suele tener un factor de potencia bajo (0.7–0.85 en atraso); si ya cuenta con un motor síncrono de gran tamaño para alguna carga mecánica, sobreexcitarlo puede corregir buena parte de ese factor de potencia sin instalar un solo capacitor adicional.' },
    { area: 'Condensador síncrono en subestaciones', ejemplo: 'Algunas subestaciones usan un motor síncrono girando sin ninguna carga mecánica, exclusivamente sobreexcitado, como "condensador síncrono" para dar soporte de reactivos y de tensión a la red en horas de alta demanda — el mismo principio que este laboratorio explora en el nivel de carga P=0.' },
    { area: 'Evitar penalizaciones por bajo factor de potencia', ejemplo: 'Muchas tarifas industriales penalizan a la planta cuando su factor de potencia cae por debajo de un umbral (típicamente 0.90); un operador que sabe leer la curva V de su motor síncrono puede ajustar la excitación para mantenerse por encima de ese umbral sin sobrecargar térmicamente la máquina.' },
  ],
};

export default briefing;
