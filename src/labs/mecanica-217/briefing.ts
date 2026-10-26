import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-217",
  "titulo": "Impedancia de batería: ajuste de un circuito equivalente",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Compara medidas complejas en frecuencia y ajusta un modelo eléctrico de una celda.\nOT-217 · Ajusta el espectro medido hasta obtener residuo complejo RMS ≤0,6 mΩ y coherencia de la constante dinámica.\nCelda virtual en corte, conexión Kelvin y analizador Nyquist/Bode.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Compara medidas complejas en frecuencia y ajusta un modelo eléctrico de una celda."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Ajusta el espectro medido hasta obtener residuo complejo RMS ≤0,6 mΩ y coherencia de la constante dinámica."
    }
  ],
  "mision": [
    "Observa los datos del barrido y la conexión de cuatro terminales.",
    "Ajusta el modelo contrastando partes real e imaginaria.",
    "Registra la respuesta y valida el ajuste sin inferir salud absoluta.",
    "Ajusta el espectro medido hasta obtener residuo complejo RMS ≤0,6 mΩ y coherencia de la constante dinámica."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Impedancia de batería: ajuste de un circuito equivalente"
    }
  ]
};
export default briefing;
