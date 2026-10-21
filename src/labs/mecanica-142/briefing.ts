import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-142",
  titulo: "Mild Hybrid de 48 V y Start-Stop: el Alternador-Arrancador",
  subtitulo: "Autotrónica · apagar el motor en cada semáforo y recuperar la energía del freno",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Abre el banco y mira el motor en corte: un cilindro con su pistón, la correa y, pegado a ella, el alternador-arrancador de 48 V (BSG). Cuando el coche se detiene, el motor se apaga; al soltar el freno, el BSG lo vuelve a arrancar en menos de medio segundo.

Cambia el tráfico y activa o desactiva el start-stop: en el ciclo urbano apagar el motor ahorra un 13 % de combustible, y con la recuperación al frenar y la asistencia al acelerar el ahorro llega al 22 %. Pero la batería es finita: si recuperas poco y asistes mucho, se vacía.

Tu misión es hallar el ajuste que gasta lo mínimo y deja la batería como empezó. La respuesta no está escrita: sale de la física, y el óptimo no está en los extremos.`,
  conceptos: [
    { icono: '⏹️', nombre: 'Start-stop', descripcion: 'El motor al ralentí quema combustible sin mover el coche; apagarlo en cada parada lo evita, siempre que haya batería y el motor esté caliente.' },
    { icono: '🔋', nombre: 'Red de 48 V', descripcion: 'Con 48 V el BSG da hasta 12 kW con corrientes manejables y sin pasar el límite de 60 V de protección.' },
    { icono: '♻️', nombre: 'Frenado regenerativo', descripcion: 'Al frenar, el BSG trabaja de generador y guarda en el paquete energía que antes se perdía como calor en los frenos.' },
    { icono: '⚖️', nombre: 'Consumo equivalente', descripcion: 'La energía que falta o sobra en la batería al final del ciclo se valora en combustible para poder comparar ajustes de forma justa.' },
  ],
  mision: [
    'Observa el motor, el BSG y el paquete de 48 V, y mira cómo se apaga y se rearranca en cada parada.',
    'Compara el ciclo con y sin start-stop en tráfico fluido, urbano y denso.',
    'En el laboratorio guiado, predice el ahorro, fija el umbral de parada y la asistencia, y deja el SOC final en 60 %.',
    'Diagnostica una falla por sus síntomas y contesta la pregunta de cierre.',
  ],
  aplicaciones: [
    { area: 'Automoción', ejemplo: 'Muchos coches con motor de gasolina de gama media llevan red de 48 V y alternador-arrancador de correa para cumplir las normas de emisiones.' },
    { area: 'Taller y diagnóstico', ejemplo: 'Si el start-stop deja de funcionar, lo más común es una batería de 12 V débil o un nivel de carga bajo en el paquete de 48 V.' },
  ],
};

export default briefing;
