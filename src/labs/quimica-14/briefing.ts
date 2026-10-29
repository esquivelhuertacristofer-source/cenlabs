import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "QMI-14",
  "titulo": "Corrosión y pasivación de metales",
  "subtitulo": "Electroquímica Aplicada",
  "acento": "#219EBC",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Superficies expuestas cambian con el medio; interpretar curvas y pérdida de material con alcance declarado.\n\nCalcula la pérdida uniforme de espesor de hierro a partir de la corriente de corrosión registrada.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Cinética",
      "descripcion": "La corriente mide transferencia de carga por área."
    },
    {
      "icono": "📐",
      "nombre": "Pasivación",
      "descripcion": "Un estado superficial puede reducir la corriente."
    },
    {
      "icono": "📊",
      "nombre": "Faraday",
      "descripcion": "La carga se convierte en cantidad de hierro disuelto."
    }
  ],
  "mision": [
    "Inspecciona «Probeta metálica» y «Capa superficial» con Explorar en 3D.",
    "Ajusta «Potencial del banco», «Exposición» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Integridad de materiales",
      "ejemplo": "Convertir corriente de corrosión en pérdida uniforme y reconocer pasivación."
    }
  ],
  "imagen": "/images/ciencias/quimica-14.webp?v=25d09396572e"
};
export default briefing;
