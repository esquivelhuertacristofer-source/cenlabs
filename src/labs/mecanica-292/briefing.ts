import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-292",
  "titulo": "Bode y márgenes de estabilidad",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Dos señales pueden tener el mismo tamaño y llegar en momentos distintos. Ese retraso cambia cómo se comporta un lazo de control.\nOT-292 · Ajusta un compensador y comprueba ambos márgenes antes de cerrar el lazo.",
  "conceptos": [
    {
      "icono": "📈",
      "nombre": "Cruce de magnitud",
      "descripcion": "La ganancia del lazo vale uno."
    },
    {
      "icono": "↔️",
      "nombre": "Fase",
      "descripcion": "Expresa cuánto se retrasa la salida durante un ciclo."
    },
    {
      "icono": "🧰",
      "nombre": "Margen",
      "descripcion": "Mide cuánto cambio admite el lazo antes de alcanzar la condición marginal."
    }
  ],
  "mision": [
    "Compara la fase de ambos indicadores.",
    "Ajusta ganancia y adelanto.",
    "Registra los dos cruces y valida los márgenes."
  ],
  "aplicaciones": [
    {
      "area": "Mecatrónica",
      "ejemplo": "Los dos indicadores se mueven a la frecuencia de cruce. Compara el retraso de la salida y registra los márgenes."
    }
  ]
};
export default briefing;
