# MEC-113 · Sincroniza la distribución y verifica la puesta a punto

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-03 — *Sincroniza la distribución y verifica la puesta a punto* (molde E, ensamble + simulación)
- **Simulador:** `/labs/sincronizacion-distribucion-puesta-a-punto.html`
- **Slug:** `sincronizacion-distribucion-puesta-a-punto`
- **Ancla curricular:** AUT-Y motores (liga con `mecanica-2`) · UAX Mecánica y mantenimiento
- **Norma ancla:** manual de taller del fabricante (rangos), única fuente de ángulos, juego de taqués y holgura mínima de un motor concreto
- **Fuentes de referencia:** SAE J604 (nomenclatura de motores alternativos) · criterios de alzado de referencia 0,15 / 1,00 / 1,27 mm (0,050 in) · ISO 6789 (herramientas dinamométricas) · Heywood, *Internal Combustion Engine Fundamentals* (1988) · Taylor, *The Internal-Combustion Engine in Theory and Practice*, MIT Press

---

## Qué enseña

1. Que **el error de calado se cuenta en dientes, no en grados**. Un paso de piñón vale `360/Z_leva` vistos en el piñón y `720/Z_leva` medidos en el cigüeñal, y ambas cifras son la misma identidad porque `720/Z_leva = 360/Z_cig`. En las cuatro máquinas: **9,00°/18,00°** (1.6 DOHC, Z 40), **9,47°/18,95°** (1.8 SOHC, Z 38), **9,00°/18,00°** (2.0 TDI, Z 40) y **10,00°/20,00°** (5.0 V8, Z 36).
2. Que **el mismo árbol publica tres juegos de ángulos** según a qué alzado neto se declare abierta la válvula. El traslape del 1.6 DOHC vale **55,0°** a 0,15 mm, **14,0°** a 1,00 mm y **6,3°** a 1,27 mm; el del 1.8 SOHC, **35,5° / 8,0° / 1,9°**; el del 2.0 TDI, **42,3° / 3,0° / −4,3°**. La duración de admisión del 1.6 pasa de **272,9°** a **232,0°** y a **224,3°** por el mismo motivo.
3. Que **el traslape se mide, no se suma**. El laboratorio recorre el entorno del PMS a 0,05° y comprueba dónde los dos alzados netos superan a la vez la referencia: en el 1.6 DOHC el barrido da **13,95°** frente a los **14,00°** de `AAA + RCE`, con **39,56 mm·°** de área y **1,52 mm** de alzado simultáneo máximo.
4. Que **un traslape negativo es una decisión de diseño y se informa como tal**. El V8 leído a 1,00 mm no da 0°: da un **hueco de 17,05°** entre el cierre del escape y la apertura de la admisión, con sólo **0,43 mm** de alzado simultáneo. Devolverlo como cero mentiría.
5. Que **ser interferente y chocar son preguntas distintas**. Interferente es geometría —alzado neto máximo contra el hueco de la corona, independiente del calado—: el 1.6 tiene **8,80 mm contra 3,20** (penetra **5,60**) y el 2.0 TDI **9,20 contra 2,50** (penetra **6,70**). Chocar es del calado: ese mismo 1.6, bien calado, conserva **1,33 mm** de holgura en admisión y **1,94** en escape.
6. Que **el signo del diente importa la mitad de las veces**. El punto crítico de la admisión cae *después* del PMS de solape —está abriendo mientras el pistón sube—, así que **adelantar** aprieta la admisión: en el 1.6, `+1` la lleva de **+1,33 a −0,66 mm**. El del escape cae *antes* —aún no ha cerrado—, así que **retrasar** aprieta el escape: en el 2.0 TDI, `−1` lo lleva a **−0,28 mm**. Quien memoriza «un diente = peligro» sin el signo se equivoca la mitad de las veces.
7. Que **hay motores que no pueden chocar, y eso es un teorema**. Si `L_neta_max ≤ C₀`, entonces `C(θ) = C₀ + s(θ)·cos α − L(θ) ≥ C₀ − L_neta_max ≥ 0` para todo θ, porque `s(θ) ≥ 0` siempre. El 1.8 SOHC (**10,30 contra 11,50**) y el V8 (**11,40 contra 12,50**) no tocan ni saltando dos dientes en los dos árboles: comprobado en el navegador sobre las 25 combinaciones de cada uno.
8. Que **la presión de compresión es ciega al árbol de escape**. Se cuenta desde el cierre REAL de admisión, así que mover el escape no la toca: **15,0 bar** en el 1.6 y **28,4 bar** en el 2.0 TDI, exactamente los mismos con el calado correcto que con un diente movido. Los residuales a ralentí sí lo delatan: **7,3 % → 11,6 %** con un diente de retraso y **→ 5,1 %** con uno de adelanto.
9. Que **el comprobador forma parte de la medida**. El manómetro tiene volumen muerto (8,0 cm³ declarados) y eso no es cosmético: la relación dinámica del 1.6 desnudo es **9,52** y la que ve el útil, **8,16**; la del 2.0 TDI, **16,75** contra **13,26**. Y la presión de arranque se publica como **banda** —14,0 a 16,2 bar en el 1.6, 26,0 a 31,1 en el 2.0— porque el exponente politrópico real de un arranque cae entre 1,28 y 1,35 según lo fría que esté la pared y lo que fugue por segmentos.
10. Que **un árbol único no es medio motor: es la mitad de las variables**. Con dos árboles hay **25** calados posibles y **24** jugables; con uno solo, **5** y **4**, porque admisión y escape van en el mismo eje y no se pueden desfasar entre sí. En las cuatro máquinas el censo da **cero calados ambiguos**: los cuatro instrumentos juntos separan todos los casos, y por eso el reto tiene siempre respuesta única.

---

## Lógica (verificada en `scratchpad/motor_dist.mjs` + `test_dist.mjs`, 199 comprobaciones, 0 fallos; geometría 3D en `chk_geo3d.mjs`, 234 comprobaciones; navegador real en `pw_dist.mjs`, 898 comprobaciones)

### Constantes selladas

| Símbolo | Valor | Qué es |
| --- | --- | --- |
| `LREF_ANU` / `LREF` / `LREF_US` | 0,15 / 1,00 / 1,27 mm | los tres alzados netos de referencia en uso simultáneo en la industria |
| `H_PASO` | 0,25° | paso de integración del intercambio de gases |
| `H_BARRIDO` | 0,05° | paso del barrido de traslape y de holgura |
| `N_CICLOS` | 14 | ciclos encadenados hasta periodicidad de los residuales |
| `N_ARR_MIN` / `N_ARR_MAX` | 1,28 / 1,35 | banda del exponente politrópico de arranque |
| `P_ARR_ADM` | 0,95 bar | presión en el colector arrastrando con el motor de arranque |
| `V_MANG` | 8,0 cm³ | volumen muerto declarado del comprobador de compresión |
| `A_WIEBE` / `M_WIEBE` | 6,908 / 2,0 | combustión |
| `C1_CERR` / `C1_ABIER` / `C2_WOS` | 2,28 / 6,18 / 3,24·10⁻³ | Woschni |

### Cadena de cálculo

1. **Perfil de leva**: polinomio de continuidad C² —`q(0)=0`, `q(1)=1`, `q'(0)=q'(1)=0`, `q''≈0` en ambos extremos— estrictamente monótono, con inversa numérica que cierra a 1,25·10⁻¹⁴. La duración GEOMÉTRICA del lóbulo se deduce de la duración PUBLICADA: `D_geo = D_pub / (1 − q⁻¹((juego + L_ref)/L_g))`, porque el manual publica a un alzado de referencia y el lóbulo tiene que ser más largo, ya que arranca en cero.
2. **Calado**: `centro = centro_nominal − dientes · 720/Z_leva`. Un diente positivo adelanta el árbol y todo sucede antes.
3. **Alzado**: bruto `L_g·q(1−u)` con `u = |wrap720(θ − centro)|/(D_geo/2)`; neto `máx(0, bruto − juego)`. El juego se come el arranque de la rampa, y por eso recorta duración por los DOS extremos y estrecha el traslape sin tocar el árbol.
4. **Geometría del cilindro**: biela finita exacta, `s(θ) = r(1 − cos θ) + L_b(1 − √(1 − λ²sen²θ))`. Verificado: `s(0) = 0`, `s(180°) = carrera`, `V(180°)/V(0) = r_c` a 10⁻¹², y la media carrera cae entre 80,5° y 82,5° —no a 90°, que es lo que daría el armónico simple.
5. **Ángulos**: `AAA = 360 − θ_abre`, `RCA = θ_cierra − 540`, `AAE = 180 − θ_abre`, `RCE = θ_cierra − 360`, con los ángulos crudos sin normalizar para que la aritmética sea directa. `ICL`, `ECL` y `LCA` se derivan de los centros.
6. **Traslape medido**: barrido de 240° a 480° acumulando `mín(L_adm, L_esc)`. Devuelve `cruce` CON SIGNO, `separacion` cuando es negativo, área en mm·° y alzado simultáneo máximo. La suma de catálogo se comprueba contra el barrido, no se supone.
7. **Holgura**: `C(θ) = C₀ + s(θ)·cos α − L(θ)` recorrida en las 720°, con la velocidad de aproximación en el cruce por `|d/dθ(s·cos α − L)|·6·rpm`.
8. **Interferencia**: criterio exacto ante rotura del mando —el árbol se para en un ángulo cualquiera y el cigüeñal sigue por inercia, así que el peor caso siempre existe: pistón en el PMS y válvula a alzado máximo. Es interferente si y sólo si `L_neta_max > C₀`, con independencia del calado.
9. **Compresión dinámica**: desde el cierre real de admisión y no desde el PMI, con el volumen muerto del comprobador sumado arriba y abajo. Se devuelven las dos relaciones —motor desnudo y con útil— para poder enseñar la diferencia.
10. **Intercambio de gases**: llenado y vaciado paso a paso con combustión de Wiebe y transferencia de Woschni, rendimiento volumétrico referido a la densidad del COLECTOR (la convención correcta para el diésel sobrealimentado), fricción y bombeo, hasta periodicidad.

### Maqueta 3D: qué está atado al motor

- **Escala 1:1** — una unidad de escena son 100 mm. Ninguna cota está exagerada.
- **El lóbulo es la ley de leva.** Su radio en cada ángulo se muestrea de `alzadoBruto(centro + 2ψ)` dividido por la relación de balancín. Comprobado en `chk_geo3d.mjs`: el punto del perfil que mira al empujador tiene, en todo θ, el radio que corresponde al alzado del motor (igualdad a 10⁻¹²).
- **La marca es el calado.** El nodo del árbol gira `tilt − (θ − centro)/2` y la marca se pinta a `90° − centro_nominal/2`; de ahí sale que en θ = 0 la marca cae sobre su índice con el calado correcto y se desvía **exactamente un paso de piñón** por cada diente saltado. Comprobado para −2, −1, 0, +1 y +2 en las cuatro máquinas.
- **La correa es la banda tensa.** El camino se traza por las tangentes exteriores comunes a las poleas recorridas en casco convexo. Comprobado: cada tramo recto es tangente a sus dos poleas (10⁻¹²), todas las poleas quedan del mismo lado de la banda, y ninguna se solapa con otra.
- **Tres arquitecturas reales.** Dos árboles en culata con taqué de vaso (1.6 y 2.0), un árbol en culata con balancines (1.8) y árbol en el bloque con varillas y balancines (5.0 V8 OHV). La relación de radios de los piñones es siempre la de dientes.

### Lo que NO modela — declarado en pantalla

- El **juego de taqués** entra en el alzado neto, en la duración, en el traslape y en todas las cifras, pero **no se dibuja**: a escala 1:1 son centésimas de milímetro en pantalla.
- El **balancín** se dibuja con relación 0,62/0,38 y el motor publica el alzado ya medido en el vástago, así que el lóbulo se dibuja dividido por esa relación para que el dibujo cierre.
- La **holgura pistón-válvula es axial y de un punto**. La cazoleta real es una superficie 3D y el contacto ocurre en el borde de la válvula: el modelo da la tendencia y el orden de magnitud, no un permiso para no medir con plastilina.
- No hay flexión del árbol, juego de casquillos, alargamiento de correa, error de paso acumulado, distribución variable, orden de encendido ni transitorios.
- Los cuatro motores son **arquetipos declarados** cuyas cifras caen dentro de las bandas publicadas para su familia. **No son modelos comerciales.**

---

## Los cuatro arquetipos

| | 1.6 DOHC 16 V | 1.8 SOHC 8 V | 2.0 TDI 16 V | 5.0 V8 OHV |
| --- | --- | --- | --- | --- |
| Cilindrada · `r_c` | 1 598 cm³ · 10,5 | 1 801 cm³ · 9,5 | 1 968 cm³ · 18,5 | 4 942 cm³ · 9,0 |
| Mando · Z cig/leva | correa · 20/40 | correa · 19/38 | correa · 20/40 | cadena · 18/36 |
| 1 diente (piñón · cigüeñal) | 9,00° · 18,00° | 9,47° · 18,95° | 9,00° · 18,00° | 10,00° · 20,00° |
| Taqué · juego adm/esc | hidráulico · 0/0 | mecánico · 0,20/0,25 | hidráulico · 0/0 | hidráulico · 0/0 |
| Alzado neto adm/esc | 8,80 / 8,40 mm | 10,30 / 9,95 mm | 9,20 / 9,00 mm | 11,40 / 11,40 mm |
| AAA · RCA / AAE · RCE (1,00 mm) | 8,0° · 44,0° / 42,0° · 6,0° | 6,0° · 34,0° / 34,0° · 2,0° | 0,0° · 44,0° / 47,0° · 3,0° | −8,0° · 32,0° / 43,0° · −9,0° |
| Traslape 0,15 / 1,00 / 1,27 mm | 55,0° / 14,0° / 6,3° | 35,5° / 8,0° / 1,9° | 42,3° / 3,0° / −4,3° | 15,5° / −17,0° / −23,0° |
| ICL · ECL · LCA | 108° · 108° · 108° | 104° · 106° · 105° | 112° · 112° · 112° | 110° · 116° · 113° |
| Compresión de arranque | 14,0–16,2 bar | 13,5–15,6 bar | 26,0–31,1 bar | 13,2–15,3 bar |
| Holgura mín. adm / esc | 1,33 / 1,94 mm | 9,58 / 10,53 mm | 1,35 / 1,62 mm | 11,91 / 12,67 mm |
| Interferente | **sí** (5,60 mm) | no | **sí** (6,70 mm) | no |
| Calados posibles · jugables | 25 · 24 | 5 · 4 | 25 · 24 | 5 · 4 |

Ángulos en grados de cigüeñal. Para calar un motor concreto hay que consultar el manual de taller de ESE motor: los ángulos, el juego de taqués y la holgura mínima son datos del fabricante y ninguna cifra de esta tabla los sustituye.

---

## Los seis modos

| Modo | Qué se hace | Qué se lleva el alumno |
| --- | --- | --- |
| 1 · Montar | siete piezas del banco a sus siete huecos | el motor no se cala a medias; sin tren completo no hay medida |
| 2 · Marcas | diagrama circular, marcas contra índices, tres criterios de lectura | un diente desplaza la marca un paso exacto, y el criterio cambia los ángulos publicados |
| 3 · Alzado | curvas de alzado neto y traslape medido | el traslape se mide donde las dos curvas pasan la referencia, y puede ser un hueco |
| 4 · Holgura | `C(θ)` de las dos válvulas contra el margen de taller | interferente es geometría, chocar es calado, y el signo del diente decide |
| 5 · Banco | cuatro instrumentos y su poder de separación | la compresión es ciega al escape; hacen falta al menos dos medidas |
| 6 · Reto | cuatro lecturas de un calado oculto, con pistas | diagnóstico por cruce de evidencias, con respuesta única garantizada por el censo |
