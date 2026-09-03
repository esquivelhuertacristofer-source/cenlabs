# MEC-125 · El arranque: caídas de tensión y arranque en frío

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-A1 — *Diagnostica el circuito de arranque por caídas de tensión* (molde E+S, ensamble 3D + simulación con mode-lock)
- **Simulador:** `/labs/arranque-caidas-de-tension.html`
- **Slug:** `arranque-caidas-de-tension`
- **Ancla curricular:** AUT-Y sistemas eléctricos del vehículo y diagnóstico (liga con `mecanica-60` curva V–I y tolerancias, `mecanica-64` transitorio RC, `mecanica-66` diagnóstico de fallas por bisección, `mecanica-74` conductores y protecciones, `mecanica-111` ciclo Otto, `mecanica-115` lubricación) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** SAE J537 (baterías de arranque: el ensayo de arranque en frío, 30 s a −18 °C sin bajar de 7,2 V) · SAE J541 (caída de tensión del circuito de arranque) · SAE J1127 y J1128 (cables) · SAE J300 (clasificación de viscosidad de aceites) · Bosch, *Automotive Handbook* y *Automotive Electrics and Automotive Electronics* · Denton, *Automobile Electrical and Electronic Systems* · Heywood, *Internal Combustion Engine Fundamentals*, cap. 13 · Taylor, *The Internal-Combustion Engine in Theory and Practice*

Abre el bloque eléctrico del motor y cierra el hilo que dejaron `mecanica-60` y `mecanica-66`: allí se aprendió que una resistencia sólo se manifiesta con corriente y a diagnosticar por bisección; aquí eso se aplica **al circuito de más corriente que lleva un coche**, con la avería que el método no puede encontrar puesta encima de la mesa.

---

## Qué enseña

1. Que **la medida que todo el mundo hace es la que menos dice**. Con el utilitario 1.6 a 20 °C y la batería llena, **ocho de los nueve montajes dan exactamente 12,59 V en reposo** —borne oxidado, masa floja, contactos picados, cable de menos sección, batería sulfatada, escobillas gastadas y solenoide flojo, además del coche sano—. Sólo el vaso en corto se separa (10,49 V). Y no es casualidad de esa mañana: pasa en las cinco.

2. Que la razón es **la ley de Ohm y nada más**: en circuito abierto no circula corriente, y una resistencia sin corriente no cae tensión. El laboratorio lo comprueba tramo a tramo y montaje a montaje: la caída de cada tramo es exactamente su resistencia por la corriente del cruce, y las cinco suman el lado positivo más la masa.

3. Que **el límite de 0,20 V es POR CONEXIÓN, no por cable**, y confundirlo condena a un vehículo sano. La furgoneta lleva la batería bajo el asiento: 3,50 m de 50 mm² que, sanos, caen **0,30 V con 246 A**. A una conexión se le exige un umbral fijo; a un cable, que caiga lo que su longitud y su sección predicen —aquí, más de 1,6 veces su valor calculado—. Los dos criterios están separados en el modelo, y la vista de tramos los pinta con colores distintos.

4. Que **hay una avería que este procedimiento no puede encontrar**. Con las escobillas gastadas las cinco caídas salen dentro de límite, la batería aguanta la tensión y el coche gira a **191 rpm en vez de 216**, con **menos** corriente, no más. Lo que subió está dentro del arranque, y un procedimiento de caídas mide conexiones. El punto ciego está **contado y no afirmado**: en **11 de las 180 casillas** de los cuatro censos el coche no arranca y el procedimiento no señala nada.

5. Que **el frío ataca por los dos lados a la vez**. El mismo coche sano pasa de **225 a 144 rpm** entre una mañana de 35 °C y otra de −18 °C con la batería al 50 %, y la corriente **sube** de 175 a 260 A. La resistencia interna de la batería pasa de 3,11 a 7,08 mΩ (ley de Arrhenius) y el aceite se espesa: la que empuja da menos y el que se deja arrastrar pide más.

6. Que **la tensión en reposo esconde un tercio de la batería**. En esa misma mañana sólo baja de 12,61 a 12,10 V —cinco décimas— mientras la corriente de arranque en frío cae de 640 a **434 A, un −32,2 %**. Marca bien y no arranca.

7. Que **la etiqueta de la batería es una norma y no un adorno**. La SAE J537 exige entregar esos amperios durante 30 s a −18 °C sin bajar de 7,2 V, y de ahí se deduce cuánto puede valer su resistencia interna: **3,556 mΩ** para una de 640 A. Todo el modelo de batería está anclado a ese ensayo, así que los amperios que el laboratorio calcula para cada mañana se pueden comparar con los de la etiqueta.

8. Que **el aceite decide si arranca, y no sólo en el frío**. Los tres grados dan **220, 216 y 209 rpm** a 20 °C y **160, 144 y 118** a −18 °C, con el motor pidiendo 140: con el 15W-40 no arranca y con el 0W-20 sí. Un grado SAE necesita **dos** números —lo espeso que está templado, que viene del segundo, y la pendiente con la que se espesa, que viene del primero—; con uno solo, los tres aceites salían idénticos a 20 °C y el mando no movía ni una rpm.

9. Que **el régimen de arrastre no se declara: se busca**. El par que da el arranque baja con el régimen —la fuerza contraelectromotriz le come tensión— y el que pide el motor sube; donde se cruzan, ahí gira. No hay fórmula cerrada: hay una bisección de sesenta pasos, y por eso cambiar **un solo miliohmio** de un tramo mueve la recta entera y con ella el punto de funcionamiento. Con el rotor bloqueado el arranque pide **746 A** y da **265 N·m** en el cigüeñal; en vacío llega a **291 rpm** de cigüeñal, con una relación total de **57,6**.

10. Que **la resolución de los aparatos es parte del diagnóstico**. Los nueve montajes del utilitario templado dan nueve corrientes distintas —de 185,2 a 191,0 A—, pero una pinza de taller resuelve al cuarto de centenar de amperios y las mete **todas en dos cajones**; a −18 °C, **en uno solo**. El mejor instrumento del juego, la caída de todo el lado positivo, separa 5 de los 9.

11. Que **hay parejas que ningún instrumento separa**. De los 540 casos posibles, **480 tienen una sola respuesta**; los 60 que no van por parejas simétricas: 27 son «todo bien» contra «escobillas gastadas» y 3 son, en la furgoneta, un borne sucio contra un cable de menos sección —los dos en el lado positivo, y esa medida ve **el lado, no el punto**—. El reto sólo se arma con casos que tienen solución, y el censo enseña los que no.

12. Que **el motor no es parte del circuito**: es la carga. Por eso no está entre las seis piezas que se montan, y por eso el inducido no está entre los cinco tramos que se miden. Ponerlo lo convertía en «el peor tramo» de todos los ensayos —su resistencia es la mayor con diferencia— y tapaba a los demás.

---

## Cómo está verificado

- **Capa 1** (`scripts/auditoria/.c1_A1.mjs`): recorta el motor sellado del `.body.js` y lo valida en Node, sin navegador. **14 002 comprobaciones** sobre las 540 configuraciones: la batería en circuito abierto, el CCA recuperado exacto desde la etiqueta, el frío sin cambios de signo, el cobre, los dos criterios de tramo, el cruce, el ensayo sano en las cinco mañanas, la ley de Ohm cerrada, el orden de los aceites, el censo, el punto ciego contado, el reto con solución única y sus grupos simétricos, la resolución de los aparatos y el separador decimal de toda cadena que lea una persona.
- **Capa 2** (`scripts/auditoria/.c2_A1.mjs`): conduce la página real en Chromium por `window.__labDebug`. El mode-lock, las siete vistas con el pizarrón por encima de 480 px, los tres centinelas de materiales y posiciones, la ley de Ohm en la página, la furgoneta sana con su cable por encima del límite de conexión, el punto ciego, el frío, los aceites, el censo casilla a casilla, el reto sin filtraciones por ninguna superficie y los botones del panel haciendo lo mismo que el puente.
