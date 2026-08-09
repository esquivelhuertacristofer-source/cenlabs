# MEC-116 · Enfriamiento del motor: termostato, radiador y refrigerante

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-06 — *Enfriamiento del motor: termostato, radiador y refrigerante* (molde E+S, ensamble + simulación)
- **Simulador:** `/labs/enfriamiento-termostato-radiador.html`
- **Slug:** `enfriamiento-termostato-radiador`
- **Ancla curricular:** AUT-Y motores (liga con `mecanica-111`, `mecanica-112`, `mecanica-113`, `mecanica-114` y `mecanica-115`) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** ecuación de Clausius-Clapeyron para la ebullición · atmósfera estándar ISA para la presión y la densidad del aire · tabla publicada de punto de congelación de etilenglicol y agua (ASHRAE *Fundamentals*) · Kays y London, *Compact Heat Exchangers*, 3.ª ed. (1984) · Incropera y DeWitt, *Fundamentals of Heat and Mass Transfer* · Heywood, *Internal Combustion Engine Fundamentals* (1988) · SAE J1468 · manual de taller del fabricante, única fuente del tarado del termostato, del tapón y de la mezcla de un motor concreto

---

## Qué enseña

1. Que **la aguja del tablero NO mide la reserva del sistema**. A 2 000 rpm con el 45 % de par y el coche parado, el 1.6 marca **97,0 °C** al nivel del mar, en Guadalajara, en la Ciudad de México y en Toluca —la misma cifra hasta el decimal— y el ventilador trabaja al **53,5 %, 57,3 %, 59,2 % y 60,4 %**, con un margen que cae de 29,8 a 24,8 °C.
2. Que **el ciclo del ventilador es la verdadera medida de margen**. Parado y al nivel del mar, con la misma cifra de 97,0 °C en la aguja: **3,0 %** a 750 rpm sin carga, **32,3 %** a 1 200 rpm con el 45 %, **87,5 %** a 2 500 rpm con el 70 % y **89,2 %** a 4 000 rpm con el 25 %. Un coche al 90 % de ventilador está a un semáforo de recalentar y su tablero no lo dice.
3. Que **el tapón de presión no mueve la aguja ni un grado**. En la cuesta, sano **101,0 °C** y con el tapón agotado **101,0 °C**. Lo que cambia es la ebullición, de **126,8 a 111,3 °C**, y con ella el margen, de **25,8 a 10,3 °C**. La temperatura de equilibrio sale de un balance en el que la presión no aparece.
4. Que **un termostato agarrotado ABIERTO también es una avería**. El motor se queda en **70,9 °C** en carretera contra los 91,0 del sano y en **100,1 °C** en la cuesta, donde parece sano. Es el único escenario al que el veredicto de marcha absuelve, y por eso el frío se juzga aparte.
5. Que **un radiador FRÍO no es un radiador sucio: es un termostato que no abre**. Con el termostato cerrado no pasa caudal, el pirómetro da el mismo número en las dos mangueras y el motor hierve: **126,8 °C** en los tres puntos del protocolo.
6. Que **con el termostato cerrado el balance NO CIERRA**. No hay ninguna temperatura por debajo de los 400 °C en que se corta la bisección donde lo disipado iguale a lo generado: quitado el radiador, la superficie del bloque se lleva **4,5 kW** de los 32 que entran. El simulador lo **declara** en vez de publicar el techo como si fuera una solución.
7. Que **el ventilador y la marcha NO se suman**: la velocidad del aire frente al radiador es la MAYOR de las dos. Parado con ventilador, **1,872 kg/s**; a 60 km/h sin ventilador, **1,610**; a 90 km/h, **2,415** en los dos casos. Por eso el ventilador averiado da **91,0 °C** en carretera —la misma cifra que el sano— y **118,0 °C** en la cuesta a 40 km/h.
8. Que **la altitud pega por los dos lados, y más por el que no se espera**. Del mar a Toluca (2 660 m) la presión atmosférica cae de **1,0132 a 0,7319 bar**: la ebullición baja **5,0 °C** y el aire enrarecido adelgaza el caudal del frontal de 1,872 a **1,352 kg/s**, lo que sube el motor **8,6 °C**. De los 13,6 °C de margen perdidos, **ocho y medio los pone el aire y cinco la ebullición**.
9. Que **más glicol no es más protección**. La curva de congelación no es monótona: al **60 %** (el eutéctico) congela a **−51,1 °C** y al **70 %**, a **−48,3 °C**. Y el 70 % transporta menos calor por litro (**3,321** contra **3,439** MJ/m³·K), transfiere peor y deja el motor a 103,6 °C en vez de a 102,1. Lo único que gana son **1,55 °C** de ebullición.
10. Que **un motor no se calienta al ralentí**. Con 10 °C de ambiente, el 1.6 a ralentí está a **68,6 °C** a los quince minutos —su equilibrio es 96,0 pero tarda más de lo que dura el ensayo— y conduciendo a 2 500 rpm con el 45 % llega a temperatura de servicio en **154 s**. Con la calefacción a tope y el coche parado se queda en **47,8 °C**. Eso NO es una avería del sistema: es el punto de trabajo, y el simulador lo dice con esas palabras.
11. Que **el balance cierra y no hay más caminos**. En la cuesta el 1.6 quema **108,4 kW** de combustible y manda **31,97 kW** al refrigerante (el **29,5 %**); de ahí salen **31,06 kW** por el radiador y **0,91 kW** por la superficie del bloque. Abre la calefacción y el calefactor se lleva **4,80 kW**: el motor baja de 101,0 a 97,0 °C.
12. Que **el orden por temperatura y el orden por margen no son el mismo**. El tapón agotado es el duodécimo de catorce por temperatura y el octavo por margen; el agua sola es la más fría de las catorce (97,5 °C) y aun así tiene menos margen que el sistema sano, porque hierve 7,8 °C antes.
13. El **teorema del censo**: con las tres temperaturas del indicador se separan **9 de 14** escenarios en el 1.6, **8** en el 1.8, **7** en el diésel y **8** en el V8. Con todo lo que se mide en un taller: **14, 12, 11 y 12** — en el 1.6 alcanza y en las otras tres **no**. Con las ocho observaciones, 14 de 14 en las cuatro. El subconjunto mínimo tiene **5, 6, 5 y 4** observaciones, y en tres de las cuatro máquinas incluye el refractómetro. No hay una regla única: hay un censo por motor.

---

## Molde y estructura

**Molde E+S** (ensamble + simulación). Siete piezas sobre el banco y siete huecos luminosos en el motor; hasta que el circuito no está completo no se abre ningún modo. Después, seis modos de trabajo:

| Modo | Qué se hace |
|---|---|
| 1 · Montar | Bomba, termostato, radiador, ventilador, tapón, calefactor y sensor. Cada tramo de manguera sólo existe si sus dos piezas están montadas. |
| 2 · Balance | De dónde sale el calor (combustible, cigüeñal, rozamiento, refrigerante) y por dónde sale (radiador, calefactor, bloque), con la comprobación de que la suma cuadra. |
| 3 · Termostato | Curva de calentamiento desde frío, apertura contra temperatura, tiempo hasta servicio y el veredicto del frío, separado del de marcha. |
| 4 · Radiador | Calor disipado contra velocidad de marcha con y sin ventilador, la misma cuesta en las cuatro plazas y el ciclo de trabajo del ventilador. |
| 5 · Refrigerante | Curva de congelación con su eutéctico, ebullición contra presión absoluta para las seis mezclas y la tabla comparada. |
| 6 · Censo | Los 255 subconjuntos de observaciones, los tres cortes que importan y el subconjunto mínimo de esta máquina. |
| 7 · Reto | Avería oculta. Se compran observaciones y se entrega la familia. |

---

## Contrato de fidelidad

**Sí modela:** calor al refrigerante desde la potencia de combustible por la línea de Willans, con la presión media de rozamiento de Heywood, la de bombeo dependiente de la carga y un factor de rozamiento en frío; bomba centrífuga por leyes de semejanza contra una resistencia que va con el cuadrado del caudal, con el reparto entre radiador, derivación y calefactor por conductancias en paralelo; termostato de cera con banda de apertura; radiador y calefactor por **ε-NTU** de flujo cruzado sin mezcla, con la película de cada lado escalando con su caudal; caudal de aire por el frontal como el **mayor** de los dos empujes sobre la densidad ISA de la plaza; ventilador como interruptor con **ciclo de trabajo** cuando el equilibrio cae en su temperatura de arranque; equilibrio por bisección sobre la temperatura de salida del bloque con el calor generado dentro de la bisección; ebullición por Clausius-Clapeyron contra la presión absoluta —tapón más atmósfera— y congelación por la tabla publicada con su eutéctico; calentamiento desde frío con la inercia del refrigerante y del metal; catorce escenarios y el censo exhaustivo de los 255 subconjuntos.

**No modela:** el gradiente de temperatura dentro del bloque, que aquí es un solo nodo; el comportamiento por encima de la ebullición, donde el modelo —que es de líquido— se declara fuera de validez y publica el margen como **inexistente** en vez de como un número negativo; la convergencia del balance con el termostato cerrado, que se declara **no convergido**; la oscilación instantánea mientras el ventilador cicla, que cierra en promedio; la convección natural sobre el frontal, que es un valor declarado de **0,05 m/s**; la degradación del refrigerante y sus inhibidores. El corte del motor es longitudinal y sólo enseña los cilindros y la camisa de agua, y los cuatro arquetipos se dibujan **en línea**, también el V8. La escena gira el impulsor a **0,0016** veces su velocidad real y el aspa a **0,30**. Los cuatro motores son **arquetipos declarados**, no modelos comerciales.

---

## Verificación

- **Capa 1 · motor sellado:** `motor_enfr.mjs` + `test_enfr.mjs` → **13 500/13 500** comprobaciones. Nueve secciones: mezclas y congelación, atmósfera y ebullición, calor al refrigerante, hidráulica de la bomba y el termostato, radiador ε-NTU, equilibrio y monotonías, la tesis del indicador, el calentamiento, y escenarios y censo.
- **Capa 2 · navegador real:** `pw_enfr.mjs` contra `window.__labDebug` → **2 204/2 204** comprobaciones. Dieciséis secciones, incluidas la de que el balance cierra **en pantalla**, la de que la aguja se queda clavada en las cuatro plazas mientras el ciclo sube, la de que el tapón no mueve la temperatura, la de que **«todo en orden» sólo puede decirlo el sistema sano** —con una avería montada que no se nota, la pantalla dice que no se nota—, la de que a ralentí el aviso de calentamiento lento **no condena** al sistema, la de que ninguna pantalla publica NaN en los catorce escenarios × cuatro máquinas × tres puntos de trabajo, y la de que el diagnóstico a ciegas no regala la respuesta ni por la telemetría ni por la cabecera del pizarrón.
- **Revisión visual:** capturas de los siete modos y de seis casos límite. Defectos que **sólo se vieron mirando**: la tabla de las cuatro plazas dibujada sobre un `clearRect` que dejaba el lienzo transparente y el pizarrón la pintaba **en blanco** con el texto claro encima, ilegible; los siete aros luminosos del banco vacío en primer plano, cuyo resplandor el `bloom` repartía por encima del pizarrón; tres botones de observación con el rótulo recortado al mismo texto —«Temperatura del indicador en …»— sin poder distinguir carretera de cuesta; las resoluciones publicadas como «5,000 °C» donde el taller mide cinco grados; tres pares de título y tabla montados uno encima de otro; la camisa de agua tan opaca que tapaba los cilindros; y el 5.0 V8 encuadrado con un factor multiplicativo que lo dejaba del tamaño de un sello en mitad de una pantalla vacía.
- **Honestidad del modelo:** el margen hasta la ebullición se publica como **`null`** —y en pantalla como «HIERVE» o «sin equilibrio»— en cuanto el refrigerante hierve o el balance no converge, en lugar de como un número negativo. La comparación se hace siempre por un único par de funciones, porque en JavaScript `null < 12` vale `false` y una comparación a pelo colaría un motor hervido como un motor con reserva de sobra.
