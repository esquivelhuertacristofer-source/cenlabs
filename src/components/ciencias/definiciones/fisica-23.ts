import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {fotoelectrico} from '@/domain/ciencias/fisica';
const definition:PracticaCiencia={...{
  "id": "fisica-23",
  "title": "Efecto fotoeléctrico: frecuencia, umbral y potencial de frenado",
  "intro": "Fotones y electrones en un banco óptico; distinguir energía individual e intensidad.",
  "mission": "Calcula el potencial de frenado que anula la fotocorriente para la luz elegida y una función de trabajo2,15 eV.",
  "formula": "Eγ=hc/λ. Kmax=Eγ−φ, φ=2,15 eV; eVs=Kmax. h=6,62607015·10⁻³⁴ J·s, e=1,602176634·10⁻¹⁹ C, c=299792458 m/s. Corriente sintética: I=18 nA·max(0,1−V/Vs), equivalente a energías normales uniformes entre0 yKmax. En el tubo: x=v0τ−eVτ²/(2mL), L=0,10 m.",
  "limits": "Monocromático, sin efecto de espacio de carga, emisión térmica, espectro real del material ni distribución electrónica de una superficie comercial. Ley de corriente del banco declarada, no curva universal. Intervalo espectral por encima del umbral para φ elegida. Las trayectorias representan componentes normales1D. El color del haz es una guía aproximada. La radiación ultravioleta se representa violeta para localizarla, aunque no es visible al ojo.",
  "scale": "Electrones×1/10⁷ · tubo0,10 m · ley de corriente sintética",
  "controls": [
    {
      "key": "wavelength",
      "label": "Longitud de onda",
      "min": 350,
      "max": 550,
      "step": 5,
      "unit": "nm",
      "initial": 450
    },
    {
      "key": "voltage",
      "label": "Potencial de frenado",
      "min": 0,
      "max": 2,
      "step": 0.05,
      "unit": "V",
      "initial": 0.3
    }
  ],
  "readings": [
    {
      "key": "frequency",
      "label": "Frecuencia de la luz",
      "unit": "THz",
      "scale": 1e-12,
      "digits": 5
    },
    {
      "key": "current",
      "label": "Fotocorriente ideal",
      "unit": "nA",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Potencial de frenado",
  "answerUnit": "V",
  "tolerance": 0.03,
  "source": [
    {
      "name": "UCLA Physics · efecto fotoeléctrico",
      "url": "https://demoweb.physics.ucla.edu/node/118"
    }
  ],
  "concepts": [
    {
      "title": "Fotón",
      "description": "Su energía depende de la frecuencia."
    },
    {
      "title": "Función de trabajo",
      "description": "Energía necesaria para liberar el electrón del material."
    },
    {
      "title": "Frenado",
      "description": "El potencial detiene incluso los electrones de energía máxima."
    }
  ],
  "quiz": [
    {
      "pregunta": "¿Qué aumenta al reducir λ a igual material?",
      "opciones": [
        "La energía máxima de los fotoelectrones.",
        "Sólo la masa del electrón.",
        "La función de trabajo del material por definición.",
        "El número de átomos del cátodo."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "hc/λ aumenta al reducir λ."
    },
    {
      "pregunta": "¿Qué relación define el potencial de frenado?",
      "opciones": [
        "eVs=Kmax.",
        "Vs=I²R para cualquier fotocátodo.",
        "Vs=λ/h.",
        "eVs=φ sin depender de la luz."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El trabajo eléctrico compensa la energía cinética máxima."
    },
    {
      "pregunta": "¿Qué parte de la curva de corriente es específica de este banco?",
      "opciones": [
        "La distribución ideal de energías usada para I(V).",
        "La conservación de energía.",
        "El valor exacto de la carga elemental.",
        "La relación Eγ=hν."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La forma de I(V) no es universal aunque el umbral energético sí siga el balance."
    }
  ]
},model:fotoelectrico};
export default definition;
