import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Espectrofotometría UV–Vis: concentración y blanco",
  "mision": "Determina la concentración de la muestra original en µmol/L a partir de la absorbancia, el paso óptico y la dilución.",
  "ecuacion": "A=−log10(I/I₀)=εbc; ε=12000 L·mol⁻¹·cm⁻¹. c_original=c_diluida·factor de dilución. El blanco fija I₀=1. Paso b en cm y concentración c en mol/L.",
  "formulaGfx": "A=−log10(I/I₀)=εbc",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Cubeta y muestra» y «Solución de ensayo» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Factor de dilución», «Paso óptico de la cubeta» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Determina la concentración de la muestra original en µmol/L a partir de la absorbancia, el paso óptico y la dilución.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Absorbancia: Magnitud logarítmica que relaciona intensidades incidente y transmitida.",
      "Calibración y blanco: El blanco establece la referencia óptica del medio.",
      "Dilución: El factor de preparación vincula la cubeta con la muestra original."
    ]
  },
  "conceptos": [
    {
      "titulo": "Absorbancia",
      "desc": "Magnitud logarítmica que relaciona intensidades incidente y transmitida."
    },
    {
      "titulo": "Calibración y blanco",
      "desc": "El blanco establece la referencia óptica del medio."
    },
    {
      "titulo": "Dilución",
      "desc": "El factor de preparación vincula la cubeta con la muestra original."
    }
  ]
};
export default contenido;
