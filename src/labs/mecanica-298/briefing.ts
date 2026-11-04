import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-298",
  "titulo": "Encoder incremental y absoluto",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "El disco sigue girando aunque el lector se salte marcas. Compara el conteo de flancos con la posición que entrega una palabra absoluta.\nOT-298 · Selecciona el muestreo para contar la cuadratura sin perder posición.",
  "conceptos": [
    {
      "icono": "🔢",
      "nombre": "Cuadratura",
      "descripcion": "El orden de los estados indica el sentido del eje."
    },
    {
      "icono": "💿",
      "nombre": "Código Gray",
      "descripcion": "Dos sectores contiguos cambian un solo bit."
    },
    {
      "icono": "⏱️",
      "nombre": "Muestreo",
      "descripcion": "Una lectura lenta puede perder estados entre muestras."
    }
  ],
  "mision": [
    "Compara las pistas durante el giro.",
    "Ajusta el muestreo para conservar el conteo.",
    "Ensaya y explica la diferencia entre sector y desplazamiento."
  ],
  "aplicaciones": [
    {
      "area": "Mecatrónica",
      "ejemplo": "Ajusta la velocidad y el muestreo. Las pistas del disco representan A, B y los seis bits Gray."
    }
  ]
};
export default briefing;
