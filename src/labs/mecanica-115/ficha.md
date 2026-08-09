# MEC-115 · Lubricación del motor: grado SAE, película y presión

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-05 — *Lubricación del motor: grado SAE, película y presión* (molde E+S, ensamble + simulación)
- **Simulador:** `/labs/lubricacion-sae-pelicula-presion.html`
- **Slug:** `lubricacion-sae-pelicula-presion`
- **Ancla curricular:** AUT-Y motores (liga con `mecanica-111`, `mecanica-112`, `mecanica-113` y `mecanica-114`) · UAX Mecánica y mantenimiento
- **Norma ancla:** SAE J300 — clasificación de viscosidad de aceites de motor
- **Fuentes de referencia:** ASTM D341 (viscosidad contra temperatura) · ASTM D2270 (índice de viscosidad) · ASTM D5293 (CCS) y ASTM D4684 (MRV) · Hamrock, Schmid y Jacobson, *Fundamentals of Fluid Film Lubrication*, 2.ª ed. (2004) · Cameron, *Basic Lubrication Theory*, 3.ª ed. (1981) · manual de taller del fabricante, única fuente de la holgura de montaje, de la presión mínima admisible y del aceite de un motor concreto

---

## Qué enseña

1. Que **el manómetro NO mide la lubricación**: mide la resistencia del circuito. A 100 °C y 2 000 rpm con carga el 1.6 marca **3,04 bar** y **5,73 µm** de película; a 130 °C y 1 200 rpm con carga, la presión cae un **66 %** y la película sólo un **41 %**. Son dos magnitudes distintas que responden distinto a lo mismo.
2. Que **la fuga de un cojinete va con el CUBO de su holgura**. Un solo cojinete de bancada gastado mueve la aguja **0,032 bar** en caliente a ralentí (de 0,93 a 0,89) y un motor gastado entero la hunde **0,472 bar** (hasta 0,45): **catorce veces** más.
3. Que **a excentricidad alta la holgura casi no cambia h mínima**. Es la asíntota exacta del cojinete corto —la capacidad va con 1/c² y el espesor con c(1−ε)—, así que duplicar la holgura mueve h mínima menos de un 10 %. Lo que se dispara es el caudal.
4. Que **la recta de Walther no se extrapola al frío**. Extrapolar el catálogo a −35 °C da una viscosidad que no cumpliría el propio grado SAE del aceite. El tramo frío se ancla en el punto **medido** del ensayo CCS.
5. Que **la pendiente de Walther no es el índice de viscosidad**. El 0W-20 tiene mejor IV que el 10W-40 (**168** contra **154**) y **mayor** pendiente (3,142 contra 2,972). Sólo ordena dentro del mismo grado de verano, y por eso ASTM D2270 usa aceites patrón de la misma KV100.
6. Que **el grado no ordena la protección**. El 15W-40 tiene MENOS KV100 que el 10W-40 (**14,30** contra **14,50** mm²/s) y MÁS HTHS (**3,85** contra **3,65** mPa·s). El número de verano se mide a cizalla baja; el cojinete trabaja a cizalla alta.
7. Que **J300 pide DOS ensayos de invierno y hacen falta los dos**. El CCS garantiza que el motor de arranque GIRE el motor; el MRV, que la bomba lo ASPIRE. A −20 °C, en el 1.6, sólo el 0W-20 (**185 rpm**) y el 5W-30 (**140 rpm**) superan las **120 rpm** que ese motor necesita; el 10W-40 se queda en **91**, el 15W-40 en **64**, el 20W-50 en **29** y el SAE 30 en **18**.
8. Que **hay algo peor que no arrancar**: un aceite que pasa el CCS y falla el MRV deja al motor **girando en seco**, y el manómetro no tiene nada que medir porque no hay aceite en la galería.
9. Que **las vueltas en seco al arrancar casi no dependen del frío**: **3,7** en todos los casos, aunque el cebado pase de **0,64 s** a 20 °C a **1,20 s** a −20 °C. La bomba y el cigüeñal giran juntos y el cociente se cancela. Girar más despacio no protege; cebar antes, sí.
10. Que **dos averías son invisibles con el motor en marcha**. El filtro obstruido con su derivación abierta deja las tres presiones del protocolo **idénticas** a las del motor sano y el antirretorno roto también; ése sólo se paga en cada arranque, donde las vueltas en seco pasan de **3,7 a 18,6**.
11. Que **la limitadora no protege al motor: protege al circuito**. Agarrotada cerrada no recorta nada y en frío la presión llega a **17,3 bar** en el 1.6 y a **20,4 bar** en el diésel, por encima de lo que aguanta la carcasa del filtro. En caliente la misma avería no se nota.
12. Que **el punto crítico del cojinete está a régimen BAJO con el pie a fondo**: sin par pedido el pico del cilindro es el de compresión —la misma cifra que publica `mecanica-114`— y la inercia alternativa descarga el cojinete al subir de vueltas. λ vale **6,83** a 2 000 rpm con carga y **8,47** a 3 000 rpm con la misma carga.
13. El **teorema del censo**: con las tres presiones del protocolo se separan **8 de 13** escenarios en el 1.6, el 1.8 y el V8, y **7** en el diésel; con todo lo que se mide sin abrir el motor, **9** y **8**; con las siete observaciones, **13 de 13**. **Ningún** subconjunto formado sólo con observaciones de taller llega a los trece en ninguna de las cuatro máquinas.

---

## Molde y estructura

**Molde E+S** (ensamble + simulación). Siete piezas sobre el banco y siete huecos luminosos en el motor; hasta que el circuito no está completo no se abre ningún modo. Después, seis modos de trabajo:

| Modo | Qué se hace |
|---|---|
| 1 · Montar | Cárter con colador, bomba, limitadora, filtro con antirretorno y derivación, radiador, galería con sus taladros y manocontacto. Cada tramo de conducción sólo existe si sus dos piezas están montadas. |
| 2 · Viscosidad | Los seis aceites en los ejes de ASTM D341, la verificación contra los cuatro criterios de J300 y las dos trampas del grado. |
| 3 · Presión | p(rpm) y p(T) contra la referencia del motor sano con el aceite del fabricante, con el tarado, la alarma y el límite del filtro marcados. |
| 4 · Película | λ(rpm) con las bandas de régimen, h(T) contra la rugosidad compuesta, la tabla de las cinco bancadas y el cojinete ampliado en sección. |
| 5 · Arranque | Los seis aceites a la temperatura del ensayo: régimen de giro, bombeabilidad, cebado y vueltas en seco. |
| 6 · Censo | Los 127 subconjuntos de observaciones, los tres cortes que importan y el subconjunto mínimo. |
| 7 · Reto | Avería oculta. Se compran observaciones y se entrega la familia. |

---

## Contrato de fidelidad

**Sí modela:** viscosidad por Walther (ASTM D341) con el tramo frío anclado en el punto medido del CCS; los cuatro criterios de J300; cojinete corto de Ocvirk con excentricidad por bisección, h = c(1−ε) y λ contra la rugosidad compuesta; circuito por balance de caudales entre bomba volumétrica con resbalamiento y fuga de cada cojinete (ley del cubo) más restricciones auxiliares, con la limitadora recortando por arriba; carga del cojinete compuesta de gas e inercia y dependiente del par pedido; arranque en frío con par resistente, régimen de giro, bombeabilidad y tiempo de cebado; trece escenarios y el censo exhaustivo.

**No modela:** carga variable del cojinete ni efecto de película exprimida (análisis estacionario con la carga media equivalente, factor **0,34** del pico, declarado); validez de Ocvirk por encima de ε = 0,90, que se **avisa en pantalla**; gradiente de temperatura dentro del circuito; transferencia del radiador, que aquí es un mando; circuitos de biela y de árbol de levas por separado; superficie libre del cárter. El corte del motor va del eje del cigüeñal hacia abajo —no hay pistones ni culata— y las bancadas se dibujan en línea en los cuatro arquetipos. La escena gira el cigüeñal a **0,030 veces** la velocidad real y el cojinete ampliado dibuja la holgura multiplicada por el factor que él mismo publica. Los cuatro motores son **arquetipos declarados**, no modelos comerciales.

---

## Verificación

- **Capa 1 · motor sellado:** `motor_lub.mjs` + `test_lub.mjs` → **4 813/4 813** comprobaciones. Nueve secciones: D341, J300, Ocvirk, espesor específico, circuito, la tesis, arranque en frío, escenarios y censo.
- **Capa 2 · navegador real:** `pw_lub.mjs` contra `window.__labDebug` → **1 883/1 883** comprobaciones. Dieciséis secciones, incluidas la verificación de que las cifras de esta ficha se sostienen en la máquina, la de que ninguna pantalla publica NaN en ninguno de los trece escenarios de las cuatro máquinas, la de que **«todo en orden» sólo puede decirlo el motor sano** —con una avería montada que no se nota, la pantalla dice que no se nota— y la de que el diagnóstico a ciegas no regala la respuesta ni por la telemetría ni por la cabecera del pizarrón.
- **Revisión visual:** capturas de los siete modos y de cuatro casos límite. Siete defectos sólo se vieron mirando: el cojinete ampliado dibujado de canto, el aceite del cárter tapando el cigüeñal, los trece botones de escenario saliéndose del panel, el rótulo del cojinete cortado por las dos puntas, el encuadre que metía el pizarrón debajo del HUD, dos filas de telemetría repetidas y —la peor— **el reto publicando el aceite que impone el escenario**, que delata la familia de avería sin gastar una sola observación.
- **Trampa de montaje corregida:** la interfaz se ensambla desde ocho piezas, y una de ellas, `d605_t2.js`, era un archivo *derivado* que había que rehacer a mano. Dos correcciones no llegaron nunca al laboratorio porque nadie lo rehízo. El ensamblador lee ahora las dos piezas de origen y el derivado se ha borrado.
