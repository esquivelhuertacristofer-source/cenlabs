export interface SimuladorContenido {
  titulo: string;
  tituloEn?: string;
  mision: string;
  misionEn?: string;
  ecuacion: string;
  formulaGfx: string;
  pasos: {
    id: number;
    text: string;
    textEn?: string;
    icon: string;
  }[];
  guiaMaestro: {
    objetivo: string;
    friccion: string;
    puntosClave: string[];
  };
  conceptos: {
    titulo: string;
    desc: string;
  }[];
  videoUrl?: string;
}

export const MASTER_DATA: Record<string, SimuladorContenido> = {
  "quimica-1": {
    titulo: "Construcción Atómica", 
    videoUrl: "https://youtu.be/917vmRGfUcQ",
    tituloEn: "Atomic Construction",
    mision: "¡Bienvenido al Forge Atómico de CEN Labs! Tu misión hoy es fundamental para la ciencia moderna: vamos a sintetizar un isótopo de Carbono-14, una variante esencial utilizada en la datación arqueológica. Deberás equilibrar con precisión la cantidad de protones para definir la identidad del elemento, añadir los neutrones necesarios para alcanzar la masa atómica requerida y finalmente ajustar la nube electrónica para lograr un estado de neutralidad eléctrica perfecto. ¡La estabilidad de la materia está bajo tu supervisión!", 
    misionEn: "Forge a Carbon-14 atom (Isotope)",
    ecuacion: "A = Z + N", 
    formulaGfx: "Carga = P - e",
    pasos: [
      { id: 1, text: "Añade 6 Protones (P+) al núcleo para estabilizar el elemento.", textEn: "Add 6 Protons (P+) to the nucleus to stabilize the element.", icon: "zap" },
      { id: 2, text: "Añade 8 Neutrones (N) para alcanzar la masa crítica (A=14).", textEn: "Add 8 Neutrons (N) to reach critical mass (A=14).", icon: "beaker" },
      { id: 3, text: "Añade 6 Electrones (e-) repartidos en las capas K y L.", textEn: "Add 6 Electrons (e-) distributed in K and L shells.", icon: "circle" },
      { id: 4, text: "Verifica que la carga sea neutra (0) y presiona Validar.", textEn: "Verify that the charge is neutral (0) and press Validate.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Diferenciar entre masa (protones + neutrones) y carga (protones - electrones).",
      friccion: "El alumno suele confundir el número atómico (Z) con el número de masa (A). Forzar la construcción del C-14 ayuda a visualizar por qué un exceso de neutrones genera inestabilidad.",
      puntosClave: ["Isótopos: Átomos con igual Z pero distinto A.", "Carga Neta: Desbalance electrónico.", "Bandas de Estabilidad: Límites físicos reales."]
    },
    conceptos: [
      { titulo: "Protón (P+)", desc: "Partícula con carga positiva (+1). Su cantidad (Z) define la identidad química del elemento." },
      { titulo: "Neutrón (N)", desc: "Partícula sin carga. Actúa como pegamento nuclear." },
      { titulo: "Isótopo", desc: "Variante de un elemento con diferente masa." }
    ]
  },
  "quimica-2": {
    titulo: "Leyes de los Gases", 
    videoUrl: "https://youtu.be/ooLnSYsMcZA",
    tituloEn: "Gas Laws",
    mision: "¡Atención, investigador! Nos encontramos en la Cámara de Pruebas Térmicas de CEN Labs. Tu objetivo es validar experimentalmente la Ley de Gay-Lussac. Deberás manipular la energía cinética de las partículas de gas aumentando la temperatura del sistema, mientras mantienes el volumen rigurosamente constante en 10 litros. Tu meta es alcanzar una presión de 2.0 atmósferas sin comprometer la integridad estructural del contenedor. ¡Analiza cómo cada grado Kelvin impacta en la fuerza de colisión molecular!", 
    misionEn: "Study of Pressure vs Temperature (Gay-Lussac's Law)",
    ecuacion: "P = T / (30 · V)", 
    formulaGfx: "V = constante",
    pasos: [
      { id: 1, text: "Ajusta el mechero para subir la temperatura a 450K.", textEn: "Adjust the burner to raise the temperature to 450K.", icon: "flame" },
      { id: 2, text: "Observa el aumento de colisiones en el manómetro.", textEn: "Observe the increase in collisions on the manometer.", icon: "bar-chart" },
      { id: 3, text: "Mantén el volumen en 10L para evitar sobrepresión.", textEn: "Maintain the volume at 10L to avoid overpressure.", icon: "box" },
      { id: 4, text: "Registra mediciones y valida resultados.", textEn: "Record measurements and validate results.", icon: "save" }
    ],
    guiaMaestro: {
      objetivo: "Analizar la relación directamente proporcional entre P y T.",
      friccion: "El alumno debe entender que la presión es el resultado de choques cinéticos.",
      puntosClave: ["Gay-Lussac: P ∝ T a V constante.", "Cámara de Presión: Riesgo mecánico a > 5.0 atm.", "Energía Cinética: 1/2 mv²."]
    },
    conceptos: [
      { titulo: "Presión (P)", desc: "Fuerza ejercida por unidad de área." },
      { titulo: "Temperatura (K)", desc: "Medida de la energía cinética promedio." },
      { titulo: "Volumen (L)", desc: "Espacio ocupado por la masa de gas." }
    ]
  },
  "quimica-3": {
    titulo: "Motor de Fusión Estequiométrica", 
    mision: "¡Bienvenido al Motor de Fusión Estequiométrica! Tu objetivo es dominar el arte del balanceo químico para garantizar la eficiencia en procesos de síntesis industrial. Deberás aplicar la Ley de Lavoisier con precisión matemática, asegurando que cada átomo en los reactivos esté presente en los productos finales. Avanzarás a través de 6 niveles de complejidad creciente, desde la combustión de propano hasta la síntesis de metanol. Recuerda: en el universo, nada se crea ni se destruye, solo se transforma bajo tu supervisión. ¡Logra el equilibrio atómico!", 
    ecuacion: "Ley de Conservación (Lavoisier)", 
    formulaGfx: "Σ m(Reactivos) = Σ m(Productos)",
    pasos: [
      { id: 1, text: "Analiza el estado de agregación (s, l, g, aq) de cada componente.", icon: "microscope" },
      { id: 2, text: "Balancea la ecuación usando coeficientes estequiométricos enteros.", icon: "zap" },
      { id: 3, text: "Verifica en tiempo real que la masa total se conserve (Sync al 100%).", icon: "scale" },
      { id: 4, text: "Desbloquea el siguiente nivel de complejidad tras lograr el equilibrio.", icon: "lock" }
    ],
    guiaMaestro: {
      objetivo: "Validar la estequiometría mediante la conservación de masa y el conteo atómico preciso.",
      friccion: "El alumno debe enfrentar reacciones con coeficientes grandes (ej: Octano), lo que requiere un método sistemático.",
      puntosClave: [
        "Progresión: 6 niveles (Propano, Fotosíntesis, Haber, Metanol, Neutralización, Octano).",
        "Rigor: Inclusión de estados de agregación según estándar IUPAC.",
        "Masa Molar: Cálculos basados en g/mol para validación de Lavoisier."
      ]
    },
    conceptos: [
      { titulo: "Coeficiente Estequiométrico", desc: "Número que indica la proporción molar en que reaccionan las sustancias." },
      { titulo: "Estado de Agregación", desc: "Forma física de la materia (sólido, líquido, gas, acuoso) bajo condiciones específicas." },
      { titulo: "Ley de Lavoisier", desc: "Principio de conservación de la materia: nada se crea ni se destruye, solo se transforma." }
    ]
  },
  "quimica-4": {
    titulo: "Reactivo Limitante", mision: "¡Bienvenido a la Planta de Síntesis de Amoníaco! Tu objetivo es optimizar la reacción entre Nitrógeno e Hidrógeno. En la industria, los recursos son limitados; por ello, deberás identificar con precisión matemática cuál de tus reactivos se agotará primero (Reactivo Limitante) y calcular exactamente cuánto material quedará en exceso. Tu meta es producir la mayor cantidad posible de NH3 aplicando la proporción estequiométrica 1:3. ¡Analiza los moles, predice el rendimiento y evita el desperdicio atómico!", 
    ecuacion: "N2 + 3H2 → 2NH3", formulaGfx: "Exceso = m - (nL * ratio * PM)",
    pasos: [
      { id: 1, text: "Analiza los gramos iniciales de N2 y H2.", icon: "microscope" },
      { id: 2, text: "Calcula los moles y determina el limitante.", icon: "zap" },
      { id: 3, text: "Ingresa el limitante y los gramos sobrantes.", icon: "beaker" },
      { id: 4, text: "Inicia la síntesis y observa el flujo.", icon: "play" }
    ],
    guiaMaestro: {
      objetivo: "Identificar el reactivo limitante mediante cálculos estequiométricos.",
      friccion: "Muchos alumnos asumen que el reactivo con menos gramos es el limitante.",
      puntosClave: ["PM(N2) = 28, PM(H2) = 2.", "Relación: 1 de N2 necesita 3 de H2.", "Exceso: Masa que no reaccionó."]
    },
    conceptos: [
      { titulo: "Reactivo Limitante", desc: "Sustancia que se consume totalmente." },
      { titulo: "Reactivo en Exceso", desc: "Sustancia que sobra." },
      { titulo: "Eficiencia", desc: "Relación entre rendimiento real y teórico." }
    ]
  },
  "quimica-5": {
    titulo: "Preparación de Soluciones", mision: "¡Ingresas al Laboratorio de Análisis de Precisión! Tu objetivo es preparar una solución estándar de Cloruro de Sodio (NaCl) con una molaridad específica. La exactitud es tu prioridad: deberás usar la balanza analítica para pesar el soluto considerando la masa del vidrio de reloj (TARA) y luego transferirlo a un matraz aforado. Tu éxito depende del control del menisco al añadir el solvente; una gota extra sobre la línea de aforo invalidará el proceso por dilución excesiva. ¡Domina el arte del aforo y alcanza la concentración perfecta!", 
    ecuacion: "M = n / V (L)", formulaGfx: "n = m / PM",
    pasos: [
      { id: 1, text: "Usa la balanza analítica para pesar el soluto exacto.", icon: "scale" },
      { id: 2, text: "Recuerda aplicar la TARA al vidrio de reloj (12.5g).", icon: "zap" },
      { id: 3, text: "Transfiere al matraz y afora con agua destilada.", icon: "droplets" },
      { id: 4, text: "No sobrepases la línea de aforo del matraz.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Dominar la técnica de pesaje y aforo volumétrico.",
      friccion: "La principal dificultad es el control del menisco.",
      puntosClave: ["PM NaCl = 58.44.", "Aforo: Medida de volumen exacto.", "Vidrio de Reloj: Masa amortiguadora."]
    },
    conceptos: [
      { titulo: "Molaridad (M)", desc: "Moles de soluto por litro de solución." },
      { titulo: "Aforo", desc: "Marca circular que indica el volumen exacto." },
      { titulo: "Soluto", desc: "Sustancia que se disuelve." }
    ]
  },
  "quimica-6": {
    titulo: "Solubilidad y Cristalización", mision: "¡Bienvenido al laboratorio de Termodinámica Molecular! Tu misión es inducir la formación de cristales puros de Nitrato de Potasio (KNO3) mediante un choque térmico controlado. Deberás calentar la solución hasta alcanzar la saturación total a alta temperatura y luego someterla a un enfriamiento brusco en un baño de hielo. Observa cómo la disminución de la solubilidad fuerza a los iones a organizarse en una red cristalina geométrica. Tu éxito depende de lograr una disolución completa antes del enfriamiento para evitar impurezas. ¡Desafía las leyes de la solubilidad!", ecuacion: "S(T) = f(T²)", formulaGfx: "KNO3 Cristalización",
    pasos: [
      { id: 1, text: "Añade 80g de KNO3 al vaso de precipitados.", icon: "scale" },
      { id: 2, text: "Mueve el vaso a la parrilla y calienta hasta disolver.", icon: "flame" },
      { id: 3, text: "Traslada el vaso al baño de hielo bruscamente.", icon: "snowflake" },
      { id: 4, text: "Observa la formación de cristales geométricos.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la solubilidad como propiedad termodinámica dependiente.",
      friccion: "El alumno debe disolver completamente el soluto en caliente antes de enfriar, de lo contrario la recristalización será impura o incompleta.",
      puntosClave: ["KNO3: Solubilidad altamente sensible a T.", "Sobresaturación: Estado inestable.", "Cristalización: Proceso de ordenamiento molecular."]
    },
    conceptos: [
      { titulo: "Solubilidad", desc: "Máxima cantidad de soluto que se disuelve en solvente a T fija." },
      { titulo: "Cristalización", desc: "Formación de sólidos con estructura geométrica ordenada." },
      { titulo: "Choque Térmico", desc: "Cambio brusco de temperatura que fuerza la precipitación." }
    ]
  },
  "quimica-7": {
    titulo: "Titulación Ácido-Base", mision: "¡Bienvenido al Laboratorio de Química Analítica! Tu misión es realizar una valoración ácido-base de alta precisión para determinar la concentración desconocida de Ácido Clorhídrico (HCl). Deberás controlar la bureta con maestría técnica, añadiendo Hidróxido de Sodio (NaOH) gota a gota hasta alcanzar el punto de equivalencia estequiométrico. La Fenolftaleína será tu sensor visual: el primer viraje a rosa pálido persistente marcará el éxito de tu análisis. Un exceso de una sola gota invalidará la muestra. ¡Demuestra tu destreza en el manejo volumétrico!", 
    ecuacion: "Ca · Va = Cb · Vb", formulaGfx: "NaOH 0.1 M (Base)",
    pasos: [
      { id: 1, text: "Purga la bureta para eliminar burbujas de aire.", icon: "zap" },
      { id: 2, text: "Añade 3 gotas de Fenolftaleína al matraz.", icon: "droplets" },
      { id: 3, text: "Titula con NaOH usando goteo lento (Gota a Gota).", icon: "beaker" },
      { id: 4, text: "Detente al observar el primer viraje a rosa pálido.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Determinar el punto de equivalencia mediante calorimetría visual.",
      friccion: "El 'salto de pH' es la parte más difícil; si el alumno se distrae, la muestra se vuelve fucsia y debe reiniciar.",
      puntosClave: ["Punto de Equivalencia: Moles H+ = Moles OH-.", "Indicador: Rango de viraje pH 8.2 - 10.", "Menisco: Lectura en la parte cóncava."]
    },
    conceptos: [
      { titulo: "Valoración", desc: "Técnica para determinar concentraciones desconocidas." },
      { titulo: "Punto Final", desc: "Momento visual donde el indicador cambia de color." },
      { titulo: "Alícuota", desc: "Volumen fijo de muestra (20mL en este caso)." }
    ]
  },
  "quimica-8": {
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
  },
  "quimica-9": {
    titulo: "Celdas Galvánicas", mision: "¡Bienvenido al motor de la Electroquímica! Tu misión es diseñar y ensamblar una celda galvánica funcional capaz de generar energía eléctrica espontánea. Deberás seleccionar los electrodos adecuados, cerrar el circuito iónico mediante un puente salino y verificar la diferencia de potencial. Tu objetivo técnico es lograr un voltaje positivo, lo que certifica la espontaneidad de la reacción según la ecuación de Nernst. Domina el flujo de electrones y convierte el potencial químico en fuerza electromotriz.", ecuacion: "E°celda = E°cat - E°anod", formulaGfx: "Redox: e- Flow",
    pasos: [
      { id: 1, text: "Coloca los dos electrodos metálicos en los vasos de precipitados.", icon: "beaker" },
      { id: 2, text: "Instala el Puente Salino para cerrar el circuito iónico.", icon: "zap" },
      { id: 3, text: "Conecta los cables del voltímetro a ambos electrodos.", icon: "activity" },
      { id: 4, text: "Identifica el ánodo y cátodo para lograr un voltaje positivo.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Identificar los componentes de una celda galvánica y predecir el potencial de celda.",
      friccion: "El alumno suele confundir la polaridad. Si el voltaje es negativo, los cables están invertidos con respecto al flujo espontáneo de electrones.",
      puntosClave: ["CatAn: Cátodo-Anodo.", "Ánodo: Oxidación (Menor E°).", "Cátodo: Reducción (Mayor E°)."]
    },
    conceptos: [
      { titulo: "Ánodo", desc: "Electrodo donde ocurre la oxidación (pérdida de electrones)." },
      { titulo: "Cátodo", desc: "Electrodo donde ocurre la reducción (ganancia de electrones)." },
      { titulo: "Puente Salino", desc: "Tubo que permite el flujo de iones para mantener la electroneutralidad." }
    ]
  },
  "quimica-10": {
    titulo: "Destilación Fraccionada", mision: "¡Iniciando protocolo de Separación Molecular! Tu objetivo es purificar una mezcla hidroalcohólica mediante destilación fraccionada de alta precisión. Deberás controlar la termodinámica de la manta calefactora para estabilizar el sistema en el punto de ebullición del etanol (78.4°C). Tu éxito técnico depende de mantener una isoterma constante que evite la co-evaporación del agua, asegurando un destilado con pureza superior al 98%. ¡Domina el equilibrio líquido-vapor y recupera el componente volátil con grado analítico!", ecuacion: "ΔT = Teb(B) - Teb(A)", formulaGfx: "Etanol vs Agua",
    pasos: [
      { id: 1, text: "Ajusta la manta de calentamiento a 80-85°C para evaporar el etanol.", icon: "flame" },
      { id: 2, text: "Observa el punto de ebullición del etanol en el termómetro.", icon: "thermometer" },
      { id: 3, text: "Controla que la temperatura no exceda los 90°C para evitar co-evaporación.", icon: "zap" },
      { id: 4, text: "Recupera el volumen total de etanol y valida la pureza.", icon: "beaker" }
    ],
    guiaMaestro: {
      objetivo: "Diferenciar sustancias puras mediante sus puntos de ebullición constantes.",
      friccion: "El alumno debe entender que la temperatura de la mezcla se mantiene constante durante el cambio de fase. Si sube de 90°C, está forzando la ebullición del agua.",
      puntosClave: ["Etanol: 78.4°C.", "Agua: 100°C.", "Fraccionamiento: Separación por volatilidad."]
    },
    conceptos: [
      { titulo: "Punto de Ebullición", desc: "Temperatura a la que la presión de vapor iguala la atmosférica." },
      { titulo: "Condensación", desc: "Cambio de fase de gas a líquido por pérdida de energía." },
      { titulo: "Mezcla Azeotrópica", desc: "Mezcla que destila con composición constante (No aplicable aquí)." }
    ]
  },
  "fisica-1": {
    titulo: "Tiro Parabólico", 
    videoUrl: "https://youtu.be/4wbTLJJwyng",
    mision: "¡Bienvenido al polígono de pruebas de balística! Tu misión es dominar la cinemática bidimensional para alcanzar objetivos estratégicos con precisión milimétrica. Deberás descomponer vectorialmente la velocidad inicial, compensar la aceleración gravitatoria y calcular el ángulo de lanzamiento óptimo. Tu éxito técnico se medirá por la capacidad de predecir el punto de impacto exacto, dominando la relación entre el tiempo de vuelo y el alcance horizontal máximo. ¡Ajusta el cañón y convierte la física en precisión balística!", ecuacion: "y = x·tan(θ) - (g·x²) / (2·v₀²·cos²θ)", formulaGfx: "V₀x = V₀·cos(θ)",
    pasos: [
      { id: 1, text: "Ajusta el cañón a un ángulo de 45° para máximo alcance.", icon: "zap" },
      { id: 2, text: "Define la velocidad inicial a 20 m/s.", icon: "activity" },
      { id: 3, text: "Dispara y observa la trayectoria parabólica.", icon: "play" },
      { id: 4, text: "Ajusta parámetros si el proyectil no alcanza el blanco.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Descomponer el movimiento en sus componentes rectilíneo (X) y acelerado (Y).",
      friccion: "El alumno suele olvidar que la velocidad en X es constante.",
      puntosClave: ["Ángulo óptimo: 45°.", "Gravedad: 9.81 m/s².", "Tiempo de vuelo: T = 2·V₀y / g."]
    },
    conceptos: [
      { titulo: "Velocidad Inicial", desc: "Magnitud vectorial del inicio del movimiento." },
      { titulo: "Aceleración Gravitatoria", desc: "Constante que afecta solo al eje vertical." },
      { titulo: "Alcance Máximo", desc: "Distancia horizontal total recorrida." }
    ]
  },
  "fisica-2": {
    titulo: "Dinámica: Leyes de Newton", mision: "¡Iniciando protocolo de Análisis Mecánico! Tu misión es dominar la dinámica de partículas analizando el movimiento de un bloque en un plano inclinado. Deberás descomponer vectorialmente la fuerza de gravedad en sus componentes tangencial y normal, calcular la magnitud de la fricción cinética y predecir la aceleración resultante del sistema. Tu éxito técnico se basará en la precisión de tu Diagrama de Cuerpo Libre (DCL) y tu capacidad para equilibrar las fuerzas fundamentales. ¡Desbloquea los secretos del movimiento y domina la segunda ley de Newton!", ecuacion: "F_net = m·a", formulaGfx: "a = g(sinθ - μ·cosθ)",
    pasos: [
      { id: 1, text: "Ajusta el ángulo de la rampa a 30°.", icon: "zap" },
      { id: 2, text: "Coloca el bloque de 2kg sobre la superficie.", icon: "box" },
      { id: 3, text: "Mide el tiempo de descenso del bloque.", icon: "timer" },
      { id: 4, text: "Calcula el coeficiente de fricción cinética si es necesario.", icon: "activity" }
    ],
    guiaMaestro: {
      objetivo: "Identificar las fuerzas normal, peso y fricción en un sistema inclinado.",
      friccion: "Dificultad al descomponer el vector peso en Px y Py.",
      puntosClave: ["Normal: Siempre perpendicular al plano.", "Fricción: Se opone al movimiento.", "Aceleración: Independiente de la masa (sin fricción)."]
    },
    conceptos: [
      { titulo: "Fuerza Normal", desc: "Reacción del plano sobre el objeto." },
      { titulo: "Fricción", desc: "Resistencia al movimiento entre superficies." },
      { titulo: "Diagrama de Cuerpo Libre", desc: "Representación vectorial de todas las fuerzas." }
    ]
  },
  "fisica-3": {
    titulo: "Geofísica: Péndulo Simple", mision: "¡Iniciando protocolo de Gravimetría! Tu misión es determinar la aceleración de la gravedad local analizando el isocronismo de un péndulo simple. Deberás configurar con precisión la longitud del sistema, minimizar el error experimental mediante el cronometraje de oscilaciones múltiples y validar la relación teórica entre el periodo y la longitud. Tu éxito técnico dependerá de tu capacidad para mantener ángulos de oscilación pequeños (Movimiento Armónico Simple) y tu rigor en el procesamiento estadístico de los datos temporales. ¡Domina la mecánica planetaria y despeja la gravedad!", ecuacion: "T = 2π·√(L/g)", formulaGfx: "g = 4π²L / T²",
    pasos: [
      { id: 1, text: "Ajusta la longitud de la cuerda a 1.0 metro.", icon: "zap" },
      { id: 2, text: "Desplaza la masa 10° (Pequeñas oscilaciones).", icon: "activity" },
      { id: 3, text: "Mide el tiempo de 10 oscilaciones completas.", icon: "timer" },
      { id: 4, text: "Calcula el periodo y despeja la gravedad.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Analizar el movimiento armónico simple y su dependencia de la longitud.",
      friccion: "El error común es creer que el periodo depende de la masa.",
      puntosClave: ["Isocronismo: T constante para ángulos pequeños.", "Efecto de L: A mayor L, mayor T.", "Energía: Intercambio entre Cinética y Potencial."]
    },
    conceptos: [
      { titulo: "Periodo (T)", desc: "Tiempo requerido para una oscilación completa." },
      { titulo: "Frecuencia (f)", desc: "Número de oscilaciones por unidad de tiempo." },
      { titulo: "Longitud (L)", desc: "Distancia del pivote al centro de masa." }
    ]
  },
  "fisica-4": {
    titulo: "Ingeniería: Suspensión Rover (Ley Hooke)", mision: "¡Protocolo de Estabilidad de Chasis Activo! Tu misión como ingeniero de sistemas de aterrizaje es calibrar con precisión milimétrica la rigidez del amortiguador principal para la próxima misión exploratoria. Utilizando la Ley de Hooke, deberás someter el pistón telescópico a cargas estáticas variables, registrar la telemetría láser de compresión y determinar la constante elástica (k) del ensamble. El éxito de la misión depende de tu capacidad para predecir la respuesta mecánica del sistema y asegurar que la energía potencial elástica almacenada no exceda los límites de fatiga del material. ¡Asegura el aterrizaje y domina la elasticidad industrial!", ecuacion: "F = -k·x", formulaGfx: "Ep = ½·k·x²",
    pasos: [
      { id: 1, text: "Aplica masa de prueba sobre el pistón telescópico.", icon: "box" },
      { id: 2, text: "Lee la telemetría láser de compresión estática (x).", icon: "target" },
      { id: 3, text: "Registra la elongación en la matriz de análisis.", icon: "activity" },
      { id: 4, text: "Calcula la rigidez (k) del ensamble mecánico.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Analizar la respuesta elástica de un sistema de suspensión sometido a carga estática.",
      friccion: "No relacionar correctamente la compresión (x) con la fuerza aplicada por la gravedad sobre la masa.",
      puntosClave: ["Rigidez Mecánica (k): Capacidad de absorción del impacto.", "Límite Elástico: Riesgo de falla catastrófica del chasis.", "Amortiguación: Disipación de energía cinética al tocar la superficie."]
    },
    conceptos: [
      { titulo: "Constante de Rigidez", desc: "Resistencia del pistón a la deformación axial." },
      { titulo: "Compresión", desc: "Reducción de longitud respecto a su estado libre." },
      { titulo: "Energía Potencial", desc: "Energía almacenada en el amortiguador lista para disiparse." }
    ]
  },
  "fisica-5": {
    titulo: "Sistemas Hidráulicos de Elevación", 
    mision: "Optimiza la ventaja mecánica mediante el Principio de Pascal para la movilización de carga industrial.", 
    ecuacion: "F₁ / A₁ = F₂ / A₂", 
    formulaGfx: "P₁ = P₂",
    pasos: [
      { id: 1, text: "Calibración de Entrada: Ajusta el radio del émbolo primario (r1) para definir la densidad de fuerza inicial.", icon: "settings" },
      { id: 2, text: "Configuración de Multiplicador: Define el radio del émbolo de salida (r2) para maximizar la ganancia mecánica.", icon: "maximize" },
      { id: 3, text: "Prueba de Carga: Selecciona la masa crítica de transporte en el pistón mayor.", icon: "box" },
      { id: 4, text: "Maniobra de Elevación: Aplica presión controlada hasta lograr la estabilidad gravitatoria de la carga.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Certificar la comprensión de la transmisión hidrostática de presión y la multiplicación de fuerzas en sistemas cerrados.",
      friccion: "Es común la confusión entre el radio y el área. El alumno debe notar que duplicar el radio cuadriplica la ventaja mecánica.",
      puntosClave: ["Principio de Pascal: Transmisión isométrica de presión.", "Ventaja Mecánica: Transformación de presión en fuerza de elevación masiva.", "Balance de Energía: Relación inversa entre fuerza y desplazamiento axial."]
    },
    conceptos: [
      { titulo: "Presión Hidráulica", desc: "Fuerza ejercida por el fluido por unidad de área." },
      { titulo: "Pistón / Émbolo", desc: "Superficie móvil que recibe o transmite la fuerza." },
      { titulo: "Fluido Incompresible", desc: "Líquido que no reduce su volumen bajo presión." }
    ]
  },
  "fisica-6": {
    titulo: "Física de Fluidos: Empuje Estático", 
    mision: "Determina la densidad de materiales desconocidos mediante el análisis del empuje hidrostático de Arquímedes.", 
    ecuacion: "E = ρ_f · g · V_sub", 
    formulaGfx: "P_ap = P_real - E",
    pasos: [
      { id: 1, text: "Pesaje Inicial: Registra la masa gravitatoria del sólido en condiciones atmosféricas (Aire).", icon: "scale" },
      { id: 2, text: "Inmersión Controlada: Sumerge el espécimen completamente en el fluido de referencia (Agua/Glicerina).", icon: "droplets" },
      { id: 3, text: "Telemetría de Empuje: Mide el peso aparente para calcular la fuerza de flotación ascendente.", icon: "activity" },
      { id: 4, text: "Certificación de Densidad: Utiliza el volumen de fluido desalojado para identificar la composición del material.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Validar experimentalmente que el empuje es igual al peso del volumen de fluido desplazado por el cuerpo.",
      friccion: "Muchos alumnos asocian el empuje a la profundidad o al peso del objeto, ignorando que es el volumen desalojado el factor determinante.",
      puntosClave: ["Principio de Arquímedes: Fuerza vertical dirigida hacia arriba.", "Peso Aparente: Reducción efectiva de masa por el empuje del fluido.", "Flotabilidad: Análisis de fuerzas competitivas en medios líquidos."]
    },
    conceptos: [
      { titulo: "Fuerza de Empuje", desc: "Fuerza neta ascendente sobre un cuerpo sumergido." },
      { titulo: "Densidad", desc: "Propiedad intensiva de la materia." },
      { titulo: "Peso Aparente", desc: "Lectura del dinamómetro dentro del fluido." }
    ]
  },
  "fisica-7": {
    titulo: "Materiales: Dilatación Térmica", 
    mision: "Certifica el coeficiente de expansión lineal (α) mediante el análisis de elongación micrométrica por gradiente térmico.", 
    ecuacion: "ΔL = L₀ · α · ΔT", 
    formulaGfx: "α = ΔL / (L₀·ΔT)",
    pasos: [
      { id: 1, text: "Calibración Inicial: Registra la longitud L₀ del espécimen a temperatura ambiente.", icon: "target" },
      { id: 2, text: "Gradiente de Calor: Inyecta energía térmica controlada hasta alcanzar la saturación por vapor.", icon: "flame" },
      { id: 3, text: "Telemetría Micrométrica: Mide la elongación ΔL con precisión láser en el comparador de carátula.", icon: "activity" },
      { id: 4, text: "Análisis Alfa: Calcula la constante de expansión para validar la composición metalúrgica.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Analizar la respuesta macroscópica del aumento de la agitación térmica en la red cristalina del sólido.",
      friccion: "Es crítico entender que ΔL es una fracción milimétrica. Un error de lectura en el micrómetro invalida el coeficiente α.",
      puntosClave: ["Coeficiente Alfa (α): Propiedad intrínseca del material.", "Efecto Térmico: Dilatación por aumento de la distancia interatómica.", "Precisión: Relación entre ΔT y la escala micrométrica."]
    },
    conceptos: [
      { titulo: "Coeficiente de Dilatación", desc: "Constante característica de cada material." },
      { titulo: "Equilibrio Térmico", desc: "Estado de igual temperatura entre cuerpos." },
      { titulo: "Termometría", desc: "Técnica de medición de calor sensible." }
    ]
  },
  "fisica-8": {
    titulo: "Ingeniería: Ley de Ohm", 
    mision: "Certifica la relación V=I·R analizando la respuesta de conductancia en un circuito de precisión bajo diferentes cargas de potencial.", 
    ecuacion: "V = I · R", 
    formulaGfx: "P = V · I",
    pasos: [
      { id: 1, text: "Configuración de Carga: Instala una resistencia patrón de 100Ω en el banco de pruebas.", icon: "zap" },
      { id: 2, text: "Barrido de Potencial: Aumenta el voltaje de la fuente para analizar la respuesta lineal.", icon: "activity" },
      { id: 3, text: "Telemetría de Corriente: Mide la intensidad (I) con el amperímetro digital en configuración serie.", icon: "timer" },
      { id: 4, text: "Certificación Óhmica: Valida que la pendiente V/I coincida con la resistencia nominal.", icon: "play" }
    ],
    guiaMaestro: {
      objetivo: "Analizar el comportamiento lineal de los materiales conductores y la disipación de energía por efecto Joule.",
      friccion: "El cortocircuito virtual es el error común; el alumno debe entender que el amperímetro no tiene resistencia interna.",
      puntosClave: ["Conductancia: Facilidad de flujo de electrones.", "Linealidad: Comportamiento de materiales óhmicos.", "Potencia: Relación entre trabajo eléctrico y calor."]
    },
    conceptos: [
      { titulo: "Resistencia (Ω)", desc: "Oposición al flujo de corriente." },
      { titulo: "Corriente (A)", desc: "Flujo de carga eléctrica por segundo." },
      { titulo: "Voltaje (V)", desc: "Diferencia de potencial o fuerza electromotriz." }
    ]
  },
  "fisica-9": {
    titulo: "Física: Electrostática", 
    mision: "Cuantifica la interacción de fuerzas fundamentales entre cargas puntuales, validando la Ley de Coulomb mediante el análisis de vectores de atracción y repulsión en un vacío controlado.", 
    ecuacion: "F = k · |q₁q₂| / r²", 
    formulaGfx: "k ≈ 8.99 x 10⁹ N·m²/C²",
    pasos: [
      { id: 1, text: "Configuración de Fuente: Posiciona la carga q₁ (estacionaria) en el origen del sistema de coordenadas.", icon: "zap" },
      { id: 2, text: "Ajuste de Probeta: Sitúa la carga q₂ a una distancia nanométrica controlada.", icon: "target" },
      { id: 3, text: "Análisis de Campo: Observa la magnitud y dirección de los vectores de fuerza resultantes.", icon: "activity" },
      { id: 4, text: "Certificación de Fuerza: Calcula la magnitud neta en Newtons para validar la constante de Coulomb.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la naturaleza de las fuerzas centrales y la dependencia del inverso del cuadrado de la distancia.",
      friccion: "La escala de las fuerzas (Newton) frente a las cargas (Microcoulomb) suele generar confusión en las potencias de diez.",
      puntosClave: ["Interacción Electrostática: Cargas iguales se repelen; opuestas se atraen.", "Magnitud Vectorial: La fuerza actúa a lo largo de la línea que une las cargas.", "Cuantización: Relación entre la cantidad de carga y la fuerza neta."]
    },
    conceptos: [
      { titulo: "Carga Eléctrica (C)", desc: "Propiedad intrínseca de la materia." },
      { titulo: "Campo Eléctrico", desc: "Región de influencia de una carga." },
      { titulo: "Permitividad", desc: "Influencia del medio en la fuerza eléctrica." }
    ]
  },
  "fisica-10": {
    titulo: "Motor Eléctrico", mision: "Convierte energía eléctrica en torque mecánico", ecuacion: "τ = N · I · A · B · sinφ", formulaGfx: "F = I · L x B",
    pasos: [
      { id: 1, text: "Coloca la bobina de cobre entre los imanes permanentes.", icon: "zap" },
      { id: 2, text: "Asegura el contacto de las escobillas con el conmutador.", icon: "activity" },
      { id: 3, text: "Alimenta el sistema con una batería de 9V.", icon: "play" },
      { id: 4, text: "Aumenta el flujo magnético para subir las RPM.", icon: "activity" }
    ],
    guiaMaestro: {
      objetivo: "Entender la fuerza de Lorentz y el principio de inducción electromagnética.",
      friccion: "El alumno debe notar que sin conmutador, la bobina no giraría continuamente.",
      puntosClave: ["Torque: Fuerza de giro.", "Campo Magnético: Imán estator.", "Corriente: Energía de entrada."]
    },
    conceptos: [
      { titulo: "Inducción Magnética (B)", desc: "Densidad de flujo magnético." },
      { titulo: "Conmutador", desc: "Dispositivo para invertir la corriente cada media vuelta." },
      { titulo: "Torque (τ)", desc: "Momento de una fuerza que tiende a producir rotación." }
    ]
  },
  "matematicas-1": {
    titulo: "Explorador de Cuadráticas", 
    videoUrl: "https://youtu.be/lq3R6uPGWNA",
    mision: "Ajusta los coeficientes para empatar la trayectoria objetivo", ecuacion: "f(x) = ax² + bx + c", formulaGfx: "Δ = b² - 4ac",
    pasos: [
      { id: 1, text: "Ajusta el coeficiente 'a' para controlar la apertura y concavidad.", icon: "zap" },
      { id: 2, text: "Modifica 'b' para desplazar el vértice horizontalmente.", icon: "activity" },
      { id: 3, text: "Cambia 'c' para ajustar la intersección con el eje Y.", icon: "target" },
      { id: 4, text: "Valida la función cuando ambas parábolas se superpongan.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Analizar cómo los coeficientes a, b y c transforman la gráfica de una función cuadrática.",
      friccion: "El alumno suele tener dificultad para entender el desplazamiento horizontal causado por 'b' sin afectar 'a'.",
      puntosClave: ["Si a > 0, cóncava hacia arriba; si a < 0, hacia abajo.", "Si Δ < 0, la parábola no corta el eje X.", "El vértice es el punto máximo o mínimo."]
    },
    conceptos: [
      { titulo: "Discriminante (Δ)", desc: "Indica el número de raíces reales de la función." },
      { titulo: "Vértice", desc: "Punto de inflexión donde la función cambia de dirección." },
      { titulo: "Raíces", desc: "Puntos donde la gráfica cruza el eje X (f(x) = 0)." }
    ]
  },
  "matematicas-2": {
    titulo: "Sistemas 2x2: Triangulación", mision: "Ajusta las trayectorias para localizar la señal del satélite", ecuacion: "y = mx + b", formulaGfx: "P(x,y) = L₁ ∩ L₂",
    pasos: [
      { id: 1, text: "Ajusta la pendiente m y la ordenada b de la trayectoria L1 (Cyan).", icon: "activity" },
      { id: 2, text: "Modifica los parámetros de la trayectoria L2 (Fucsia).", icon: "zap" },
      { id: 3, text: "Sigue el punto de colisión blanco hasta coincidir con el objetivo pulsante.", icon: "target" },
      { id: 4, text: "Cuando el radar marque 'Target Locked', presiona Triangular.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Hallar el punto de intersección de dos funciones lineales mediante manipulación algebraica-visual.",
      friccion: "Identificar que no existe solución cuando m1 = m2 (rectas paralelas).",
      puntosClave: ["Pendiente (m): Inclinación respecto al eje X.", "Ordenada (b): Punto de corte con el eje Y.", "Intersección: Valores de x e y que satisfacen ambas ecuaciones."]
    },
    conceptos: [
      { titulo: "Sistema 2x2", desc: "Conjunto de dos ecuaciones con dos incógnitas." },
      { titulo: "Pendiente (m)", desc: "Razón de cambio que determina la dirección de la recta." },
      { titulo: "Intersección", desc: "Punto común donde ambas trayectorias se cruzan." }
    ]
  },
  "matematicas-3": {
    titulo: "Escala Richter: Energía Sísmica", 
    videoUrl: "https://youtu.be/B_0q1tpaZbk",
    mision: "Calcula el factor de potencia entre sismos usando logaritmos", ecuacion: "E = 10^(1.5ΔM)", formulaGfx: "log₁₀(E₂/E₁) = 1.5(M₂ - M₁)",
    pasos: [
      { id: 1, text: "Usa el slider para ajustar la magnitud del sismo detectado.", icon: "activity" },
      { id: 2, text: "Observa el crecimiento exponencial de la esfera de energía.", icon: "zap" },
      { id: 3, text: "Calcula el multiplicador basándote en la diferencia de magnitud.", icon: "target" },
      { id: 4, text: "Ingresa el valor calculado y valida los datos para finalizar.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Diferenciar entre crecimiento lineal y exponencial aplicado a fenómenos naturales.",
      friccion: "Los alumnos suelen subestimar el incremento de energía al ver números pequeños (ej. de 6 a 8).",
      puntosClave: ["Un aumento de 1 grado = ~31.6 veces más energía.", "Un aumento de 2 grados = 1000 veces más energía.", "La escala es logarítmica para manejar rangos de energía masivos."]
    },
    conceptos: [
      { titulo: "Magnitud de Momento", desc: "Escala logarítmica que mide la energía total liberada." },
      { titulo: "Energía Sísmica", desc: "Cantidades masivas de Joules liberados en la falla." },
      { titulo: "Logaritmo", desc: "Función inversa de la exponencial, clave en sismología." }
    ]
  },
  "matematicas-4": {
    titulo: "Teorema de Pitágoras: Fluidos", mision: "Demuestra la relación a² + b² = c² mediante áreas dinámicas", ecuacion: "a² + b² = c²", formulaGfx: "c = √(a² + b²)",
    pasos: [
      { id: 1, text: "Ajusta la longitud de los catetos A y B usando los deslizadores.", icon: "move" },
      { id: 2, text: "Calcula el área de cada cuadrado (lado * lado).", icon: "square" },
      { id: 3, text: "Presiona 'Verter Contenido' para observar la transferencia de energía.", icon: "droplets" },
      { id: 4, text: "Ingresa el valor de la hipotenusa (2 decimales) y valida.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Visualizar geométricamente la suma de áreas en un triángulo rectángulo.",
      friccion: "Los alumnos suelen memorizar la fórmula sin entender que se refiere a áreas físicas.",
      puntosClave: ["La hipotenusa no es solo un lado, es la raíz de una suma de áreas.", "Uso de ternas pitagóricas (3-4-5) para demostración rápida.", "Manejo de raíces cuadradas no exactas."]
    },
    conceptos: [
      { titulo: "Hipotenusa", desc: "Lado opuesto al ángulo recto, el más largo del triángulo." },
      { titulo: "Catetos", desc: "Lados que forman el ángulo de 90 grados." },
      { titulo: "Terna Pitagórica", desc: "Conjunto de tres números enteros que cumplen el teorema." }
    ]
  },
  "matematicas-5": {
    titulo: "Círculo Trigonométrico", mision: "Visualiza el origen geométrico de las ondas Seno y Coseno", ecuacion: "y = sin(θ), x = cos(θ)", formulaGfx: "Unitario (r=1)",
    pasos: [
      { id: 1, text: "Gira el vector en el círculo unitario usando el deslizador.", icon: "rotate-cw" },
      { id: 2, text: "Usa el 'Auto-Giro' para ver cómo se desenrolla la onda en el osciloscopio.", icon: "activity" },
      { id: 3, text: "Observa el punto de cruce en 45° donde Seno y Coseno son idénticos.", icon: "target" },
      { id: 4, text: "Presiona 'Validar Ángulo' exactamente en el punto de intersección.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Deducir las funciones trigonométricas a partir de la geometría del círculo.",
      friccion: "El salto mental entre una rotación circular y una onda oscilante es complejo.",
      puntosClave: ["Ángulo Radianes: Longitud del arco en el círculo unitario.", "Amplitud: Siempre 1 en el círculo unitario.", "Fase: Posición inicial del vector."]
    },
    conceptos: [
      { titulo: "Círculo Unitario", desc: "Círculo de radio 1 centrado en el origen (0,0)." },
      { titulo: "Seno", desc: "Proyección vertical (eje Y) del punto en el círculo." },
      { titulo: "Coseno", desc: "Proyección horizontal (eje X) del punto en el círculo." }
    ]
  },
  "matematicas-6": {
    titulo: "Transformaciones Geométricas", mision: "Aterriza la sonda en la plataforma fantasma mediante isometrías", ecuacion: "V' = M · V + T", formulaGfx: "Escala → Rotación → Traslación",
    pasos: [
      { id: 1, text: "Ajusta el Factor de Escala para igualar el tamaño del objetivo.", icon: "maximize" },
      { id: 2, text: "Aplica la Rotación necesaria sobre el eje de origen.", icon: "rotate-cw" },
      { id: 3, text: "Desplaza la sonda en los ejes X e Y hasta el punto de acoplamiento.", icon: "move" },
      { id: 4, text: "Presiona 'Validar Acoplamiento' cuando la superposición sea perfecta.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Comprender cómo las matrices de transformación alteran la posición, orientación y tamaño de un objeto.",
      friccion: "El orden de las operaciones es crítico. Rotar después de trasladar produce resultados distintos.",
      puntosClave: ["Traslación: Suma vectorial.", "Rotación: Cambio de base angular.", "Homotecia: Multiplicación escalar del área al cuadrado."]
    },
    conceptos: [
      { titulo: "Traslación", desc: "Desplazamiento de todos los puntos en una dirección fija." },
      { titulo: "Isometría", desc: "Transformación que conserva las distancias (Rotación y Traslación)." },
      { titulo: "Homotecia", desc: "Transformación que altera el tamaño manteniendo la forma." }
    ]
  },
  "matematicas-7": {
    titulo: "Ley de Snell", mision: "Deduce el índice de refracción del cristal misterioso", ecuacion: "n₁·sin(θ₁) = n₂·sin(θ₂)", formulaGfx: "n₂ = n₁ · sin(θ₁) / sin(θ₂)",
    pasos: [
      { id: 1, text: "Selecciona los materiales de los medios superior e inferior.", icon: "layers" },
      { id: 2, text: "Ajusta el ángulo de incidencia (θ₁) del láser.", icon: "zap" },
      { id: 3, text: "Mide el ángulo refractado (θ₂) resultante en el segundo medio.", icon: "target" },
      { id: 4, text: "Calcula n₂ y valídalo para identificar el cristal misterioso.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Aplicar funciones trigonométricas inversas para resolver problemas de óptica física.",
      friccion: "El fenómeno de Reflexión Interna Total puede confundir al alumno; es vital explicar el ángulo crítico.",
      puntosClave: ["La Normal: El ángulo se mide siempre desde la vertical.", "Límite: sin(θ) no puede ser mayor a 1.", "Densidad: A mayor n, menor es la velocidad de la luz."]
    },
    conceptos: [
      { titulo: "Refracción", desc: "Cambio de dirección de un rayo al pasar de un medio a otro." },
      { titulo: "Índice de Refracción", desc: "Medida de cuánto se reduce la velocidad de la luz en un medio." },
      { titulo: "Ángulo Crítico", desc: "Ángulo mínimo donde ocurre la reflexión total interna." }
    ]
  },
  "matematicas-8": {
    titulo: "La Derivada", mision: "Identifica los puntos críticos de la montaña rusa usando la recta tangente", ecuacion: "f'(x) = lim(h→0) [f(x+h)-f(x)]/h", formulaGfx: "f'(x) = x² - 4x + 3",
    pasos: [
      { id: 1, text: "Desliza el escáner a lo largo de la pista para observar la pendiente.", icon: "move" },
      { id: 2, text: "Busca los puntos donde la recta tangente sea perfectamente horizontal.", icon: "target" },
      { id: 3, text: "Usa los botones de micro-ajuste para alcanzar m = 0.00.", icon: "mouse-pointer" },
      { id: 4, text: "Registra el Punto Crítico para validar el hallazgo del máximo o mínimo.", icon: "award" }
    ],
    guiaMaestro: {
      objetivo: "Visualizar la derivada como la pendiente de la recta tangente en un punto.",
      friccion: "Muchos alumnos ven la derivada como una fórmula algebraica; aquí la verán como un objeto geométrico que rota.",
      puntosClave: ["Pendiente 0: Indica un máximo o mínimo local.", "Cambio de Signo: De positivo a negativo es un Máximo.", "Razonamiento: f'(x) es la velocidad instantánea."]
    },
    conceptos: [
      { titulo: "Tasa de Cambio", desc: "Relación entre el cambio de salida respecto al de entrada." },
      { titulo: "Punto Crítico", desc: "Lugar donde la derivada es cero o no existe." },
      { titulo: "Máximo Local", desc: "Punto más alto en un entorno cercano de la función." }
    ]
  },
  "matematicas-9": {
    titulo: "Sumas de Riemann", mision: "Aproxima el área bajo la parábola incrementando la resolución rectángular", ecuacion: "A ≈ Σ f(xᵢ) Δx", formulaGfx: "f(x) = -x² + 10x",
    pasos: [
      { id: 1, text: "Selecciona el método de aproximación (Izquierda, Derecha o Medio).", icon: "list" },
      { id: 2, text: "Ajusta la resolución (n) para dividir el área en rectángulos.", icon: "columns" },
      { id: 3, text: "Observa cómo disminuye el margen de error respecto al área exacta.", icon: "activity" },
      { id: 4, text: "Valida la integral cuando el error sea menor al 0.5%.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la integral definida como el límite de una suma de Riemann.",
      friccion: "El alumno puede frustrarse si no nota la diferencia entre los métodos; anímalo a usar n < 10 primero.",
      puntosClave: ["Δx: El ancho de las subdivisiones.", "Convergencia: n → ∞ implica Error → 0.", "Comparación: El punto medio suele ser más preciso con menos n."]
    },
    conceptos: [
      { titulo: "Suma de Riemann", desc: "Método para aproximar el área total mediante áreas simples." },
      { titulo: "Integral Definida", desc: "El límite de la suma de Riemann cuando el número de rectángulos tiende a infinito." },
      { titulo: "Teorema Fundamental", desc: "Relación entre la derivación y la integración." }
    ]
  },
  "matematicas-10": {
    titulo: "Máquina de Galton", mision: "Descubre el patrón oculto en el caos aleatorio calibrando la distribución de probabilidades", ecuacion: "P(k) = (nCk) pᵏ (1-p)ⁿ⁻ᵏ", formulaGfx: "y = [1 / (σ√(2π))] exp[ -½((x-μ)/σ)² ]",
    pasos: [
      { id: 1, text: "Observa la deformación de la campana causada por el sesgo inicial de la máquina.", icon: "alert-triangle" },
      { id: 2, text: "Ajusta la probabilidad de rebote (p) para eliminar la tendencia lateral.", icon: "settings" },
      { id: 3, text: "Lanza una población masiva de esferas (n=500) para estabilizar el histograma.", icon: "cloud-rain" },
      { id: 4, text: "Confirma que la distribución física encaja con la Campana de Gauss teórica.", icon: "award" }
    ],
    guiaMaestro: {
      objetivo: "Demostrar el Teorema del Límite Central de forma empírica.",
      friccion: "Los alumnos suelen confundir aleatoriedad con desorden total. Ayúdales a ver que con n grande, el orden emerge.",
      puntosClave: ["Distribución Binomial: Modelo de cada rebote individual.", "Distribución Normal: Límite de la binomial cuando n es grande.", "Sesgo: Cómo p ≠ 0.5 desplaza la media μ."]
    },
    conceptos: [
      { titulo: "Independencia", desc: "Cada rebote no depende del anterior ni influye en el siguiente." },
      { titulo: "Límite Central", desc: "La suma de variables independientes tiende a una distribución normal." },
      { titulo: "Probabilidad Binomial", desc: "Modelo que cuenta éxitos en una serie de ensayos Bernoulli." }
    ]
  },
  "biologia-1": {
    titulo: "Microscopio Virtual", 
    videoUrl: "https://youtu.be/1elp96ecPGY",
    mision: "Identifica orgánulos específicos en muestras celulares", ecuacion: "Resolución = 0.61λ / NA", formulaGfx: "Mag = Oc · Ob",
    pasos: [
      { id: 1, text: "Selecciona el portaobjetos con la muestra requerida.", icon: "layers" },
      { id: 2, text: "Ajusta la iluminación del diafragma para ver detalles.", icon: "sun" },
      { id: 3, text: "Usa el revólver (zoom) para localizar la estructura objetivo.", icon: "zoom-in" },
      { id: 4, text: "Presiona 'Capturar Micrografía' cuando el orgánulo esté enfocado.", icon: "camera" }
    ],
    guiaMaestro: {
      objetivo: "Dominar el uso de aumentos y reconocer diferencias entre células animales y vegetales.",
      friccion: "Pérdida de luz a gran aumento: El alumno debe compensar subiendo la intensidad lumínica manualmente.",
      puntosClave: ["Cloroplastos: Solo presentes en vegetales.", "Núcleo: Visible a partir de 400x.", "Ciclosis: Movimiento citoplasmático vivo."]
    },
    conceptos: [
      { titulo: "Aumento Total", desc: "Producto del poder de magnificación del ocular por el objetivo." },
      { titulo: "Resolución", desc: "Capacidad de distinguir dos puntos cercanos como objetos separados." },
      { titulo: "Ciclosis", desc: "Movimiento giratorio del citoplasma que transporta orgánulos." }
    ]
  },
  "biologia-2": {
    titulo: "Transporte Celular", mision: "Ajusta la salinidad para alcanzar el equilibrio osmótico", ecuacion: "π = i · M · R · T", formulaGfx: "ΔV ∝ (C_int - C_ext)",
    pasos: [
      { id: 1, text: "Selecciona el modelo celular (Animal o Vegetal).", icon: "box" },
      { id: 2, text: "Ajusta la concentración del medio extracelular (M).", icon: "beaker" },
      { id: 3, text: "Observa la deformación de la membrana y el flujo de agua.", icon: "droplets" },
      { id: 4, text: "Valida cuando la célula alcance un estado isotónico estable.", icon: "check-circle" }
    ],
    guiaMaestro: {
      objetivo: "Comprender los efectos de la tonicidad en la morfología celular y el equilibrio homeostático.",
      friccion: "Lisis celular: Si el medio es excesivamente hipotónico, el eritrocito explotará.",
      puntosClave: ["Isotonía: C_int = C_ext.", "Turgencia: Hinchamiento por entrada de agua.", "Plasmólisis: Retracción de la membrana en vegetales."]
    },
    conceptos: [
      { titulo: "Ósmosis", desc: "Movimiento de agua a través de una membrana semipermeable hacia mayor concentración de soluto." },
      { titulo: "Tonicidad", desc: "Capacidad de una solución extracelular de mover agua hacia adentro o afuera de una célula." },
      { titulo: "Presión Osmótica", desc: "Presión necesaria para detener el flujo de solvente a través de la membrana." }
    ]
  },
  "biologia-3": {
    titulo: "Síntesis de Proteínas", mision: "Transcribe el ADN y ensambla el polipéptido en el ribosoma", ecuacion: "ADN → ARN → Proteína", formulaGfx: "Codón = 3 Nucleótidos",
    pasos: [
      { id: 1, text: "Transcribe el gen objetivo (ADN) a ARNm en el núcleo.", icon: "file-text" },
      { id: 2, text: "Observa el viaje del ARNm hacia el citoplasma.", icon: "wind" },
      { id: 3, text: "Acopla los ARNt al ribosoma siguiendo los codones.", icon: "hash" },
      { id: 4, text: "Completa la cadena de aminoácidos hasta el codón STOP.", icon: "check-square" }
    ],
    guiaMaestro: {
      objetivo: "Dominar el Dogma Central de la Biología Molecular y las reglas de apareamiento.",
      friccion: "Sustitución de Uracilo: El alumno debe entender que la Timina no existe en el ARN.",
      puntosClave: ["AUG: Codón de inicio universal.", "Transcripción: Ocurre en el núcleo.", "Traducción: Ensamblaje en el ribosoma."]
    },
    conceptos: [
      { titulo: "Transcripción", desc: "Proceso de copiado de la información genética del ADN al ARNm." },
      { titulo: "Traducción", desc: "Conversión de la secuencia de nucleótidos del ARNm en aminoácidos." },
      { titulo: "Codón", desc: "Secuencia de tres nucleótidos que codifica un aminoácido específico." }
    ]
  },
  "biologia-4": {
    titulo: "Fotosíntesis", mision: "Encuentra la luz ideal para producir 50ml de Oxígeno", ecuacion: "6CO₂ + 6H₂O + Luz → C₆H₁₂O₆ + 6O₂", formulaGfx: "O₂ ∝ 1/d² · ColorEff",
    pasos: [
      { id: 1, text: "Ajusta la distancia de la lámpara sobre el riel.", icon: "move" },
      { id: 2, text: "Selecciona una longitud de onda (color) del espectro.", icon: "palette" },
      { id: 3, text: "Monitorea la tasa de burbujeo en el tubo de recolección.", icon: "droplets" },
      { id: 4, text: "Alcanza la meta de 50ml de O₂ antes del tiempo límite.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Visualizar el efecto de la intensidad y longitud de onda en la tasa metabólica vegetal.",
      friccion: "La Trampa Verde: Los alumnos suelen creer que la planta absorbe luz verde. Al ver que no produce O₂, descubrirán el papel de la clorofila.",
      puntosClave: ["Luz Roja/Azul: Máxima absorción.", "Distancia: La intensidad cae con el cuadrado de la distancia.", "Fotólisis: Ruptura de agua para liberar O₂."]
    },
    conceptos: [
      { titulo: "Clorofila", desc: "Pigmento primordial de las plantas que absorbe luz violeta, azul y roja." },
      { titulo: "Espectro de Absorción", desc: "Rango de longitudes de onda que un pigmento puede captar para realizar trabajo." },
      { titulo: "Fotólisis del Agua", desc: "Etapa de la fase clara donde se libera oxígeno como subproducto." }
    ]
  },
  "biologia-5": {
    titulo: "Leyes de Mendel", mision: "Valida la proporción 9:3:3:1 de Mendel con una población masiva", ecuacion: "P(AB) = P(A) \cdot P(B)", formulaGfx: "9 : 3 : 3 : 1",
    pasos: [
      { id: 1, text: "Configura el genotipo de los parentales (padre y madre).", icon: "dna" },
      { id: 2, text: "Analiza el Cuadro de Punnett para predecir las probabilidades.", icon: "grid" },
      { id: 3, text: "Define el tamaño de la muestra y genera la población F1.", icon: "users" },
      { id: 4, text: "Compara los fenotipos reales con los teóricos de Mendel.", icon: "bar-chart" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la segregación independiente de alelos mediante cruces dihíbridos.",
      friccion: "Probabilidad vs Estadística: En muestras pequeñas (N=10), las proporciones rara vez coinciden con el 9:3:3:1, enseñando la necesidad de grandes muestras.",
      puntosClave: ["Dominancia Completa: El alelo dominante enmascara al recesivo.", "Dihibridismo: Cruce de dos rasgos independientes.", "Distribución Independiente: 2da Ley de Mendel."]
    },
    conceptos: [
      { titulo: "Alelo", desc: "Cada una de las formas alternativas que puede tener un mismo gen." },
      { titulo: "Cuadro de Punnett", desc: "Diagrama diseñado por Reginald Punnett para determinar la probabilidad de genotipos." },
      { titulo: "Fenotipo", desc: "Expresión observable del genotipo en función de un ambiente determinado." }
    ]
  },
  "biologia-6": {
    titulo: "Selección Natural", mision: "Observa cómo el ambiente industrial desplaza las frecuencias fenotípicas", ecuacion: "f(A) + f(a) = 1", formulaGfx: "\Delta p = p' - p",
    pasos: [
      { id: 1, text: "Selecciona el ambiente (Bosque Limpio o Industrial).", icon: "tree" },
      { id: 2, text: "Inicia la temporada de caza y actúa como el depredador.", icon: "target" },
      { id: 3, text: "Observa la supervivencia diferencial basada en el camuflaje.", icon: "eye" },
      { id: 4, text: "Analiza la gráfica evolutiva tras completar 5 generaciones.", icon: "line-chart" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la selección natural mediante el mimetismo industrial.",
      friccion: "Intervención Directa: Si el alumno no caza, la población se estabiliza. Debe experimentar cómo su rol de depredador es el motor del cambio.",
      puntosClave: ["Presión Selectiva: El agente (ave) que elimina individuos.", "Adaptación: Ventaja reproductiva según el entorno.", "Melanismo Industrial: El caso de la polilla Biston betularia."]
    },
    conceptos: [
      { titulo: "Selección Natural", desc: "Proceso por el cual los organismos mejor adaptados sobreviven y se reproducen." },
      { titulo: "Camuflaje", desc: "Capacidad de un organismo para pasar inadvertido en su entorno." },
      { titulo: "Frecuencia Alélica", desc: "Proporción de un alelo específico en el conjunto de genes de una población." }
    ]
  },
  "biologia-7": {
    titulo: "Sistema Nervioso", mision: "Rastrea el arco reflejo rotuliano y evalúa la conducción nerviosa", ecuacion: "v = Δx / Δt", formulaGfx: "Integridad Mielina (%)",
    pasos: [
      { id: 1, text: "Ajusta la integridad de la vaina de mielina al 100% para un estado sano.", icon: "zap" },
      { id: 2, text: "Configura la fuerza del martillo y aplica el estímulo en el tendón.", icon: "hammer" },
      { id: 3, text: "Observa la propagación del potencial de acción hacia la médula.", icon: "activity" },
      { id: 4, text: "Valida si el reflejo ocurre dentro del rango normal (< 30ms).", icon: "check-circle" }
    ],
    guiaMaestro: {
      objetivo: "Analizar el arco reflejo como respuesta involuntaria y el papel de la mielina en la velocidad nerviosa.",
      friccion: "Ley del Todo o Nada: Si el golpe es < 20%, no hay respuesta. Desmielinización: A < 50% de mielina, el retraso visual debe ser evidente para el alumno.",
      puntosClave: ["Transmisión Saltatoria: Función de la vaina de mielina.", "Arco Reflejo: Vía sensorial, interneurona (médula) y vía motora.", "Sinapsis: Comunicación química/eléctrica en el asta gris."]
    },
    conceptos: [
      { titulo: "Mielina", desc: "Capa aislante que permite que los impulsos se transmitan de manera rápida y eficiente." },
      { titulo: "Potencial de Acción", desc: "Onda de descarga eléctrica que viaja a lo largo de la membrana celular de la neurona." },
      { titulo: "Arco Reflejo", desc: "Ruta neuronal que controla un reflejo; la mayoría no pasan directamente al cerebro." }
    ]
  },
  "biologia-8": {
    titulo: "Electrocardiograma", mision: "Monitorea la actividad eléctrica del corazón y realiza una prueba de esfuerzo", ecuacion: "T = 60 / BPM", formulaGfx: "P-QRS-T Sync",
    pasos: [
      { id: 1, text: "Identifica el objetivo de BPM para la prueba de esfuerzo del paciente.", icon: "target" },
      { id: 2, text: "Ajusta el nivel de actividad o estrés para modular el ritmo cardíaco.", icon: "activity" },
      { id: 3, text: "Observa la sincronía entre el impulso eléctrico y la contracción mecánica.", icon: "heart" },
      { id: 4, text: "Registra la prueba cuando el ritmo coincida exactamente con el objetivo.", icon: "check-circle" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la relación entre la actividad eléctrica del corazón y su función mecánica.",
      friccion: "Taquicardia Extrema: A 180 BPM, el alumno debe notar que la diástole se acorta, comprometiendo el llenado ventricular, lo que explica la fatiga.",
      puntosClave: ["Ciclo Cardíaco: Sístole (contracción) y Diástole (relajación).", "ECG: Representación gráfica de los potenciales eléctricos del corazón.", "Sistema de Conducción: Nodos SA y AV, y fibras de Purkinje."]
    },
    conceptos: [
      { titulo: "Frecuencia Cardíaca", desc: "Número de veces que el corazón se contrae por unidad de tiempo; se mide en BPM." },
      { titulo: "Onda PQRST", desc: "Conjunto de deflexiones que representan la despolarización y repolarización cardíaca." },
      { titulo: "Débito Cardíaco", desc: "Volumen de sangre expulsado por el corazón en un minuto." }
    ]
  },
  "biologia-9": {
    titulo: "Sistema Digestivo", mision: "Cataliza macronutrientes mediante enzimas y optimización de pH", ecuacion: "Enzima + Sustrato", formulaGfx: "pH Óptimo",
    pasos: [
      { id: 1, text: "Analiza el macronutriente ingerido por el paciente en la bitácora.", icon: "target" },
      { id: 2, text: "Selecciona la enzima catalizadora específica (Llave-Cerradura).", icon: "zap" },
      { id: 3, text: "Ajusta el pH del órgano según el rango óptimo de la enzima.", icon: "thermometer" },
      { id: 4, text: "Inyecta la enzima y monitorea la absorción en el torrente sanguíneo.", icon: "activity" }
    ],
    guiaMaestro: {
      objetivo: "Visualizar el proceso de hidrólisis enzimática y la dependencia del pH en la digestión.",
      friccion: "Desnaturalización: Si el alumno inyecta pepsina a pH 7, esta se deformará. Aprenderá por qué el estómago DEBE ser ácido para digerir proteínas.",
      puntosClave: ["Catálisis: Aceleración de reacciones químicas por enzimas.", "Especificidad: Cada enzima actúa sobre un sustrato único.", "Microvellosidades: Aumento de superficie para absorción de monómeros."]
    },
    conceptos: [
      { titulo: "Enzima", desc: "Proteína que actúa como catalizador biológico, aumentando la velocidad de una reacción." },
      { titulo: "Hidrólisis", desc: "Reacción química en la que una molécula de agua rompe uno o más enlaces químicos." },
      { titulo: "Macronutriente", desc: "Sustancia necesaria en grandes cantidades (Carbohidratos, Proteínas, Lípidos)." }
    ]
  },
  "biologia-10": {
    titulo: "Dinámica de Poblaciones", mision: "Equilibra el ecosistema mediante el modelo Lotka-Volterra", ecuacion: "dx/dt = αx - βxy", formulaGfx: "Oscilación Armónica",
    pasos: [
      { id: 1, text: "Inicia la simulación para observar el desequilibrio inicial del ecosistema.", icon: "play" },
      { id: 2, text: "Ajusta la tasa de natalidad de las presas para evitar su colapso.", icon: "activity" },
      { id: 3, text: "Modula la eficacia de caza de los depredadores para prevenir la sobrepoblación.", icon: "zap" },
      { id: 4, text: "Estabiliza las oscilaciones y sobrevive 50 años virtuales sin extinciones.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la interdependencia de las especies y el caos determinista en ecología.",
      friccion: "Exceso de Protección: Si el alumno elimina a los depredadores, las presas crecen hasta agotar los recursos, demostrando que la depredación es necesaria para el equilibrio.",
      puntosClave: ["Modelo Lotka-Volterra: Ecuaciones diferenciales de interacción.", "Resiliencia: Capacidad del ecosistema para volver al equilibrio.", "Diagrama de Fase: Representación de ciclos cerrados en el espacio de estados."]
    },
    conceptos: [
      { titulo: "Capacidad de Carga", desc: "Población máxima que un entorno puede sustentar indefinidamente." },
      { titulo: "Depredación", desc: "Interacción biológica donde un individuo caza a otro para subsistir." },
      { titulo: "Caos Determinista", desc: "Sistemas sensibles a condiciones iniciales que siguen leyes matemáticas precisas." }
    ]
  }
} as const;

export type SimuladorId = keyof typeof MASTER_DATA;
