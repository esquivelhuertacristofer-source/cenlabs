# MEC-126 · El circuito de carga: alternador, regulador y balance eléctrico

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-A2 — *Diagnostica el circuito de carga y haz el balance eléctrico del vehículo* (molde E+S, ensamble 3D + simulación con mode-lock)
- **Simulador:** `/labs/carga-alternador-balance.html`
- **Slug:** `carga-alternador-balance`
- **Ancla curricular:** AUT-Y sistemas eléctricos del vehículo y diagnóstico (liga con `mecanica-60` curva V–I, `mecanica-64` transitorio RC, `mecanica-66` diagnóstico por bisección, `mecanica-70` potencia y factor de potencia, `mecanica-74` conductores y protecciones, `mecanica-125` arranque y caídas de tensión) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** SAE J56 (ensayo del alternador: la corriente de chapa y el régimen al que se declara) · SAE J537 (baterías: el ensayo de arranque en frío del que sale la resistencia óhmica) · SAE J1127 y J1128 (cables) · Bosch, *Automotive Handbook* y *Automotive Electrics and Automotive Electronics* · Denton, *Automobile Electrical and Electronic Systems* · Mohan, Undeland y Robbins, *Power Electronics* (rectificador de seis pulsos con conmutación) · Fitzgerald, Kingsley y Umans, *Electric Machinery* · Linden y Reddy, *Handbook of Batteries* · Peukert (1897)

Cierra el bloque eléctrico del motor que abrió `mecanica-125`: allí se aprendió que una resistencia sólo se manifiesta con corriente; aquí la corriente va **al revés** y el que se queda sin tensión es quien debería estar cargándose. Y añade lo que aquel laboratorio dejaba fuera a propósito: **de dónde salió el estado de carga con el que amanece la batería**.

---

## Qué enseña

1. Que **un alternador de 120 A no da 120 A**. La cifra de la chapa es la corriente a **régimen infinito**, y eso sale del modelo, no de una afirmación: la fem por fase crece con ω y la reactancia síncrona que la frena crece con ω igual, así que al despejar la corriente continua del rectificador de seis pulsos el cociente **deja de depender del régimen**. Aquí, **151,6 A**. Los 120 A de la chapa son el punto de esa curva a 6 000 rpm de alternador, que es como los declara la SAE J56.

2. Que **al ralentí eso es menos de la mitad**. Los cuatro coches, con relaciones de poleas de 2,55 a 3,10, dan al ralentí **53,2 · 60,8 · 51,6 · 58,9 A**: entre el **43 % y el 51 %** de su chapa. La relación de poleas es media máquina, y esto no es una avería.

3. Que **un coche SANO se come la batería en un atasco**. De noche, con todo encendido y a 720 rpm, el utilitario consume 73,2 A, el alternador entrega 65,8 y la batería pone los **7,4 que faltan**: la barra cae a 12,26 V y quedan **2,8 h** hasta el 30 % de carga. Y el arreglo no es cambiar nada: **bastarían 793 rpm de ralentí en vez de 720**. Es la razón por la que un coche sube el ralentí al conectar el aire.

4. Que **el testigo del salpicadero no vigila el balance**. De las **180 casillas** del censo, en **73 la batería se está vaciando con el motor en marcha** y el testigo se enciende en **0**. No está roto: se alimenta del propio estator por el trío de diodos de excitación, así que vigila si el alternador **excita**, no si **alcanza**. El centinela no es vacío: el laboratorio comprueba que el testigo **sí** se enciende por debajo de 400 rpm de motor, o sea cuando la máquina de verdad deja de generar.

5. Que **dónde mide el regulador decide qué avería se ve**. Con 30 mΩ de más en el cable de carga, el utilitario —sensado en el alternador— baja el borne de 14,45 a **13,06 V**. La furgoneta —sensada en la batería— marca **14,57 V exactos, los mismos que sana**, porque el regulador compensa la caída subiendo su propia tensión a **16,41 V**. La misma avería, invisible en un coche y evidente en el otro, y en el que es invisible el que se cuece es el alternador. La única medida que la delata en los dos es la **caída en el cable, con carga**.

6. Que **sumar vatios de etiqueta y dividir por doce está mal**. Cinco consumos son resistivos y cuatro de potencia constante, y éstos **suben** la corriente cuando la barra baja. Entre 13,5 y 12,3 V el total pasa de 93,0 a 92,0 A: **un 1,1 %**. La cuenta de la etiqueta se equivoca aquí en un **12,5 %**.

7. Que **la batería no acepta lo que se le ofrece, sino lo que puede**. Descargando manda su resistencia óhmica —la del d6-A1, deducida de la SAE J537—; cargando manda la **polarización por difusión**, dos órdenes de magnitud mayor y creciente como (1−SoC)^−0,92. A 14,4 V la de 60 Ah admite **23,2 A al 50 %, 9,1 al 80 %, 4,6 al 90 % y 2,4 al 95 %**; a −7 °C, **3,1 A al 90 %**. Poner la misma resistencia en los dos sentidos da 100 A de carga donde el coche da 8.

8. Que **la correa es una pieza eléctrica y no patina siempre**. Patina cuando hay par que transmitir, y el par crece con la corriente: impecable en la revisión, y en el atasco el alternador gira **1 460 rpm en vez de 1 944**. El testigo, apagado.

9. Que **el rizado no son tres voltios, son milivoltios**. Con la batería puesta: **10 mV** con el puente sano y **150** con un diodo abierto. La cifra del folclore sale de medir con la batería floja. Y hay un confundidor real: **una masa floja sube el rizado medido a 60 mV** sin que haya ningún diodo roto, porque lo que se mide es el rizado por la impedancia del punto de medida.

10. Que **la condición pesa más que el aparato**. De las **20 condiciones** del laboratorio sólo **4 separan los nueve montajes ellas solas** —y la que más resuelve es un ralentí de verano con el aire puesto—. «De día en carretera y sin nada encendido», la condición de la revisión de taller, **no resuelve en ninguno de los cuatro coches**. Y las **escobillas gastadas** dan ahí exactamente las mismas diez lecturas que un coche sano; en el atasco se separan por **más de cincuenta amperios**.

11. Que **un dictamen no se juzga sólo por el acierto**. El reto corrige dos cosas: si acertaste, y si **te lo habías ganado** —o sea, si con las condiciones que llegaste a mirar quedaba un único montaje compatible—. Acertar sin cerrar el caso se marca como acertado **y no cerrado**.

---

## Lo que NO modela, y por qué

El régimen transitorio (constante de tiempo del campo, golpe de carga, oscilación del regulador), la electrónica del regulador, la regulación por unidad de mando y la recuperación en frenada, la forma de onda punto a punto, el calentamiento del alternador, el par que le roba al motor, la química fina de la batería y los sistemas de 48 V o doble batería. Y de los instrumentos se modela su **resolución** —que es lo que cambia un diagnóstico— y no su exactitud.

---

## Verificación

- **Capa 1** (`scripts/auditoria/.c1_A2.mjs`): 5 436 comprobaciones sobre el motor sellado en Node, en 20 grupos. Incluye el contraste entre las **dos escrituras del nudo** —la legible y la precalculada— sobre una rejilla de tensiones, la comprobación de que ninguna de las nueve averías es de adorno, la de que ningún par de averías es indistinguible en las cinco situaciones, y el barrido de las 1 800 lecturas de texto buscando un punto decimal.
- **Capa 2** (`scripts/auditoria/.c2_A2.mjs`): la página real en Chromium con SwiftShader. Mode-lock, las siete vistas con el pizarrón ≥ 480 px, los mandos, las 180 casillas del testigo, la trampa del sensado, el reto sin filtración por ninguna superficie y el separador decimal en 1 260 combinaciones de panel.
- **Centinelas de escena**: `materialesFalsos`, `materialesPorDefecto`, `posicionesNaN` y —nuevo en este laboratorio— `piezasDescolocadas`, que caza una pieza construida en coordenadas del mundo cuyo ancla se declaró mal.
