# MEC-121 · Eficiencia del catalizador y sondas de oxígeno

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-11 — *Evalúa la eficiencia del catalizador con las sondas de oxígeno anterior y posterior* (molde P+S, panel-instrumento virtual + simulación de proceso)
- **Simulador:** `/labs/catalizador-sondas.html`
- **Slug:** `catalizador-sondas`
- **Ancla curricular:** AUT-C emisiones y postratamiento (liga con `mecanica-117` inyección y sonda lambda, `mecanica-118` formas de onda de los sensores, `mecanica-120` gases de escape y verificación) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** NOM-167-SEMARNAT-2017 (verificación por sistema de diagnóstico a bordo para modelos 2006 y posteriores) · NOM-041-SEMARNAT-2015 (TABLA 1 y TABLA 2, transcritas de `mecanica-120`) · NOM-047-SEMARNAT-2014 · SAE J1979 / ISO 15031-5 (modos $01 PID $01, $03 y $06) · SAE J2012 / ISO 15031-6 (P0420, P0430, P2270, P2271) · Heywood, *Internal Combustion Engine Fundamentals* (postratamiento catalítico) · Bosch, *Automotive Handbook* (sondas de circonio y almacenamiento de oxígeno) · Twigg, M. V., *Applied Catalysis B* 70 (2007) 2-15 (envejecimiento térmico, envenenamiento y el papel del rodio)

Cierra el hilo que `mecanica-120` dejó abierto explícitamente: allí se dijo que el método de diagnóstico a bordo de la NOM-167 «ya es otro laboratorio». Éste es ese laboratorio.

---

## Qué enseña

1. Que **el ciclo límite del lazo cerrado no se escribe: se integra**. El ordenador rampa la mezcla a 0,10 de λ por segundo, la sonda anterior la ve con 0,112 s de retardo de transporte más 0,09 s de respuesta propia, y al cruzar 0,45 V invierte la rampa. De ahí salen el periodo (**0,808 s**, 1,42 Hz) y la amplitud (**±0,0202** de λ) sin que ninguno esté escrito como constante. En marcha mínima el mismo lazo da 2,20 s y ±0,0302: el ciclo es más lento y más basto con menos caudal, y ésa es la razón física de que el monitor tenga ventana de habilitación.

2. Que **una sonda posterior sana vive ALTA y quieta** —0,63 V con 0,032 V de recorrido— y que eso no es una mezcla rica. El gas que sale del catalizador viene equilibrado por el desplazamiento del gas de agua y lleva hidrógeno, al que el circonio es hipersensible. Es la firma de que la lata trabaja. En el modelo ese sesgo se apaga exactamente cuando el oxígeno rompe, porque entonces el propio catalizador se lo quema; por eso la señal de atrás no se degrada suavemente sino que se desploma.

3. Que **el almacén de oxígeno es un integrador con rodilla**. 0,095 g de O₂ por litro de cilindrada cuando es nuevo (0,152 g en el 1.6), y lo que se escapa va con Θ elevado a 6: hasta el 80 % de lleno no pasa casi nada. Con la lata nueva ΔΘ = 0,06 y la sonda de atrás no se entera; con el catalizador gastado ΔΘ = 0,91 y toca los dos topes.

4. Que **el tiempo de almacenamiento es capacidad entre caudal**, y por eso la prueba se hace en marcha mínima. El catalizador nuevo da **3,51 s en mínima y 0,72 s en crucero**: 4,88 veces más segundos con el mismo depósito. Los 3,51 s caen dentro de la horquilla de 2 a 8 s con que se mide un catalizador nuevo en un banco real, y son el ancla que fija la capacidad de este modelo.

5. Que **la oscilación no es un defecto del control: es el mecanismo de la conversión**. El almacén mantiene el λ interno pegado a uno mientras el de entrada oscila ±2 %, y por eso las dos reacciones opuestas del tres vías pueden ir a la vez. Quitando sólo el cerio y dejando los metales intactos, el HC de cola sube de **46 a 110 ppm** sin que se envenene un átomo de platino.

6. Que **guardar no es convertir**. La ventana mide **0,0130 de λ** (0,9960 a 1,0090 con las tres por encima del 90 %) y además hace falta pasar de la temperatura de encendido: 230 °C para el CO, 270 °C para el HC, 280 °C para el NOx. El monitor no mide ninguna de las dos condiciones.

7. Que **el umbral del monitor es una calibración contra la ley, no física**. Con el índice en 0,32 el monitor salta cuando el HC de cola llega a **148 ppm, 1,48 veces el límite de 100** de la TABLA 1 — que es lo que la reglamentación de diagnóstico a bordo exige. En ese punto la lata conserva el 21,3 % de su cerio y da 0,78 s de almacenamiento.

8. Que **de esa calibración sale una banda ciega de diseño**. La ley rechaza a partir de la edad 0,240 (≈ 82 000 km) y el testigo no se enciende hasta la 0,358 (≈ 122 000 km). En esos **40 000 km el coche reprueba la verificación con el tablero limpio**, y no hay nada roto.

9. Que **hay un P0420 con el catalizador nuevo**. Una sonda anterior que lee 0,1 V de más hacia rica deja el almacén lleno para siempre: índice **0,737 con 37 ppm de HC**. Con la sonda anterior lenta, índice 1,265 con 47 ppm. Las dos veces la pieza cara está intacta.

10. Que **el caso contrario es peor porque no avisa**. El fósforo del aceite tapa los metales y deja el cerio entero: índice 0,107, almacenamiento 2,95 s, y **539 ppm de HC**. El envenenamiento del rodio es más fino todavía: HC 46 ppm perfecto, índice 0,099 perfecto, **1 662 ppm de NOx**. Pasa el monitor, pasa el estático —que no limita NOx— y sólo lo caza el dinámico.

11. Que **hay un instrumento que engaña a otros dos**. El monitor y la prueba de almacenamiento leen los dos por la sonda posterior. Con esa sonda lenta y el catalizador agotado: índice 0,105 y cronómetro 0,74 s, los dos normales, con **374 ppm de HC** saliendo. El analizador de gases es el único que no pasa por ahí.

12. Que **la misma avería da dos códigos según su tamaño**. Una fuga pequeña tras la lata cancela el sesgo de hidrógeno y deja la señal en 0,43 V, sobre el umbral, donde cualquier rizo la cruza: **P0420**. Una fuga grande la clava en 0,20 V: **P2270**, sonda posterior clavada en pobre. Sólo uno de los dos códigos nombra al catalizador.

13. Que **eso se cuenta**. Nueve averías por cinco edades, 45 celdas: el ordenador **acierta en 25 y falla en 20** — 4 acusando a un catalizador limpio y 16 callándose con un coche que reprueba. Los dos números salen de recorrer la rejilla, no están escritos en el modelo.

14. Que **un coche sin sonda posterior no se equivoca: no opina**. El TBI de 1992 no puede encender un P0420 en ninguna de las 45 combinaciones. Para ese vehículo el escáner no es una segunda opinión, es un instrumento que no existe.

---

## El molde

**P+S** (panel-instrumento virtual + simulación de proceso), el mismo de `mecanica-120`. No hay nada que ensamblar: lo que se manipula son cuatro mandos —vehículo, edad del catalizador, avería y punto de trabajo— y lo que hay que aprender a leer son tres instrumentos que no siempre coinciden.

Siete vistas: `sondas` (las dos señales), `almacen` (el depósito y la rodilla de ruptura), `prueba` (el cronómetro intrusivo), `ventana` (dónde convierte y dónde no), `monitor` (el umbral contra la ley), `censo` (las 45 celdas) y `reto` (diagnóstico a ciegas).

El reto pide **qué hay que cambiar**, no qué avería es. Y la respuesta se deriva del estado del coche, no de una lista escrita al lado de cada avería: si la conversión se cayó pero el almacén sigue entero, el dictamen correcto incluye arreglar la causa aguas arriba, porque poner una lata nueva sin quitar el veneno la mata en unos miles de kilómetros.

---

## Lo que NO modela, y se declara

- El motor por dentro. Los gases de entrada al catalizador son fijos por arquetipo: en lazo cerrado y a λ ≈ 1 lo que cambia de un caso a otro es la lata. Para ver los gases de motor moverse con la mezcla está `mecanica-120`.
- La cinética química del catalizador. La conversión es una ventana contra λ por una curva de encendido, no Langmuir-Hinshelwood ni difusión en el poro.
- El frente de saturación viajando por el monolito: el almacén es un solo depósito con una rodilla de exponente 6.
- El balance térmico de la lata: la temperatura es un dato del punto de trabajo.
- El arranque en frío, que es donde un coche moderno emite la mayor parte de su HC del ciclo.
- La corrección por humedad de los NOx y el reparto del HC entre especies.
- El filtro de partículas y el catalizador de almacenamiento de NOx: esto es un tres vías de gasolina estequiométrica.

Los exponentes del envejecimiento (3,5 del cerio, 1,6 de la oxidación, 1,4 de la reducción) y el ensanchamiento × 2,6 de la oscilación durante la prueba son **ajustes didácticos declarados**, elegidos para que el umbral caiga donde la reglamentación pide. La capacidad de 0,095 g/L sí está anclada contra la medida real.
