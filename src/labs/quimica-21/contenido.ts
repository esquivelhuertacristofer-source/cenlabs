import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Recuperación de metales: precipitación selectiva",
  "mision": "Calcula el porcentaje de cobre recuperado y analiza la co-precipitación de magnesio.",
  "ecuacion": "Cu²⁺0=Mg²⁺0=0,010 mol/L. Kw=10⁻¹⁴; [OH⁻]=10^(pH−14). KspCu(OH)2=2,2·10⁻²⁰; KspMg(OH)2=5,61·10⁻¹². Concentración residual=min(C0,Ksp/[OH⁻]²); recuperación=(C0−Cres)/C0.",
  "formulaGfx": "Cu²⁺0=Mg²⁺0=0,010 mol/L. Kw=10⁻¹⁴",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Dosificador de reactivo» y «Precipitado de cobre» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «pH del medio», «Volumen tratado» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el porcentaje de cobre recuperado y analiza la co-precipitación de magnesio.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Solubilidad: El producto iónico fija la precipitación.",
      "Selectividad: La recuperación alta no garantiza pureza.",
      "pH: OH⁻ cambia exponencialmente con pH."
    ]
  },
  "conceptos": [
    {
      "titulo": "Solubilidad",
      "desc": "El producto iónico fija la precipitación."
    },
    {
      "titulo": "Selectividad",
      "desc": "La recuperación alta no garantiza pureza."
    },
    {
      "titulo": "pH",
      "desc": "OH⁻ cambia exponencialmente con pH."
    }
  ]
};
export default contenido;
