# MEC-97 · Lógica Neumática Y/O y Temporización

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-05 — «Implementa lógica neumática Y/O y temporización»
**Simulador:** `/labs/logica-neumatica-temporizacion.html`
**Slug de construcción:** `logica-neumatica-temporizacion`

---

## Qué enseña

1. **En neumática el 1 lógico tiene un valor en bar.** La válvula de simultaneidad entrega `min(p1, p2)` y la selectora entrega `max(p1, p2)`. No hay umbral interno que regenere la señal: la salida sólo es un 1 útil si supera la presión de pilotaje de la válvula de potencia (2,5 bar).
2. **Un bloqueo puede no ser una avería.** En la estación de encolado, una simultaneidad sana entrega `min(6; 2) = 2,00 bar` y la válvula de potencia no conmuta. Nada está roto: es aritmética. El diagnóstico correcto es comprar un relevador de baja presión, no cambiar la válvula.
3. **La función Y a veces es gratis.** Dos válvulas 3/2 en serie realizan la Y con **cero** componentes añadidos, y en la prensa de embutido ésa es la solución mínima: la simultaneidad allí es dinero tirado.
4. **La serie tiene un límite topológico, no de presión.** Sólo se pueden encadenar dos **órganos de mando** alimentados por la misma línea. Si una entrada es una señal ya generada aguas arriba (final de carrera, célula), la serie deja de existir aunque las presiones sean idénticas.
5. **El relevador de baja presión se compra sólo cuando hace falta.** Dispara con 1,2 bar en su pilotaje y repone la línea a la presión de red. Es la única solución válida en encolado y es dinero muerto en las otras cuatro estaciones.
6. **El empalme en T nunca es válido y casi siempre «funciona».** Une dos líneas en un nodo y abre un camino permanente hacia el escape de la válvula inactiva. Por eso se monta tanto: la máquina arranca.
7. **El T miente de verdad cuando las entradas son distintas.** En la puerta de horno salen 5,85 bar pulsando el pedal (Qn 350) y 1,00 bar pulsando el panel (Qn 100). Es el síntoma clásico de taller: *funciona con un botón y con el otro no*.
8. **La fuga del T se mide, no se estima.** 149 l/min continuos → 71,5 m³ por turno de 8 h → 7,9 kWh a 0,11 kWh/m³. Una válvula selectora de dos pesos se paga sola.
9. **El retardo no se elige: se integra.** Depósito llenado a través del estrangulador según ISO 6358, con rama sónica y rama subsónica, en 4000 pasos hasta los 2,5 bar de pilotaje.
10. **El caudal nominal de catálogo es un punto subsónico.** Qn se mide de 7 a 6 bar absolutos, así que `C = Qn / 4,7062` — no `C = Qn/7`.
11. **El tiempo depende de la red y de forma no lineal.** Perder un bar alarga el retardo un 17,0 % desde 6 bar; el segundo bar cuesta un 21,9 % adicional. Cuanto más baja la red, más caro sale cada bar.
12. **«Que dé el tiempo» no basta: hay que dar el tiempo con la red caída.** La robustez frente a una caída de 1,0 bar se evalúa como criterio separado, y es la razón por la que la ventana se comprueba dos veces.
13. **Repetible no es lo mismo que correcto.** Por debajo de una apertura relativa k = 0,15 el tornillo del estrangulador deja de ser repetible: el mismo ajuste da tiempos distintos cada mañana. La solución es subir de depósito y abrir, no cerrar más.
14. **El temporizador rara vez se nota en la factura del aire, salvo cuando el cilindro es pequeño.** El depósito de temporización pesa un 2,0 % del aire del ciclo en la prensa Ø63 y un **37,3 %** en el encolado Ø32 — mismo componente, peso opuesto.

---

## Lógica (verificada `verif_logica.mjs` — 181/181)

### Constantes selladas

| Constante | Valor | Origen |
|---|---|---|
| `P_ANR` | 1,000 bar abs | ISO 8778 (aire de referencia normal) |
| `P_ATM` | 1,013 bar abs | atmósfera de referencia |
| `B_CRIT` | 0,45 | ISO 6358, valor típico dentro del rango 0,2–0,5 |
| `P_PILOT` | 2,5 bar | criterio de fabricante (rango 1,5–3,0) |
| `P_PILOT_LP` | 1,2 bar | pilotaje del relevador de baja presión (rango 0,8–1,5) |
| `K_MIN` | 0,15 | apertura mínima repetible (rango 0,10–0,20) |
| `P_CAIDA` | 1,0 bar | caída de red de referencia (rango 0,5–1,5) |
| `C_ESTR` | 1,4 l/(min·bar) | coeficiente sónico del estrangulador a plena apertura |
| `E_AIRE` | 0,11 kWh/m³ | coste energético del aire comprimido (rango 0,09–0,13) |

### Fórmulas

| Magnitud | Expresión |
|---|---|
| Caudal ISO 6358 sónico (`r ≤ b`) | `Q = C · p1` |
| Caudal ISO 6358 subsónico (`r > b`) | `Q = C · p1 · √(1 − ((r − b)/(1 − b))²)`, con `r = p2/p1` |
| Factor del caudal nominal | `F_QN = 7·√(1 − ((6/7 − b)/(1 − b))²) = 4,7062` |
| Coeficiente sónico desde catálogo | `C = Qn / F_QN` → `Qn 100 → C = 21,2484`; `Qn 350 → C = 74,3692` |
| Retardo del temporizador | `t = Σ (V/P_ANR)·Δp / Q(p)` sobre 4000 pasos, de `P_ATM` a `P_PILOT + P_ATM` |
| Presión del nodo en T | bisección (70 iteraciones) que iguala `Q(Ca, p1, m)` con `Q(Ce, m, P_ATM)` |
| Salida por elemento | serie → `pRed`; simultaneidad → `min`; selectora → `max`; relevador → `min ≥ 1,2 ? min(pRed, max) : 0`; T → `p_nodo` |
| Coste (orden lexicográfico) | `[nº de componentes, índice del depósito, −margen]` |
| Margen | `min(t/tMin, tMax/tD)` con `tD` = retardo con la red caída 1,0 bar |

El estrangulador a plena apertura equivale a **Qn = 6,589 l/min** (`C_ESTR · F_QN`).

### Catálogo de montajes

| Clave | Montaje | Función | Componentes |
|---|---|---|---|
| `serie` | Dos 3/2 en serie | Y | 0 |
| `simult` | Válvula de simultaneidad | Y | 1 |
| `ampl` | Relevador de baja presión + simultaneidad | Y | 2 |
| `select` | Válvula selectora | O | 1 |
| `te` | Empalme en T | O | 0 (nunca válido) |

**Depósitos:** 50 / 100 / 250 / 500 / 1000 cm³ → aire de temporización por ciclo 0,125 / 0,250 / 0,625 / 1,250 / 2,500 l ANR (el de 1000 cm³ gasta **20 veces** lo que el de 50).

**Aperturas del estrangulador:** k = 0,10 · 0,15 · 0,25 · 0,40 · 0,60 · 0,80 · 1,00 (la de 0,10 queda siempre por debajo del mínimo repetible).

### Criterios (7) y cuántas veces falla cada uno EN SOLITARIO

| Criterio | Qué comprueba | Fallos en solitario |
|---|---|---|
| `okFunc` | El montaje realiza la función que pide la estación | 36 |
| `okTopo` | La serie sólo encadena dos órganos de la misma línea | 9 |
| `okPres` | La salida supera los 2,5 bar de pilotaje | 6 |
| `okFuga` | El montaje no deja un camino permanente a la atmósfera | 2 |
| `okVent` | El retardo cae dentro de la ventana `[tMin, tMax]` | 58 |
| `okRob` | La ventana se sigue cumpliendo con 1,0 bar menos de red | 10 |
| `okK` | La apertura es repetible (`k ≥ 0,15`) | 2 |

Ningún criterio es texto muerto: los siete disparan solos en al menos dos combinaciones del barrido, y las 13 familias de diagnóstico se emiten todas.

El **coste** no es un precio: es un orden de complejidad. Primero el número de componentes, después el depósito más pequeño (menos aire por ciclo) y, a igualdad de ambos, el mayor margen frente a los extremos de la ventana. Por eso «vale» y «es la solución» no son lo mismo: montar una simultaneidad donde bastan dos 3/2 en serie es válido y es un error de proyecto.

---

## Las cinco estaciones

| Estación | Función | Red | Entradas | Ventana | Cilindro |
|---|---|---|---|---|---|
| Prensa de embutido | Y | 6 bar | Pulsador izquierdo + derecho (órganos, 6 bar, Qn 100) | 1,70 – 2,60 s | Ø63, 150 mm, 200 mm/s |
| Puerta de horno | O | 6 bar | Pulsador de panel (Qn 100) + Pedal lejano (Qn **350**) | 6,00 – 16,00 s | Ø50, 400 mm, 250 mm/s |
| Estación de encolado | Y | 6 bar | Final de carrera a1 (señal) + Rama regulada a **2 bar** (señal) | 14,00 – 30,00 s | Ø32, 100 mm, 150 mm/s |
| Cabina de pintura | Y | **5 bar** | Dos señales a 5 bar (Qn 100) | 3,00 – 6,50 s | Ø40, 200 mm, 180 mm/s |
| Alimentador vibrante | O | 6 bar | Pulsador de ciclo (órgano) + Señal de la célula (señal) | 0,80 – 1,60 s | Ø32, 50 mm, 300 mm/s |

### Terna ganadora de cada estación

| Estación | Elemento | Depósito | k | t | t con red caída | Margen | Ciclo | Ciclos/h | Aire/ciclo | % del depósito | Válidas |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Prensa de embutido | Dos 3/2 en serie | 50 cm³ | 0,40 | 1,910 s | 2,235 s | ×1,124 | 3,335 s | 1 080 | 6,353 l | 2,0 % | 6/175 |
| Puerta de horno | Válvula selectora | 100 cm³ | 0,15 | 10,187 s | 11,918 s | ×1,342 | 13,131 s | 274 | 10,385 l | 2,4 % | 7/175 |
| Estación de encolado | Relevador + simultaneidad | 250 cm³ | 0,25 | 15,281 s | 17,877 s | ×1,091 | 16,520 s | 218 | 1,674 l | **37,3 %** | 6/175 |
| Cabina de pintura | Válvula de simultaneidad | 50 cm³ | 0,25 | 3,575 s | 4,357 s | ×1,192 | 5,620 s | 641 | 2,906 l | 4,3 % | 6/175 |
| Alimentador vibrante | Válvula selectora | 50 cm³ | 0,80 | 0,955 s | 1,117 s | ×1,194 | 1,265 s | 2 846 | 0,649 l | 19,2 % | 2/175 |

Las cinco ternas ganadoras son distintas entre sí en el elemento (serie, selectora, relevador, simultaneidad, selectora), de modo que ningún montaje es «la respuesta buena» del laboratorio.

---

## Presión de salida por montaje (bar) — `*` = válido

| Estación | serie | simultaneidad | relevador | selectora | empalme T |
|---|---|---|---|---|---|
| Prensa de embutido | 6,00 * | 6,00 * | 6,00 * | 6,00 | 4,52 |
| Puerta de horno | 6,00 | 6,00 | 6,00 | 6,00 * | **1,00** |
| Estación de encolado | 6,00 | **2,00** | 6,00 * | 6,00 | 1,36 |
| Cabina de pintura | 5,00 | 5,00 * | 5,00 * | 5,00 | 3,73 |
| Alimentador vibrante | 6,00 | 6,00 | 6,00 | 6,00 * | 4,52 |

Lecturas obligadas de esta tabla:

- En la **prensa** valen tres montajes y gana el que no cuesta nada. Que la serie sea válida sólo ocurre cuando las dos entradas son órganos de la misma línea (`serieVale` = verdadero en prensa y puerta; falso en encolado, cabina y alimentador).
- En el **encolado** la simultaneidad entrega 2,00 bar: por debajo de los 2,5 de pilotaje. El circuito está sano y la máquina no arranca.
- En la **puerta** la serie da 6,00 bar y no vale: realiza la función Y y la estación pide O. Un montaje puede tener la presión perfecta y seguir siendo la pieza equivocada.
- El **empalme en T** entrega entre 1,00 y 4,52 bar según la estación y no es válido en ninguna, ni siquiera donde supera el pilotaje.

---

## El empalme en T, estación por estación

| Estación | p desde A | p desde B | Q por el nodo | Volumen/turno | Coste |
|---|---|---|---|---|---|
| Prensa de embutido | 4,52 bar | 4,52 bar | 117 l/min | 56,4 m³ | 6,2 kWh |
| Puerta de horno | **1,00 bar** | **5,85 bar** | 149 l/min | 71,5 m³ | 7,9 kWh |
| Estación de encolado | 4,52 bar | 1,36 bar | 117 l/min | 56,4 m³ | 6,2 kWh |
| Cabina de pintura | 3,73 bar | 3,73 bar | 101 l/min | 48,3 m³ | 5,3 kWh |
| Alimentador vibrante | 4,52 bar | 4,52 bar | 117 l/min | 56,4 m³ | 6,2 kWh |

El nodo es simétrico cuando las dos entradas tienen el mismo caudal nominal y la misma presión, y se desequilibra en cuanto una de ellas es más grande (puerta: pedal Qn 350 frente a panel Qn 100) o viene de una rama regulada (encolado: 2 bar).

---

## Sensibilidad a la caída de red

| Estación | t nominal | −1 bar | −2 bar | Coste del 2.º bar |
|---|---|---|---|---|
| Prensa de embutido | 1,910 s | 2,235 s (+17,0 %) | 2,723 s (+42,6 %) | +21,9 % |
| Puerta de horno | 10,187 s | 11,918 s (+17,0 %) | 14,524 s (+42,6 %) | +21,9 % |
| Estación de encolado | 15,281 s | 17,877 s (+17,0 %) | 21,785 s (+42,6 %) | +21,9 % |
| Cabina de pintura (5 bar) | 3,575 s | 4,357 s (**+21,9 %**) | 5,862 s (+64,0 %) | +34,5 % |
| Alimentador vibrante | 0,955 s | 1,117 s (+17,0 %) | 1,362 s (+42,6 %) | +21,9 % |

El porcentaje sólo depende de la presión de partida, no del volumen ni de la apertura: por eso la cabina, que ya trabaja a 5 bar, paga por el primer bar lo que las demás pagan por el segundo.

---

## Anclas de honestidad

- **Cero componentes también es una respuesta.** La solución mínima de la prensa no compra nada: dos 3/2 en serie. El laboratorio califica como error montar la simultaneidad allí, aunque funcione.
- **El bloqueo del encolado no es una avería.** La simultaneidad entrega 2,00 bar porque una de sus entradas viene regulada a 2 bar. Ninguna pieza está rota y ningún cambio de válvula lo arregla.
- **La serie no falla por presión, falla por topología.** En encolado, cabina y alimentador la serie entregaría la presión de red íntegra y aun así no se puede montar: al menos una entrada es una señal ya generada.
- **El empalme en T se declara «funciona pero no vale».** El banco no lo presenta como algo que se avería: lo presenta como algo que arranca la máquina, degrada la presión de forma asimétrica y factura aire todos los turnos.
- **El relevador de baja presión es dinero muerto en cuatro de las cinco estaciones.** Sólo se compra donde la simultaneidad no alcanza el umbral.
- **La apertura de 0,10 nunca es aceptable**, aunque dé el tiempo pedido: por debajo de k = 0,15 el ajuste deja de ser repetible. El propio banco muestra casos donde el único fallo es ése.
- **El peso del temporizador en el consumo depende del cilindro, no del depósito.** 2,0 % en la prensa Ø63, 37,3 % en el encolado Ø32.
- **ISO 13851 / EN 574** (mando a dos manos) e **ISO 8573-1** (calidad del aire) se citan y **no** se simulan; la segunda se desarrolla en MEC-99. Los mandos regulados (estrangulación de entrada/salida, escape rápido) quedan para MEC-107 y el método cascada para MEC-98.
- Los valores de pilotaje, apertura mínima repetible, caída de red y coste del aire son **criterios de fabricante declarados con su rango**, no valores normativos. La `b = 0,45` es un valor típico dentro del rango 0,2–0,5 que admite la ISO 6358.

---

## Molde y estructura

**Molde S** (banco 3D + pizarrón 1024×768 fuera de pantalla + panel de telemetría HTML), cuatro modos:

| Modo | Contenido |
|---|---|
| `logica` | Circuito ISO 1219 del montaje elegido, con la bola de la simultaneidad/selectora en su posición real, y la presión de salida frente al umbral de pilotaje |
| `fuga` | El empalme en T resuelto: presiones asimétricas por entrada, caudal por el nodo, volumen por turno y coste en kWh |
| `tiempo` | Matriz depósito × apertura con la ventana de la estación marcada, curva de llenado ISO 6358 y comprobación con la red caída |
| `reto` | Estación sorteada; se proyectan elemento, depósito y apertura con calificación triple ortogonal |

El banco 3D contiene las dos entradas, el elemento lógico con su bola, el estrangulador, el depósito, la válvula de potencia con su carrete, el cilindro con su carga y siete LEDs de estado, todos con *picking* por hover. La animación de ciclo muestra la rama bloqueada cuando el montaje no alcanza el pilotaje.

**Reto de calificación triple ortogonal:** cada eje (`elem`, `dep`, `aper`) se califica con los otros dos ya correctos. El barrido de las 875 combinaciones confirma que existe exactamente una terna válida y de coste mínimo por estación. La configuración de arranque falla en los tres ejes en las cinco estaciones.

---

## Verificación en dos capas

**Capa 1 — numérica:** `verif_logica.mjs`, **181 comprobaciones, 0 fallos**. Cubre las dos ramas de la ISO 6358, la deducción de `C` desde el caudal nominal, la monotonía del retardo en volumen y en apertura, la bisección del nodo en T (conservación de caudal), las cinco tablas de salida por montaje, el barrido completo de 875 combinaciones con unicidad de la terna mínima, los recuentos de fallo en solitario de los siete criterios y las 13 familias de diagnóstico.

**Capa 2 — navegador:** Playwright contra `window.__labDebug` sobre servidor HTTP local, en dos arneses: estado estático (modos, telemetría, circuito, reto) y recorrido guiado completo (`runAuto`).

**Capa 3 — regresión del proyecto:** `npx tsc --noEmit` limpio y `npx jest` completo, con los *golden snapshots* actualizados en modo aditivo.

---

## Referencias

- **ISO 1219-1** — Símbolos gráficos de válvulas lógicas, estranguladores, depósitos y actuadores.
- **ISO 6358** — Características de caudal de componentes neumáticos: **simulada** con sus dos ramas y con `b` dentro del rango normativo.
- **ISO 8778** — Aire de referencia normal (ANR).
- **ISO 15552** — Cilindros neumáticos: diámetros y parejas émbolo-vástago.
- **ISO 4414** — Seguridad de los sistemas neumáticos.
- **ISO 13851 / EN 574** — Mando a dos manos: **citada, no simulada**.
- **ISO 8573-1** — Clases de pureza del aire comprimido: **citada, no simulada** (se desarrolla en MEC-99).
- **Criterios de fabricante con rango declarado** — pilotaje 2,5 bar (1,5–3,0), pilotaje del relevador 1,2 bar (0,8–1,5), apertura mínima repetible 0,15 (0,10–0,20), caída de red 1,0 bar (0,5–1,5), coste del aire 0,11 kWh/m³ (0,09–0,13).
- **Verificación numérica propia** — 181 comprobaciones, 13 familias de diagnóstico, barrido de 875 combinaciones.
