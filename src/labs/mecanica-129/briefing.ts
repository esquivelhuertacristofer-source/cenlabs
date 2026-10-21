import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-129",
  titulo: "Suspensión: Cuarto de Coche, Confort y Agarre",
  subtitulo: "Dinámica del Vehículo",
  acento: "#2A9D8F",
  duracion: 35,
  videoUrl: '',
  bienvenida: 'Una rueda y su cuarto de carrocería ruedan por un camino real, en corte: verás el resorte comprimirse y el aceite cruzar el pistón del amortiguador.\nPrimero calculas a qué frecuencia rebota la carrocería, luego eliges el amortiguador para cumplir a la vez un umbral de confort y uno de agarre, y al final diagnosticas una avería sólo con la respuesta en frecuencia.',
  conceptos: [
    { icono: '〰️', nombre: 'Frecuencias propias', descripcion: 'La carrocería rebota a ≈ 1,3 Hz sobre su resorte y la rueda a ≈ 12 Hz sobre el neumático: dos masas, dos resonancias.' },
    { icono: '🛋️', nombre: 'Confort frente a agarre', descripcion: 'Un amortiguador blando aísla a la carrocería pero deja saltar a la rueda; uno duro sujeta la rueda pero transmite el camino. No hay un c mejor para todo.' },
    { icono: '🎚️', nombre: 'Semiactivo skyhook', descripcion: 'Endurece el amortiguador sólo cuando así frena a la carrocería respecto al cielo, y lo ablanda el resto del tiempo.' },
  ],
  mision: [
    'Predice la frecuencia natural de la carrocería con la masa y el resorte.',
    'Elige el amortiguador, o la estrategia, que cumple a la vez un umbral de confort y uno de agarre.',
    'Diagnostica si falla el amortiguador, el resorte o el neumático con la transmisibilidad.',
  ],
  aplicaciones: [
    { area: 'Diseño de chasis', ejemplo: 'Los ingenieros afinan resorte y amortiguador sobre caminos ISO 8608 buscando el mejor compromiso entre confort y agarre.' },
    { area: 'Taller y diagnóstico', ejemplo: 'Un banco de vibraciones revela amortiguadores gastados o neumáticos bajos de presión por el corrimiento de los picos de resonancia.' },
  ],
};

export default briefing;
