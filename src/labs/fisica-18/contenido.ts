import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Túnel de agua: Reynolds y desprendimiento de vórtices",
  "mision": "Determina el número de Reynolds del agua y relaciona su valor con el campo de flujo calculado alrededor del cilindro.",
  "ecuacion": "Re=UD/ν, ν=1,0·10⁻⁶ m²/s. Campo2D por Lattice Boltzmann D2Q9/BGK con rebote no-slip en el cilindro, entrada de equilibrio y salida extrapolada. Red128×64, diámetro12 celdas, Ured=0,045 celda/paso, νred=Ured·12/Re. Relajaciónτ=1/2+3νred. dx=D/12; dt=dx·Ured/U.",
  "formulaGfx": "Re=UD/ν, ν=1,0·10⁻⁶ m²/s. Campo2D por Lattice Boltzmann D2Q9/BGK con rebote no-slip en el cilindro, entrada de equilibrio y salida extrapolada. Red128×64, diámetro12 celdas, Ured=0,045 celda/paso, νred=Ured·12/Re. Relajaciónτ=1/2+3νred. dx=D/12",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Cilindro no-slip» y «Plano de medición» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Velocidad media de entrada», «Diámetro del obstáculo» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Determina el número de Reynolds del agua y relaciona su valor con el campo de flujo calculado alrededor del cilindro.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Reynolds: Compara transporte inercial y difusión viscosa.",
      "No-slip: La velocidad del fluido se anula en la superficie del obstáculo.",
      "Modelo2D: Las estructuras observadas pertenecen a un dominio y unas fronteras específicos."
    ]
  },
  "conceptos": [
    {
      "titulo": "Reynolds",
      "desc": "Compara transporte inercial y difusión viscosa."
    },
    {
      "titulo": "No-slip",
      "desc": "La velocidad del fluido se anula en la superficie del obstáculo."
    },
    {
      "titulo": "Modelo2D",
      "desc": "Las estructuras observadas pertenecen a un dominio y unas fronteras específicos."
    }
  ]
};
export default contenido;
