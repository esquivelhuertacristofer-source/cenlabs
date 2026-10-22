import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-163",
  titulo: "Supercapacitores: potencia al acelerar y energía al frenar",
  subtitulo: "Autotrónica",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Dimensiona un banco que ayude al acelerar y conserve espacio para recuperar energía al frenar.\nLos supercapacitores almacenan energía y pueden mover mucha corriente rápidamente. Pero una tensión alta deja menos capacidad libre para el siguiente frenado.\nExplora el banco y una celda en corte, decide cuántas ramas usar y con qué tensión iniciar. Comprueba tu diseño y diagnostica un fallo por sus síntomas.`,
  conceptos: [
    { icono: '⚡', nombre: 'Energía almacenada', descripcion: 'Crece con la capacitancia y con el cuadrado de la tensión.' },
    { icono: '🔗', nombre: 'Serie y paralelo', descripcion: 'La serie permite más tensión; el paralelo reparte corriente y aumenta la capacitancia.' },
    { icono: '🌡️', nombre: 'Pérdidas', descripcion: 'La resistencia interna convierte parte de la energía en calor.' },
  ],
  mision: [
    'Relaciona la tensión, la energía y la dirección del flujo.',
    'Dimensiona el banco para cumplir cinco criterios a la vez.',
    'Diagnostica una falla y responde la pregunta de cierre.',
  ],
  aplicaciones: [
    { area: 'Vehículos híbridos', ejemplo: 'Almacenamiento de pulsos de energía y recuperación frecuente al frenar.' },
    { area: 'Diagnóstico eléctrico', ejemplo: 'Comparar el salto de tensión y su pendiente para distinguir resistencia de capacitancia.' },
  ],
};

export default briefing;
