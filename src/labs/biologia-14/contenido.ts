import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Electroforesis en gel",
  "mision": "Deduce el tamaño del fragmento desconocido usando la distancia recorrida y el patrón de tamaños.",
  "ecuacion": "Banco semilogarítmico: v=[4−0,8log10(Lpb)]·V/100 mm/min; d=vt. Para estimar L: log10L=[4−d/(tV/100)]/0,8. Patrón: 100, 250, 500, 1000 y 2000 pb.",
  "formulaGfx": "Banco semilogarítmico: v=[4−0,8log10(Lpb)]·V/100 mm/min",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Marcador de referencia» y «Carril de muestra» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Tensión aplicada», «Tiempo de corrida» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Deduce el tamaño del fragmento desconocido usando la distancia recorrida y el patrón de tamaños.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Separación: Los fragmentos pequeños avanzan más en el banco.",
      "Patrón: Una escala conocida permite inferir tamaños.",
      "Calibración: La relación no se extrapola fuera de su intervalo."
    ]
  },
  "conceptos": [
    {
      "titulo": "Separación",
      "desc": "Los fragmentos pequeños avanzan más en el banco."
    },
    {
      "titulo": "Patrón",
      "desc": "Una escala conocida permite inferir tamaños."
    },
    {
      "titulo": "Calibración",
      "desc": "La relación no se extrapola fuera de su intervalo."
    }
  ]
};
export default contenido;
