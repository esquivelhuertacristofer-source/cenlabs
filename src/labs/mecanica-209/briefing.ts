import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-209",
  "titulo": "Firma eléctrica de un motor bajo carga",
  "subtitulo": "Máquinas Eléctricas",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Prepara un registro de corriente que permita distinguir bandas próximas a la fundamental sin sobrecargar el motor.\nOT-209 · Resuelve un tercio de la separación, registra señal lateral ≥0,4 A, corriente fundamental ≤11 A y carga ≥50 %.\nPinza de corriente, banco de carga y analizador FFT.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Prepara un registro de corriente que permita distinguir bandas próximas a la fundamental sin sobrecargar el motor."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Resuelve un tercio de la separación, registra señal lateral ≥0,4 A, corriente fundamental ≤11 A y carga ≥50 %."
    }
  ],
  "mision": [
    "Reconoce el banco, sus referencias y los límites de la orden.",
    "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
    "Contrasta todos los criterios, valida manualmente y conserva el informe.",
    "Resuelve un tercio de la separación, registra señal lateral ≥0,4 A, corriente fundamental ≤11 A y carga ≥50 %."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Firma eléctrica de un motor bajo carga"
    }
  ]
};
export default briefing;
