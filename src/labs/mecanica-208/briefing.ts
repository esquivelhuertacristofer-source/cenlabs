import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-208",
  "titulo": "Tensión de correa con medidor sónico",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Comprueba la pretensión de una correa por su frecuencia y verifica después la capacidad de transmitir potencia.\nOT-208 · Ajusta 45–60 Hz, adherencia suficiente, carga radial ≤1000 N y potencia útil ≥1,8 kW.\nSensor sónico, poleas, apoyos y comprobación de carga.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Comprueba la pretensión de una correa por su frecuencia y verifica después la capacidad de transmitir potencia."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Ajusta 45–60 Hz, adherencia suficiente, carga radial ≤1000 N y potencia útil ≥1,8 kW."
    }
  ],
  "mision": [
    "Reconoce el banco, sus referencias y los límites de la orden.",
    "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
    "Contrasta todos los criterios, valida manualmente y conserva el informe.",
    "Ajusta 45–60 Hz, adherencia suficiente, carga radial ≤1000 N y potencia útil ≥1,8 kW."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Tensión de correa con medidor sónico"
    }
  ]
};
export default briefing;
