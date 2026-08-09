# MEC-114 · Diagnostica el sellado con pruebas de compresión y fugas

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-04 — *Diagnostica el sellado con pruebas de compresión y fugas* (molde E+P, ensamble + procedimiento)
- **Simulador:** `/labs/sellado-compresion-fugas.html`
- **Slug:** `sellado-compresion-fugas`
- **Ancla curricular:** AUT-Y motores (liga con `mecanica-111`, `mecanica-112` y `mecanica-113`) · UAX Mecánica y mantenimiento
- **Norma ancla:** manual de taller del fabricante — única fuente del estándar de compresión, del límite de rechazo, de la diferencia admisible entre cilindros y del porcentaje de fuga aceptable de un motor concreto
- **Fuentes de referencia:** SAE J604 (nomenclatura de motores alternativos) · atmósfera estándar internacional (ISA) para la corrección por altitud · Heywood, *Internal Combustion Engine Fundamentals* (1988) · Ferguson y Kirkpatrick, *Internal Combustion Engines: Applied Thermosciences*, 3.ª ed. (2016)

---

## Qué enseña

1. Que **la antirretorno del manómetro hace de trinquete**. La aguja sube golpe a golpe y no baja: en el 1.6 sano, **13,1 · 15,7 · 16,1 · 16,1 bar**, estancada a partir del cuarto. Lo que se lee no es la presión de un ciclo, es el techo de todos.
2. Que **el volumen muerto del útil NO cambia la lectura final**. Con **24 cm³** de manguera en vez de 8, el primer golpe cae de **15,9 a 8,5 bar** y a los ocho golpes las dos lecturas coinciden. Cuesta **golpes, no bares**. Esto matiza —no contradice— lo que publican `mecanica-112` y `mecanica-113`, donde se compara la relación dinámica del motor desnudo (**9,52**) con la que ve el útil (**8,16**): esa es la relación de **un solo golpe**. Las dos afirmaciones son ciertas y hay que decir de cuál se habla.
3. Que **la altitud hunde la compresión y no mueve el porcentaje de fuga**. El mismo motor sano marca **16,1 bar** a nivel del mar, **13,5** a 1 500 m y **11,6** a 2 660 m: un **28 % menos** sin estar peor. La fuga pasa del **7,0 % al 6,7 %**.
4. Que **el factor de altitud de Toluca (0,723) es casi la relación límite/estándar de un manual** (11,6/16,1 = **0,72**): un motor sano medido allí cae **justo sobre el límite** de rechazo escrito a nivel del mar. Sin corregir el límite por la altitud del taller se condenan motores sanos.
5. Que **la ruta localiza y el porcentaje sólo cuantifica**. La ruta que señala la avería es la del **mayor exceso sobre la fuga de base**, no la de mayor caudal: todo motor sopla por el cárter —el **83 %** del caudal estando sano— y eso no es un hallazgo. Una **junta al circuito de agua fuga un 17,6 %**, por debajo del límite del 20 %, y **se condena igual**: no hay burbujeo aceptable en un radiador.
6. Que **el porcentaje de fuga es del conjunto motor + fugómetro**, no del motor. Sale **idéntico en las cuatro máquinas** para la misma avería y **cambia con el restrictor** sin que el motor haya cambiado nada. Lo que no cambia con el útil es por dónde sale el aire.
7. Que **el signo del salto al mojar separa familias**. Contra la **mediana** del motor: positivo = segmentos (el aceite sella el hueco del aro), negativo = válvula o junta (el aceite no llega ahí). Segmentos pegados **+4,3 bar**, válvula de escape quemada **+1,2**, cilindro sano **+2,4**, pared rayada **+3,2** — a medias, porque el aceite no rellena un surco. El salto es un **reactivo, no un interruptor**.
8. Que **la regla del 10 % entre cilindros es ciega** a unos segmentos desgastados en **tres de las cuatro** máquinas: en el 1.6 la dispersión se queda en el **7 %** y la regla no se dispara. En el diésel, con el doble de presión, sí los ve.
9. Que **ningún subconjunto de observaciones sin la compresión absoluta corregida por altitud resuelve los once escenarios**, y está comprobado en las cuatro máquinas. Con sólo las cuatro comparativas quedan **8 de 11**: motor sano, distribución un diente retrasada y batería baja caen en la **misma firma**. Comparar cilindro contra cilindro encuentra el cilindro malo; **nunca** dice que el motor entero está bajo.
10. Que **girar despacio cuesta mucho menos de lo que se cree**: de **320 a 120 rpm** la lectura sólo baja de **16,4 a 15,0 bar**. Una batería floja no explica un motor bajo, pero sí explica que baje **por igual**.

---

## Cifras del banco — arquetipo 1.6 DOHC a nivel del mar

Presiones **relativas** (bar-g), que es lo que marca un manómetro. Fuga con el restrictor estándar de 1,00 mm y 6,0 bar de suministro.

| Estado del cilindro | Seca | Húmeda | Salto | Fuga | Sale sobre todo por |
|---|---|---|---|---|---|
| Sano | 16,1 | 18,5 | +2,4 | 7,0 % | cárter (83 %) — normal |
| Segmentos desgastados | 15,0 | 18,4 | +3,3 | 25,1 % | cárter (92 %) |
| Segmentos pegados o rotos | 13,9 | 18,1 | +4,3 | 48,1 % | cárter (95 %) |
| Pared del cilindro rayada | 12,3 | 15,5 | +3,2 | 72,0 % | cárter (97 %) |
| Válvula de admisión mal asentada | 14,8 | 16,1 | +1,3 | 30,0 % | cuerpo de aceleración (60 %) |
| Válvula de escape quemada | 14,0 | 15,2 | +1,2 | 45,0 % | cola de escape (70 %) |
| Válvula de escape sin juego de taqué | 13,1 | 14,2 | +1,1 | 61,9 % | cola de escape (78 %) |
| Junta de culata a la camisa de agua | 15,4 | 16,8 | +1,4 | 17,6 % | radiador (40 %) — **condena** |
| Junta de culata entre dos cilindros | 14,5 | 15,8 | +1,3 | 35,0 % | bujía contigua (61 %) |

Altitud (motor sano): **0 m → 16,1 bar / 7,0 %** · **1 500 m → 13,5 / 6,8 %** · **2 660 m → 11,6 / 6,7 %**.
Régimen de arranque (motor sano): **120 rpm → 15,0** · **180 → 15,7** · **250 → 16,1** · **320 → 16,4 bar**.
Distribución +18° de cigüeñal: relación dinámica **8,56**, compresión **13,9 bar**.

Datos del manual del arquetipo: estándar **16,1 bar-g**, límite de rechazo **11,6** (el 72 % del estándar), diferencia máxima entre cilindros **10 %**, fuga admisible **20 %**.

---

## Censo de instrumentos (1.6 DOHC, once escenarios)

| Observación (una sola) | Resuelve | Firmas | Firmas con dos diagnósticos |
|---|---|---|---|
| Compresión, contra el mejor cilindro | 8/11 | 9 | 1 |
| Porcentaje de fuga | 8/11 | 9 | 1 |
| Por dónde sale el aire | 5/11 | 6 | 2 |
| Salto al mojar, contra el que menos sube | 3/11 | 6 | 3 |
| Compresión absoluta corregida por altitud | 2/11 | 3 | 1 |
| Régimen real de arranque | 1/11 | 2 | 1 |

Las **cuatro comparativas** (sin ficha del fabricante): **8/11**, con una firma que mezcla dos diagnósticos.
Las **seis juntas**: **11/11**.
Subconjunto **mínimo** que lo resuelve todo: **déficit contra el mejor cilindro + compresión absoluta corregida por altitud**.

---

## Verificación

- **Capa 1 (motor sellado, Node):** `scratchpad/motor_sello.mjs` + `test_sello.mjs` → **1 841/1 841**. Nueve secciones: atmósfera ISA, geometría del cilindro con biela finita, orificio compresible con bloqueo sónico (relación crítica 0,528282), leak-down (asíntotas, monotonía en el área, calibración a ±0,6 %, partición de rutas que suma 1, porcentaje idéntico en las cuatro máquinas, balance de masa en el equilibrio), compresión golpe a golpe, altitud, escenarios, censo y reto.
- **Calibración:** `scratchpad/calib_sello.mjs`. Las áreas de fuga **no** están puestas a ojo: se resuelve qué área produce cada porcentaje objetivo con el útil estándar, y el test vuelve a comprobar la calibración.
- **Capa 2 (navegador real, Playwright):** `scratchpad/pw_sello.mjs` → **553/553**, sin errores de consola. Doce secciones: carga limpia con los modos cerrados, ensamble que desbloquea, geometría 3D contra el arquetipo en las cuatro máquinas, 256 cifras de telemetría contrastadas contra el motor de Node, las nueve afirmaciones de la ficha comprobadas en la máquina, el veredicto criterio por criterio en las cuatro máquinas y los once escenarios, los seis modos pintando sin texto roto, las rutas de los chorros de aire contra las fracciones del modelo, la prueba de compresión completa, el barajado del cuestionario, el reto y el recorrido guiado.
- **CSS:** `scratchpad/chk_css.mjs` → 35 clases y 12 variables usadas, **0 sin respaldo** en el donante.
- **Identificadores:** `scratchpad/dupids.mjs` → 258 nombres de nivel superior, **0 duplicados**, sin colisión con el kit del donante.

### Defectos que sólo vieron las capturas

Tres defectos reales no los vio ninguna comprobación numérica y sí una captura de pantalla:

1. **El bloque se dibujaba entero** y el motor se veía como una pared blanca: no había corte y no se veía ni un pistón. Ahora el bloque y la culata son cajas sin la mitad delantera, partidas por el plano que pasa por los ejes de los cilindros, con tabiques entre cilindros.
2. **El V8 en V inclinaba el plano de corte** hasta que dejaba de verse el interior. Se pasó a **ocho cilindros en línea**, declarado en el contrato de fidelidad: ninguna cifra de esta práctica depende de la disposición, porque cada cilindro se mide por separado.
3. **`veredicto()` comparaba la dispersión al revés** (`relativa > tolRel` en vez de `100 − relativa > tolRel`) y declaraba fuera de norma **hasta a un motor sano**. Se corrigió y se añadió la sección 5bis de Playwright, que comprueba los tres criterios contra el modelo en las cuatro máquinas y los once escenarios.

---

## Lo que NO modela

- La transferencia de calor a las paredes durante el arranque se resume en un **exponente politrópico fijo** (1,32). Un motor frío y uno caliente no dan la misma cifra en el taller, y aquí sí la dan.
- Cada avería se declara como un **área equivalente** hacia un destino, no como la geometría de un asiento quemado o de un aro roto.
- El aceite de la prueba húmeda se resume en un **factor de sellado** por familia de avería: no hay película, ni escurrimiento, ni cantidad de aceite.
- La **velocidad de giro se supone constante** durante todo el golpeo. Un motor de arranque real pierde régimen al comprimir.
- No se modela el paso de aire por el **hueco de la bujía del cilindro medido**, ni la fuga del adaptador, ni la calidad del roscado. En el taller esa es la primera causa de una lectura absurda.
- La prueba de fugas se resuelve en **régimen estacionario**: no hay transitorio ni oscilación de la aguja.
- Se supone el pistón **exactamente en el PMS** con las dos válvulas cerradas. En un motor real hay que buscar el PMS.
- La escena gira el cigüeñal a **0,55 veces la velocidad real** para que los golpes sean visibles; el régimen que entra en las cifras es el real, no el de la escena.
- Los cuatro motores son **arquetipos declarados**, no modelos comerciales.

---

## Ficheros

| Qué | Dónde |
|---|---|
| Cuerpo del laboratorio | `scripts/lab-src/sellado-compresion-fugas.body.js` |
| Receta de construcción | `scripts/lab-src/sellado-compresion-fugas.json` |
| HTML generado | `public/labs/sellado-compresion-fugas.html` |
| Ficha técnica en pantalla | `public/labs/_ficha-sellado-compresion-fugas.js` |
| Registro | `src/labs/mecanica-114/` |
| Portada | `public/images/mecanica/prac_114.webp` |

El HTML se genera con `node scripts/build-lab.mjs sellado-compresion-fugas`. **Nunca se edita a mano**: la fuente es el `.body.js`.
