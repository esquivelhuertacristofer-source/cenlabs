import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Asepsia y contaminación cruzada",
  "mision": "Calcula el trazador que llega al segundo recipiente después de una limpieza entre transferencias.",
  "ecuacion": "N0=10⁶ unidades de trazador; f=transferencia/100; Nprimero=N0f. Limpieza de L reducciones log10 deja fracción 10^(−L). Arrastre al segundo=N0f²10^(−L).",
  "formulaGfx": "N0=10⁶ unidades de trazador",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Pipeta de transferencia» y «Trazadores de contaminación» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Fracción transferida por contacto», «Reducciones log10 de limpieza» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el trazador que llega al segundo recipiente después de una limpieza entre transferencias.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Transferencia: Un contacto transporta una fracción del origen.",
      "Reducción logarítmica: Cada log10 divide por diez.",
      "Control: El blanco permite observar arrastre residual."
    ]
  },
  "conceptos": [
    {
      "titulo": "Transferencia",
      "desc": "Un contacto transporta una fracción del origen."
    },
    {
      "titulo": "Reducción logarítmica",
      "desc": "Cada log10 divide por diez."
    },
    {
      "titulo": "Control",
      "desc": "El blanco permite observar arrastre residual."
    }
  ]
};
export default contenido;
