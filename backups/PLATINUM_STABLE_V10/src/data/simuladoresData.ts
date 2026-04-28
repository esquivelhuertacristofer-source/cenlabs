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
}

export const MASTER_DATA: Record<string, SimuladorContenido> = {
  "quimica-1": {
    titulo: "Construcción Atómica", 
    tituloEn: "Atomic Construction",
    mision: "Forja un átomo de Carbono-14 (Isótopo)", 
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
    tituloEn: "Gas Laws",
    mision: "Estudio de Presión vs Temperatura (Ley de Gay-Lussac)", 
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
    titulo: "Balanceo Estequiométrico", mision: "Equilibra la masa de la reacción química", ecuacion: "Ley de Conservación", formulaGfx: "Reactivos = Productos",
    pasos: [
      { id: 1, text: "Identifica los elementos presentes en ambos lados.", icon: "microscope" },
      { id: 2, text: "Ajusta coeficientes hasta igualar los átomos.", icon: "zap" },
      { id: 3, text: "Verifica que la balanza de masa esté nivelada.", icon: "scale" },
      { id: 4, text: "Presiona Validar para confirmar el balance.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Aplicar la Ley de Lavoisier.",
      friccion: "El error común es cambiar los subíndices de las moléculas.",
      puntosClave: ["Masa Molar: Suma de masas atómicas.", "Balanza Física: Evidencia visual.", "Coeficientes: Cantidades relativas."]
    },
    conceptos: [
      { titulo: "Coeficiente", desc: "Número entero que indica la proporción molar." },
      { titulo: "Reactivo", desc: "Sustancia inicial que se consume." },
      { titulo: "Producto", desc: "Sustancia final resultante." }
    ]
  },
  "quimica-4": {
    titulo: "Reactivo Limitante", mision: "Calibra la síntesis de Haber (Amoníaco)", ecuacion: "N2 + 3H2 → 2NH3", formulaGfx: "Exceso = m - (nL * ratio * PM)",
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
    titulo: "Preparación de Soluciones", mision: "Prepara una solución de NaCl de alta precisión", ecuacion: "M = n / V (L)", formulaGfx: "n = m / PM",
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
    titulo: "Solubilidad y Cristalización", mision: "Provoca una precipitación por choque térmico", ecuacion: "S(T) = f(T²)", formulaGfx: "KNO3 Cristalización",
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
    titulo: "Titulación Ácido-Base", mision: "Determina la concentración exacta de HCl", ecuacion: "Ca · Va = Cb · Vb", formulaGfx: "NaOH 0.1 M (Base)",
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
    titulo: "Equilibrio Químico", mision: "Observa el efecto de la temperatura en el NO2", ecuacion: "N2O4 + Calor ⇌ 2NO2", formulaGfx: "Le Châtelier",
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
    titulo: "Celdas Galvánicas", mision: "Ensambla una pila funcional con voltaje positivo", ecuacion: "E°celda = E°cat - E°anod", formulaGfx: "Redox: e- Flow",
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
    titulo: "Destilación Fraccionada", mision: "Recupera 50 mL de Etanol puro (Pureza > 98%)", ecuacion: "ΔT = Teb(B) - Teb(A)", formulaGfx: "Etanol vs Agua",
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
    titulo: "Tiro Parabólico", mision: "Alcanza el objetivo ajustando ángulo y velocidad", ecuacion: "y = x·tan(θ) - (g·x²) / (2·v₀²·cos²θ)", formulaGfx: "V₀x = V₀·cos(θ)",
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
    titulo: "Leyes de Newton", mision: "Calcula la aceleración en un plano inclinado", ecuacion: "F = m·a", formulaGfx: "a = g(sinθ - μ·cosθ)",
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
    titulo: "Péndulo Simple", mision: "Determina la gravedad local", ecuacion: "T = 2π·√(L/g)", formulaGfx: "g = 4π²L / T²",
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
    titulo: "Ley de Hooke", mision: "Determina la constante elástica del resorte", ecuacion: "F = -k·x", formulaGfx: "Ep = ½·k·x²",
    pasos: [
      { id: 1, text: "Cuelga una masa de 500g en el resorte.", icon: "box" },
      { id: 2, text: "Mide el estiramiento (x) desde la posición de equilibrio.", icon: "target" },
      { id: 3, text: "Grafica Fuerza vs Elongación.", icon: "activity" },
      { id: 4, text: "Calcula la pendiente (k) de la recta resultante.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Comprobar la proporcionalidad entre fuerza y deformación elástica.",
      friccion: "Sobrepasar el límite elástico deforma permanentemente el resorte.",
      puntosClave: ["Constante k: Rigidez del resorte.", "Límite Elástico: Punto de no retorno.", "Oscilación: Movimiento alrededor del equilibrio."]
    },
    conceptos: [
      { titulo: "Constante Elástica", desc: "Rigidez intrínseca del material." },
      { titulo: "Elongación", desc: "Cambio de longitud respecto al reposo." },
      { titulo: "Energía Potencial Elástica", desc: "Energía almacenada por la deformación." }
    ]
  },
  "fisica-5": {
    titulo: "Colisiones en 1D", mision: "Verifica la conservación del momento lineal", ecuacion: "Σp_init = Σp_final", formulaGfx: "m₁v₁ + m₂v₂ = ...",
    pasos: [
      { id: 1, text: "Configura las masas de los dos carritos.", icon: "box" },
      { id: 2, text: "Define una colisión perfectamente inelástica.", icon: "zap" },
      { id: 3, text: "Lanza el carrito A hacia el carrito B en reposo.", icon: "play" },
      { id: 4, text: "Mide la velocidad final conjunta del sistema.", icon: "timer" }
    ],
    guiaMaestro: {
      objetivo: "Analizar el intercambio de momento y energía en choques.",
      friccion: "Confusión entre conservación de Momento (siempre) y Energía (solo elásticos).",
      puntosClave: ["Choque Elástico: Conserva Ec.", "Choque Inelástico: Los cuerpos se pegan.", "Vectorial: Cuidado con los signos de velocidad."]
    },
    conceptos: [
      { titulo: "Momento Lineal (p)", desc: "Producto de la masa por la velocidad." },
      { titulo: "Coeficiente de Restitución", desc: "Medida de la 'elasticidad' del choque." },
      { titulo: "Impulso", desc: "Cambio en el momento lineal de un cuerpo." }
    ]
  },
  "fisica-6": {
    titulo: "Principio de Arquímedes", mision: "Calcula la densidad de un sólido desconocido", ecuacion: "E = ρ_fluido · g · V_sub", formulaGfx: "P_aparente = P_real - E",
    pasos: [
      { id: 1, text: "Pesa el objeto en el aire usando el dinamómetro.", icon: "scale" },
      { id: 2, text: "Sumerge el objeto completamente en agua.", icon: "droplets" },
      { id: 3, text: "Registra el nuevo peso aparente.", icon: "activity" },
      { id: 4, text: "Calcula el volumen desplazado por la diferencia de peso.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la fuerza de empuje como el peso del fluido desalojado.",
      friccion: "El alumno cree que el empuje depende del peso del objeto, no de su volumen.",
      puntosClave: ["Empuje: Fuerza ascendente vertical.", "Flotabilidad: Condición si E > Peso.", "Densidad: Relación masa/volumen."]
    },
    conceptos: [
      { titulo: "Fuerza de Empuje", desc: "Fuerza neta ascendente sobre un cuerpo sumergido." },
      { titulo: "Densidad", desc: "Propiedad intensiva de la materia." },
      { titulo: "Peso Aparente", desc: "Lectura del dinamómetro dentro del fluido." }
    ]
  },
  "fisica-7": {
    titulo: "Dilatación Térmica", mision: "Mide el coeficiente de expansión lineal (α)", ecuacion: "ΔL = L₀ · α · ΔT", formulaGfx: "α = ΔL / (L₀·ΔT)",
    pasos: [
      { id: 1, text: "Mide la longitud inicial de la barra de Aluminio.", icon: "target" },
      { id: 2, text: "Registra la temperatura ambiente inicial.", icon: "thermometer" },
      { id: 3, text: "Inyecta vapor para subir la temperatura a 100°C.", icon: "flame" },
      { id: 4, text: "Mide la elongación milimétrica con el micrómetro.", icon: "activity" }
    ],
    guiaMaestro: {
      objetivo: "Observar el efecto microscópico del calor en la red cristalina.",
      friccion: "La dilatación es muy pequeña (micras), requiere medición de precisión.",
      puntosClave: ["Expansión: Aumento de vibración atómica.", "Lineal vs Volumétrica: Dependencia dimensional.", "Materiales: Diferentes α para Cu, Al, Fe."]
    },
    conceptos: [
      { titulo: "Coeficiente de Dilatación", desc: "Constante característica de cada material." },
      { titulo: "Equilibrio Térmico", desc: "Estado de igual temperatura entre cuerpos." },
      { titulo: "Termometría", desc: "Técnica de medición de calor sensible." }
    ]
  },
  "fisica-8": {
    titulo: "Ley de Ohm", mision: "Verifica la relación V = I·R", ecuacion: "V = I · R", formulaGfx: "P = V · I",
    pasos: [
      { id: 1, text: "Construye un circuito con una resistencia de 100Ω.", icon: "zap" },
      { id: 2, text: "Aumenta el voltaje de la fuente gradualmente.", icon: "activity" },
      { id: 3, text: "Mide la corriente (I) con el amperímetro en serie.", icon: "timer" },
      { id: 4, text: "Comprueba que la gráfica V vs I es lineal.", icon: "play" }
    ],
    guiaMaestro: {
      objetivo: "Analizar el comportamiento de elementos óhmicos.",
      friccion: "El alumno suele conectar el amperímetro en paralelo, quemando el fusible virtual.",
      puntosClave: ["Serie: I constante.", "Paralelo: V constante.", "Potencia: Disipación de calor por efecto Joule."]
    },
    conceptos: [
      { titulo: "Resistencia (Ω)", desc: "Oposición al flujo de corriente." },
      { titulo: "Corriente (A)", desc: "Flujo de carga eléctrica por segundo." },
      { titulo: "Voltaje (V)", desc: "Diferencia de potencial o fuerza electromotriz." }
    ]
  },
  "fisica-9": {
    titulo: "Electrostática", mision: "Calcula la fuerza entre cargas puntuales", ecuacion: "F = k · |q₁q₂| / r²", formulaGfx: "k ≈ 9 x 10⁹ N·m²/C²",
    pasos: [
      { id: 1, text: "Coloca la carga q1 (positiva) en el origen.", icon: "zap" },
      { id: 2, text: "Coloca la carga q2 a una distancia de 2 metros.", icon: "target" },
      { id: 3, text: "Observa los vectores de fuerza de atracción/repulsión.", icon: "activity" },
      { id: 4, text: "Calcula el valor de la fuerza neta en Newtons.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la Ley de Coulomb y la naturaleza de las fuerzas centrales.",
      friccion: "El crecimiento inverso con el cuadrado de la distancia (1/r²) es difícil de intuir.",
      puntosClave: ["Cargas iguales: Repelen.", "Cargas opuestas: Atraen.", "Distancia: El factor más influyente."]
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
    titulo: "Explorador de Cuadráticas", mision: "Ajusta los coeficientes para empatar la trayectoria objetivo", ecuacion: "f(x) = ax² + bx + c", formulaGfx: "Δ = b² - 4ac",
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
    titulo: "Escala Richter: Energía Sísmica", mision: "Calcula el factor de potencia entre sismos usando logaritmos", ecuacion: "E = 10^(1.5ΔM)", formulaGfx: "log₁₀(E₂/E₁) = 1.5(M₂ - M₁)",
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
    titulo: "Microscopio Virtual", mision: "Identifica orgánulos específicos en muestras celulares", ecuacion: "Resolución = 0.61λ / NA", formulaGfx: "Mag = Oc · Ob",
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
