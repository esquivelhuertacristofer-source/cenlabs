import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-138",
  titulo: "Diferencial y Reparto de Par en Curva",
  subtitulo: "Dinámica del Vehículo",
  acento: "#2DD4BF",
  duracion: 35,
  videoUrl: '',
  bienvenida: 'El eje trasero de un coche toma una curva a la izquierda con el diferencial a la vista: corona, piñón, caja, satélites y planetarios, con los dientes que dicen los números.\nVerás que las dos ruedas no giran igual y que los satélites absorben la diferencia. Y verás qué pasa cuando una de las ruedas está sobre hielo.\nPrimero calculas a cuántas rpm gira una rueda; luego eliges el tipo de diferencial y su ajuste para salir de una curva con hielo sin que el coche se tuerza; y al final diagnosticas, sin verlo, qué diferencial lleva un eje.',
  conceptos: [
    { icono: '⚙️', nombre: 'Cinemática del diferencial', descripcion: 'La caja gira a la media de las dos ruedas: ω_L + ω_R = 2·ω_caja. Los satélites giran sólo cuando las ruedas van a distinta velocidad.' },
    { icono: '❄️', nombre: 'Suelo dividido', descripcion: 'Un diferencial abierto reparte el par por igual, así que manda la rueda que menos agarra: en hielo sólo pasa el doble de lo que ella aguanta.' },
    { icono: '🔄', nombre: 'Momento de guiñada', descripcion: 'Si el par no se reparte igual, la diferencia de fuerzas, por la mitad de la vía, tuerce el coche: ΔM = (T_R − T_L)·t/(2r).' },
  ],
  mision: [
    'Calcula a cuántas rpm gira la rueda interior en una curva a partir de la velocidad y del radio.',
    'Elige el diferencial y su ajuste para tener la tracción pedida en una salida con hielo sin pasarte de momento de guiñada.',
    'Diagnostica qué diferencial lleva un eje con lo que miden sus ruedas.',
  ],
  aplicaciones: [
    { area: 'Competición y deportivos', ejemplo: 'Los autoblocantes y los diferenciales con vectorización de par sacan al coche de las curvas lentas sin que la rueda interior se queme.' },
    { area: 'Todoterreno y nieve', ejemplo: 'Con una rueda sobre barro o hielo, un diferencial abierto deja al vehículo parado; un bloqueo o un autoblocante lo sacan.' },
  ],
};

export default briefing;
