import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-165",
  titulo: "Soldadura por puntos robotizada: calor, fuerza y tamaño de la pepita en una línea de carrocerías",
  subtitulo: "Autotrónica",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Ajustas el robot que suelda las piezas de un coche para que cada punto quede fuerte, sin quemar la lámina.\nEl robot aprieta dos chapas de una puerta y deja pasar una corriente enorme unos instantes. El calor funde un puntito de acero entre ellas: la pepita.\nTres mandos deciden su tamaño: la corriente, el tiempo y la fuerza. Si falta energía, la unión queda pegada; si sobra, el metal sale despedido o el electrodo se hunde.\nCalcula primero, ajusta después un punto en una situación que cambia (electrodos nuevos, gastados o puntos muy juntos) y diagnostica por qué otro punto falla.`,
  conceptos: [
    { icono: '🔥', nombre: 'Calor de Joule', descripcion: 'El calor crece con el cuadrado de la corriente y con el tiempo; la resistencia de contacto baja al apretar más.' },
    { icono: '🔩', nombre: 'La pepita y su mínimo', descripcion: 'El acero fundido entre las chapas debe medir al menos 4 veces la raíz del espesor para que la unión aguante.' },
    { icono: '⚡', nombre: 'Salpicar, pegar o quemar', descripcion: 'Poca fuerza o demasiada corriente expulsa metal; poca energía deja la unión pegada; demasiado tiempo hunde el electrodo.' },
  ],
  mision: [
    'Calcula el diámetro mínimo de la pepita o el calor de un pulso.',
    'Ajusta corriente, tiempo y fuerza para cumplir el mínimo sin salpicar ni quemar.',
    'Diagnostica la causa de un punto defectuoso y responde el quiz de cierre.',
  ],
  aplicaciones: [
    { area: 'Líneas de carrocerías', ejemplo: 'Cientos de puntos por puerta, soldados por robots que deben mantener cada uno dentro de su ventana de corriente.' },
    { area: 'Mantenimiento de electrodos', ejemplo: 'Afilar o cambiar la punta de cobre y subir la corriente por pasos a medida que se ensancha.' },
  ],
};

export default briefing;
