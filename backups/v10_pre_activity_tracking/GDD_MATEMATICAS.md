# GDD MATEMÁTICAS - CEN LABS
## Game Design Document - Prácticas de Matemáticas

**Versión:** 1.0  
**Última actualización:** 2026-04-08  
**Autor:** CEN Labs

---

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Prácticas de Matemáticas](#prácticas-de-matemáticas)
3. [Mecánicas de Simulación](#mecánicas-de-simulación)
4. [UI/UX](#uiux)
5. [Audio](#audio)
6. [Anti-Cheat](#anti-cheat)

---

## Resumen Ejecutivo

Las prácticas de Matemáticas de CEN LABS permiten a los estudiantes visualizar y manipular conceptos matemáticos abstractos mediante simulaciones interactivas. Cada práctica combina un piloto (simulación) con una bitácora educativa.

### Objetivos Pedagógicos
- Visualizar conceptos abstractos de manera concreta
- Relacionar fórmulas con representación gráfica
- Manipular parámetros y observar efectos
- Construir intuición matemática

### Distribución de Tiempo
- **Bitácora (30%):** Teoría, instrucciones, cálculos, conclusiones
- **Piloto (70%):** Simulación interactiva

---

## Prácticas de Matemáticas

---

### MAT-01: Ecuaciones Cuadráticas

**Nombre:** Parábolas Interactivas  
**Dificultad:** ★★☆☆☆  
**Duración estimada:** 10 min

#### Descripción
Manipular coeficientes a, b, c de una ecuación cuadrática y observar cambios en la parábola.

#### Mecánica Principal
- **Controles:**
  - Slider: Coeficiente a (-5 to 5)
  - Slider: Coeficiente b (-10 to 10)
  - Slider: Coeficiente c (-10 to 10)
  - Display: Ecuación actual y = ax² + bx + c
  - Display: Gráfico de la parábola
  - Hotspot: Click en raíces, vértice

#### Estado del Store
```typescript
cuadraticas1: {
  coefA: number;
  coefB: number;
  coefC: number;
  vertice: { x: number; y: number };
  raices: [number, number] | null;
  discriminante: number;
  puntosGrafico: Array<{ x: number; y: number }>;
}
```

#### Checkpoints
- [ ] CP1: Observar que a>0 abre hacia arriba, a<0 hacia abajo
- [ ] CP2: Encontrar vértice en x = -b/(2a)
- [ ] CP3: Verificar raíces con fórmula cuadrática
- [ ] CP4: Observar que |a| pequeño = parábola más "ancha"

#### Matemáticas
```
y = ax² + bx + c

x_vertice = -b / (2a)
y_vertice = f(x_vertice)

Δ = b² - 4ac
Δ > 0: 2 raíces reales
Δ = 0: 1 raíz real (tangente)
Δ < 0: sin raíces reales
```

---

### MAT-02: Sistemas 2x2

**Nombre:** Triangulación y Resolución  
**Dificultad:** ★★☆☆☆  
**Duración estimada:** 12 min

#### Descripción
Resolver sistemas de ecuaciones lineales. Visualizar intersección de rectas.

#### Mecánica Principal
- **Controles:**
  - Input: Coeficientes de ecuación 1 (a₁, b₁, c₁)
  - Input: Coeficientes de ecuación 2 (a₂, b₂, c₂)
  - Botón: Resolver
  - Display: Gráfico con dos rectas
  - Display: Punto de intersección
  - Selector: Método (Gráfico/Sustitución/Eliminación)

#### Estado del Store
```typescript
sistemas2: {
  eq1: { a: number; b: number; c: number };
  eq2: { a: number; b: number; c: number };
  solucionX: number | null;
  solucionY: number | null;
  tipoSolucion: 'unica' | 'ninguna' | 'infinitas';
  metodo: 'grafico' | 'sustitucion' | 'eliminacion';
}
```

#### Checkpoints
- [ ] CP1: Observar intersección de dos rectas
- [ ] CP2: Identificar solución única (líneas se cruzan)
- [ ] CP3: Identificar sin solución (paralelas)
- [ ] CP4: Identificar infinitas soluciones (coincidentes)

#### Resolución
```
Sustitución:
  1. Despejar y de eq1: y = (c₁ - a₁x)/b₁
  2. Sustituir en eq2
  3. Resolver para x
  4. Sustituir para y

Eliminación:
  Multiplicar ecuaciones por factores
  Sumar/restar para eliminar variable
```

---

### MAT-03: Escala Richter

**Nombre:** Logaritmos en Acción  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 12 min

#### Descripción
Calcular magnitud de terremotos usando logaritmos. Comparar energías liberadas.

#### Mecánica Principal
- **Controles:**
  - Slider: Amplitud de onda sísmica (1 - 1000 μm)
  - Input: Distancia epicentral (10 - 500 km)
  - Display: Magnitud Richter calculada
  - Display: Energía liberada (en Joules y TNT)
  - Gráfico: Comparación de magnitudes

#### Estado del Store
```typescript
richter3: {
  amplitudOnda: number;
  distanciaEpicentral: number;
  magnitudRichter: number;
  energiaJoules: number;
  energiaTNT: number;
  historialTerremotos: Array<{ magnitud: number; energia: number }>;
}
```

#### Checkpoints
- [ ] CP1: Calcular magnitud M = log(A/A₀) + corrección
- [ ] CP2: Cada unidad Richter = 31.6× más energía
- [ ] CP3: Comparar M5 vs M7 (×1000 energía)
- [ ] CP4: Entender que Richter es escala logarítmica

#### Fórmulas
```
M = log₁₀(A/A₀) + 3·log₁₀(Δ/Δ₀)

E = 10^(1.5·M + 4.8) Joules
E_TNT = E / 4.184×10⁹ kg

M8 = 10^(12+4.8) = 10^16.8 J ≈ 1000 bombas atómicas
M5 = 10^(7.5+4.8) = 10^12.3 J ≈ 2 bombas Hiroshima
```

---

### MAT-04: Teorema de Pitágoras

**Nombre:** Geometría Dinámica  
**Dificultad:** ★★☆☆☆  
**Duración estimada:** 10 min

#### Descripción
Construir triángulos rectángulos. Verificar relación a² + b² = c².

#### Mecánica Principal
- **Controles:**
  - Slider: Longitud cateto a (1-10)
  - Slider: Longitud cateto b (1-10)
  - Display: Construcción del triángulo
  - Display: Áreas de cuadrados a², b², c²
  - Display: Verificación a² + b² = c²
  - Botón: Animar demostración

#### Estado del Store
```typescript
pitagoras4: {
  catetoA: number;
  catetoB: number;
  hipotenusa: number;
  areaCuadradoA: number;
  areaCuadradoB: number;
  areaCuadradoC: number;
  verificacion: boolean;
}
```

#### Checkpoints
- [ ] CP1: Construir triángulo rectángulo
- [ ] CP2: Observar que a² + b² = c²
- [ ] CP3: Verificar con triángulo 3-4-5
- [ ] CP4: Verificar con otros triángulos rectos

#### Geometría
```
a² + b² = c²

3-4-5:  9 + 16 = 25 ✓
5-12-13: 25 + 144 = 169 ✓
7-24-25: 49 + 576 = 625 ✓

cos(θ) = a/c
sin(θ) = b/c
tan(θ) = b/a
```

---

### MAT-05: Círculo Trigonométrico

**Nombre:** Ondas Seno y Coseno  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 12 min

#### Descripción
Explorar funciones trigonométricas. Mover punto en círculo unitario y observar ondas.

#### Mecánica Principal
- **Controles:**
  - Slider: Ángulo θ (0° - 360°)
  - Drag: Mover punto directamente en círculo
  - Display: Círculo trigonométrico
  - Display: Gráfico simultáneo de sin(θ) y cos(θ)
  - Toggle: Mostrar todas las funciones (tan, sec, csc, cot)
  - Selector: Modo (estático/animation)

#### Estado del Store
```typescript
trigonometria5: {
  angulo: number;         // radianes
  sinValor: number;
  cosValor: number;
  tanValor: number;
  puntoEnCirculo: { x: number; y: number };
  historialOnda: Array<{ angulo: number; sin: number; cos: number }>;
  modoAnimacion: boolean;
}
```

#### Checkpoints
- [ ] CP1: Observar que sin²(θ) + cos²(θ) = 1
- [ ] CP2: Verificar periodicidad: sin(θ+2π) = sin(θ)
- [ ] CP3: Identificar ángulos notables (0°, 30°, 45°, 60°, 90°)
- [ ] CP4: Observar que tan tiene asíntotas en 90°, 270°

#### Identidades
```
sin²(θ) + cos²(θ) = 1
sin(-θ) = -sin(θ)  (impar)
cos(-θ) = cos(θ)  (par)
sin(π - θ) = sin(θ)
cos(π - θ) = -cos(θ)
```

---

### MAT-06: Transformaciones

**Nombre:** Isometrías y Homotecia  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Aplicar transformaciones a figuras: traslación, rotación, reflexión, homotecia.

#### Mecánica Principal
- **Controles:**
  - Selector: Tipo de figura original (triángulo/cuadrado/pentágono)
  - Slider: Traslación x (-5 to 5)
  - Slider: Traslación y (-5 to 5)
  - Slider: Rotación (0° - 360°)
  - Slider: Factor de escala (0.5 - 2.0)
  - Selector: Reflexión (ninguna/eje X/eje Y/origen)
  - Toggle: Mostrar figura original

#### Estado del Store
```typescript
transformaciones6: {
  figuraOriginal: Array<{ x: number; y: number }>;
  transformada: Array<{ x: number; y: number }>;
  trasX: number;
  trasY: number;
  rotacion: number;
  escala: number;
  reflexion: 'ninguna' | 'x' | 'y' | 'origen';
}
```

#### Checkpoints
- [ ] CP1: Aplicar traslación y verificar coord+vector
- [ ] CP2: Rotar 90° y verificar matrices
- [ ] CP3: Reflejar y observar imagen especular
- [ ] CP4: Homotecia por 2 = duplicar tamaño

#### Matrices de Transformación
```
Traslación: [x'] = [x] + [tx]    [y'] = [y] + [ty]

Rotación:   [x'] = x·cos(θ) - y·sin(θ)
            [y'] = x·sin(θ) + y·cos(θ)

Escala:     [x'] = k·x
            [y'] = k·y

Reflexión X: [x'] = x, [y'] = -y
Reflexión Y: [x'] = -x, [y'] = y
```

---

### MAT-07: Ley de Snell

**Nombre:** Refracción y Ángulos  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 12 min

#### Descripción
Rayos de luz refractándose entre medios. Observar ley de Snell n₁·sin(θ₁) = n₂·sin(θ₂).

#### Mecánica Principal
- **Controles:**
  - Selector: Medio 1 (Vacío/Aire/Agua/Vidrio/Diamante)
  - Selector: Medio 2 (Vacío/Aire/Agua/Vidrio/Diamante)
  - Slider: Ángulo de incidencia (0° - 89°)
  - Display: Rayo incidente y refractado
  - Display: Ángulos medidos
  - Toggle: Mostrar reflexión

#### Estado del Store
```typescript
snell7: {
  medio1: string;
  medio2: string;
  indice1: number;
  indice2: number;
  anguloIncidente: number;
  anguloRefractado: number;
  anguloCritico: number;
  reflexionTotal: boolean;
}
```

#### Checkpoints
- [ ] CP1: Medir ángulo refractado para diferentes incidencias
- [ ] CP2: Verificar n₁·sin(θ₁) = n₂·sin(θ₂)
- [ ] CP3: Encontrar ángulo crítico para reflexión total
- [ ] CP4: Observar que luz va de medio denso a menos denso se aleja de normal

#### Óptica
```
n₁·sin(θ₁) = n₂·sin(θ₂)

n_vacio = 1.0
n_aire = 1.0003
n_agua = 1.33
n_vidrio = 1.5
n_diamante = 2.42

θ_critico = arcsin(n₂/n₁)  (si n₁ > n₂)
```

---

### MAT-08: La Derivada

**Nombre:** Recta Tangente  
**Dificultad:** ★★★★☆  
**Duración estimada:** 15 min

#### Descripción
Visualizar derivada como pendiente de recta tangente. Tangent lines aproximándose.

#### Mecánica Principal
- **Controles:**
  - Selector: Función (x², x³, sin(x), eˣ, ln(x))
  - Slider: Punto x₀ (-5 to 5)
  - Display: Gráfico de función
  - Display: Recta tangente en x₀
  - Display: Valor de derivada f'(x₀)
  - Toggle: Mostrar secantes aproximándose
  - Botón: Animar Δx → 0

#### Estado del Store
```typescript
derivadas8: {
  funcion: 'x^2' | 'x^3' | 'sin(x)' | 'e^x' | 'ln(x)';
  puntoX0: number;
  valorFuncion: number;
  valorDerivada: number;
  rectaTangente: { pendiente: number; intercepto: number };
  puntosSecante: Array<{ x: number; dx: number; pendiente: number }>;
}
```

#### Checkpoints
- [ ] CP1: Observar que derivada = pendiente de tangente
- [ ] CP2: Verificar f'(x) para x² = 2x
- [ ] CP3: Verificar f'(x) para sin(x) = cos(x)
- [ ] CP4: Entender límite: f'(x₀) = lim(Δx→0) [f(x₀+Δx)-f(x₀)]/Δx

#### Cálculo
```
f(x) = x²
f'(x) = 2x

f'(2) = 4 → pendiente de tangente en x=2

f(x) = sin(x)
f'(x) = cos(x)

f(x) = eˣ
f'(x) = eˣ
```

---

### MAT-09: Sumas de Riemann

**Nombre:** Integración Numérica  
**Dificultad:** ★★★★☆  
**Duración estimada:** 15 min

#### Descripción
Aproximar integrales usando sumas de Riemann. Comparar izquierda, derecha y punto medio.

#### Mecánica Principal
- **Controles:**
  - Selector: Función (x², x³, sin(x), 1/x)
  - Input: Límite inferior a
  - Input: Límite superior b
  - Slider: Número de rectángulos n (4 - 100)
  - Selector: Método (Izquierda/Derecha/Punto Medio/Trapecio)
  - Display: Suma aproximada
  - Display: Integral exacta (si disponible)
  - Gráfico: Rectángulos sobre función

#### Estado del Store
```typescript
riemann9: {
  funcion: 'x^2' | 'x^3' | 'sin(x)' | '1/x';
  limiteInferior: number;
  limiteSuperior: number;
  numRectangulos: number;
  metodo: 'izquierda' | 'derecha' | 'puntoMedio' | 'trapecio';
  sumaAproximada: number;
  integralExacta: number;
  error: number;
  rectangulos: Array<{ x: number; altura: number; ancho: number }>;
}
```

#### Checkpoints
- [ ] CP1: Aproximar ∫x² dx de 0 a 1 (≈ 0.333)
- [ ] CP2: Más rectángulos = mejor aproximación
- [ ] CP3: Comparar error entre métodos
- [ ] CP4: Verificar que integral exacta = lim(n→∞) suma

#### Integración Numérica
```
Izquierda:  Σ f(xᵢ)·Δx
           i=0 to n-1

Derecha:   Σ f(xᵢ₊₁)·Δx
           i=0 to n-1

Punto Medio: Σ f((xᵢ+xᵢ₊₁)/2)·Δx

Trapecio:  Σ (f(xᵢ)+f(xᵢ₊₁))/2 · Δx
```

---

### MAT-10: Máquina de Galton

**Nombre:** Distribución Normal  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Simular máquina de Galton. Observar distribución binomial convergiendo a normal.

#### Mecánica Principal
- **Controles:**
  - Slider: Número de niveles (5 - 15)
  - Slider: Bolas a soltar (10 - 1000)
  - Botón: Soltar 1 bola
  - Botón: Soltar N bolas
  - Botón: Reiniciar
  - Display: Histograma de resultados
  - Display: Curva normal teórica superpuesta
  - Selector: Velocidad de animación

#### Estado del Store
```typescript
galton10: {
  numNiveles: number;
  bolasTotales: number;
  bolasPorRecipiente: number[];
  mediaObservada: number;
  desviacionObservada: number;
  curvaNormal: Array<{ x: number; y: number }>;
  simulando: boolean;
}
```

#### Checkpoints
- [ ] CP1: Observar que distribución parece simétrica
- [ ] CP2: Más bolas = más cercana a campana de Gauss
- [ ] CP3: Calcular media y desviación estándar
- [ ] CP4: Entender que esto es binomial B(n, 0.5) → N(μ, σ²)

#### Probabilidad
```
Distribución Binomial:
  B(k) = C(n,k) · (0.5)^n

Teorema del Límite Central:
  B(n, 0.5) → N(μ=n/2, σ²=n/4)

μ = n/2
σ = √n / 2

68-95-99.7 rule:
  68% dentro de ±1σ
  95% dentro de ±2σ
  99.7% dentro de ±3σ
```

---

## Mecánicas de Simulación

### Motor Matemático
- **Precisión:** 6-8 decimales para cálculos
- **Actualización en tiempo real:** Gráficos se actualizan con cada cambio de slider
- **Animaciones suaves:** Transiciones de 200-300ms

### Loop Principal
```
Matemáticas continuas:
  1. Recalcular función al cambiar parámetros
  2. Generar puntos para gráfico
  3. Calcular valores especiales (raíces, vértices)
  4. Renderizar

Probabilidad/Estadística:
  1. Simular evento
  2. Actualizar contadores
  3. Recalcular histogramas
  4. Renderizar
```

---

## UI/UX

### Componentes Matemáticos
- **Gráficos cartesianos:** Zoom, pan, grid configurable
- **Sliders con valores:** Mostrar número actual
- **Inputs numéricos:** Validación de rango
- **Visualización de fórmulas:** Renderizado LaTeX
- **Tablas de valores:** Puntos discretos

### Feedback Visual
- **Coordenadas:** Tooltips al hover
- **Errores:** Rojo para valores inválidos
- **Verificación:** Verde para identidad cumplida

---

## Audio

### Efectos Matemáticos
| Evento | Sonido |
|--------|--------|
| Golpe de bola (Galton) | "plink" |
|checkpoint completado | "ding" |
| Cambio de slider | "tick" |
| Animación completa | "whoosh" suave |

---

## Anti-Cheat

### Validaciones Matemáticas
1. **Tolerancia numérica:** Aceptar respuestas dentro de ±0.01
2. **Tiempo mínimo:** No permitir cálculos instantánea
3. **Secuencia lógica:** No mostrar derivadas sin función base

### Flags Matemáticos
```typescript
sospecha: {
  respuestaInstantanea: boolean;      // sin tiempo de cálculo
  precisionImposible: boolean;        // más decimales de los visibles
  derivadaIncorrectaRapida: boolean;   //来不及 pensar
}
```

---

## Métricas de Éxito

| Práctica | Checkpoints | Tiempo Est. | Score Máx |
|----------|-------------|-------------|-----------|
| MAT-01 | 4 | 10 min | 100 |
| MAT-02 | 4 | 12 min | 100 |
| MAT-03 | 4 | 12 min | 100 |
| MAT-04 | 4 | 10 min | 100 |
| MAT-05 | 4 | 12 min | 100 |
| MAT-06 | 4 | 15 min | 100 |
| MAT-07 | 4 | 12 min | 100 |
| MAT-08 | 4 | 15 min | 100 |
| MAT-09 | 4 | 15 min | 100 |
| MAT-10 | 4 | 15 min | 100 |

---

**Documento controlado por:** Sistema de Gestión de Documentos CEN LABS  
**Próxima revisión:** 2026-07-08
