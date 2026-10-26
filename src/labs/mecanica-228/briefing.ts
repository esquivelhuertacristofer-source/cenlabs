import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-228",
  "titulo": "Rugosímetro: perfil, filtro y muestreo",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Una punta recorre una superficie mecanizada y separa ondulación de rugosidad mediante un filtro.\nOT-228 · Separa ondulación con fuga ≤0,1 µm y conserva ≥95 % de la rugosidad; toma ≥20 muestras por onda corta en ≤20 s.\nRugosímetro, perfil mecanizado y separación gaussiana.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Una punta recorre una superficie mecanizada y separa ondulación de rugosidad mediante un filtro."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Separa ondulación con fuga ≤0,1 µm y conserva ≥95 % de la rugosidad; toma ≥20 muestras por onda corta en ≤20 s."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Separa ondulación con fuga ≤0,1 µm y conserva ≥95 % de la rugosidad; toma ≥20 muestras por onda corta en ≤20 s."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Rugosímetro: perfil, filtro y muestreo"
    }
  ]
};
export default briefing;
