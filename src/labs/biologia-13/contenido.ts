import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "PCR con ADN patrón",
  "mision": "Calcula el mínimo de ciclos necesarios para alcanzar 10⁷ copias y contrasta si el registro alcanza esa meta.",
  "ecuacion": "Nn=N0(1+E)^n, N0=100 copias, E=eficiencia/100. Cada ciclo ilustra desnaturalización 95 °C, alineamiento 60 °C y extensión 72 °C; el reloj comprime todos los ciclos en 6 s. Control negativo ideal sin plantilla: cero copias.",
  "formulaGfx": "Nn=N0(1+E)^n, N0=100 copias, E=eficiencia/100. Cada ciclo ilustra desnaturalización 95 °C, alineamiento 60 °C y extensión 72 °C",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Bloque del termociclador» y «ADN en amplificación» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Número de ciclos», «Eficiencia por ciclo» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el mínimo de ciclos necesarios para alcanzar 10⁷ copias y contrasta si el registro alcanza esa meta.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Amplificación: La cantidad crece multiplicativamente por ciclo.",
      "Control: Sin plantilla no hay amplificación ideal.",
      "Eficiencia: Un valor menor de uno reduce el crecimiento respecto a duplicación."
    ]
  },
  "conceptos": [
    {
      "titulo": "Amplificación",
      "desc": "La cantidad crece multiplicativamente por ciclo."
    },
    {
      "titulo": "Control",
      "desc": "Sin plantilla no hay amplificación ideal."
    },
    {
      "titulo": "Eficiencia",
      "desc": "Un valor menor de uno reduce el crecimiento respecto a duplicación."
    }
  ]
};
export default contenido;
