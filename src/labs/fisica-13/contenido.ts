import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Fotoelasticidad: esfuerzos vistos con polarizadores",
  "mision": "Obtén el esfuerzo tangencial máximo alrededor del agujero en MPa a partir del modelo de Kirsch y el registro óptico.",
  "ecuacion": "Placa infinita bajo tracción en x: σ∞=F/(wt), w=60 mm, agujero a=8 mm. En el borde σθ=σ∞(1−2cos2θ), máximo3σ∞. Ley fotoelástica: N=Ct(σ1−σ2)/λ, C=7,5·10⁻¹¹ Pa⁻¹, λ de referencia550 nm. Se representa luz blanca mediante tres bandas450/550/650 nm entre polarizadores circulares cruzados.",
  "formulaGfx": "Placa infinita bajo tracción en x: σ∞=F/(wt), w=60 mm, agujero a=8 mm. En el borde σθ=σ∞(1−2cos2θ), máximo3σ∞. Ley fotoelástica: N=Ct(σ1−σ2)/λ, C=7,5·10⁻¹¹ Pa⁻¹, λ de referencia550 nm. Se representa luz blanca mediante tres bandas450/550/650 nm entre polarizadores circulares cruzados.",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Placa con agujero» y «Espesor de la probeta» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Fuerza de tracción», «Espesor de placa» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Obtén el esfuerzo tangencial máximo alrededor del agujero en MPa a partir del modelo de Kirsch y el registro óptico.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Concentración: Un agujero modifica el campo incluso bajo carga remota uniforme.",
      "Diferencia de esfuerzos: La birrefringencia depende de esfuerzos principales y espesor.",
      "Unidades: Carga, ancho y espesor deben expresarse en unidades compatibles."
    ]
  },
  "conceptos": [
    {
      "titulo": "Concentración",
      "desc": "Un agujero modifica el campo incluso bajo carga remota uniforme."
    },
    {
      "titulo": "Diferencia de esfuerzos",
      "desc": "La birrefringencia depende de esfuerzos principales y espesor."
    },
    {
      "titulo": "Unidades",
      "desc": "Carga, ancho y espesor deben expresarse en unidades compatibles."
    }
  ]
};
export default contenido;
