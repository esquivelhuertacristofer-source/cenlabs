# MEC-122 · Conducto común diésel y precalentamiento

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-12 — *Diagnostica el sistema de conducto común y el precalentamiento* (molde P+S, panel-instrumento virtual + simulación de proceso)
- **Simulador:** `/labs/common-rail-precalentamiento.html`
- **Slug:** `common-rail-precalentamiento`
- **Ancla curricular:** AUT-C sistemas de inyección y diagnóstico (liga con `mecanica-112` ciclo Diésel y autoencendido, `mecanica-117` inyección y sonda lambda, `mecanica-118` formas de onda de los sensores, `mecanica-121` catalizador y sondas) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** SAE J2012 / ISO 15031-6 (P0087, P0088, P0380) · ISO 15031-5 / SAE J1979 (modos $01 y $03) · EN 590 (gasóleo: densidad y viscosidad) · Bosch, *Diesel-Engine Management* 5.ª ed. (conducto común, regulación por dosificación en la aspiración, tiempo muerto del inyector) · Bosch, *Automotive Handbook* (módulo de compresibilidad, bujías incandescentes) · Heywood, *Internal Combustion Engine Fundamentals* (retardo de encendido, compresión politrópica, arranque en frío) · Hardenberg y Hase, SAE 790493 (1979)

Continúa el hilo de `mecanica-112`, que resolvió el ciclo Diésel y el autoencendido pero dejó fuera el sistema que lleva el combustible hasta ahí. Éste es ese sistema, y su diagnóstico.

---

## Qué enseña

1. Que **el riel no se resuelve: se integra**. Es un condensador hidráulico y la ecuación es dp/dt = K(p)/V · (entra − sale), con paso de 20 µs sobre 360 ms. Las inyecciones son SUCESOS discretos: a plena carga son **87 por segundo** sobre 32,0 cm³, y de ahí sale un rizo de **47,8 bar sobre 1 604, el 2,98 %**. En marcha mínima el mismo riel da 2,7 bar sobre 280, el 0,98 %. Ninguno de los dos está escrito como constante.

2. Que **el módulo de compresibilidad del gasóleo no es constante**: va de 1,30 GPa a la atmosférica a **2,42 GPa a 1 600 bar**. Casi el doble, y ésa es la razón física de que el riel amortigüe mejor cuanto más lleno está.

3. Que **el tiempo muerto del inyector no es una corrección pequeña**. En la inyección principal —55 mm³, pulso de 1,713 ms— vale 0,283 ms: el **17 %**. En la inyección piloto —1,4 mm³ con el riel a 280 bar, pulso de 0,259 ms— vale 0,172: el **66 %**. En el V8, el **77 %**.

4. Que **de eso sale la consecuencia más útil de la práctica**: subir el pulso un 5 % da **+6 % de combustible en la principal y +15 % en la piloto** del turismo, +22 % en la del V8. El aumento entero cae sobre la parte que de verdad inyecta, y esa parte es la pequeña. Por eso las piloto se corrigen en mm³ y nunca en porcentaje.

5. Que **con la batería floja la piloto no llega a salir**. A 9,4 V el tiempo muerto sube a **0,267 ms**, más largo que el pulso entero de 0,259 que el ordenador manda: salen **0,00 mm³ de los 1,4 pedidos**. El ordenador no puede enterarse, porque manda un tiempo y da por hecho el combustible.

6. Que **la probeta separa lo que el escáner confunde**. Con todo sano los cuatro devuelven 12,4 mL/min y el total coincide con la suma. Con un inyector con fuga interna, el tercero devuelve **91,2** contra 12,4. Con el juego entero desgastado devuelven **41,5 cada uno, parejos**: no señalan a ninguno, señalan al kilometraje. Y con el regulador pegado abierto los cuatro están normales y el total se dispara a 202,7, de los cuales **153,6 mL/min no han pasado por ningún cilindro**.

7. Que **la referencia de retorno sano tiene que salir del propio motor**. Un inyector piezoeléctrico devuelve 3,6 mL/min y uno de solenoide 12,4, porque ni la fuga ni el combustible de mando son los mismos. Con un umbral escrito a mano, la misma avería daba síntoma en un motor y no en otro.

8. Que **el escáner acusa a la pieza equivocada**. La bomba gastada y el filtro tapado dan **el mismo P0087**, la misma dosificación al 100 % y la misma pérdida de fuerza. Lo único que los separa es la presión de alimentación: **4,20 bar contra 1,93**.

9. Que **hay un sensor que causa el problema y lo tapa**. Leyendo un 14 % del fondo por debajo, el ordenador sube la presión real a **1 907 bar, un 6,0 % por encima del máximo del sistema**, y el escáner enseña 1 655 sin código: desviación leída 3,5 %, real **19,2 %**. Leyendo de más pasa lo contrario: 1 302 reales con 1 554 en pantalla y el coche sin fuerza. En los dos casos el lazo cierra sobre el sensor, así que **ver una presión correcta no prueba que la haya**.

10. Que **sin bujías un diésel sano arranca hasta los +5 °C**. El retardo es de 2,741 ms contra una ventana de 7,230; a −10 °C se va a **10,425 ms** y ya no cabe. Con las bujías al rojo —+144 K de salto efectivo— el mismo motor prende los cuatro cilindros a −30 °C.

11. Que **la batería floja es un problema de COMPRESIÓN**. A −20 °C el motor sano gira a 140 rpm, el exponente politrópico vale 1,231 y la compresión llega a 32,0 bar y 227 °C. Con la batería a 9,4 V gira a **75 rpm**, el exponente cae a **1,140** —girar despacio le da tiempo al calor a escaparse por la pared— y la compresión se queda en 24,8 bar y **114 °C**: no prende ni un cilindro, con las cuatro bujías perfectas y el escáner mudo.

12. Que **el ordenador vigila la corriente de las bujías, no su temperatura**. Una bujía en circuito abierto se detecta —P0380— aunque a +25 °C el motor arranque redondo. Unas bujías envejecidas que siguen conduciendo consumen **3,7 A en vez de 8,7** y llegan a **326 °C en vez de 1 007**: el salto efectivo cae de +144 K a +47 y a −20 °C **no prende ninguno de los cuatro, sin ningún código**.

13. Que **el precalentamiento no es confort**. Las bujías cerámicas del turismo tienen una constante de 1,9 s y el ordenador precalienta 6,1 s a −20 °C. Las metálicas del furgón de 2006 tienen 6,4 s y necesitan **20,5 s de contacto** consumiendo 29,4 A. Es la misma física con otro material.

14. Que **eso se cuenta**. Doce averías por cinco temperaturas, 60 casillas: **44 se notan conduciendo y en 31 el escáner no tiene nada que declarar**. Cuatro dejan el vehículo parado, cinco ponen el riel por encima del máximo del sistema con el escáner enseñando una cifra correcta, y en dos hay código antes de que el conductor note nada. De las doce averías, **el escáner nombra bien la pieza en una**.

---

## Cómo está construido

**Molde P+S**: motor sellado → siete vistas del pizarrón → banco 3D con el circuito completo y la torre de probetas → HUD, mandos y telemetría → reto a ciegas, cuestionario y recorrido guiado.

El motor sellado integra el riel paso a paso y calcula el arranque cilindro por cilindro. Publica todo por `window.__labDebug`, que es la superficie que verifica la Capa 2.

**Cuatro vehículos**: turismo 2.0 L de 2014 (solenoide), compacto 1.6 L de 2018 (piezoeléctrico), camioneta 6.6 L V8 de 2010 y furgón 3.0 L de 2006 con **bujías metálicas**, que es el que enseña que el precalentamiento no es un detalle.

**Doce averías × cinco temperaturas**, con la temperatura como mando aparte: hay averías que a +25 °C no existen y a −20 °C dejan el vehículo en la calle.

**El reto** sortea un caso que algún instrumento pueda ver, apaga el escáner, vacía las probetas y deja las bujías frías hasta que se paga el instrumento correspondiente. Una tira en el pizarrón enseña qué averías **siguen siendo compatibles** con lo medido, y se estrecha a cada medida: es la destreza de la que trata la práctica.

---

## Lo que NO modela

La cámara de combustión y el ciclo termodinámico (eso es `mecanica-112`); el chorro y su evaporación; la onda de presión en el tubo de alta entre riel e inyector; la bomba de alta por dentro; la temperatura del gasóleo; las estrategias de inyección múltiple más allá de calcular lo que costaría una piloto; las emisiones y el postratamiento; y el circuito eléctrico del precalentamiento con su relé y su modulación.

La constante de Arrhenius (1,73·10⁻⁴) está **anclada** para que un motor sano y caliente prenda en 0,381 ms y para que el mismo motor sin bujías deje de arrancar entre +5 y −10 °C. La ventana de ocho grados de giro, el salto de 150 K de la bujía a tope, los 7,5 mm³ de combustible de mando y las trayectorias de las doce averías son **ajustes didácticos declarados**. La escala del banco 3D (×1,25) también se declara: está elegida MIDIENDO el ancho del pizarrón en pantalla, que tiene que quedar por encima de 480 px para que su texto se lea.

---

## Verificación

- **Capa 1** (motor sellado en Node, recortado del `.body.js` publicado): 85 comprobaciones.
- **Capa 2** (la página real en Chromium con Playwright): 90 comprobaciones — arranque, las siete vistas, que **toda malla del banco lleve un material de verdad**, la no-fuga del reto contra los rótulos que el propio motor publica, el cuestionario, el recorrido guiado y los cuatro vehículos.
- **Ancho del pizarrón**: 531–583 px de ventana en 1600×900, medido vehículo por vehículo y vista por vista con `scripts/auditoria/.medida_122.mjs`.
