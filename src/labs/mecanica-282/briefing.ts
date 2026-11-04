import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-282",
  "titulo": "Aleta de enfriamiento y eficiencia",
  "subtitulo": "Termofluidos y Energía",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Compara conductividad y convección para retirar calor manteniendo una punta suficientemente activa.\nOT-282 · Compara materiales para el disipador de un módulo de potencia. Entrega calor suficiente sin que la punta quede prácticamente a temperatura ambiente.",
  "conceptos": [
    {
      "icono": "⚙",
      "nombre": "Eficiencia",
      "descripcion": "Lectura del banco en %."
    },
    {
      "icono": "⚙",
      "nombre": "Temperatura en punta",
      "descripcion": "Lectura del banco en °C."
    },
    {
      "icono": "⚙",
      "nombre": "Calor por aleta",
      "descripcion": "Lectura del banco en W."
    }
  ],
  "mision": [
    "Identifica placa caliente, siete aletas y mapa térmico en el banco.",
    "Registra un ensayo variando conductividad y convección.",
    "Eficiencia entre 65 y 82 %. Temperatura en punta entre 58 y 75 °C. Calor por aleta entre 20 y 32 W."
  ],
  "aplicaciones": [
    {
      "area": "Termofluidos y Energía",
      "ejemplo": "Manipula conductividad y convección. Compara las lecturas con la orden de trabajo."
    }
  ]
};
export default briefing;
