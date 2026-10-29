import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {enzimas} from '@/domain/ciencias/biologia';
const definition:PracticaCiencia={...{
  "id": "biologia-11",
  "title": "Enzimas: velocidad e inhibición",
  "intro": "Sustratos interactúan con sitios activos; interpretar cinética y comparar mecanismos de inhibición.",
  "mission": "Obtén la velocidad inicial en µmol/L/min a partir del producto registrado y relaciona su cambio con la inhibición competitiva.",
  "formula": "v=Vmax[S]/(Km(1+[I]/Ki)+[S]). Banco sintético: Vmax=80 µmol/L/min,Km=2,4 mmol/L,Ki=2 mmol/L. El sustrato se mantiene constante por un reservorio ideal; producto P(t)=vt, con t en minutos. Se registra6 s=0,1 min.",
  "limits": "Cinética estacionaria de un único sustrato e inhibidor competitivo ideal; sin agotamiento, cooperatividad, inhibición por producto o dinámica molecular. La estructura de apoyo es la lisozima1LYZ; sus coordenadas Cα son experimentales, pero las constantes y el inhibidor del banco son sintéticos y no se atribuyen a la lisozima real. Tránsitos de sustratos y productos son ilustrativos.",
  "scale": "Estructura Cα: PDB 1LYZ · cinética sintética · transporte molecular ilustrativo",
  "controls": [
    {
      "key": "substrate",
      "label": "Sustrato mantenido en el ensayo",
      "min": 0.2,
      "max": 10,
      "step": 0.2,
      "unit": "mmol/L",
      "initial": 3
    },
    {
      "key": "inhibitor",
      "label": "Inhibidor competitivo",
      "min": 0,
      "max": 4,
      "step": 0.1,
      "unit": "mmol/L",
      "initial": 1
    }
  ],
  "readings": [
    {
      "key": "product",
      "label": "Producto acumulado",
      "unit": "µmol/L",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "minutes",
      "label": "Tiempo físico del registro",
      "unit": "min",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Velocidad inicial",
  "answerUnit": "µmol/L/min",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NCATS/NCBI · ensayos de mecanismo enzimático",
      "url": "https://www.ncbi.nlm.nih.gov/books/NBK92001/"
    },
    {
      "name": "RCSB PDB · lisozima1LYZ",
      "url": "https://www.rcsb.org/structure/1LYZ"
    }
  ],
  "concepts": [
    {
      "title": "Saturación",
      "description": "La velocidad se aproxima a un límite al aumentar sustrato."
    },
    {
      "title": "Competencia",
      "description": "El inhibidor eleva Km aparente sin cambiar Vmax en este modelo."
    },
    {
      "title": "Registro",
      "description": "La pendiente de producto frente al tiempo da la velocidad inicial."
    }
  ],
  "quiz": [
    {
      "pregunta": "¿Qué cambia en inhibición competitiva ideal?",
      "opciones": [
        "Aumenta Km aparente y Vmax permanece.",
        "Desaparece el sustrato instantáneamente.",
        "Vmax se duplica necesariamente.",
        "Se destruye la estructura de toda enzima."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El factor1+[I]/Ki modifica el término de afinidad aparente."
    },
    {
      "pregunta": "¿Cómo obtienes v desde el registro lineal?",
      "opciones": [
        "Mediante ΔP/Δt con unidades compatibles.",
        "Dividiendo producto entre la masa del aparato.",
        "Tomando el producto final sin dividir por el intervalo de tiempo.",
        "Multiplicando concentración por un tiempo sin unidades."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La velocidad expresa producción por unidad de tiempo."
    },
    {
      "pregunta": "¿Las constantes del banco caracterizan experimentalmente a1LYZ?",
      "opciones": [
        "No: la geometría es estructural y la cinética del ensayo es sintética.",
        "Sí, cualquier coordenada determina por sí sola Km.",
        "Sí, porque todas las enzimas tienen el mismo Km.",
        "Sólo cuando se ocultan los átomos."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La ficha distingue estructura experimental y modelo de operación."
    }
  ],
  "plotKey": "product"
},model:enzimas};
export default definition;
