# Estándar de laboratorios de clase mundial

> **Estado:** VIGENTE desde el 2026-10-13. Es la vara de medir de todo lab nuevo y de todo lab que se remodele, de cualquier área.
> **Origen:** la remodelación de 10 laboratorios escaparate del 12 y 13 de octubre de 2026 (registro completo en la §6).
> **Relación con los estándares anteriores:** [`ESTANDAR-MOLDE-LAB-3D-MECANICA.md`](./ESTANDAR-MOLDE-LAB-3D-MECANICA.md) (dos capas: 3D didáctico + ficha técnica, regla de honestidad) y [`../ESTANDAR_VISUAL_LABS.md`](../ESTANDAR_VISUAL_LABS.md) (UI del simulador y del hub) siguen vigentes. **Donde choquen, manda este documento.** El choque más visible: los pizarrones y monitores con cifras dentro del 3D quedan prohibidos.
> **Labs de referencia:** ciclo Otto (`mecanica-111`) para los estáticos de mecánica y construcción atómica (`quimica-1`) para los labs base.

---

## 1. El estándar en una frase

**La escena es la protagonista y es hermosa desde el segundo cero; todo lo que se mueve sale de una ecuación real y probada; los datos van en un instrumento nítido fuera del 3D; el texto es una guía corta.**

## 2. Por qué existe: el rechazo que lo definió

El dueño pidió 10 labs de «nivel producción de clase mundial: el mejor 3D, matemática o ciencia exacta, algo hermoso e impresionante». La primera entrega (ciclo Otto y construcción atómica) tenía la física impecable, pero él la rechazó:

> **Otto:** «Está atascadísimo de texto, además la textura, todo, no se ve de buena calidad, vas a tener que buscar una forma en que todo esto funcione junto, del panel digital del fondo ni se hable, así no sirve.»
>
> **Átomos:** «Es buena idea, pero necesito una alternativa más visual, porque hasta que no lleno lo cuántico con elementos no es visualmente atractivo.»

Las dos citas resumen el estándar. Una ciencia exacta **no basta** si la pantalla se ve saturada, los materiales parecen de juguete o el lab sólo luce cuando el alumno ya trabajó un buen rato. Las reglas de la §3 salen de corregir esas quejas en los 10 labs.

## 3. Reglas obligatorias

### A. Primera impresión
1. **Bonito desde el segundo cero.** El estado inicial o vacío y los primeros pasos son la demo. El fenómeno ya está vivo antes de que el alumno toque nada: el láser encendido en la bruma, el corazón latiendo, la doble hélice girando, el robot haciendo su pick & place.
2. **Gancho en los labs de ensamble.** No arrancan con piezas quietas «de catálogo»: la pieza clave ya muestra el fenómeno antes de montarla. Ejemplos: el estátor energizado con su campo girando en el banco del motor de inducción, o el motor a 2400 rpm respirando sin turbo antes de montar el turbo.
3. **El objeto llena el lienzo**, entre el 55 % y el 70 % de su alto, en 1366×768, en 1600×900 y en **≈2020×1055 a DPR 1,25 (la pantalla del dueño)**. La cámara se ajusta al tamaño del objeto con transición suave.

### B. Texto y datos
4. **Nada de texto ni gráficas dentro del 3D.** Quedan prohibidos los pizarrones, los monitores con cifras, los carteles ladeados y las torres de indicadores. En 3D sólo caben rótulos cortos de piezas: **apagados por defecto**, que aparecen al pasar el ratón y, con el botón «Rótulos», como máximo 8 y sin solaparse.
5. **Dock de instrumentos en DOM.** Gráficas, cifras y trazas van en un panel nítido: canvas a `devicePixelRatio` con la tipografía del lab. Usa el mismo reloj que la escena.
6. **Revelado progresivo.** En el estado inicial se ven **≤ 120 palabras de prosa**, sin contar rótulos de controles ni cifras, y ningún panel propio con barra de scroll. Las ecuaciones, el contrato de fidelidad y los informes van en desplegables cerrados o en la ficha técnica. El quiz va en su cajón o en su modo. La barra de pista fija se sustituye por un aviso que aparece una vez y se desvanece.

### C. Calidad visual
7. **Materiales de catálogo.** PBR con entorno (RoomEnvironment + ACES), con estas condiciones:
   - **Sin ruido de alta frecuencia.** El moteado tipo lija o purpurina se sustituye por variación suave de baja frecuencia; en los estáticos, usa `pielFundicion` (§21 de `_piezas3d.js`).
   - **Sin colores planos.** Nada de colector rosa ni aceite como losa naranja.
   - **Translucidez donde la materia lo es**: vidrio, líquidos, gas y membranas.
   - **Caras de sección** con rayado técnico fino a 45°, de bajo contraste y del tono de la pieza, que se desvanece por debajo de 3 px.
   - **Iluminación de estudio**: sombras suaves y bloom moderado sólo en lo que emite luz.
8. **Formas reales.** Piezas con perfil de torno, chaflanes y nervios, y cortes en media sección que dejan ver el interior. Nada de «cuadritos y cubitos». **Cero normales nulas**: `__diag3d.salud()` debe dar `normalesCero: 0`, porque una normal nula deja la pantalla negra.
9. **Calidad media que no se vea borrosa.** Sólo se elige automáticamente en móviles, en pantallas de menos de 820 px o con ≤ 2 núcleos, nunca «por tener 4 núcleos». Su píxel nunca baja de `min(DPR, 1,5)` y siempre lleva antialias. En la interfaz se lee sin ambigüedad: «Calidad: alta».

### D. Ciencia
10. **Ciencia exacta y probada.** Todo lo que se mueve o se colorea sale de una ecuación real con unidades, nunca de una animación «a ojo». Cada relación nueva lleva su prueba numérica contra valores de referencia: NIST, Schott, tablas de Slater, formas cerradas. Las pruebas son de jest en `src/__tests__/` para los labs base y de un script node para los estáticos. La física de los labs base vive en un módulo puro sin three.
11. **Un solo reloj.** La escena, las gráficas del dock y los números salen del mismo estado del modelo en cada cuadro: mover un control cambia las tres cosas a la vez. En el Otto se midió un error de 0 entre dock y escena.
12. **Fenómeno visible y cámara lenta rotulada.** El alumno ve la causa: cortes, campos, flujos, nubes de probabilidad, partículas coloreadas por temperatura. Si el fenómeno es más rápido que el ojo, la cámara lenta se rotula con su factor real (por ejemplo «×1/5000» en las ruedas del turbo).
13. **Honestidad.** Lo que el modelo simplifica se declara en la ficha o en el contrato de fidelidad, y lo esquemático se rotula como tal (por ejemplo «esquema: tamaños no a escala»). Aplica la regla de rangos frente a falsa precisión del estándar de mecánica.

### E. Pedagogía y lógica
14. **No regalar la respuesta.** Ni la escena, ni el dock, ni la bitácora, ni los mensajes de error muestran la incógnita antes de validar. Las curvas teóricas, los ajustes de recta, la frecuencia cardiaca, el diagnóstico, la base correcta y el número de neutrones aparecen **sólo después** de que el alumno envía su respuesta.
15. **No romper.** Se conservan con sus mismos criterios la lógica, el reto, el quiz, los validadores, el store, el recorrido y `__labDebug` con el puente. Si se mueve un elemento del que dependen el recorrido o las pruebas, se ajustan los selectores y se declara.

### F. Técnica
16. **r3f:** ningún `useFrame` con prioridad > 0. Una prioridad positiva toma el render y, sin EffectComposer (calidad media), el lienzo sale negro.
17. **Rendimiento:** dos niveles de calidad. En alta, como orientación, < 400 k triángulos y < 150 draw calls (`InstancedMesh` y geometrías fusionadas). La geometría pesada se construye fuera del hilo principal si hace falta: el corazón del ECG usa un Web Worker con caída al hilo principal.
18. **Respeta `prefers-reduced-motion`.**

## 4. Definición de terminado

Un lab cumple el estándar cuando pasa **todo** lo siguiente:

- [ ] Pruebas numéricas de su física en verde, con las cifras citadas en el commit.
- [ ] `npx tsc --noEmit -p .` limpio y `npx jest` **completo** en verde. Un golden se actualiza con `-u` sólo si el cambio es intencional y se dice cuál.
- [ ] Si es estático: `node scripts/build-lab.mjs <slug>` sin errores, `node scripts/auditoria/barrido-labs.mjs --solo <slug>` sano y `__diag3d.salud()` con `normalesCero: 0`.
- [ ] Si es base: `node scripts/auditoria/sonda-labs-base.mjs <dir> <id> 1600x900 60000` sin errores propios.
- [ ] Capturas con Playwright (SwiftShader) de **varios estados**: vacío o inicial, fenómeno en marcha, reto validado y calidad media. Se toman a 1366×768, a 1600×900 y a **2020×1055 con `deviceScaleFactor: 1.25`**.
- [ ] **Autocrítica por escrito** contra las dos citas de la §2: ¿está atascado de texto?, ¿se ve de calidad?, ¿es atractivo antes de que el alumno haga nada? Si alguna respuesta es «no», se itera. Se da el conteo de palabras de prosa visibles en el estado inicial.
- [ ] Se marca con `destacada: true` en su `src/labs/<id>/catalogo.ts` y se añade a la lista esperada de `src/__tests__/golden/catalogo.golden.test.ts` (ver §5).
- [ ] Se publica con `npm run deploy:cf` desde un worktree, copiando `public/assets/voz/`. `git push` no publica.

## 5. Cómo se ven en la plataforma

Los labs que cumplen este estándar llevan `destacada: true`. Cada hub de área (`src/app/alumno/laboratorio/<área>/page.tsx`) los pinta **todos** con [`src/components/LabsDestacados.tsx`](../src/components/LabsDestacados.tsx): una sección «Destacadas · N labs de nueva generación 3D» con una tarjeta por lab, en el color del área. No hay límite de una destacada por área: el dueño lo rechazó expresamente.

## 6. Registro de las remodelaciones (2026-10-12 y 13)

### 6.1 Resumen

| # | Lab | Área | Tipo | Commits | Pruebas |
|---|---|---|---|---|---|
| 1 | Ciclo Otto y relación de compresión (`mecanica-111`) | Mecánica | estático | 3fd317f → **7b7a4fc** (v2) | 112 727 comprobaciones, 0 fallos |
| 2 | Construcción atómica e isótopos (`quimica-1`) | Química | base | 14e91c8 → **de24467** (v2) | 102 (82 + 20) |
| 3 | Motor de inducción: par-velocidad (`mecanica-49`) | Mecánica | estático, ensamble | e4e8f16 → **385e457** (v3) | 188/188 |
| 4 | Ley de Snell (`matematicas-7`) | Matemáticas | base | **eb62f6c** | 26 |
| 5 | Electrocardiograma (`biologia-8`) | Biología | base | **2f81e94** | 19 |
| 6 | Electrostática / Coulomb (`fisica-9`) | Física | base | **ed323c9** | 36 |
| 7 | Sobrealimentación turbo e intercooler (`mecanica-123`) | Mecánica | estático, ensamble | 50a2962 → **381aa3e** (v3) | 2118/2118 + Capa 2 969/969 |
| 8 | Máquina de Galton (`matematicas-10`) | Matemáticas | base | **6156e3f** | 27 |
| 9 | Brazo robótico de 4 ejes (`mecanica-3`) | Mecánica | estático, a mano | **d14693d** | 5095/5095 |
| 10 | Síntesis de proteínas (`biologia-3`) | Biología | base | 1aaab06 → **5b716fb** | 30 |

Verificación final sobre el árbol completo: tsc 0 errores, jest con 28 suites y 2113 pruebas, barrido de 128/128 labs estáticos sanos y sonda de los 6 labs base sin errores. Se publicó en Cloudflare el 2026-10-13: primero la versión f22d96e1 y, con los destacados en los hubs (124dae7), la 5587f4db.

### 6.2 Qué se remodeló y qué mejoró, lab por lab

**1. Ciclo Otto**
- **Antes:** un bloque gris con un aro brillante y una biela amarilla incandescente.
- **v1, rechazada:** motor real en media sección, pero con pizarrón 3D, torre de indicadores, paneles con scroll, 16 rótulos y fundición moteada.
- **Ahora (v2):**
  - **Geometría:** culata DOHC con levas de perfil real, taqués, muelles, válvulas con guía y asiento, bujía, junta, camisa de agua, pistón con segmentos y bulón, biela en doble T y cigüeñal con contrapeso.
  - **Física:** biela-manivela exacta; la holgura en el PMS sale de Vc = Vd/(r−1) y cambia a la vista con r; levas a mitad de vueltas (720°). El gas se colorea por la T(θ) del modelo; hay chispa al avance elegido y un frente de llama cuyo volumen es y_b = x_b·T_b/T. El foco de autoencendido aparece donde la integral de Livengood-Wu llega a 1.
  - **Interfaz:** dock DOM con p–V, x_b(θ) e I(θ) bajo un mismo cursor θ, 6 cifras y el pliego de 7 criterios como chips ✓/✗. **80 palabras** visibles al inicio; rótulos apagados.
  - **Materiales:** fundición lisa (`pielFundicion`), colector de hierro con revenido, y aceite y gas translúcidos.
  - **Calidad media:** ya no se elige por tener 4 núcleos, que en la pantalla al 125 % la dejaba borrosa.

**2. Construcción atómica (Q1)**
- **Antes:** modelo de Bohr con anillos de alambre y un núcleo de bolitas mate, pequeño en un lienzo casi vacío.
- **v1, rechazada:** orbitales cuánticos exactos, pero feos hasta llenar el átomo de electrones.
- **Ahora (v2):**
  - **Modo «Átomo» por defecto**, un laboratorio vivo desde el vacío: cápsulas de protones y neutrones, anillo de electrones y plinto holográfico. Cada +p/+n vuela desde su fuente y el núcleo se reacomoda en red FCC. Cada e⁻ entra en espiral, se asienta en su capa (esferas K/L con fresnel) y emite un **fotón con la energía de ionización de Slater**: H 13,61 eV · 91,1 nm; C 11,46 eV frente a los 11,26 de NIST.
  - **Modo «Orbitales»:** |ψ|² volumétrico por raymarching. La ψ de GLSL se genera desde las mismas expresiones que prueba jest. Aufbau, Hund y Pauli, y la Z_eff de Slater contrae el catión y expande el anión.
  - **Bohr** queda como modo histórico declarado.
  - **Lógica:** el mensaje de fallo y los pasos dinámicos ya **no revelan N ni el número de e⁻** (`src/domain/quimica.ts`, `SimuladorClient.tsx`).

**3. Motor de inducción**
- **Ensamble:** 6 piezas reales (estátor de 36 ranuras con devanado de doble capa, rotor de 28 barras inclinadas, tapas con rodamiento 6206, ventilador y cubierta). Al cerrar, un plano de corte deja la sección transversal.
- **Campo giratorio exacto:** líneas de flujo como curvas de nivel de A(r,θ), y las corrientes por fase y de las barras. El rotor gira a (1−s)/P del campo. Un estroboscopio rotulado muestra el deslizamiento.
- **Dock:** curva de Kloss con el punto de operación y el vector espacial de 1,5·Im.
- **v3:** el estátor espera **ya energizado** en el banco desde el segundo cero.
- **Verificación:** Σ i_barra·Br reproduce Kloss con un error de 8·10⁻¹⁵.

**4. Ley de Snell**
- **Banco óptico real:** disco goniométrico anodizado, módulo láser y bloque semicircular con transmisión física. El haz se ve en el aire gracias a una bruma con atenuación de Beer–Lambert.
- **Física:** potencias de Fresnel (Rs, Rp, R; T = 1 − R), polarizador y Brewster, reflexión total por encima del crítico, y dispersión de Cauchy ajustada a BK7 con luz blanca que abre el arcoíris.
- **Dock:** mediciones en sen θ₁ frente a sen θ₂, **sin recta hasta validar**.
- **Fallo corregido:** `BitacoraSnell` dibujaba θ₂(θ₁) durante el reto del cristal misterioso.

**5. Electrocardiograma**
- **Corazón:** corte de cuatro cámaras con válvulas, nodos SA y AV, His, ramas, Purkinje y coronarias, dentro de un torso de vidrio con el triángulo de Einthoven.
- **Física:** activación por eikonal con velocidades por tejido. El vector cardiaco es −K∮Vm·n dA y cada derivación es su proyección (I + III = II).
- **Dock:** tira de papel real a 25 mm/s y 10 mm/mV, 6 derivaciones y lazo vectorcardiográfico.
- **No regala:** ni la FC, ni el RR, ni el diagnóstico.

**6. Coulomb**
- **Banco:** riel anodizado y esferas niqueladas emisivas (rojo +, azul −).
- **Campo:** **líneas integradas con RK4**, 16 por μC (Gauss), que nacen en + y mueren en −; equipotenciales translúcidas perpendiculares a E, incluida la esfera de Apolonio; par acción–reacción y sonda de superposición.
- **Dock:** F–r en log–log con pendiente −2, sin newtons hasta validar.
- **Fallo corregido:** la barra superior se desplazaba a 1366 px.

**7. Turbo e intercooler**
- **Fuera el pizarrón 3D.** El turbo se ve en media sección: rueda de compresor con álabes de retroceso, turbina, cartucho y válvula de descarga.
- **Partículas de masa fija coloreadas por temperatura:** T₂ isentrópica con rendimiento, intercooler con su efectividad, escape al rojo con T₄ del balance del eje, y densidad de partículas que sigue a ρ = p/RT.
- **Dock:** mapa del compresor con bombeo, bloqueo e islas de rendimiento.
- **v3:** el motor respira a 2400 rpm **sin turbo** desde el segundo cero; al montar el turbo, el par sube de 129 a 251 N·m.
- **Fallo corregido:** la ficha §4 salía vacía.

**8. Máquina de Galton**
- **Tablero:** de nogal con vidrio de Fresnel, 55 clavos de latón y bolitas de acero que **se apilan de verdad**; goteo desde el segundo cero.
- **Física:** p es la inclinación visible del tablero, p = ½ + h·tan α/(2w), y cada clavo decide con Bernoulli(p).
- **No regala:** la binomial, la normal y χ² (gl, p-valor) **sólo aparecen tras validar**.

**9. Brazo robótico**
- **Robot:** 4 ejes con eslabones fundidos, servos, corona y piñón 64/12, brida ISO 9409-1 y mazo de cables. Repite su pick & place desde el segundo cero.
- **Cinemática:** directa por DH con tabla en vivo e inversa analítica (codo arriba/abajo). Se ven la envolvente translúcida, la manipulabilidad |det J| y la comparación de PTP frente a LIN con el mismo tiempo.
- **Diagnóstico:** tres fallas físicas (encoder corrido, pinza débil, servo al 80 %).
- **Ficha:** cita ISO 10218, 9283 y 9787.

**10. Síntesis de proteínas**
- **ADN B con geometría medida:** 0,338 nm por par, 10,5 pares por vuelta, Ø 2,0 nm, surcos mayor y menor.
- **Pol II en corte**, con burbuja de transcripción y el NTP equivocado rechazado.
- **Traducción:** 40S y 60S reconocibles, ARNt en L por los sitios A, P y E, y proteína que se pliega por Zimm–Bragg.
- **No regala:** la base ni el aminoácido antes de que el alumno elija.
- **Fallo corregido:** `BitacoraSintesis` ya se lee.

### 6.3 Mejoras transversales de la plataforma
- **Destacados en los hubs:** las 10 tarjetas salen en sus cinco áreas con el componente `LabsDestacados` (§5).
- **Enlaces corregidos en los hubs:** Física decía siempre «Tiro Parabólico» y llevaba a `fisica-1`; Biología y Matemáticas enlazaban siempre a la práctica 1.
- **Calidad media** sin borrosidad en pantallas escaladas, en los labs estáticos (regla 9).
- **`pielFundicion`** (§21 de `_piezas3d.js`): fundición lisa reutilizable.
- **Despliegue documentado:** se sube por worktree con la voz incluida; ver la memoria del proyecto.

## 7. Pendientes conocidos (no cumplen todavía el estándar)
- **ECG:** con dos opciones, el orden de los mensajes de `evaluarB8` deja adivinar el diagnóstico, y «Reiniciar» conserva el mismo paciente (regla 14).
- **Ficha §4 vacía** en `catalizador-sondas` y `common-rail-precalentamiento`: es el mismo fallo que se corrigió en el turbo.
- **Otto:** la detonación cerca del PMS se ve poco.
- **Q1:** el plano de corte de «Orbitales» está fijo en z = 0.
- **CI de GitHub:** `npm ci` falla desde agosto, así que el CI no verifica nada; la verificación se hace en local.
- **Labs de mecánica anteriores con pizarrón 3D:** siguen como estaban. Pasan a este estándar cuando se remodelen.
