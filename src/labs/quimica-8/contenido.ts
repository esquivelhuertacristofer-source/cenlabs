import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Equilibrio Químico", mision: "¡Entras en el dominio del Balance Dinámico! Tu objetivo es manipular y estabilizar un sistema químico en equilibrio. Deberás aplicar el Principio de Le Châtelier añadiendo o retirando componentes y observando cómo el sistema 'responde' para alcanzar un nuevo estado de mínima energía. Aprenderás que el equilibrio no es el final de la reacción, sino un estado donde las fuerzas opuestas se igualan. Tu éxito depende de predecir correctamente el desplazamiento de la reacción según la constante Kc. ¡Domina la danza de las moléculas!", 
    ecuacion: "N2O4 + Calor ⇌ 2NO2", formulaGfx: "Le Châtelier",
    pasos: [
      { id: 1, text: "Traslada una jeringa al baño de hielo (0°C).", icon: "snowflake" },
      { id: 2, text: "Traslada otra jeringa a la plancha caliente (100°C).", icon: "flame" },
      { id: 3, text: "Compara el color del gas N2O4/NO2 en equilibrio.", icon: "zap" },
      { id: 4, text: "Deduce la dirección del desplazamiento en tu bitácora.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Deducir si una reacción es endo o exotérmica mediante perturbaciones térmicas.",
      friccion: "El alumno debe notar que el color café (NO2) aumenta con el calor, lo que indica que el calor es un reactivo (Endotérmica).",
      puntosClave: ["N2O4: Gas incoloro.", "NO2: Gas café oscuro.", "Endotérmica: ΔH = +57.2 kJ/mol."]
    },
    conceptos: [
      { titulo: "Eq. Químico", desc: "Estado donde las velocidades directa e inversa se igualan." },
      { titulo: "Le Châtelier", desc: "Si un sistema en equilibrio es perturbado, este se desplazará para reducir el estrés." },
      { titulo: "Endotérmica", desc: "Reacción que absorbe energía en forma de calor." }
    ]
  };

export default contenido;
