# GDD BIOLOGÍA - CEN LABS
## Game Design Document - Prácticas de Biología

**Versión:** 1.0  
**Última actualización:** 2026-04-08  
**Autor:** CEN Labs

---

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Prácticas de Biología](#prácticas-de-biología)
3. [Mecánicas de Simulación](#mecánicas-de-simulación)
4. [UI/UX](#uiux)
5. [Audio](#audio)
6. [Anti-Cheat](#anti-cheat)

---

## Resumen Ejecutivo

Las prácticas de Biología de CEN LABS permiten a los estudiantes explorar procesos biológicos fundamentales mediante simulaciones interactivas de alta fidelidad visual. Cada práctica combina un piloto (simulación) con una bitácora educativa.

### Objetivos Pedagógicos
- Comprender procesos celulares y moleculares
- Visualizar fenómenos a nivel microscópico
- Relacionar estructura con función biológica
- Registrar observaciones y analizar datos

### Distribución de Tiempo
- **Bitácora (30%):** Teoría, instrucciones, cálculos, conclusiones
- **Piloto (70%):** Simulación interactiva

---

## Prácticas de Biología

---

### BIO-01: Microscopio Virtual

**Nombre:** Célula Animal y Vegetal  
**Dificultad:** ★★☆☆☆  
**Duración estimada:** 10 min

#### Descripción
El estudiante utiliza un microscopio virtual para observar células animales y vegetales, identificando orgánulos y sus funciones.

#### Mecánica Principal
- **Controles:**
  - Selector: Tipo de muestra (Animal/Vegetal)
  - Slider: Zoom (40x - 1000x)
  - Botón: Mover platina (arrastrar)
  - Botón: Enfoque fino
  - Selector: Tinte (Azul/Naranja/Sin tinte)
  - Hotspot clicks: Identificar orgánulos

#### Estado del Store
```typescript
microscopio1: {
  tipoMuestra: 'animal' | 'vegetal';
  zoomActual: number;
  posicionX: number;
  posicionY: number;
  enfoque: number;
  tinte: 'azul' | 'naranja' | 'ninguno';
  orgulosIdentificados: string[];
  orgulosTotales: string[];
}
```

#### Checkpoints
- [ ] CP1: Observar pared celular en célula vegetal
- [ ] CP2: Identificar cloroplastos
- [ ] CP3: Encontrar vacuola central grande
- [ ] CP4: Comparar con célula animal (sin pared, forma irregular)

#### Orgánulos por Tipo
```
Vegetal:  pared_celular, membrana, nucleo, cloroplasto, vacuola_grande, mitocondria
Animal:   membrana, nucleo, mitocondria, reticulo, vacuolas_chicas
```

---

### BIO-02: Transporte Celular

**Nombre:** Ósmosis y Tonicidad  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Célula en diferente tonicidad. Observar movimiento de agua y cambios de forma.

#### Mecánica Principal
- **Controles:**
  - Selector: Solución externa (Hipotónica/Hiperelónica/Isotónica)
  - Slider: Concentración (0% - 10%)
  - Botón: Iniciar simulación
  - Botón: Pausar
  - Display: Volumen celular, membrana

#### Estado del Store
```typescript
transporte2: {
  solucion: 'hipotonica' | 'hipertonica' | 'isotonica';
  concentracion: number;
  volumenCelula: number;
  aguaIntracelular: number;
  aguaExtracelular: number;
  tiempoSimulacion: number;
  estadoCelula: 'normal' | 'criada' | 'estallida';
  osmosisActiva: boolean;
}
```

#### Checkpoints
- [ ] CP1: En solución hipotónica → célula se hincha (lisis)
- [ ] CP2: En solución hipertónica → célula se encoge (crenación)
- [ ] CP3: En solución isotónica → sin cambio neto
- [ ] CP4: Calcular presión osmótica con π = iMRT

#### Física/Biología
```
Hipotónica:  [soluto]_ext < [soluto]_int  → agua entra
Hiperelónica: [soluto]_ext > [soluto]_int  → agua sale
Isotónica:   [soluto]_ext = [soluto]_int  → equilibrio

π = iMRT (Ley de Van't Hoff)
```

---

### BIO-03: Síntesis de Proteínas

**Nombre:** Dogma Central de la Biología  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Transcribir y traducir una secuencia de ADN a proteína. El estudiante assembla el ribosoma y observa traducción.

#### Mecánica Principal
- **Controles:**
  - Display: Hebra de ADN (secuencia)
  - Botón: Transcripción (ADN → ARNm)
  - Botón: Traducción (ARNm → Proteína)
  - Input: Codón a traducir
  - Tabla: Código genético interactivo
  - Visualización: Ribosoma animado

#### Estado del Store
```typescript
sintesis3: {
  secuenciaADN: string;
  secuenciaARNm: string;
  secuenciaProteina: string;
  codonActual: number;
  aminoacidos: string[];
  traduccionCompleta: boolean;
  erroresTraduccion: number;
}
```

#### Checkpoints
- [ ] CP1: Transcribir ADN a ARNm (reemplazar T por U)
- [ ] CP2: Identificar codón de inicio (AUG)
- [ ] CP3: Traducir secuencia hasta codón de parada
- [ ] CP4: Nombrar 3 aminoácitos de la secuencia

#### Código Genético
```
AUG = Metionina (inicio)
UUU = Fenilalanina
UUA = Leucina
GUU = Valina
UAA = STOP
UGA = STOP
UAG = STOP
```

---

### BIO-04: Fotosíntesis

**Nombre:** Producción de Oxígeno  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Planta en diferentes condiciones. Observar producción de O₂ y factores que afectan la fotosíntesis.

#### Mecánica Principal
- **Controles:**
  - Slider: Intensidad de luz (0% - 100%)
  - Slider: Concentración de CO₂ (0 - 1000 ppm)
  - Slider: Temperatura (5°C - 45°C)
  - Botón: Día/Noche
  - Display: Burbujas de O₂ producidas
  - Gráfico: Tasa de fotosíntesis vs factores

#### Estado del Store
```typescript
fotosintesis4: {
  intensidadLuz: number;
  concentracionCO2: number;
  temperatura: number;
  fase: 'dia' | 'noche';
  tasaFotosintesis: number;
  o2Producido: number;
  co2Consumido: number;
  aguaDisponible: boolean;
}
```

#### Checkpoints
- [ ] CP1: Sin luz no hay fotosíntesis (fase oscura only)
- [ ] CP2: Más luz = más fotosíntesis (hasta saturación)
- [ ] CP3: Optimal T = 25-35°C
- [ ] CP4: Ecuación: 6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂

#### Ecuación Global
```
6CO₂ + 6H₂O + energía_luminosa → C₆H₁₂O₆ + 6O₂

Luz: Fotones activan clorofila
H₂O: Fuente de electrones y O₂
CO₂: Carbono para glucosa
```

---

### BIO-05: Leyes de Mendel

**Nombre:** Genética Mendeliana  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Cruzar plantas de guisantes y observar proporciones de fenotipos en F1 y F2.

#### Mecánica Principal
- **Controles:**
  - Selector: Parental 1 (genotipo)
  - Selector: Parental 2 (genotipo)
  - Botón: Cruzar
  - Display: Cuadrado de Punnett
  - Resultado: Proporciones F1/F2
  - Selector: Característica (color/semilla/longitud)

#### Estado del Store
```typescript
genetica5: {
  parental1Genotipo: string;  // AA, Aa, aa
  parental2Genotipo: string;
  parental1Fenotipo: string;
  parental2Fenotipo: string;
  descendenciaF1: Array<{ genotipo: string; fenotipo: string }>;
  descendenciaF2: Array<{ genotipo: string; fenotipo: string }>;
  generacion: 'P' | 'F1' | 'F2';
  caracteristica: 'color' | 'semilla' | 'textura';
}
```

#### Checkpoints
- [ ] CP1: Cruzar AA × aa → todo Aa (100% dominante)
- [ ] CP2: Cruzar Aa × Aa → 3:1 fenotípico
- [ ] CP3: Cruzar Aa × aa → 1:1
- [ ] CP4: Verificar proporción 9:3:3:1 en dihybridismo

#### Genética Implementada
```
Leyes de Mendel:
1. Ley de Uniformidad: P×aa → 100% Aa
2. Ley de Segregación: Aa×Aa → 25% AA, 50% Aa, 25% aa
3. Ley de Herencia Independiente: genes separan

Dominancia:
- Color semilla: A=amarillo, a=verde
- Textura: B=liso, b=rugoso
```

---

### BIO-06: Selección Natural

**Nombre:** Polillas del Abedul  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Simulación de selección natural. Polillas claras/oscuras en ambiente con/sin hollín.

#### Mecánica Principal
- **Controles:**
  - Slider: Concentración de hollín (0% - 100%)
  - Selector: Ambiente visible/nocturno
  - Botón: Iniciar depredación
  - Display: Contador de sobrevivientes
  - Gráfico: Poblaciones vs tiempo
  - Toggle: Mostrar predadores

#### Estado del Store
```typescript
seleccion6: {
  hollin: number;              // 0-100%
  faseDia: 'dia' | 'noche';
  polillasClaras: number;
  polillasOscuras: number;
  generaciones: number;
  depredadoresActivos: boolean;
  historiaPoblacion: Array<{ gen: number; claras: number; oscuras: number }>;
  tasaSupervivenciaClaras: number;
  tasaSupervivenciaOscuras: number;
}
```

#### Checkpoints
- [ ] CP1: Sin hollín → más supervivientes claras (camuflaje)
- [ ] CP2: Con hollín → más supervivientes oscuras
- [ ] CP3: Graficar proporción clara/oscur→ adaptación
- [ ] CP4: Conectar con Darwin y Pepper Moth Study

#### Mecánica de Supervivencia
```
Con hollín bajo:
  clara_visible = 0.7 (fácil de ver)
  oscura_visible = 0.3 (difícil de ver)

Con hollín alto:
  clara_visible = 0.3 (difícil de ver)
  oscura_visible = 0.7 (fácil de ver)

Supervivencia ∝ 1 - visible_probability
```

---

### BIO-07: Sistema Nervioso

**Nombre:** Arco Reflejo  
**Dificultad:** ★★★★☆  
**Duración estimada:** 20 min

#### Descripción
Visualizar el arco reflejo. Desde receptor hasta efector. Tiempo de reacción.

#### Mecánica Principal
- **Controles:**
  - Botón: Estímulo (toque en mano)
  - Animación: Señal nerviosa viajando
  - Display: Tiempo de reacción
  - Selector: Vista (anatómica/esquemática)
  - Visualización: Neurona motora/sensorial

#### Estado del Store
```typescript
nervioso7: {
  estimuloAplicado: boolean;
  senalEnReceptor: boolean;
  senalEnMedula: boolean;
  senalEnEfector: boolean;
  tiempoReaccion: number;    // ms
  senalRecorrido: number;    // 0-100%
  reflejosCompletados: number;
}
```

#### Checkpoints
- [ ] CP1: Identificar receptor (piel)
- [ ] CP2: Identificar neurona sensorial
- [ ] CP3: Identificar interneurona (médula)
- [ ] CP4: Identificar neurona motora y efector (músculo)

#### Ruta del Arco Reflejo
```
Receptor (piel)
    ↓  (nervio sensorial)
Médula Espinal
    ↓  (interneurona)
    ↓  (nervio motor)
Efector (músculo)
```

---

### BIO-08: Electrocardiograma

**Nombre:** ECG Dinámico  
**Dificultad:** ★★★★☆  
**Duración estimada:** 20 min

#### Descripción
Monitor cardíaco interactivo. El estudiante observa y mide intervalos del ECG.

#### Mecánica Principal
- **Controles:**
  - Display: ECG en tiempo real
  - Slider: Ritmo cardíaco (60 - 120 BPM)
  - Selector: Patología (Normal/Taquicardia/Bradicardia/Fibrilación)
  - Botón: Pausar/Reanudar
  - Medición: Intervalos P-Q, QRS, Q-T

#### Estado del Store
```typescript
electrocardio8: {
  ritmo: number;              // BPM
  patologia: 'normal' | 'taquicardia' | 'bradicardia' | 'fibrilacion';
  intervaloPQ: number;       // ms
  intervaloQRS: number;      // ms
  intervaloQT: number;       // ms
  segmentoST: 'normal' | 'elevado' | 'deprimido';
  lecturasECG: Array<number>;
}
```

#### Checkpoints
- [ ] CP1: Identificar onda P (despolarización auricular)
- [ ] CP2: Identificar complejo QRS (despolarización ventricular)
- [ ] CP3: Medir intervalo RR (calcula FC)
- [ ] CP4: Detectar anomalía según selector

#### Valores Normales
```
Onda P: < 120 ms
Intervalo PR: 120-200 ms
Complejo QRS: 80-100 ms
Intervalo QT: < 440 ms (hombres), < 460 ms (mujeres)
FC normal: 60-100 BPM
```

---

### BIO-09: Sistema Digestivo

**Nombre:** Enzimas y pH  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Digestión de alimentos a través del sistema. Observar acción enzimática según pH.

#### Mecánica Principal
- **Controles:**
  - Selector: Alimento (Proteína/Carbohidratos/Grasa)
  - Slider: Posición en tracto (0% - 100%)
  - Display: pH actual
  - Display: Enzima activa
  - Visualización: Descomposición de moléculas
  - Gráfico: Actividad enzimática vs pH

#### Estado del Store
```typescript
digestivo9: {
  alimento: 'proteina' | 'carbohidratos' | 'grasa';
  posicion: number;          // 0-100%
  phActual: number;
  enzimaActiva: string;
  moleculasIntactas: number;
  moleculasDig eridas: number;
  actividadEnzimatica: number;
}
```

#### Checkpoints
- [ ] CP1: Pepsina activa en estómago (pH ~2)
- [ ] CP2: Amilasa activa en boca (pH ~7)
- [ ] CP3: Lipasa activa en intestino (pH ~8)
- [ ] CP4: Relacionar pH óptimo con origen de enzima

#### Enzimas y pH
```
Boca (pH ~7):
  Amilasa salival → almidón → maltosa

Estómago (pH 1.5-2):
  Pepsina → proteínas → péptidos

Intestino (pH ~8):
  Tripsina → proteínas → aminoácidos
  Lipasa → grasas → ácidos grasos + glicerol
  Maltasa → maltosa → glucosa
```

---

### BIO-10: Dinámica de Poblaciones

**Nombre:** Modelo Lotka-Volterra  
**Dificultad:** ★★★★☆  
**Duración estimada:** 20 min

#### Descripción
Simulación depredador-presa. Observar oscilaciones poblacionales.

#### Mecánica Principal
- **Controles:**
  - Slider: Población inicial de presas
  - Slider: Población inicial de depredadores
  - Slider: Tasa de reproducción presas (α)
  - Slider: Tasa de mortalidad presas por depredador (β)
  - Slider: Tasa de reproducción depredadores (δ)
  - Slider: Tasa de mortalidad depredadores (γ)
  - Botón: Iniciar/Pausar simulación
  - Gráfico: Poblaciones vs tiempo (dual axis)

#### Estado del Store
```typescript
poblaciones10: {
  presasy: number;
  depredadores: number;
  tasaReproduccionPresas: number;     // α
  tasaMortalidadPresas: number;       // β
  tasaReproduccionDepredadores: number; // δ
  tasaMortalidadDepredadores: number;   // γ
  tiempo: number;
  historiaPresas: Array<number>;
  historiaDepredadores: Array<number>;
  simulando: boolean;
}
```

#### Checkpoints
- [ ] CP1: Observar que poblaciones oscilan
- [ ] CP2: Picos de presas ANTES de picos de depredadores
- [ ] CP3: Modificar β y observar mayor amplitud
- [ ] CP4: Encontrar punto de equilibrio

#### Ecuaciones Lotka-Volterra
```
dPresas/dt = α·Presas - β·Presas·Depredadores
dDepredadores/dt = δ·Presas·Depredadores - γ·Depredadores

α = tasa reproducción presas
β = tasa mortalidad presas por depredación
δ = tasa reproducción depredadores (depende de presas)
γ = tasa mortalidad depredadores
```

---

## Mecánicas de Simulación

### Motor Biológico
- **Timestep variable:** según fenómeno (ms para nervios, min para población)
- **Precisión biológica:** aproximaciones aceptadas para visualización

### Loop Principal
```
Biología molecular:
  1. Mover moléculas según difusión
  2. Verificar colisiones enzima-sustrato
  3. Reaccionar si complejo activo

Sistemas:
  1. Actualizar tasas según parámetros
  2. Calcular siguiente estado
  3. Renderizar
```

---

## UI/UX

### Componentes Biológicos
- **Microscopio:** Zoom, foco, iluminación
- **Gráficos temporales:** Poblaciones, reacciones
- **Indicadores de pH:** Escala colorimétrica
- **Tablas genéticas:** Código de aminoácidos

### Feedback Visual
- **Celular:** Colores distintivos por orgánulo
- **Molecular:** Espacio-filling vs schemático
- **Temporal:** Color coding para tiempo (pasado/futuro)

---

## Audio

### Efectos Biológicos
| Evento | Sonido |
|--------|--------|
| Burbujas O₂ | "glub glub" |
| Impulso nervioso | "zap" eléctrico |
| Latido cardíaco | "lub-dub" |
| Click en orgánulo | "click" |
| checkpoint completado | "ding" suave |

---

## Anti-Cheat

### Validaciones Biológicas
1. **Secuencia lógica:** No puedes ver orgánulos sin zoom suficiente
2. **Tiempo mínimo:** Parámetros requieren observación
3. **Valores en rangos biológicos:** No aceptar pH < 0 o > 14

### Flags Biológicos
```typescript
sospecha: {
  identificacionRapida: boolean;      // sin zoom suficiente
  reaccionInstantanea: boolean;        //来不及 reaccionar
  valoresImposibles: boolean;          // pH < 0
}
```

---

## Métricas de Éxito

| Práctica | Checkpoints | Tiempo Est. | Score Máx |
|----------|-------------|-------------|-----------|
| BIO-01 | 4 | 10 min | 100 |
| BIO-02 | 4 | 15 min | 100 |
| BIO-03 | 4 | 15 min | 100 |
| BIO-04 | 4 | 15 min | 100 |
| BIO-05 | 4 | 15 min | 100 |
| BIO-06 | 4 | 15 min | 100 |
| BIO-07 | 4 | 20 min | 100 |
| BIO-08 | 4 | 20 min | 100 |
| BIO-09 | 4 | 15 min | 100 |
| BIO-10 | 4 | 20 min | 100 |

---

**Documento controlado por:** Sistema de Gestión de Documentos CEN LABS  
**Próxima revisión:** 2026-07-08
