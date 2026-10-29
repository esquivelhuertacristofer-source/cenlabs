import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Tratamiento de agua: coagulación, floculación y sedimentación",
  "mision": "Calcula la velocidad de sedimentación del flóculo equivalente y compara el agua clarificada.",
  "ecuacion": "Banco sintético: η=exp[−((dosis−35)/22)²]·G/(G+20); radio=25+100η µm. Stokes: v=2Δρgr²/(9μ), Δρ=80 kg/m³, μ=0,001 Pa·s, H=0,25 m. Turbidez relativa=100[1−η min(1,vt/H)].",
  "formulaGfx": "Banco sintético: η=exp[−((dosis−35)/22)²]·G/(G+20)",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Dosis menor» y «Ensayo central» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Dosis de coagulante del banco», «Gradiente de mezcla» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la velocidad de sedimentación del flóculo equivalente y compara el agua clarificada.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Coagulación: El banco tiene una dosis óptima sintética.",
      "Floculación: La mezcla favorece agregados equivalentes.",
      "Sedimentación: La velocidad depende del cuadrado del radio."
    ]
  },
  "conceptos": [
    {
      "titulo": "Coagulación",
      "desc": "El banco tiene una dosis óptima sintética."
    },
    {
      "titulo": "Floculación",
      "desc": "La mezcla favorece agregados equivalentes."
    },
    {
      "titulo": "Sedimentación",
      "desc": "La velocidad depende del cuadrado del radio."
    }
  ]
};
export default contenido;
