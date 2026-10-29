import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Corrosión y pasivación de metales",
  "mision": "Calcula la pérdida uniforme de espesor de hierro a partir de la corriente de corrosión registrada.",
  "ecuacion": "i activo=0,001·10^(E/0,12) mA/cm². Fracción pasiva f=1/[1+exp(−(E−0,36)/0,018)]; i=(1−f)i activo+f·0,02 mA/cm². Fe→Fe²⁺+2e⁻; δ=i t M/(2Fρ), M=55,845 g/mol, ρ=7,87 g/cm³. Convertir mA a A.",
  "formulaGfx": "i activo=0,001·10^(E/0,12) mA/cm². Fracción pasiva f=1/[1+exp(−(E−0,36)/0,018)]",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Probeta metálica» y «Capa superficial» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Potencial del banco», «Exposición» y usa Revisar movimiento para comparar el fenómeno.",
      "icon": "target"
    },
    {
      "id": 3,
      "text": "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
      "icon": "activity"
    },
    {
      "id": 4,
      "text": "Valida tu respuesta y contrasta la interpretación en el quiz.",
      "icon": "check"
    }
  ],
  "guiaMaestro": {
    "objetivo": "Calcula la pérdida uniforme de espesor de hierro a partir de la corriente de corrosión registrada.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Cinética: La corriente mide transferencia de carga por área.",
      "Pasivación: Un estado superficial puede reducir la corriente.",
      "Faraday: La carga se convierte en cantidad de hierro disuelto."
    ]
  },
  "conceptos": [
    {
      "titulo": "Cinética",
      "desc": "La corriente mide transferencia de carga por área."
    },
    {
      "titulo": "Pasivación",
      "desc": "Un estado superficial puede reducir la corriente."
    },
    {
      "titulo": "Faraday",
      "desc": "La carga se convierte en cantidad de hierro disuelto."
    }
  ]
};
export default contenido;
