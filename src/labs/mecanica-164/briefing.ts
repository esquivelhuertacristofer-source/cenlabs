import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-164",
  titulo: "Celda robotizada: garra, bloques y pulido",
  subtitulo: "Autotrónica",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Programa una garra para cargar una pieza, cambiar de herramienta, pulir y entregar el resultado.\nLa superficie tiene pequeños relieves. Un brazo demasiado rígido aumenta la fuerza al encontrarlos; uno demasiado blando se aparta cuando lo empujan.\nConstruye la secuencia con movimientos, garra, herramientas, condiciones y repeticiones. Comprueba el agarre, la rigidez y el freno al movimiento. Después diagnostica por qué otro ajuste falla.`,
  conceptos: [
    { icono: '🤖', nombre: 'Ceder al contacto', descripcion: 'El extremo se comporta como un resorte con freno: una fuerza produce un desplazamiento controlado.' },
    { icono: '🛠️', nombre: 'Seguir el relieve', descripcion: 'La herramienta acompaña la superficie para limitar la variación de fuerza.' },
    { icono: '📈', nombre: 'Apagar oscilaciones', descripcion: 'El amortiguamiento hace decaer una perturbación, pero también dificulta seguir movimientos rápidos.' },
  ],
  mision: [
    'Programa la carga, el cambio de herramienta, el pulido y la entrega.',
    'Ajusta rigidez y amortiguamiento para cumplir tres criterios.',
    'Diagnostica un ajuste defectuoso y responde la pregunta de cierre.',
  ],
  aplicaciones: [
    { area: 'Fabricación automotriz', ejemplo: 'Pulido, lijado y acabado de piezas con contacto controlado.' },
    { area: 'Robótica de contacto', ejemplo: 'Ajustar la respuesta del extremo frente a relieves y empujes externos.' },
  ],
};

export default briefing;
