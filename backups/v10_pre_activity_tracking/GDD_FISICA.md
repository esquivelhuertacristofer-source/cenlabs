# GDD FÍSICA - CEN LABS
## Game Design Document - Prácticas de Física

**Versión:** 1.0  
**Última actualización:** 2026-04-08  
**Autor:** CEN Labs

---

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Prácticas de Física](#prácticas-de-física)
3. [Mecánicas de Simulación](#mecánicas-de-simulación)
4. [UI/UX](#uiux)
5. [Física y Gráficos](#física-y-gráficos)
6. [Audio](#audio)
7. [Anti-Cheat](#anti-cheat)

---

## Resumen Ejecutivo

Las prácticas de Física de CEN LABS están diseñadas para que los estudiantes experimenten con leyes físicas fundamentales mediante simulaciones interactivas de alta fidelidad. Cada práctica combina un piloto (simulación) con una bitácora educativa.

### Objetivos Pedagógicos
- Comprender leyes físicas mediante experimentación virtual
- Relacionar fórmulas matemáticas con fenómenos observables
- Desarrollar intuición física a través de la manipulación directa
- Registrar observaciones y calcular resultados

### Distribución de Tiempo
- **Bitácora (30%):** Teoría, instrucciones, cálculos, conclusiones
- **Piloto (70%):** Simulación interactiva

---

## Prácticas de Física

---

### FIS-01: Tiro Parabólico

**Nombre:** Cañón de Proyectiles  
**Dificultad:** ★★☆☆☆  
**Duración estimada:** 10-15 min

#### Descripción
El estudiante ajusta el ángulo y velocidad inicial de un cañón para alcanzar objetivos a diferentes distancias. Se visualiza la trayectoria parabólica con vectores de velocidad instantaneous.

#### Mecánica Principal
- **Controles:** 
  - Slider: Ángulo (0° - 90°)
  - Slider: Velocidad inicial (5 - 50 m/s)
  - Botón: Disparar
  - Botón: Reiniciar

#### Estado del Store
```typescript
tiro1: {
  angulo: number;        // grados
  velocidadInicial: number; // m/s
  proyectil: { x: number; y: number; vx: number; vy: number };
  trayectoria: Array<{ x: number; y: number }>;
  objetivoAlcanzado: boolean;
  distanceFinal: number;
  alturaMaxima: number;
  tiempoVuelo: number;
}
```

#### Checkpoints
- [ ] CP1: Ajustar ángulo a 45° y disparar
- [ ] CP2: Calcular alcance teórico usando R = v₀²·sin(2θ)/g
- [ ] CP3: Ajustar ángulo para tocar el objetivo
- [ ] CP4: Calcular altura máxima con h = v₀²·sin²(θ)/(2g)

#### Física Implementada
```
x(t) = v₀ · cos(θ) · t
y(t) = v₀ · sin(θ) · t - ½·g·t²
vₓ(t) = v₀ · cos(θ)
vᵧ(t) = v₀ · sin(θ) - g·t

R = v₀² · sin(2θ) / g
h_max = v₀² · sin²(θ) / (2g)
```

#### Assets Visuales
- Cañón SVG (rotación dinámica)
- Proyectil (esfera roja con trail)
- Terreno (línea con objetivo)
- Vectores de velocidad (flechas)
- Trayectoria histórica (línea punteada)

---

### FIS-02: Plano Inclinado

**Nombre:** Leyes de Newton - Plano Inclinado  
**Dificultad:** ★★☆☆☆  
**Duración estimada:** 12 min

#### Descripción
Un bloque se desliza por un plano inclinado. El estudiante ajusta el ángulo y coeficiente de fricción para observar el movimiento.

#### Mecánica Principal
- **Controles:**
  - Slider: Ángulo del plano (5° - 45°)
  - Slider: Coeficiente de fricción μ (0.0 - 1.0)
  - Botón: Soltar bloque
  - Botón: Pausar/Reanudar
  - Checkbox: Mostrar fuerzas

#### Estado del Store
```typescript
plano2: {
  angulo: number;        // grados
  coefFriccion: number;  // μ
  bloque: { x: number; y: number; v: number };
  tiempo: number;
  aceleracion: number;
  fuerzaNormal: number;
  fuerzaFriccion: number;
  fuerzaGravedad: number;
  simulando: boolean;
}
```

#### Checkpoints
- [ ] CP1: Observar que a θ=0° el bloque no se mueve
- [ ] CP2: Encontrar el ángulo crítico donde empieza a deslizar
- [ ] CP3: Calcular aceleración con a = g·(sin(θ) - μ·cos(θ))
- [ ] CP4: Comparar energía potencial y cinética

#### Física Implementada
```
N = m · g · cos(θ)
f = μ · N
F_net = m · g · sin(θ) - μ · m · g · cos(θ)
a = g · (sin(θ) - μ · cos(θ))

θ_crítico = arctan(μ)
```

---

### FIS-03: Péndulo Simple

**Nombre:** Periodo y Gravedad  
**Dificultad:** ★★☆☆☆  
**Duración estimada:** 10 min

#### Descripción
Un péndulo simple oscila. El estudiante mide el periodo para diferentes longitudes y calcula g experimentalmente.

#### Mecánica Principal
- **Controles:**
  - Slider: Longitud de cuerda (0.2m - 2m)
  - Slider: Ángulo inicial (5° - 30°)
  - Botón: Soltar
  - Botón: Medir periodo (cronómetro)
  - Input: Masa (opcional, afecta visuals)

#### Estado del Store
```typescript
pendulo3: {
  longitud: number;    // metros
  anguloInicial: number; // grados
  anguloActual: number;
  velocidadAngular: number;
  periodoMedido: number;
  numOscilaciones: number;
  tiempo: number;
}
```

#### Checkpoints
- [ ] CP1: Medir periodo para L = 1m
- [ ] CP2: Usar T = 2π√(L/g) para calcular g
- [ ] CP3: Graficar T² vs L (debe ser lineal)
- [ ] CP4: Verificar que la masa NO afecta el periodo

#### Física Implementada
```
T = 2π · √(L/g)
ω = √(g/L)
θ(t) = θ₀ · cos(ωt + φ)

v_max = θ₀ · ω · L
a_max = θ₀ · ω² · L
```

---

### FIS-04: Ley de Hooke

**Nombre:** Constante Elástica  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Un resorte vertical con masas. El estudiante mide elongación para determinar la constante k.

#### Mecánica Principal
- **Controles:**
  - Slider: Masa añadida (0.1kg - 2kg)
  - Botón: Añadir masa
  - Botón: Quitar masa
  - Botón: Soltar/equilibrar
  - Medición: Regla con precisón 0.1cm

#### Estado del Store
```typescript
hooke4: {
  constanteElastica: number; // k (N/m)
  masas: Array<number>;
  elongacion: number;      // metros
  equilibrio: { x: number; y: number };
  energiaPotencial: number;
  energiaCinetica: number;
}
```

#### Checkpoints
- [ ] CP1: Medir elongación para diferentes masas
- [ ] CP2: Calcular k = m·g/Δx para cada caso
- [ ] CP3: Calcular k promedio
- [ ] CP4: Graficar F vs x (Ley de Hooke: F = k·x)

#### Física Implementada
```
F = -k · x
k = m · g / x

PE_resorte = ½ · k · x²
PE_gravedad = m · g · y

E_total = PE + KE = constante
```

---

### FIS-05: Colisiones 1D

**Nombre:** Conservación de Momento  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Dos bloques en riel de aire chocan. El estudiante configura masas y velocidades para observar colisiones elásticas e inelásticas.

#### Mecánica Principal
- **Controles:**
  - Slider: Masa bloque 1 (0.5kg - 5kg)
  - Slider: Masa bloque 2 (0.5kg - 5kg)
  - Slider: Velocidad inicial bloque 1 (-10 to 10 m/s)
  - Toggle: Colisión elástica/inelástica
  - Botón: Iniciar/colisión
  - Gráfico: Momento vs Tiempo

#### Estado del Store
```typescript
colision1: {
  masa1: number;
  masa2: number;
  velocidad1: number;
  velocidad2: number;
  posicion1: number;
  posicion2: number;
  momentoTotalInicial: number;
  momentoTotalFinal: number;
  energiaCineticaInicial: number;
  energiaCineticaFinal: number;
  tipoColision: 'elastica' | 'inelastica';
}
```

#### Checkpoints
- [ ] CP1: Configurar colisión elástica con m1=m2
- [ ] CP2: Verificar que p_inicial = p_final
- [ ] CP3: Calcular energías antes y después
- [ ] CP4: Colisión perfectamente inelástica (v_f = (m1·v1 + m2·v2)/(m1+m2))

#### Física Implementada
```
// Colisión elástica
v1' = ((m1-m2)·v1 + 2·m2·v2) / (m1+m2)
v2' = ((m2-m1)·v2 + 2·m1·v1) / (m1+m2)

// Colisión inelástica
v_f = (m1·v1 + m2·v2) / (m1+m2)

p_total = m1·v1 + m2·v2 = constante
```

---

### FIS-06: Principio de Arquímedes

**Nombre:** Empuje y Flotabilidad  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 12 min

#### Descripción
Un objeto se sumerge parcialmente en un fluido. El estudiante observa el empuje y la tensión de la cuerda.

#### Mecánica Principal
- **Controles:**
  - Slider: Densidad del fluido (500 - 2000 kg/m³)
  - Slider: Volumen sumergido (0% - 100%)
  - Slider: Densidad del objeto (200 - 5000 kg/m³)
  - Botón: Simular
  - Medición: Fuerza de empuje, peso aparente

#### Estado del Store
```typescript
arquimedes6: {
  densidadFluido: number;
  densidadObjeto: number;
  volumenObjeto: number;
  fraccionSumergida: number;
  empuje: number;
  pesoReal: number;
  pesoAparente: number;
  nivelAgua: number;
}
```

#### Checkpoints
- [ ] CP1: Calcular empuje E = ρ_fluido · V_sumergido · g
- [ ] CP2: Observar que si ρ_objeto < ρ_fluido → flota
- [ ] CP3: Peso aparente = Peso real - Empuje
- [ ] CP4: Fracción sumergida = ρ_objeto/ρ_fluido

#### Física Implementada
```
E = ρ_fluido · V_sumergido · g
W = m · g = ρ_objeto · V_total · g

Si E > W → flota
Si E = W → equilibrio
Si E < W → se hunde

fraccion_sumergida = ρ_objeto / ρ_fluido
```

---

### FIS-07: Dilatación Térmica

**Nombre:** Coeficiente de Dilatación  
**Dificultad:** ★★☆☆☆  
**Duración estimada:** 10 min

#### Descripción
Una barra metálica se calienta y dilata. El estudiante mide la dilatación para calcular el coeficiente α.

#### Mecánica Principal
- **Controles:**
  - Slider: Temperatura inicial (20°C)
  - Slider: Temperatura final (20°C - 200°C)
  - Selector: Material (Al, Fe, Cu, Acero)
  - Botón: Calentar
  - Medición: Longitud inicial, final, ΔL

#### Estado del Store
```typescript
dilatacion7: {
  temperaturaInicial: number;
  temperaturaFinal: number;
  longitudInicial: number;
  longitudFinal: number;
  material: 'aluminio' | 'hierro' | 'cobre' | 'acero';
  coeficienteAlpha: number;
  deltaTemperatura: number;
  deltaLongitud: number;
}
```

#### Checkpoints
- [ ] CP1: Medir ΔL para ΔT = 100°C
- [ ] CP2: Calcular α = ΔL / (L₀ · ΔT)
- [ ] CP3: Comparar con valores teóricos
- [ ] CP4: Verificar que diferentes materiales tienen diferente α

#### Física Implementada
```
ΔL = L₀ · α · ΔT
L_final = L₀ · (1 + α · ΔT)

α_Al = 24 × 10⁻⁶ /°C
α_Fe = 12 × 10⁻⁶ /°C
α_Cu = 17 × 10⁻⁶ /°C
α_Acero = 11 × 10⁻⁶ /°C
```

---

### FIS-08: Ley de Ohm

**Nombre:** Circuito V=I·R  
**Dificultad:** ★★☆☆☆  
**Duración estimada:** 10 min

#### Descripción
Circuito simple con fuente de voltaje y resistor variable. El estudiante mide corriente para verificar V=IR.

#### Mecánica Principal
- **Controles:**
  - Slider: Voltaje de fuente (1V - 12V)
  - Slider: Resistencia (10Ω - 1000Ω)
  - Display: Amperímetro, Voltímetro
  - Gráfico: V vs I (debe ser lineal)
  - Botón: Encender/Apagar

#### Estado del Store
```typescript
ohm8: {
  voltaje: number;
  resistencia: number;
  corriente: number;
  potencia: number;
  circuitoEncendido: boolean;
  historialLecturas: Array<{ V: number; I: number; R: number }>;
}
```

#### Checkpoints
- [ ] CP1: Medir corriente para diferentes voltajes (R constante)
- [ ] CP2: Graficar V vs I → debe ser línea recta
- [ ] CP3: Calcular R = V/I de la pendiente
- [ ] CP4: Calcular potencia P = V·I

#### Física Implementada
```
V = I · R
P = V · I = I² · R = V² / R

Serie: R_total = R1 + R2 + ...
Paralelo: 1/R_total = 1/R1 + 1/R2 + ...
```

---

### FIS-09: Electrostática

**Nombre:** Ley de Coulomb  
**Dificultad:** ★★★☆☆  
**Duración estimada:** 15 min

#### Descripción
Dos cargas puntuales interactúan. El estudiante mueve cargas y observa fuerzas attractive/repulsivas.

#### Mecánica Principal
- **Controles:**
  - Slider: Carga 1 (-10μC to +10μC)
  - Slider: Carga 2 (-10μC to +10μC)
  - Drag: Mover cargas en el espacio 2D
  - Display: Fuerza, distancia, campo eléctrico
  - Toggle: Mostrar líneas de campo

#### Estado del Store
```typescript
electrostatica9: {
  carga1: number;     // Coulombs
  carga2: number;
  posicion1: { x: number; y: number };
  posicion2: { x: number; y: number };
  distancia: number;
  fuerza: number;
  campoElectrico1: { magnitud: number; direccion: number };
  campoElectrico2: { magnitud: number; direccion: number };
}
```

#### Checkpoints
- [ ] CP1: Verificar que cargas del mismo signo se repelen
- [ ] CP2: Verificar que cargas opuestas se atraen
- [ ] CP3: Calcular F = k·|q1·q2|/r²
- [ ] CP4: Observar que F ∝ 1/r²

#### Física Implementada
```
F = k · (q1 · q2) / r²
k = 8.99 × 10⁹ N·m²/C²

E = k · q / r² (campo eléctrico)

F_elec = F_grav si k·q1·q2/r² = G·m1·m2/r²
```

---

### FIS-10: Motor Eléctrico

**Nombre:** Inducción Electromagnética  
**Dificultad:** ★★★★☆  
**Duración estimada:** 20 min

#### Descripción
Motor DC simple con espira, imanes y escobillas. El estudiante observa la conversión de energía eléctrica a mecánica.

#### Mecánica Principal
- **Controles:**
  - Slider: Voltaje de alimentación (1V - 12V)
  - Slider: Campo magnético (ajuste de imán)
  - Botón: Encender/Apagar
  - Display: RPM, torque, potencia
  - Visualización: Giro de espira, cambio de dirección de corriente

#### Estado del Store
```typescript
motor10: {
  voltaje: number;
  corriente: number;
  campoMagnetico: number;
  anguloEspira: number;
  velocidadAngular: number;
  torque: number;
  potenciaMecanica: number;
  potenciaElectrica: number;
  eficiencia: number;
}
```

#### Checkpoints
- [ ] CP1: Observar que el motor gira al encender
- [ ] CP2: Identificar el conmutador que invierte la corriente
- [ ] CP3: Calcular torque τ = n·B·I·A·sin(θ)
- [ ] CP4: Medir RPM para diferentes voltajes

#### Física Implementada
```
τ = n · B · I · A · sin(θ)

ε = -dΦ/dt = -d(BA·cos(ωt))/dt = B·A·ω·sin(ωt)

P_elec = V · I
P_mec = τ · ω
η = P_mec / P_elec
```

---

## Mecánicas de Simulación

### Motor Físico
- **Integración numérica:** Euler o Verlet
- **Timestep fijo:** 60 FPS (Δt = 16.67ms)
- **Precisión:** 6 decimales para cálculos

### Loop Principal
```
cada frame (16.67ms):
  1. Leer inputs del usuario
  2. Actualizar estado de física
  3. Verificar colisiones
  4. Renderizar frame
  5. Actualizar UI
```

---

## UI/UX

### Componentes Comunes
- **Regla/Medición:** Para prácticas que requieren mediciones
- **Gráfico en tiempo real:** Para mostrar relaciones V-I, T-L, etc.
- **Cronómetro:** Para medir periodos y tiempos
- **Indicadores:** Flechas vectoriales para fuerzas, velocidades

### Feedback Visual
- **Colores:** 
  - Verde:checkpoint completado
  - Rojo: Error/intento fallido
  - Amarillo: Advertencia
  - Azul: Información
- **Animaciones:** Transiciones suaves de 200ms

---

## Audio

### Efectos de Sonido
| Evento | Sonido |
|--------|--------|
| Disparar proyectil | "whoosh" |
| Colisión | "thud" |
| checkpoint completado | "ding" |
| Error | "buzz" |
| Masa añadida | "click" |

### Configuración
```typescript
audio: {
  enabled: boolean;
  volume: number; // 0-1
  sfxEnabled: boolean;
}
```

---

## Anti-Cheat

### Validaciones
1. **Tiempo mínimo:** No se puede completar en menos de X segundos
2. **Secuencia de checkpoints:** Deben seguir orden lógico
3. **Valores atípicos:** Verificar que resultados estén en rangos físicos
4. **Server-side:** Timestamp de servidor para validar tiempos

### Flags de Sospecha
```typescript
sospecha: {
  tiempoExcesivamenteRapido: boolean;
  valoresFueraDeRango: boolean;
  secuenciaIncorrecta: boolean;
  multiplesSubastasRapidas: boolean;
}
```

---

## Métricas de Éxito

| Práctica | Checkpoints | Tiempo Est. | Score Máx |
|----------|-------------|-------------|-----------|
| FIS-01 | 4 | 15 min | 100 |
| FIS-02 | 4 | 12 min | 100 |
| FIS-03 | 4 | 10 min | 100 |
| FIS-04 | 4 | 15 min | 100 |
| FIS-05 | 4 | 15 min | 100 |
| FIS-06 | 4 | 12 min | 100 |
| FIS-07 | 4 | 10 min | 100 |
| FIS-08 | 4 | 10 min | 100 |
| FIS-09 | 4 | 15 min | 100 |
| FIS-10 | 4 | 20 min | 100 |

---

**Documento controlado por:** Sistema de Gestión de Documentos CEN LABS  
**Próxima revisión:** 2026-07-08
