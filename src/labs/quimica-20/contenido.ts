import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Polimerización y curado: de monómeros a una red",
  "mision": "Calcula el porcentaje de conversión al terminar el tratamiento isotérmico y contrástalo con los grupos reactivos restantes.",
  "ecuacion": "Modelo de primer orden: dα/dt=k(1−α), α=1−exp(−kt), k=10⁷exp(−55000/(RT)) min⁻¹, R=8,314462618 J/mol/K. Masa0,1 kg yentalpía de curado300 kJ/kg: Q=30000α J. En baño isotérmico, potencia retirada=30000k(1−α)/60 W. Los6 s de visualización recorren el tiempo de tratamiento seleccionado.",
  "formulaGfx": "Modelo de primer orden: dα/dt=k(1−α), α=1−exp(−kt), k=10⁷exp(−55000/(RT)) min⁻¹, R=8,314462618 J/mol/K. Masa0,1 kg yentalpía de curado300 kJ/kg: Q=30000α J. En baño isotérmico, potencia retirada=30000k(1−α)/60 W. Los6 s de visualización recorren el tiempo de tratamiento seleccionado.",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Muestra de resina» y «Enlaces de la red» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Temperatura de curado», «Tiempo de tratamiento» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el porcentaje de conversión al terminar el tratamiento isotérmico y contrástalo con los grupos reactivos restantes.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Conversión: Fracción de grupos iniciales que ha reaccionado.",
      "Temperatura: Cambia la constante cinética mediante Arrhenius.",
      "Balance térmico: Mantener T requiere retirar el calor liberado."
    ]
  },
  "conceptos": [
    {
      "titulo": "Conversión",
      "desc": "Fracción de grupos iniciales que ha reaccionado."
    },
    {
      "titulo": "Temperatura",
      "desc": "Cambia la constante cinética mediante Arrhenius."
    },
    {
      "titulo": "Balance térmico",
      "desc": "Mantener T requiere retirar el calor liberado."
    }
  ]
};
export default contenido;
