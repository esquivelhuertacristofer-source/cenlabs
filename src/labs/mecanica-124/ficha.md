# MEC-124 · Dinamómetro: par, potencia y corrección a norma

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-14 — *Mide par y potencia en dinamómetro y corrige a norma* (molde E+S, ensamble 3D + simulación con mode-lock)
- **Simulador:** `/labs/dinamometro-par-potencia-correccion.html`
- **Slug:** `dinamometro-par-potencia-correccion`
- **Ancla curricular:** AUT-Y ensayo de motores y bancos de potencia (liga con `mecanica-111` ciclo Otto, `mecanica-112` ciclo Diésel, `mecanica-113` distribución, `mecanica-120` gases de escape y verificación, `mecanica-123` sobrealimentación) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** SAE J1349 rev. 2004 (potencia neta, factor y su intervalo 0,93–1,07) · ISO 1585 y Directiva 80/1269/CEE · DIN 70020-6 · SAE J607 «bruta» (hasta 1972) · SAE J2723 (certificación) · SAE J1263 y J2263 (coastdown) · ISO 2533 (atmósfera estándar) · Martyr y Plint, *Engine Testing: Theory and Practice* · Heywood, *Internal Combustion Engine Fundamentals* · Bosch, *Automotive Handbook*

Cierra el hilo abierto por `mecanica-111`, `mecanica-112` y `mecanica-123`: aquéllos resolvieron qué pasa dentro del cilindro y qué le llega, y éste resuelve **cómo se mide lo que sale y por qué el número que se publica casi nunca es el que el motor dio**.

---

## Qué enseña

1. Que **la potencia no es un número del motor: es un número del motor y del aire que respira**. Un motor de cuatro tiempos traga su cilindrada por ciclo, así que la masa que entra es el volumen por la densidad, y la densidad depende del sitio. El aire se resuelve completo: presión barométrica por ISA, presión de saturación por Magnus, presión seca por Dalton y densidad como suma de dos gases (R_seco = 287,058, R_vapor = 461,495 J/(kg·K)).

2. Que **el mismo coche, el mismo día, da cinco números distintos**. El 1.4 turbo en Toluca (2 660 m, 18 °C, 40 %) mide **140 CV**, y sobre esa misma pasada la DIN 70020 publica **195**, la SAE J1349 **198**, la ISO 1585 **201** y la SAE J607 bruta **220**. **Ochenta caballos de diferencia** sin que nadie mienta.

3. Que **el intervalo 0,93–1,07 de la SAE J1349 no está ahí porque la fórmula se rompa**. Para un motor atmosférico sigue acertando muy fuera de él: a 2 660 m pide 1,4152 cuando el motor merecía 1,4560, un **2,8 %** de residuo. El peor residuo del atmosférico (**4,9 %**) aparece a 5 °C y nivel del mar, **dentro** del intervalo.

4. Que **lo que rompe la corrección es un motor que se defiende**. El turbo mantiene la presión absoluta de colector subiendo el soplado y sólo paga el trabajo de bombeo contra un escape a menos presión: merece un factor de **1,052** y la norma le da **1,415**. Un **+34,5 %** de potencia inventada, con la fórmula aplicada exactamente como está escrita.

5. Que **un día caluroso y húmedo al nivel del mar ya te saca del intervalo**. A 40 °C y 80 % la saturación vale 73,7 hPa y el vapor se lleva **59,0 de los 1 013,3**: la presión seca baja a 954,3 hPa, la densidad a 1,1024 kg/m³ y el factor pide **1,0746**. Ese mismo día sin humedad pide **1,0016**: la humedad sola explica toda la excursión.

6. Que **el «1,18·D − 0,18» de la J1349 es la recta tangente en D = 1 del modelo físico exacto** 0,85·D/(1 − 0,15·D), que sale de suponer que el 15 % del par es fricción independiente de la densidad. Coinciden a menos del **0,14 %** en todo el intervalo declarado —el máximo cae justo en el borde, D = 0,93— y se separan un 0,64 % en D = 1,20 y un **3,35 %** en D = 1,50.

7. Que **un banco de inercia no mide par: mide cuánto acelera un rodillo de inercia conocida** (P = J·α·ω), y que todo lo que quede entre el pistón y el rodillo desaparece de la hoja: del **10,3 % al 23,4 %** de la potencia según el punto de la curva. El 1.4 T publica 99,3 kW con la costera restada, 87,3 sin restar nada, y merece **108,2**.

8. Que **la desaceleración libre tiene un agujero estructural**. Con el gas cortado no pasa par por los engranes, y el rendimiento de una transmisión no es una constante que se reste: es una **fracción del par que la atraviesa**. Lo que sólo aparece cuando hay par no puede medirse cuando no lo hay. La costera ve del 5,6 % al 17,3 %, las pérdidas reales van del 10,3 % al 21,9 %, y en el pico se quedan fuera **4,6 puntos** que ningún método de este banco recupera.

9. Que **la marcha elegida cambia la cifra**. El V8 publica **253,7 kW en 1.ª y 291,7 en 5.ª** —merece 311,9— porque en las marchas cortas el motor gira mucho para poco camino y se queda con la potencia acelerándose a sí mismo: **12,9 %** en 1.ª contra 1,3 % en 5.ª.

10. Que **hay averías que no hacen absolutamente nada, y saberlo vale tanto como lo contrario**. De las ocho averías, en banco de inercia y al nivel del mar sólo **cuatro** superan el 2 % de repetibilidad —estación desconectada, ventilador parado, aire recirculado y rodillo aceitado—, y de las otras cuatro una es el único peligro físico del laboratorio: los amarres flojos. En un banco de inercia la **célula de carga descalibrada es muda** —no hay célula— y el **captador de vueltas contando el doble no cambia ni un vatio**, porque la potencia sale de la energía del rodillo y no de las vueltas. Lo único que delata a este último es que el eje de la hoja impresa se sale del corte del motor. En el banco de motor y en el de freno, en cambio, la célula descalibrada cuesta entre **+4,4 % y +5,1 %**.

11. Que **la avería más engañosa es la que MEJORA el número**. Con la estación desconectada, el 1.4 T en Toluca publica **126 CV en vez de 184** y se acerca a los 147 que merece. Y de propina **apaga el aviso de «fuera de norma»**, que era la única señal en pantalla de que aquel número no valía. Es la única avería del laboratorio que reduce el error total *y* borra su propia alarma.

12. Que **el error total se descompone en tres culpas y la descomposición cierra exacta**: el **suelo de la máquina** (lo que este banco se deja pase lo que pase, aquí −7,3 %), lo que el **montaje** estropea por encima de ese suelo y lo que la **cuenta** de después estropea al multiplicar. **(1 + suelo)·(1 + montaje)·(1 + cuenta) = 1 + total**, comprobado en las 90 combinaciones. Mezclados en un solo porcentaje, las 45 casillas del censo salían del mismo color y no decían nada.

13. Que **el umbral para repartir culpas es el 2 %**, que es la repetibilidad de un banco de rodillos bien llevado, y el laboratorio lo declara en vez de fingir una precisión que no tiene. Por la misma razón el resbalón por debajo del 5 % no genera aviso: existe, pero nadie lo vería.

---

## Los cuatro motores (banco de motor, SAE J1349, nivel del mar 25 °C y 40 %)

| motor | par máximo | potencia máxima | presión media |
|---|---|---|---|
| 1.6 atmosférico (1,598 L) | 158,2 N·m @ 3 869 rpm | 84,2 kW · 114 CV @ 6 149 rpm | 12,4 bar |
| 1.4 turbo (1,395 L) | 260,9 N·m @ 2 364 rpm | 107,1 kW · 146 CV @ 4 909 rpm | 23,5 bar |
| 2.0 TDI (1,968 L) | 327,4 N·m @ 1 895 rpm | 101,6 kW · 138 CV @ 3 741 rpm | 20,9 bar |
| V8 5.0 atmosférico (5,038 L) | 527,3 N·m @ 3 997 rpm | 312,4 kW · 425 CV @ 7 000 rpm | 13,2 bar |

---

## Verificación

- **Capa 1** (`scripts/auditoria/.c1_124.mjs`): recorta el motor sellado del `.body.js` y lo valida en Node, sin navegador. **23 531 comprobaciones en 20 grupos**.
- **Capa 2** (`scripts/auditoria/.c2_124.mjs`): conduce la página real en Chromium por `window.__labDebug`.

La Capa 1 encontró y obligó a corregir un fallo real de la descomposición del error: `pisoBanco` se calculaba con el factor verdadero de las condiciones **averiadas**, así que con el ventilador parado el motor respiraba aire más caliente, su factor cambiaba y «el suelo de la máquina» dejaba de ser un suelo. La corrección —juzgar siempre contra el mismo ensayo bien montado— es también la que hace que la identidad multiplicativa cierre exacta.
