import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Adsorción en carbón activado: ruptura de un lecho",
  "mision": "Estima el tiempo central de ruptura del lecho a partir de capacidad y carga de alimentación.",
  "ecuacion": "Capacidad q=0,12 g soluto/g carbón; densidad aparente 0,5 g/mL; sección 0,002 m². mcarbón=ρaparente A L. Q=0,1 L/min; C0 se convierte a g/L. t50=q m/(Q C0). Curva logística Csal/C0=1/[1+exp(−(t−t50)/(0,12t50))].",
  "formulaGfx": "Capacidad q=0,12 g soluto/g carbón",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Columna de tratamiento» y «Lecho de carbón» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Altura del lecho», «Concentración de entrada» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Estima el tiempo central de ruptura del lecho a partir de capacidad y carga de alimentación.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Capacidad: La masa del lecho fija su inventario adsorbible.",
      "Ruptura: La salida aumenta al avanzar la saturación.",
      "Carga: Más concentración o caudal agota antes el lecho."
    ]
  },
  "conceptos": [
    {
      "titulo": "Capacidad",
      "desc": "La masa del lecho fija su inventario adsorbible."
    },
    {
      "titulo": "Ruptura",
      "desc": "La salida aumenta al avanzar la saturación."
    },
    {
      "titulo": "Carga",
      "desc": "Más concentración o caudal agota antes el lecho."
    }
  ]
};
export default contenido;
