# MEC-119 · El encendido en sus tres fases

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-09 — *Diagnostica el encendido en sus tres fases* (molde P, panel-instrumento virtual)
- **Simulador:** `/labs/encendido-tres-fases.html`
- **Slug:** `encendido-tres-fases`
- **Ancla curricular:** AUT-C ignición (liga con `mecanica-111` … `mecanica-118`) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** SAE J973 *Ignition System Test Procedure* (vocabulario de tensión disponible, de demanda y reserva) · Bosch, *Automotive Handbook* (energía de encendido, separación de electrodos, resistencias de supresión) · Heywood, *Internal Combustion Engine Fundamentals*, capítulo de encendido (energía mínima de ignición, distancia de apagado por pared, duración del arco) · SAE J1930 y la familia P030x de códigos de fallo de encendido · manual de taller del fabricante, única fuente de la inductancia de la bobina, el dwell y el hueco de bujía de un motor concreto

---

## Qué enseña

1. Que **todo el sistema cuelga de una capacidad**. La bobina guarda 32,0 mJ y esa energía, puesta sobre los 50 pF del secundario, son **35,77 kV** de tensión disponible: V = √(2E/C₂), no la relación de espiras.
2. Que **las tres fases se reparten ese presupuesto**. Romper el camino a 8,19 kV consume 1,7 mJ; lo que queda mantiene el arco 1,08 ms. La ley inversa es contabilidad, no una tendencia.
3. Que **dar gas cambia la traza sin ninguna avería**: la presión pasa de 6,80 bar a 14,50 bar, la demanda de 8,19 kV a 14,78 kV y la chispa se acorta de 1,08 ms a 0,76 ms.
4. Que **hay chispa y hay encendido, y no son lo mismo**: la bujía engrasada da arco en los tres puntos y no enciende en ninguno, con una traza **mejor** que la sana (disparo 4,66 kV contra 8,19 kV; chispa 1,88 ms contra 1,08 ms).
5. Que **los dos criterios de encendido van al revés**: cerrar el hueco a 0,55 mm alarga la chispa a 1,28 ms y hunde el margen de energía de 3,31 × a **1,40 ×**; abrirlo a 1,60 mm deja energía de sobra (5,92 ×) y falla por tiempo (0,26 ms contra los 0,30 ms necesarios).
6. Que **hay averías que no tocan la primera fase**: el dwell corto deja la corriente en 5,01 A de 7,15 A, falla sólo en carga, y su línea de disparo es **exactamente** la del sistema sano, 14,78 kV.
7. Que **la tercera fase mide la bobina y no la chispa**: con espiras en corto la bobina carga **más** corriente (7,50 A contra 7,15 A) y guarda menos energía, el timbre sube de 4 799 Hz a 8 725 Hz y las oscilaciones caen de 4 a **1**, con el criterio de taller en 4.
8. Que **un corte de aire en serie suma ruptura y no resistencia**: 3,00 mm añaden 5,76 kV de demanda, y el óhmetro mide 13,0 kΩ —lo mismo que uno sano— porque no conduce hasta que hay tensión. Un resistor degradado sí se mide: 68,0 kΩ.
9. Que **el escáner dice qué cilindro y ahí se acaba**: el P0301 lo ponen 6 de 13 escenarios de 5 familias (bujía, corte en serie, fuga a masa, mando de la bobina, mecánica) y 6 escenarios con la chispa tocada pasan sin código.
10. Que **un P0301 puede no ser eléctrico**: con la compresión al 62 % la chispa enciende y el cilindro no aporta. El umbral del 75 % es un **dato declarado**, no una deducción, y se dice en pantalla.
11. Que **la arquitectura decide cuánta chispa se puede dar**: en el V6 con distribuidor, a 5 500 rpm hay 3,64 ms entre chispas y la bobina pide 4,20 ms; el dwell se recorta a 3,09 ms y la corriente cae de 6,00 A a 5,03 A.
12. Que **en chispa perdida dos líneas de disparo muy distintas son lo normal**: el cilindro que comprime pide 8,19 kV y su compañera en escape, **2,24 kV**.
13. Que **el osciloscopio hace falta, y hace falta leer dos fases**: censo de 16 383 juegos → disparo a solas 8/13, quemado a solas 11/13, los dos juntos **13/13**; taller corriente 8/13 (alcanzado ya con 5 medidas, confundiendo encendido sano ≡ masa del motor con resistencia ≡ bobina con espiras en corto ≡ avance excesivo; corte en el camino a la bujía ≡ fuga a masa en el secundario ≡ dwell corto del módulo); banco completo 13/13 con un juego mínimo de 2.

---

## Cómo se verifica

| Capa | Qué comprueba | Resultado |
|---|---|---|
| **Capa 1** (`test_ign.mjs`) | El motor sellado contra sí mismo y contra la física: exponencial de carga y recorte del dwell, V=√(2E/C₂), divisor de la fuga con la impedancia característica, compresión politrópica, ley de Paschen y sus sumandos, contabilidad exacta de la energía, la ley inversa comprobada como ley en toda la rejilla, los cuatro motivos de no-encendido y su alcanzabilidad, el timbre, las trazas medidas contra las cifras declaradas, y el censo exhaustivo | **5 551 / 5 551** |
| **Capa 2** (`pw_ign.mjs`) | El laboratorio ya construido, en Chromium, contra `window.__labDebug`: la rejilla entera de 4 máquinas × 13 escenarios × 3 puntos cifra a cifra, el punto de los mandos barriendo 5 cargas × 5 regímenes, el pico y la meseta **medidos sobre los puntos que se dibujan**, el censo, el veredicto y sus gemelos, los ocho modos, cada botón del panel pulsado con el ratón, el recorrido guiado, y el diagnóstico a ciegas por sus **tres** caminos de filtración —panel, pantalla del banco y cambio de vista—. La telemetría se compara además **como cadena**, carácter a carácter, contra las cifras formateadas en el guion de pruebas, y cada comprobación negativa lleva su positiva al lado | **13 602 / 13 602** |
| **Revisión visual** | Capturas de los ocho modos y de los casos límite en las cuatro máquinas, revisadas mirándolas. De ahí salieron doce defectos que ninguna prueba numérica podía ver —seis tablas cortadas por el borde del pizarrón, una curva teórica con asíntota inventada, rótulos ilegibles dentro de barras cortas, un cilindro de vidrio que se pintaba como un bloque blanco— y, sobre todo, que el reto publicaba en el panel las cifras que el alumno tenía que comprar | **28 capturas · 0 defectos abiertos** |

---

## Los trece escenarios en el 1.8 de cuatro cilindros con bobina doble

| escenario | disparo ralentí | quemado ralentí | disparo carga | quemado carga | ¿ralentí? | ¿tira? | osc. | corriente | códigos |
|---|---|---|---|---|---|---|---|---|---|
| encendido sano | 8,19 kV | 1,08 ms | 14,78 kV | 0,76 ms | sí | sí | 4 | 7,15 A | — |
| bujía desgastada, hueco abierto | 14,36 kV | 0,58 ms | 26,08 kV | 0,26 ms | sí | **NO** | 4 | 7,15 A | P0301 |
| bujía demasiado cerrada | 5,11 kV | 1,63 ms | 9,13 kV | 1,28 ms | sí | sí | 4 | 7,15 A | — |
| bujía engrasada, vía de carbonilla | 4,66 kV | 1,88 ms | 8,31 kV | 1,50 ms | **NO** | **NO** | 4 | 7,15 A | P0301 |
| resistor de bujía degradado | 9,29 kV | 0,60 ms | 15,88 kV | 0,45 ms | sí | sí | 4 | 7,15 A | — |
| corte en el camino a la bujía | 13,95 kV | 0,40 ms | 20,54 kV | 0,29 ms | sí | **NO** | 4 | 7,15 A | P0301 |
| masa del motor con resistencia | 8,19 kV | 0,78 ms | 14,78 kV | 0,52 ms | sí | sí | 4 | 6,14 A | — |
| fuga a masa en el secundario | 8,19 kV | 0,35 ms | 14,78 kV | 0,17 ms | sí | **NO** | 2 | 7,15 A | P0301 |
| dwell corto del módulo | 8,19 kV | 0,50 ms | 14,78 kV | 0,29 ms | sí | **NO** | 4 | 5,01 A | P0301 |
| bobina con espiras en corto | 8,19 kV | 0,63 ms | 14,78 kV | 0,40 ms | sí | sí | 1 | 7,50 A | — |
| batería baja | 8,19 kV | 0,61 ms | 14,78 kV | 0,38 ms | sí | sí | 4 | 5,49 A | — |
| compresión baja en el cilindro | 5,67 kV | 1,27 ms | 10,17 kV | 0,97 ms | **NO** | **NO** | 4 | 7,15 A | P0301 |
| avance excesivo | 6,46 kV | 1,20 ms | 10,93 kV | 0,93 ms | sí | sí | 4 | 7,15 A | — |

---

## Contrato de fidelidad

**Sí modela:** carga de la bobina como circuito RL con tope de corriente del módulo y recorte del dwell por régimen · transferencia de la energía a la capacidad del secundario, de donde sale la tensión disponible como √(2E/C₂) · ruptura del hueco por ley de Paschen con exponente de presión 0,80 y coeficientes calibrados a rangos de taller · ruptura añadida de un corte de aire en serie y caída resistiva de lo que haya en el camino · segundo camino de ruptura por carbonilla sobre el aislador, con su tensión y su arco · reparto exacto de la energía entre romper y mantener, de donde salen el tiempo de quemado y la ley inversa · los tres criterios de encendido, con el apagado del núcleo contra los electrodos creciendo con el cuadrado del cierre del hueco · compresión politrópica con n = 1,32 desde la presión de colector hasta el ángulo de avance · timbre del primario con su frecuencia y su factor de calidad, y la amortiguación de una fuga repartiendo con la impedancia característica (1,00 MΩ) · chispa de la compañera en chispa perdida · censo exhaustivo de los 16 383 subconjuntos sobre cuatro máquinas.

**NO modela:** la **detonación**, que es el daño real del avance excesivo —aquí sólo se ve que la chispa salta con menos presión y por eso baja la demanda— · la **combustión**, es decir cuánto par sale de una mezcla que ha prendido, y por eso la compresión hundida necesita la regla **declarada** del 75 % que se dice en pantalla · el desgaste de electrodos con el kilometraje, la temperatura del aislador ni el grado térmico de la bujía · la caída de la corriente de arco durante la incandescencia, tomada constante en 20 mA · el reparto del distribuidor entre cilindros y la resistencia de su rotor · el propio osciloscopio (ancho de banda, sondas y disparo). El ciclo se pinta ralentizado 140 veces. Los cuatro motores son arquetipos declarados, **no** modelos comerciales.
