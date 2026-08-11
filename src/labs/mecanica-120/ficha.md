# MEC-120 · Gases de escape y verificación

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-10 — *Interpreta un análisis de gases de escape y decide un veredicto de verificación* (molde P+S, panel-instrumento virtual + simulación de proceso)
- **Simulador:** `/labs/gases-verificacion.html`
- **Slug:** `gases-verificacion`
- **Ancla curricular:** AUT-C emisiones y postratamiento (liga con `mecanica-117` inyección y sonda lambda, `mecanica-118` formas de onda de los sensores, `mecanica-119` encendido) · UAX Mecánica y mantenimiento
- **Normas y fuentes ancla:** NOM-041-SEMARNAT-2015 (TABLA 1 y TABLA 2, num. 4.1, 4.2.1, 4.2.1.1, 4.2.2, 4.2.2.1, 4.3, 5.1.5 y definiciones 3.5, 3.6.2, 3.7) · NOM-047-SEMARNAT-2014 (métodos estático y dinámico, ventanas de promediado, Tabla 3 de exactitud y ruido del analizador) · Brettschneider, J., *Bosch Technische Berichte* 6 (1979) 4, 177-186 · Heywood, *Internal Combustion Engine Fundamentals* (composición de gases de escape, Zeldovich, postratamiento catalítico) · Bosch, *Automotive Handbook* (ventana del catalizador de tres vías)

---

## Qué enseña

1. Que **todo cuelga de un balance de átomos**. La gasolina como CH₁,₈₅ da 1,4625 moléculas de O₂ por átomo de carbono y una relación aire/combustible estequiométrica de **14,60** en masa. Los cinco gases salen de ese balance, no de cinco curvas ajustadas por separado.
2. Que **el CO₂ es máximo en λ = 1,000 y cae por los DOS lados**, así que un CO₂ bajo siempre significa algo y por sí solo no dice de qué lado.
3. Que **el reparto rico del carbono es un equilibrio, no una interpolación**: [CO]·[H₂O] = 3,5·[CO₂]·[H₂], resuelto como cuadrática exacta eligiendo la raíz que deja las cuatro especies no negativas. Ese «3,5» es el mismo que lleva dentro Brettschneider, y por eso las dos cuentas cierran.
4. Que **el máximo de NOx no está donde el de temperatura**: la campana térmica es máxima en **λ = 0,950** y el NOx en **λ = 1,060**, porque el NOx va con la temperatura Y con el oxígeno disponible, y el oxígeno sólo crece hacia el pobre. El desplazamiento no está escrito: sale de multiplicar.
5. Que **la ventana del catalizador de tres vías mide 0,015 de λ**: las dos reacciones pasan del 80 % a la vez sólo entre **0,995 y 1,010**. Un catalizador de DOS vías no reduce NOx en ningún λ.
6. Que **CO+CO₂ mide la MUESTRA y no el motor**: por el catalizador entran 1,0000 mol de carbono y salen 1,0000. La suma sube unas centésimas al pasarlo —el carbono que venía como HC pasa a CO₂ y el gas seco encoge al consumirse O₂— y eso se dice en pantalla con las dos cifras delante, en vez de afirmar que no cambia.
7. Que **una fuga en el escape reprueba un motor intacto**: CO+CO₂ cae a **11,91 %**, por debajo del mínimo de 13 %, y el veredicto correcto no es «rechaza» sino «la medición no vale».
8. Que **el Factor Lambda no se mide, se calcula**, y hereda los errores de la muestra: con la fuga, el equipo imprime **1,263** sobre un motor clavado en 1,000; con la sonda mal metida, 1,140.
9. Que **hay averías que se escapan del criterio de dilución**: la sonda mal metida deja CO+CO₂ en **13,29 %**, dentro de ventana, y lo que la caza es el límite de O₂.
10. Que **los cortes de año-modelo de las dos tablas NO coinciden** —1990/1991 en la TABLA 1 y 1993/1994 en la TABLA 2— y que a un 1992 le tocan HC ≤ 400 en estático y HC ≤ 100 en dinámico.
11. Que **eso se cuenta**: de las 11 averías que pueden darse en ese 1992, **6** aprueban el estático y suspenden el dinámico sin que cambie una sola cifra de emisión (mezcla rica, catalizador agotado, catalizador frío, fallo de encendido, EGR pegada, avance excesivo).
12. Que **el catalizador esconde el motor**: con la EGR pegada un multipunto de 2004 forma **3 039 ppm** de NOx contra los 1 692 del sano y por la cola salen **245** contra 136. Aprueba las dos pruebas. La norma mide lo que sale a la atmósfera, que es lo correcto, y no es un diagnóstico.
13. Que **se promedia al final de la fase por una razón física**: con una constante de manguera de 4,0 s, promediar los cinco primeros segundos da un CO₂ un **50 %** por debajo del real; con la ventana de la norma, un **0,097 %**.
14. Que **el veredicto tiene TRES desenlaces y no dos**: aprueba, rechaza por un criterio concreto, o la medición no es válida. Y que basta que se caiga uno (num. 5.1.5).
15. Que **una avería que no puede darse en un vehículo se DICE**: poner «catalizador agotado» en un carburado de 1988 devuelve exactamente las cifras del sano, y la pantalla explica que no es que la avería no haga nada, es que no puede existir ahí.

---

## Cómo se verifica

| Capa | Qué comprueba | Resultado |
|---|---|---|
| **Capa 1** (`test_gas.mjs`) | El motor sellado contra sí mismo y contra la química: conservación de C, H y O átomo por átomo en toda la rejilla, el equilibrio agua-gas y que H₂ < CO, el suelo de disociación del NOx, la contabilidad del carbono al pasar el catalizador, la dilución tendiendo al 20,9 % del aire, Brettschneider contra el λ del motor con la muestra limpia y con la sucia, las dos tablas con sus cortes de año, la regla 5.1.5, el promedio de la ventana contra el estacionario, y el censo de alcanzabilidad de cada rama | **4 692 / 4 692** |
| **Capa 2** (`pw_gas.mjs`) | El laboratorio ya construido, en Chromium, contra `window.__labDebug`: la rejilla de 4 arquetipos × 13 averías × 2 métodos × 2 fases cifra a cifra, el punto libre barriendo 6 mezclas × 5 cargas, los dos máximos y la ventana en cada arquetipo, la traza y su promedio en los 5 gases × 2 métodos, el censo, la trampa de los cortes de año, los ocho modos, cada botón del panel pulsado con el ratón, el recorrido guiado, el cuestionario con el censo de alcanzabilidad de sus preguntas condicionales, y la verificación a ciegas caso por caso con las filtraciones comprobadas por **cuatro** superficies —pantalla del analizador, telemetría, chapas del banco 3D y estado que sobrevive a un cambio de vista— | ver el guion |
| **Revisión visual** | Capturas de las ocho vistas y de los casos límite, revisadas mirándolas y comparadas contra el laboratorio anterior. De ahí salieron los defectos que ninguna prueba numérica podía ver: el pizarrón a 420 px de ventana con el texto ilegible, el año-modelo impreso con separador de millares («2 004»), las barras recortadas por el techo del recuadro que se leían como «justo en el límite» valiendo 2,2 ×, y una tabla que afirmaba que la suma CO+CO₂ no cambia enseñando dos cifras distintas | **13 capturas · 0 defectos abiertos** |

---

## Lo que NO modela, y se dice en pantalla

- El ciclo termodinámico y el par: la mezcla es un dato de entrada y la carga, un parámetro. Este laboratorio empieza donde acaba el d6-07.
- El NOx dentro del balance de átomos: a mil partes por millón son cinco centésimas de por ciento de oxígeno y moverlo cambiaría el CO₂ en la cuarta cifra. Se declara y se deja fuera.
- El holograma (00, 0, 1, 2): sale del programa de verificación de cada entidad, no de la NOM, y cambia cada año.
- El método SDB de la NOM-167, que en la megalópolis sustituye la medición por la lectura del diagnóstico a bordo en los 2006 y posteriores.
- La corrección por humedad de los NOx, el transitorio de calentamiento del catalizador, el reparto del HC entre especies y la dinámica del dinamómetro (excursiones de velocidad, tres intentos, rechazo por humo).
- La excepción del num. 4.3 para vehículos que POR DISEÑO operan con mezcla pobre: ninguno de los cuatro de este banco lo es, así que se cita y no se modela —una rama que nunca se recorre no es una comprobación—.
- Las constantes del NOx (T de referencia 2 600 K, energía de activación reducida 21 000 K, anchura de campana 0,40) y el paso de la carga del freno a la carga del motor son **ajustes didácticos declarados**, calibrados para que las cifras caigan donde caen en un banco real. No son constantes de la naturaleza ni datos de ninguna norma.
