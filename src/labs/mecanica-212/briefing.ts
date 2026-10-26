import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-212",
  "titulo": "Soldadura MIG robotizada: formación del cordón",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Observa cómo el avance de la antorcha forma un cordón y equilibra energía y material por unidad de longitud.\nOT-212 · Prepara 100 mm de cordón con aporte 400–650 J/mm, sección depositada 10–15 mm² y duración ≤20 s.\nRobot cartesiano, antorcha MIG, hilo y registro de energía y depósito.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Observa cómo el avance de la antorcha forma un cordón y equilibra energía y material por unidad de longitud."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Prepara 100 mm de cordón con aporte 400–650 J/mm, sección depositada 10–15 mm² y duración ≤20 s."
    }
  ],
  "mision": [
    "Observa la unión y el hilo alimentado a velocidad fija.",
    "Ajusta corriente y avance comparando energía y sección.",
    "Registra el recorrido y conserva el informe de la orden.",
    "Prepara 100 mm de cordón con aporte 400–650 J/mm, sección depositada 10–15 mm² y duración ≤20 s."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Soldadura MIG robotizada: formación del cordón"
    }
  ]
};
export default briefing;
