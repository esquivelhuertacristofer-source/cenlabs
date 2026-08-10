# MEC-118 · Formas de onda de los sensores del motor

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-08 — *Interpreta formas de onda de los sensores del motor* (molde P, panel-instrumento virtual)
- **Simulador:** `/labs/formas-de-onda-motor.html`
- **Slug:** `formas-de-onda-motor`
- **Ancla curricular:** AUT-Y electrónicos (liga con `mecanica-111` … `mecanica-117`) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** Bosch, *Automotive Handbook* (captadores de reluctancia variable y de efecto Hall, rueda fónica, sensores de posición y de presión de colector, hilo caliente, inyectores de mando por saturación) · SAE J1979 / ISO 15031-5, modos 01 y 06 · ISO 15031-6 / SAE J2012 (códigos) · ISO 15765-4 (enlace de diagnóstico) · manual de taller del fabricante, única fuente de la rueda fónica, del entrehierro y del inyector de un motor concreto

---

## Qué enseña

1. Que **el margen de una rueda fónica es un número**. La razón entre periodos de diente consecutivos vale los dientes que faltan más uno y no depende del régimen. En una 60−2 el hueco abre **3,00** y un diente roto abre **2,00**, con el umbral en 2,50 entre los dos. En una 36−1 los dos abren **2,00**: no hay margen.
2. Que por eso **el mismo diente roto tiene dos desenlaces**: en la 60−2 la centralita sigue sincronizando y sólo salta un P0300; en la 36−1 cree ver **2** referencias y el coche no arranca.
3. Que **la señal más débil de la vida del motor es la del arranque**. El 1.6 sano da 1,364 V a 220 rpm y 4,836 V a ralentí; con el captador flojo, **0,373 V** contra un umbral de 0,45 V y **1,321 V** a ralentí. Gira y no arranca; empujado, funciona.
4. Que **la misma avería mecánica tiene tres desenlaces según el captador**: inductivo (no arranca y funciona arrancado), Hall pasado de margen (sin señal ninguna) y Hall con margen (2,25 mm contra 2,30 mm: no pasa nada).
5. Que **dos pulsos seguidos perdidos inventan una referencia** de razón **3,00**, idéntica a la de fábrica: la centralita ve 2 y pierde la sincronía.
6. Que **un diente de árbol vale 720/Z grados de cigüeñal**: 18,00 ° en el 1.6, 20,00 ° en el 2.0, 22,50 ° en el 1.2 y 16,36 ° en el V6.
7. Que **una alimentación caída MULTIPLICA y una masa con resistencia SUMA**: razón constante 0,820 contra diferencia constante 0,62 V. Con una sola lectura son la misma avería.
8. Que **la raíz del hilo caliente esconde casi dos tercios del error**: 28 % de masa se quedan en 10,3 % de tensión (2,810 V → 2,520 V), por debajo del umbral del 15 %.
9. Que **la ausencia de rizado es un dato**: 26,0 Hz a ralentí en el 1.6 y 34,0 Hz en el V6; con la manguera rajada, 4,519 V y rizado cero.
10. Que **la joroba de cierre delata la aguja**: 1,15 ms sano contra **2,30 ms** pegajoso, con L/R y la corriente al corte intactas.
11. Que **cazar un fallo intermitente es aritmética**: 12,0 ms contra 80 ms dan **15 %** y **19 pisotones** para el 95 %; barriendo en 2,00 s o más, siempre.
12. Que **el osciloscopio no es un lujo**: censo de 8 191 juegos → taller corriente 9/13 (confundiendo sistema sano ≡ aguja del inyector pegajosa; un diente de la rueda fónica roto ≡ apantallamiento del cable roto), con osciloscopio 13/13, juego mínimo de 5. En el V6, 11/13, y lo que falta es que captador de cigüeñal flojo **no cambia nada**.

---

## Cómo se verifica

| Capa | Qué comprueba | Resultado |
|---|---|---|
| **Capa 1** (`test_onda.mjs`) | El motor sellado contra sí mismo y contra la física: periodos y razones de la rueda, ley del entrehierro, amplitud contra régimen, trazas medidas contra amplitudes declaradas, 720/Z, rectas de calibración, exponencial del inyector, probabilidad exacta de muestreo, códigos y censo exhaustivo | **10 520 / 10 520** |
| **Capa 2** (`pw_onda.mjs`) | El laboratorio ya construido, en Chromium, contra `window.__labDebug`: cada cifra de pantalla contra la del motor sellado en la rejilla de cuatro máquinas × escenarios × puntos, los seis canales, los ocho modos con sus atajos, el censo, el reto sin filtraciones, el cuestionario, cada botón del panel y el recorrido guiado entero. La telemetría se compara además **como cadena**, carácter a carácter, contra las cifras formateadas aquí: es otro camino de código que el que se lee por `__labDebug`, y tiene que cambiar cuando —y sólo cuando— cambia el motor | **9 567 / 9 567** |
| **Revisión visual** | Capturas de los ocho modos y de los casos límite en las cuatro máquinas | Sin recortes ni solapes |

---

## Los trece escenarios en el 1.6 (rueda 60−2, captador inductivo)

| escenario | ¿arranca? | dientes | refs. | V al arranque | fase | V mariposa | V presión | V aire | joroba | códigos |
|---|---|---|---|---|---|---|---|---|---|---|
| Sistema sano | sí | 58 | 1 | 1,36 V | +0,0 ° | 0,55 V | 1,13 V | 2,81 V | 1,15 ms | — |
| Un diente de la rueda fónica roto | sí | 57 | 1 | 1,36 V | +0,0 ° | 0,55 V | 1,13 V | 2,81 V | 1,15 ms | P0300 |
| Captador de cigüeñal flojo | **NO** | 58 | 1 | 0,37 V | +0,0 ° | 0,55 V | 1,13 V | 2,81 V | 1,15 ms | P0335 |
| Conector del cigüeñal intermitente | **NO** | 55 | 2 | 1,36 V | +0,0 ° | 0,55 V | 1,13 V | 2,81 V | 1,15 ms | P0300 P0335 |
| Correa saltada un diente | sí | 58 | 1 | 1,36 V | +18,0 ° | 0,55 V | 1,13 V | 2,81 V | 1,15 ms | P0016 |
| Sensor del árbol sin señal | sí | 58 | 1 | 1,36 V | sin señal | 0,55 V | 1,13 V | 2,81 V | 1,15 ms | P0340 |
| Pista del acelerador gastada | sí | 58 | 1 | 1,36 V | +0,0 ° | 0,55 V | 1,13 V | 2,81 V | 1,15 ms | — |
| Caída en la alimentación de 5 V | sí | 58 | 1 | 1,36 V | +0,0 ° | 0,45 V | 0,93 V | 2,30 V | 1,15 ms | P0101 |
| Masa de sensores con resistencia | sí | 58 | 1 | 1,36 V | +0,0 ° | 1,17 V | 1,75 V | 3,43 V | 1,15 ms | P0101 P0121 |
| Manguera del colector rajada | sí | 58 | 1 | 1,36 V | +0,0 ° | 0,55 V | 4,52 V | 2,81 V | 1,15 ms | P0106 |
| Hilo caliente sucio | sí | 58 | 1 | 1,36 V | +0,0 ° | 0,55 V | 1,13 V | 2,52 V | 1,15 ms | — |
| Apantallamiento del cable roto | sí | 58 +4 | 1 | 1,36 V | +0,0 ° | 0,55 V | 1,13 V | 2,81 V | 1,15 ms | P0300 |
| Aguja del inyector pegajosa | sí | 58 | 1 | 1,36 V | +0,0 ° | 0,55 V | 1,13 V | 2,81 V | 2,30 ms | — |

---

## Contrato de fidelidad

**Sí modela:** rueda fónica diente a diente con su hueco y la razón entre periodos consecutivos · captador de reluctancia variable proporcional al régimen y con caída por entrehierro según potencia ajustada declarada · sensor de efecto Hall de amplitud fija hasta el límite de su entrehierro · sincronía cigüeñal-árbol con 720°/Z · tres rectas de calibración sobre alimentación y masa comunes, con hueco de pista, factor de escala y desplazamiento de cero · presión de colector como consecuencia de mariposa y régimen, con rizado a la frecuencia de aspiración · hilo caliente por raíz del gasto · onda eléctrica del inyector con exponencial L/R, pico inductivo y joroba de cierre · ruido de encendido acoplado y su umbral de comparador · siete códigos con umbrales declarados · probabilidad exacta de muestreo y repeticiones para una confianza dada · censo exhaustivo de los 8 191 subconjuntos sobre cuatro máquinas.

**NO modela:** combustión, mezcla ni ajustes de la centralita (práctica anterior) · avance de encendido y bobina · bus de datos y su latencia, resumidos en un periodo de refresco declarado · ruido de fondo salvo el acoplamiento que declara una avería · degradación del ciclo de trabajo de un Hall cerca de su límite de entrehierro · el propio osciloscopio (ancho de banda, sondas y disparo son d10-03 y d10-04). Las averías intermitentes se **congelan** en su instante malo; lo que sí se modela es la probabilidad de cazarlas. El giro se pinta ralentizado 26 veces. Los cuatro motores son arquetipos declarados, **no** modelos comerciales.
