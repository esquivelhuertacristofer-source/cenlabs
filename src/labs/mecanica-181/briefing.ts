import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-181",
  "titulo": "Diagnóstico de rodamientos: muestreo, FFT y frecuencias de defecto",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Configura un analizador de vibraciones y registra un espectro que permita investigar un ruido de rodamiento.\nOT-181 · Investiga una vibración en un motor de1800 rpm. Ajusta el analizador, registra la señal y compara el pico con la cinemática del rodamiento.\nAcelerómetro, tacómetro y analizador FFT virtuales; ventana Hann y registro ajustable.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Configura un analizador de vibraciones y registra un espectro que permita investigar un ruido de rodamiento."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Registra sin alias los componentes de hasta900 Hz, con resolución ≤1 Hz y pico principal bien localizado."
    }
  ],
  "mision": [
    "Comprueba las unidades, el giro del eje y el rango de frecuencia requerido.",
    "Configura muestreo y duración; adquiere un registro completo.",
    "Compara los picos con las frecuencias del rodamiento y conserva el informe.",
    "Registra sin alias los componentes de hasta900 Hz, con resolución ≤1 Hz y pico principal bien localizado."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Diagnóstico de rodamientos: muestreo, FFT y frecuencias de defecto"
    }
  ]
};
export default briefing;
