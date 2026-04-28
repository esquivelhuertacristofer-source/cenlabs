# 🎨 GAME DESIGN DOCUMENT (GDD) - LAS 10 PRÁCTICAS DEFINITIVAS
**CEN Laboratorios - Espina Dorsal Técnica y Didáctica**

Este documento contiene la lógica, objetivos y detalles técnicos de las 10 simulaciones principales de la plataforma.

---

## PRÁCTICA #1: Construcción Atómica e Isótopos
- **Módulo:** 1 - Fundamentos
- **Duración estimada:** 30 min
- **OBJETIVO PEDAGÓGICO:** Comprender la relación entre protones, neutrones y electrones para formar isótopos estables, determinando masa atómica y carga neta.
- **FRICCIÓN DIDÁCTICA:** El alumno no puede simplemente armar el átomo al azar. Se le asigna un isótopo objetivo (ej. Carbono-14 neutro) y debe arrastrar las partículas exactas. Un medidor de "Inestabilidad" vibra y bloquea el avance si la relación neutrón/protón excede límites físicos reales.
- **LÓGICA DE CÁLCULO (Backend):**
    - Aleatoriedad: El sistema selecciona un elemento $Z \le 20$ como objetivo en cada sesión.
    - $A = \text{protones} + \text{neutrones}$
    - $\text{Carga} = \text{protones} - \text{electrones}$
    - Validación de estabilidad basada en banda de estabilidad isotópica pre-cargada (JSON).
- **INTERACCIÓN UI (Step by step):**
    1. Panel lateral muestra el objetivo: "Construye ${}^{14}\text{C}$ con carga $0$".
    2. Alumno arrastra partículas (drag & drop) hacia zonas concéntricas (núcleo y orbitales).
    3. Contadores digitales en pantalla se actualizan (Z, A, Carga).
    4. Si la carga no es 0, los electrones se repelen visualmente.
    5. Botón "Validar Estructura" se activa solo si los cálculos coinciden con el objetivo.
- **ASSETS VISUALES NECESARIOS:**
    - Esferas 3D con glow (Protones rojo, Neutrones azul, Electrones amarillo) (PNG transparente).
    - Órbitas circulares (SVG vectoriales punteados).
    - Panel de tabla periódica dinámica que resalta el elemento actual.
- **DIFICULTAD DE ARTE:** 2/5
- **DIFICULTAD TÉCNICA:** 3/5
- **NOTAS:** Usar `framer-motion` para que el núcleo tenga un "floating animation" constante.

---

## PRÁCTICA #2: Leyes de los Gases (Cámara de Presión)
- **Módulo:** 1 - Fundamentos
- **Duración estimada:** 40 min
- **OBJETIVO PEDAGÓGICO:** Demostrar las leyes de Boyle y Charles analizando la relación inversa/directa entre Presión, Volumen y Temperatura.
- **FRICCIÓN DIDÁCTICA:** El alumno debe alcanzar una presión objetivo $X$ alterando volumen y temperatura, pero si la presión interna supera un límite crítico, la cámara "estalla" (animación de fallo) y debe reiniciar.
- **LÓGICA DE CÁLCULO (Backend):**
    - Ecuación: $\frac{P_1 V_1}{T_1} = \frac{P_2 V_2}{T_2}$
    - Semilla: Temperatura inicial y Volumen inicial son aleatorios. Presión objetivo es calculada para que sea alcanzable.
- **INTERACCIÓN UI (Step by step):**
    1. Alumno revisa la presión objetivo en la bitácora.
    2. Mueve el slider vertical del émbolo (baja Volumen, sube Presión matemática).
    3. Mueve slider horizontal del mechero (sube Temperatura, sube Presión matemática).
    4. El manómetro (aguja) gira en tiempo real.
    5. Partículas del gas se mueven más rápido usando CSS animation-duration ligado al estado de Temperatura.
- **ASSETS VISUALES NECESARIOS:**
    - Cilindro de vidrio transparente con medidas (SVG).
    - Émbolo metálico (Render 3D estático, se recorta/oculta con overflow-hidden al bajar).
    - Mechero Bunsen con flama (Lottie para la animación de la llama variando intensidad).
    - Manómetro con aguja dinámica (SVG, la aguja rota con transform: rotate()).
- **DIFICULTAD DE ARTE:** 3/5
- **DIFICULTAD TÉCNICA:** 3/5

---

## PRÁCTICA #3: Balanceo de Ecuaciones (Balanza Estequiométrica)
- **Módulo:** 2 - Estequiometría
- **Duración estimada:** 35 min
- **OBJETIVO PEDAGÓGICO:** Aplicar la ley de la conservación de la masa ajustando coeficientes estequiométricos.
- **FRICCIÓN DIDÁCTICA:** No hay feedback instantáneo de "número correcto". El alumno debe visualizar la balanza física que solo se equilibra cuando reactivos y productos pesan exactamente lo mismo atómicamente.
- **LÓGICA DE CÁLCULO (Backend):**
    - Algoritmo de validación matricial: Suma atómica total Reactivos = Suma atómica total Productos.
- **INTERACCIÓN UI (Step by step):**
    1. Pantalla muestra ecuación desbalanceada.
    2. Alumno usa botones + / - debajo de cada molécula para alterar el coeficiente.
    3. Arriba de la ecuación, una "balanza de platillos" SVG se inclina (rotate) dependiendo de la diferencia de masas molares en tiempo real.
    4. Al equilibrarse la balanza a 0 grados, aparece un checkmark y avanza al nivel 2.
- **ASSETS VISUALES NECESARIOS:**
    - Balanza de platillos analógica (Render 3D en capas separadas: base, brazo, platillos).
    - Tipografía clara (Outfit) para renderizar fórmulas matemáticas complejas con subíndices.
- **DIFICULTAD DE ARTE:** 2/5
- **DIFICULTAD TÉCNICA:** 4/5 (El algoritmo para parsear strings químicos ej. "H2SO4" y contar átomos dinámicamente es complejo).

---

## PRÁCTICA #4: Reactivo Limitante
- **Módulo:** 2 - Estequiometría
- **Duración estimada:** 45 min
- **OBJETIVO PEDAGÓGICO:** Identificar el reactivo que se consume primero en una reacción y calcular el exceso sobrante.
- **FRICCIÓN DIDÁCTICA:** Antes de encender la "fábrica", el alumno DEBE calcular en su bitácora digital los moles y predecir el reactivo limitante. Si predice mal, la máquina desperdicia material y reprueba el intento.
- **LÓGICA DE CÁLCULO (Backend):**
    - Semilla: Se generan gramos aleatorios de dos reactivos.
    - Fórmulas: $n = \frac{m}{PM}$ seguido de la relación molar estequiométrica de la ecuación pre-cargada.
- **INTERACCIÓN UI (Step by step):**
    1. Alumno lee gramos iniciales de las dos tolvas.
    2. Abre bitácora, ingresa cálculo de reactivo limitante.
    3. Presiona botón "Iniciar Síntesis".
    4. CSS animations hacen caer pequeñas esferas al matraz central.
    5. El reactivo en exceso queda flotando en pantalla (moléculas huérfanas) usando CSS keyframes.
- **ASSETS VISUALES NECESARIOS:**
    - Dos tolvas metálicas con válvulas (SVG).
    - Matraz central reactor.
    - Partículas pequeñas de colores (simples div con border-radius: 50% y CSS animation).
- **DIFICULTAD DE ARTE:** 2/5
- **DIFICULTAD TÉCNICA:** 3/5

---

## PRÁCTICA #5: Preparación de Soluciones Molares
- **Módulo:** 2 - Estequiometría
- **Duración estimada:** 45 min
- **OBJETIVO PEDAGÓGICO:** Aprender la técnica analítica de preparación y el cálculo exacto de Molaridad.
- **FRICCIÓN DIDÁCTICA:** El rigor físico virtual. Pesar el soluto descontando la tara del vidrio de reloj y detener la llave de agua a milisegundos del aforo. Si se sobrepasa la marca del matraz, se arruina la concentración.
- **LÓGICA DE CÁLCULO (Backend):**
    - Semilla: Preparar solución objetivo de $X$ Molaridad en $Y$ volumen de aforo.
    - Fórmulas: $M = \frac{n}{V}$. Tolerancia estricta de llenado $\pm 1.5\%$.
- **INTERACCIÓN UI (Step by step):**
    1. Pantalla: Balanza digital y espátula. Alumno pesa el polvo objetivo (clics en espátula).
    2. Arrastra vidrio de reloj al matraz aforado.
    3. Presiona y mantiene clic en el botón "Piseta de agua".
    4. Un div azul (agua) crece de abajo hacia arriba en el matraz (height: X%).
    5. Suelta el clic. Si el div azul sobrepasa la línea punteada del aforo, falla.
- **ASSETS VISUALES NECESARIOS:**
    - Balanza digital analítica con display LED dinámico (SVG/PNG).
    - Matraz aforado de cuello largo (SVG).
    - Líquido de llenado (div con máscara para respetar la forma del matraz).
- **DIFICULTAD DE ARTE:** 3/5
- **DIFICULTAD TÉCNICA:** 3/5

---

## PRÁCTICA #6: Curvas de Solubilidad y Cristalización
- **Módulo:** 2 - Estequiometría
- **Duración estimada:** 35 min
- **OBJETIVO PEDAGÓGICO:** Comprender la saturación dependiente de la temperatura y el principio de cristalización fraccionada.
- **FRICCIÓN DIDÁCTICA:** El alumno tiene que calentar hasta sobresaturar, pero debe controlar el enfriamiento en baño de hielo sin que la temperatura baje del punto de precipitación objetivo.
- **LÓGICA DE CÁLCULO (Backend):**
    - Curva matemática interpolada (ej. solubilidad del $KNO_3$). El estado evalúa si $m_{\text{sal}} > \text{Solubilidad}(T)$.
- **INTERACCIÓN UI (Step by step):**
    1. Alumno deposita exceso de sal en el vaso. (Se ven montículos en el fondo).
    2. Enciende la parrilla. A medida que la Temperatura sube, el opacity de los montículos de sal baja a 0 (se disuelve).
    3. Pasa el vaso a la cubeta de hielo.
    4. Al alcanzar la temperatura de saturación, divs blancos (.crystal) hacen spawn en el fondo con animación scale-up de CSS.
- **ASSETS VISUALES NECESARIOS:**
    - Vaso de precipitados en parrilla y en baño de hielo (Renders 3D).
    - Cristales: Elementos SVG geométricos pequeños.
- **DIFICULTAD DE ARTE:** 4/5
- **DIFICULTAD TÉCNICA:** 3/5

---

## PRÁCTICA #7: Titulación Ácido-Base
- **Módulo:** 3 - Reacciones y Fisicoquímica
- **Duración estimada:** 50 min
- **OBJETIVO PEDAGÓGICO:** Determinar la concentración desconocida de un ácido mediante titulación con base conocida.
- **FRICCIÓN DIDÁCTICA:** El alumno debe purgar la bureta, leer el menisco correctamente, predecir el punto de equivalencia en su bitácora, y titular gota a gota hasta el cambio de color exacto.
- **LÓGICA DE CÁLCULO (Backend):**
    - Fórmula: $C_a V_a = C_b V_b$
    - Curva de pH: cálculo iterativo por gota añadida.
    - Tolerancia de indicador: $\pm 3$ gotas antes de marcar error.
- **INTERACCIÓN UI (Step by step):**
    1. Alumno arrastra/clic en "Purgar bureta" → burbujas salen.
    2. Alumno selecciona indicador (fenolftaleína).
    3. Panel de bitácora: Alumno anota cálculos y volúmenes base.
    4. Alumno gira válvula para añadir base (animación CSS de gotas continuas).
    5. Cada gota = el pH de React sube y se grafica.
    6. Cerca del punto de equivalencia, transiciones CSS de transparente a rosa tenue.
- **ASSETS VISUALES NECESARIOS:**
    - Bureta, soporte, matraz (Render/SVG).
    - Gráfica de pH vs Volumen (Recharts, actualización en vivo).
    - Gotas (CSS animation).
- **DIFICULTAD DE ARTE:** 3/5
- **DIFICULTAD TÉCNICA:** 4/5

---

## PRÁCTICA #8: Equilibrio Químico (Le Châtelier)
- **Módulo:** 3 - Reacciones y Fisicoquímica
- **Duración estimada:** 35 min
- **OBJETIVO PEDAGÓGICO:** Observar cómo los cambios de temperatura desplazan el equilibrio de una reacción endotérmica/exotérmica.
- **FRICCIÓN DIDÁCTICA:** Documentar el desplazamiento visual del gas y relacionarlo con su entalpía en la bitácora sin equivocarse en la teoría de "hacia reactivos" o "hacia productos".
- **LÓGICA DE CÁLCULO (Backend):**
    - Reglas booleanas simples. Si $T$ sube y $\Delta H > 0$, desplaza a productos (color oscuro). Si $T$ baja, desplaza a reactivos (incoloro).
- **INTERACCIÓN UI (Step by step):**
    1. Pantalla: Dos baños térmicos (100°C y 0°C) y tres jeringas selladas con gas $\text{NO}_2/\text{N}_2\text{O}_4$ (café medio).
    2. Alumno arrastra la jeringa 1 al agua hirviendo. El color del interior se transiciona a café oscuro/rojizo.
    3. Arrastra la jeringa 2 al hielo. Se transiciona a amarillo muy pálido.
- **ASSETS VISUALES NECESARIOS:**
    - Baños de agua humeante/con hielo (SVG/Render).
    - Jeringa de cristal sellada con máscara (clip-path).
- **DIFICULTAD DE ARTE:** 4/5
- **DIFICULTAD TÉCNICA:** 2/5

---

## PRÁCTICA #9: Electroquímica (Celdas Galvánicas)
- **Módulo:** 3 - Reacciones y Fisicoquímica
- **Duración estimada:** 45 min
- **OBJETIVO PEDAGÓGICO:** Construir una pila funcional identificando ánodo, cátodo y flujo de electrones, calculando el potencial de celda.
- **FRICCIÓN DIDÁCTICA:** El alumno tiene piezas sueltas. Si no conecta el puente salino o invierte los metales, el circuito no funciona o da voltaje negativo.
- **LÓGICA DE CÁLCULO (Backend):**
    - Diccionario de potenciales estándar ($E^\circ_{\text{celda}}$).
    - Fórmula: $E^\circ_{\text{celda}} = E^\circ_{\text{cátodo}} - E^\circ_{\text{ánodo}}$.
- **INTERACCIÓN UI (Step by step):**
    1. Alumno arrastra placas metálicas a sus vasos.
    2. Arrastra puente salino.
    3. Conecta cables (UI dibuja una línea SVG).
    4. El voltímetro se enciende. Si todo es correcto, marca ej. +1.10 V.
    5. CSS animation activa los "electrones" recorriendo el path del cable.
- **ASSETS VISUALES NECESARIOS:**
    - Placas de Zinc/Cobre, Vasos de precipitados, Voltímetro digital (Renders 3D).
    - Cables dibujados con `<path>` y electrones `<circle>` con `animateMotion`.
- **DIFICULTAD DE ARTE:** 3/5
- **DIFICULTAD TÉCNICA:** 3/5

---

## PRÁCTICA #10: Destilación Fraccionada
- **Módulo:** 3 - Reacciones y Fisicoquímica
- **Duración estimada:** 40 min
- **OBJETIVO PEDAGÓGICO:** Separar mezclas homogéneas basándose en sus diferentes puntos de ebullición.
- **FRICCIÓN DIDÁCTICA:** Precisión motriz y paciencia. Si el alumno gira la perilla del manto térmico demasiado rápido, ambos líquidos hierven y la mezcla resulta impura.
- **LÓGICA DE CÁLCULO (Backend):**
    - Dos variables fijas: $PE_1$ (Etanol 78°C) y $PE_2$ (Agua 100°C).
    - Estado de calor actual ($Q$) aumenta según la rotación del input del usuario.
- **INTERACCIÓN UI (Step by step):**
    1. Alumno observa el termómetro.
    2. Gira la perilla (dial circular). El termómetro sube.
    3. Al llegar a 78°C, se activa animación CSS `.bubble` en el matraz principal.
    4. Animación de vapor sube por el refrigerante.
    5. Gotas de líquido caen en el matraz colector.
    6. Alerta de "Destilado Contaminado" si sobrepasa los 85°C antes de tiempo.
- **ASSETS VISUALES NECESARIOS:**
    - Equipo de destilación completo montado (Render 3D full bleed o SVG complejo).
    - Burbujas y vapor (Animación CSS).
    - Mando giratorio interactivo.
- **DIFICULTAD DE ARTE:** 4/5
- **DIFICULTAD TÉCNICA:** 5/5
