import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-213",
  "titulo": "Fabricación FDM: capas y límite de extrusión",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Construye una pared por capas y comprueba si el extrusor puede entregar el material que pide la trayectoria.\nOT-213 · Imprime capas ≤0,24 mm, demanda ≤8 mm³/s, entrega ≥99 % y tiempo físico ≤220 s.\nImpresora cartesiana, extrusor, pared por capas y balance volumétrico.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Construye una pared por capas y comprueba si el extrusor puede entregar el material que pide la trayectoria."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Imprime capas ≤0,24 mm, demanda ≤8 mm³/s, entrega ≥99 % y tiempo físico ≤220 s."
    }
  ],
  "mision": [
    "Relaciona ancho, altura y avance con el caudal pedido.",
    "Comprueba la entrega real y la textura de las capas.",
    "Registra una ventana de construcción y valida el tiempo físico completo.",
    "Imprime capas ≤0,24 mm, demanda ≤8 mm³/s, entrega ≥99 % y tiempo físico ≤220 s."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Fabricación FDM: capas y límite de extrusión"
    }
  ]
};
export default briefing;
