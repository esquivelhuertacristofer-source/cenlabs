import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Capilaridad y mojabilidad en microcanales",
  "mision": "Determina la altura de ascenso de equilibrio en un tubo capilar con agua.",
  "ecuacion": "h∞=2γ cosθ/(ρgr), γ=0,0728 N/m, ρ=998 kg/m³, μ=0,001 Pa·s, g=9,80665 m/s². Ascenso viscoso: dh/dt=r²ρg(h∞/h−1)/(8μ). Solución implícita −u−ln(1−u)=t/τ, u=h/h∞, τ=8μh∞/(r²ρg).",
  "formulaGfx": "h∞=2γ cosθ/(ρgr), γ=0,0728 N/m, ρ=998 kg/m³, μ=0,001 Pa·s, g=9,80665 m/s². Ascenso viscoso: dh/dt=r²ρg(h∞/h−1)/(8μ). Solución implícita −u−ln(1−u)=t/τ, u=h/h∞, τ=8μh∞/(r²ρg).",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Microcanal» y «Menisco» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Radio interior», «Ángulo de contacto» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Determina la altura de ascenso de equilibrio en un tubo capilar con agua.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Mojado: El ángulo de contacto modifica cosθ.",
      "Equilibrio: La presión capilar equilibra la hidrostática.",
      "Viscosidad: Modifica el tiempo de ascenso, no la altura final."
    ]
  },
  "conceptos": [
    {
      "titulo": "Mojado",
      "desc": "El ángulo de contacto modifica cosθ."
    },
    {
      "titulo": "Equilibrio",
      "desc": "La presión capilar equilibra la hidrostática."
    },
    {
      "titulo": "Viscosidad",
      "desc": "Modifica el tiempo de ascenso, no la altura final."
    }
  ]
};
export default contenido;
