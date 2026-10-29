import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Espectrómetro de masas: separar por carga y masa",
  "mision": "Deduce la masa del ion monovalente a partir del radio de su trayectoria.",
  "ecuacion": "qV=mv²/2; qvB=mv²/r; m=qB²r²/(2V). q=e=1,602176634·10⁻¹⁹ C; 1 u=1,66053906892·10⁻²⁷ kg.",
  "formulaGfx": "qV=mv²/2",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Sector magnético» y «Paquete de iones» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Potencial acelerador», «Campo magnético» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Deduce la masa del ion monovalente a partir del radio de su trayectoria.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Aceleración: El potencial fija la energía cinética.",
      "Lorentz: B curva la trayectoria sin realizar trabajo.",
      "Identificación: La curva depende de m/q."
    ]
  },
  "conceptos": [
    {
      "titulo": "Aceleración",
      "desc": "El potencial fija la energía cinética."
    },
    {
      "titulo": "Lorentz",
      "desc": "B curva la trayectoria sin realizar trabajo."
    },
    {
      "titulo": "Identificación",
      "desc": "La curva depende de m/q."
    }
  ]
};
export default contenido;
