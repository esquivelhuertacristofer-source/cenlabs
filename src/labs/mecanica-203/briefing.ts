import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-203",
  "titulo": "Montaje robotizado con compensación RCC",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Prepara una inserción robotizada para que la herramienta compense el error lateral sin exigir una fuerza excesiva.\nOT-203 · Inserta con residual ≤0,11 mm, fuerza axial ≤60 N, flecha por carga ≤0,1 mm y reserva lateral suficiente.\nMuñeca complaciente, chaflán, sensor de fuerza y útil de inserción.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Prepara una inserción robotizada para que la herramienta compense el error lateral sin exigir una fuerza excesiva."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Inserta con residual ≤0,11 mm, fuerza axial ≤60 N, flecha por carga ≤0,1 mm y reserva lateral suficiente."
    }
  ],
  "mision": [
    "Reconoce el banco, sus referencias y los límites de la orden.",
    "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
    "Contrasta todos los criterios, valida manualmente y conserva el informe.",
    "Inserta con residual ≤0,11 mm, fuerza axial ≤60 N, flecha por carga ≤0,1 mm y reserva lateral suficiente."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Montaje robotizado con compensación RCC"
    }
  ]
};
export default briefing;
