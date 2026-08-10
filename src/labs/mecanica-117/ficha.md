# MEC-117 · Inyección electrónica: sonda lambda y ajustes de mezcla

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-07 — *Inyección y sonda lambda: ajustes de mezcla* (molde P+S, panel-instrumento + simulación)
- **Simulador:** `/labs/inyeccion-sonda-lambda.html`
- **Slug:** `inyeccion-sonda-lambda`
- **Ancla curricular:** AUT-Y motores (liga con `mecanica-111`, `mecanica-112`, `mecanica-113`, `mecanica-114`, `mecanica-115` y `mecanica-116`) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** ecuación de Nernst y curva publicada de la sonda de banda estrecha (Bosch, *Automotive Handbook*) · Heywood, *Internal Combustion Engine Fundamentals* (1988), cap. 6 · SAE J1979 / ISO 15031-5, modos 01 y 06 del diagnóstico a bordo · ISO 15031-6 / SAE J2012 para los códigos · catálogo del fabricante de inyectores · manual de taller del fabricante, única fuente del caudal del inyector, de la presión del riel y del mapa de una centralita concreta

---

## Qué enseña

1. Que **la sonda de banda estrecha NO mide la mezcla**. De lambda 0,80 a 0,90 —de humo negro a francamente rica— la tensión se mueve **0,328 mV**, el **0,041 %** de su carrera de 800 mV; entre 0,99 y 1,01 recorre **297 mV**, el 37,1 %. Casi toda la carrera se gasta en el diez por ciento central de la banda: es un detector de cruce, no un medidor.
2. Que **una sonda que miente arrastra a la centralita y el escáner sale impecable**. Con la sonda contaminada, el ajuste largo se queda en **+5,5 %** a ralentí y +5,5 % en crucero —por debajo del ±10 % que dispara código—, no salta ningún P0171 ni P0172, y el analizador de gases mide lambda **0,948**. El lazo busca el ajuste que hace que la SONDA diga uno, no el que centra la mezcla.
3. Que **la FORMA del ajuste contra la carga separa lo que su valor no separa**. Fuga de vacío: **+16,9 %** a ralentí y **+1,6 %** en crucero, cociente 10,4. Sensor de aire sucio: **+13,6 %** y **+13,6 %**, cociente 1,00. Un caudal fijo se diluye cuando el motor bombea; un error proporcional no. Con un solo punto de medida son la misma avería.
4. Que **un cilindro pobre arrastra a los otros tres**. Con el inyector del cilindro 1 al 72 %, la mezcla de los cuatro escapes sale en lambda **1,000** clavada y la centralita enriquece **+7,5 %**: el 1 queda en **1,292** y los otros tres en **0,930**, con **0,362** de dispersión. Mezclar escapes es sumar masas, no promediar lambdas.
5. Que **abrir el lazo destapa las averías de MEDIDA y hace desaparecer las de SONDA**. A plena carga el objetivo pasa a ser 0,877: el sensor sucio da **0,997**, la presión baja **1,048** y la alta **0,736** —los tres fuera—, mientras que sonda lenta, sonda contaminada y fuga de escape dan **0,877 exactas**. El mejor reactivo del banco no cuesta nada.
6. Que **hay una avería que el escáner no puede ver de ninguna manera**. Filtro de aire tapado: lambda 1,000, ajustes 0,0 % en los dos puntos, sin códigos, y **68,0 %** del par que daría sano a plena carga. Un escáner limpio no es un motor sano.
7. Que **un lazo lento NO es una sonda lenta**. La sonda envejecida baja los cruces de **4,51** a **2,81** por segundo con la mezcla media y el ajuste largo impecables. Pero el filtro tapado los baja a **3,10** con la sonda sana, porque entra menos aire y los gases tardan más en llegar. Lo que acusa a la sonda es su constante de tiempo —**85 ms contra 442**—, no la frecuencia del lazo.
8. Que **el caudal de un inyector va con la RAÍZ de la presión**. Cuadruplicar la caída sólo duplica el caudal, **2,850 → 5,700 g/s**; el riel al 70 % entrega el **83,7 %**, no el 70; recuperar un 10 % de caudal exige subir la presión un **21,0 %**.
9. Que **a mariposa cerrada, subir de vueltas BAJA la presión del colector**: de **0,320** a **0,200 bar** entre ralentí y 3 000 rpm en el 1.6, y lo mismo en las otras tres máquinas. La presión del colector no es un mando: es la consecuencia de la mariposa y del régimen.
10. Que **con E85 en un motor mapeado para gasolina la centralita se rinde**. El E85 pide **1,505 veces** más masa; el ajuste largo se planta en su tope de **+25,0 %** en las cuatro máquinas, el motor se queda en lambda **1,204** y salta P0171. Es la única avería en la que la autoridad del lazo no alcanza.
11. Que **el osciloscopio no es un lujo**. Censo: los dos ajustes del escáner separan **9 de 13** en las cuatro máquinas —confundiendo siempre los mismos cuatro: sano, sonda vieja, filtro tapado y batería baja—; todo el taller corriente llega a **11 de 13** y tampoco alcanza; el juego mínimo tiene **3** observaciones en el 1.6 y el 2.0, **5** en el 1.4 turbo y **4** en el V6, y en las cuatro máquinas **incluye los cruces por segundo**.

---

## Cómo se verifica

| Capa | Qué comprueba | Resultado |
|---|---|---|
| **Capa 1** (`test_iny.mjs`) | El motor sellado contra sí mismo y contra la física: definición de lambda, conservación en la cadena del combustible, monotonías, la curva de Nernst sobre su banda publicada, la saturación del lazo, la forma del ajuste contra la carga y el censo exhaustivo | **3 426 / 3 426** |
| **Capa 2** (`pw_iny.mjs`) | El laboratorio ya construido, en Chromium, contra `window.__labDebug`: cada cifra de pantalla contra la del motor sellado en la rejilla de cuatro máquinas × puntos × escenarios, la tesis en pantalla, el censo, el reto sin filtraciones y el cuestionario | **2 616 / 2 616** |
| **Revisión visual** | Diecisiete capturas de los siete modos y de los casos límite en las cuatro máquinas | Sin recortes ni solapes |

---

## Contrato de fidelidad

**Sí modela:** relación estequiométrica como propiedad del combustible (14,70 / 14,08 / 9,77) contra los 14,70 grabados en la centralita · carga de aire por densidad y régimen con rendimiento volumétrico en campana y penalización por gases residuales · presión del colector como consecuencia de la mariposa y del régimen, con soplado de turbo creciente con el gasto · caudal del inyector por la raíz de la caída de presión, con regulador referenciado al vacío o sin retorno · tiempo muerto por tabla de catálogo contra tensión de batería · sonda de banda estrecha por logística de Nernst · lazo cerrado por bisección sobre el ajuste que hace que la SONDA lea uno, con autoridad ±25 % y código a partir de ±10 % · apertura del lazo a plena carga con enriquecimiento de potencia · reparto por cilindro sumando masas de escape · oscilación del ajuste corto con salto y rampa contra el retardo de transporte y la constante de la sonda · trece escenarios y censo exhaustivo de los 255 subconjuntos sobre cuatro máquinas.

**NO modela:** combustión, avance de encendido ni detonación · química del catalizador · inyección directa y estratificada · transitorios, arranque en frío y corte en retención · dinámica del regulador de presión · sonda de banda ancha · sensores de detonación, árbol y cigüeñal · gestión de la marcha mínima. El régimen y el acelerador son mandos independientes, como en un banco con freno. Las inyecciones se pintan ralentizadas 8 veces y los cilindros se dibujan en línea también en el V6. Los cuatro motores son arquetipos declarados, no modelos comerciales.
