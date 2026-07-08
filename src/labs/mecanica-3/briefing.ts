import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MEC-03',
    titulo: 'Brazo Robótico de 4 Ejes',
    subtitulo: 'Mecatrónica · Cinemática, par y diagnóstico',
    acento: '#2A9D8F',
    duracion: 45,
    videoUrl: 'https://youtu.be/z62qgu7tMno',
    bienvenida: `¡Bienvenido al laboratorio de Mecatrónica! Hoy vas a ensamblar un brazo robótico eslabón por eslabón y a controlarlo con matemáticas.\n\nMontarás la base, el hombro, el codo y la muñeca/pinza en el orden estructural correcto. Después calcularás la posición del efector final con cinemática directa y el par necesario para levantar una carga. Por último, el brazo fallará en una tarea y tendrás que encontrar la avería.\n\nCada decisión tiene consecuencia física. ¡Construyamos un manipulador!`,
    conceptos: [
      { icono: '🦾', nombre: 'Eslabones y Articulaciones', descripcion: 'Base, hombro, codo y muñeca forman una cadena cinemática abierta.' },
      { icono: '📐', nombre: 'Cinemática Directa', descripcion: 'Con los ángulos de cada eje se calcula la posición exacta del efector final.' },
      { icono: '🏋️', nombre: 'Par (Torque)', descripcion: 'El par necesario depende de la carga y la distancia al eje: τ = F · d.' },
      { icono: '🔍', nombre: 'Diagnóstico', descripcion: 'Encoder, pinza o sobrecarga: cada falla del manipulador tiene su síntoma.' },
    ],
    mision: [
      'FASE 1 · Armado: monta base, hombro, codo y muñeca/pinza en el orden correcto.',
      'FASE 2 · Fundamento: calcula la posición del efector final y el par necesario para una carga.',
      'FASE 3 · Diagnóstico: identifica si la falla es el encoder, la pinza o una sobrecarga.',
      'Usa el modo Manual o Automático para el ensamblaje.',
    ],
    aplicaciones: [
      { area: 'Manufactura', ejemplo: 'Robots de soldadura y ensamblaje en líneas automotrices.' },
      { area: 'Logística', ejemplo: 'Brazos de pick-and-place en centros de distribución.' },
      { area: 'Cirugía Asistida', ejemplo: 'Manipuladores de precisión milimétrica en quirófanos.' },
    ],
    retos: [
      'Alcanza el punto objetivo con la combinación de ángulos más eficiente.',
      'Calcula el par exacto para la carga máxima sin sobrecargar el servo.',
    ],
  };

export default briefing;
