# MEC-123 · Sobrealimentación: turbo, wastegate e intercooler

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-13 — *Opera la sobrealimentación: turbo, wastegate e intercooler* (molde E+S, ensamble 3D + simulación con mode-lock)
- **Simulador:** `/labs/sobrealimentacion-turbo-intercooler.html`
- **Slug:** `sobrealimentacion-turbo-intercooler`
- **Ancla curricular:** AUT-Y motores sobrealimentados (liga con `mecanica-111` ciclo Otto, `mecanica-112` ciclo Diésel y autoencendido, `mecanica-116` enfriamiento y termostato, `mecanica-120` gases de escape y verificación) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** SAE J1826 (ensayo y presentación de mapas de compresor) · SAE J1723 (relación de presiones y rendimiento isentrópico) · SAE J2723 / ISO 15550 (corrección de potencia a condiciones de referencia) · SAE J2012 / ISO 15031-6 (P0299, P0234) · Watson y Janota, *Turbocharging the Internal Combustion Engine* · Heywood, *Internal Combustion Engine Fundamentals* · Bosch, *Automotive Handbook* · Kays y London, *Compact Heat Exchangers*

Cierra el hilo abierto por `mecanica-111` y `mecanica-112`: aquellos resolvieron qué pasa DENTRO del cilindro, y éste resuelve qué le llega y a qué precio.

---

## Qué enseña

1. Que **un turbo no da potencia: da densidad**. En el punto de referencia —1.4 L turbo de gasolina, 2 400 rpm, plena carga, 25 °C, nivel del mar, 91 octanos— el colector queda en 1,98 bar absolutos con el aire a 40 °C, o sea **2,211 kg/m³**. A 117 °C, que es lo que saldría del compresor sin enfriar, los mismos 1,98 bar valen **1,774**.

2. Que **el compresor no da la presión que se le pida**: vive dentro de un mapa cerrado con la línea de bombeo a la izquierda y el bloqueo a la derecha. En el punto de referencia quedan **89 % de margen hasta el bombeo y 50 % hasta el bloqueo** de su línea de velocidad, comprimiendo con un 71,5 % de rendimiento a 168 899 rpm.

3. Que **el eje se EQUILIBRA, no se declara**. El compresor pide 5,49 kW y la turbina saca exactamente 5,49 kW con una relación de expansión de 2,02. La incógnita que lo consigue es la apertura de la válvula de descarga —el **9 %** aquí—, y sale de resolver turbina y descarga como **dos toberas en paralelo**.

4. Que **el precio del turbo se cobra en el escape**: 2,04 bar delante de la turbina contra 1,98 en el colector, **8,3 J por ciclo** de trabajo de bombeo y el rendimiento volumétrico en 92,4 % en vez del máximo del motor.

5. Que **quitarle el intercooler a un motor de gasolina no lo deja caliente: lo deja sin fuerza**. El aire entraría a 70 °C y llegaría al final de la compresión a 752 K contra un umbral de 750 con 91 octanos. El control de picado baja la consigna de **1,00 a 0,34 bar**, y el par cae de 250,7 a 148,9 N·m: **−40,6 %**. Con 87 octanos, 0,20 bar y −45,3 %; con 95, 0,50 bar y −35,2 %.

6. Que **en diésel el mismo fallo actúa por otra vía**. El 2.0 TDI conserva sus 1,25 bar y sus 2,26 de colector —un diésel no detona— y aun así pierde el **23,9 %**: el aire entra a **150 °C** y la densidad cae de 2,490 a 1,864 kg/m³.

7. Que **en altura un turbo hace lo que un atmosférico no puede, y lo paga en el eje**. De 0 a 2 660 m la presión ambiente cae de 1,01 a 0,73 bar y este motor **mantiene 1,99 bar en el colector** subiendo el soplado de 1,00 a 1,28: pierde **6,7 %** de par. El turbo pasa de 168 899 a **230 357 rpm**, por encima de sus 220 000. A 3 500 m ya no puede: la relación de presiones necesaria calienta tanto el aire que el picado recorta, y la pérdida se va al **24,8 %**.

8. Que **el filtro sucio es la avería que no cuesta par**: −1,5 % de par, **+5,7 % de vueltas de eje** y el margen de bombeo del 89 % al 83 %. En un motor atmosférico se notaría; aquí se lo come el turbo y se lo cobra en vida útil.

9. Que **el escape tapado sopla ANTES**: sube la contrapresión de 2,04 a 2,66 bar y el turbo llega a la consigna en **0,14 s en vez de 0,34**, perdiendo el 9,5 % del par. Es el mismo compromiso que hay detrás de una carcasa de turbina pequeña, y por eso una avería puede parecer una mejora.

10. Que **el retardo del turbo se integra**: par neto sobre el eje contra su inercia. A 1 800 rpm, **0,34 s al 90 % con un 23 % de sobreimpulso** y una inercia de 52 g·cm². Con el turbo gastado, **1,27 s**. En el 2.0 TDI a 1 500 rpm, 1,21 s sano y **no llega nunca** gastado.

11. Que **la válvula de descarga es lo que cierra el lazo**. Pegada cerrada: 1,82 bar de soplado contra 1,35 de máximo, +21,8 % de par y el eje a **232 684 rpm en régimen y 243 968 en el transitorio**. La realimentación es positiva —más presión da más gasto, más gasto da más contrapresión y más contrapresión da más potencia de turbina— y sin la descarga no hay nada que la corte.

12. Que **el ordenador ve muy poco**: presión absoluta de colector y temperatura de admisión, y dos códigos que hablan sólo de presión. De **45 casillas, 31 con síntoma y 14 mudas** en el 1.4; **18 mudas de 35** en el V8 6.6.

13. Que **la ceguera del escáner es máxima justo donde el motor trabaja**. En el reto a ciegas, a 2 400 rpm —plena meseta de soplado— el escáner deja **cuatro sospechosos empatados**: motor sano, filtro saturado, escape restringido y turbo gastado dan la misma presión de colector y la misma temperatura de admisión, porque la válvula de descarga se ocupa de que así sea mientras le quede recorrido. A 6 000 rpm, con la descarga cerrada y sin autoridad, el escáner vuelve a separarlas todas. Lo que rompe el empate es la sonda de antes de la turbina. Las **45 casillas del reto** (nueve averías por cinco regímenes) cierran a un solo sospechoso con los seis instrumentos, y en ninguna se cae el culpable de la lista.

---

## Los cuatro vehículos

| motor | par máximo | potencia máxima | pme |
|---|---|---|---|
| 1.4 L turbo de gasolina, 2016 | 260 N·m a 1 495 rpm | 104,2 kW (140 CV) a 6 000 | 23,3 bar |
| 2.0 L turbodiésel, 2018 | 326 N·m a 1 485 rpm | 102,4 kW (137 CV) a 4 500 | 20,5 bar |
| 2.0 L de gasolina deportivo, 2020 | 452 N·m a 1 637 rpm | 205,1 kW (275 CV) a 7 000 | 28,4 bar |
| 6.6 L V8 turbodiésel, 2015 | 1 087 N·m a 1 282 rpm | 277,8 kW (373 CV) a 3 600 | 20,7 bar |

La presión media efectiva es la columna que hace comparables motores de cilindrada distinta, y las cuatro caen donde caen los motores reales de su clase.

---

## Las siete vistas

1. **montaje** — las siete piezas del camino del aire, con los modos cerrados hasta que estén todas.
2. **mapa** — el mapa del compresor completo: líneas de velocidad reducida, línea de bombeo, el final de cada línea (su bloqueo), islas de rendimiento y la línea de funcionamiento del motor.
3. **estaciones** — presión absoluta y temperatura en los seis puntos del camino, más la curva de par y potencia.
4. **intercooler** — el par contra el tamaño del intercambiador, con su máximo interior; la efectividad y la pérdida de carga contra el gasto; y la comparación con y sin.
5. **respuesta** — el transitorio: soplado, apertura de la descarga y vueltas del eje contra el tiempo.
6. **censo** — nueve averías por cinco regímenes, coloreadas por lo que el ordenador se entera.
7. **reto** — diagnóstico a ciegas con seis instrumentos de resolución realista.

---

## Verificación

- **Capa 1** (`scripts/auditoria/.c1_123.mjs`): recorta el motor sellado del `.body.js` y lo valida en Node, sin navegador.
- **Capa 2** (`scripts/auditoria/.c2_123.mjs`): conduce la página real en Chromium por `window.__labDebug`.
- **Pantalla** (`scripts/auditoria/.shot_123.mjs`): saca el lienzo del pizarrón a 1024×768 por `__labDebug.tableroPNG`, que es la única forma de ver un solape de rótulos.
