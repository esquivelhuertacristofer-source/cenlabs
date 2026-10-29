import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Cromatografía HPLC: separar una mezcla",
  "mision": "Calcula la resolución entre los dos picos y juzga si la separación es suficiente.",
  "ecuacion": "t0=1/Q min para una columna de volumen muerto 1 mL; k1=2, k2=2s; tRi=t0(1+ki). N=4000, σi=tRi/√N, anchura basal wi=4σi. Rs=2(tR2−tR1)/(w1+w2).",
  "formulaGfx": "t0=1/Q min para una columna de volumen muerto 1 mL",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Columna cromatográfica» y «Fase estacionaria» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Caudal», «Factor relativo de retención» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la resolución entre los dos picos y juzga si la separación es suficiente.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Retención: Los analitos avanzan con velocidades medias distintas.",
      "Eficiencia: El número de platos relaciona retención y anchura.",
      "Resolución: Combina separación temporal y dispersión."
    ]
  },
  "conceptos": [
    {
      "titulo": "Retención",
      "desc": "Los analitos avanzan con velocidades medias distintas."
    },
    {
      "titulo": "Eficiencia",
      "desc": "El número de platos relaciona retención y anchura."
    },
    {
      "titulo": "Resolución",
      "desc": "Combina separación temporal y dispersión."
    }
  ]
};
export default contenido;
