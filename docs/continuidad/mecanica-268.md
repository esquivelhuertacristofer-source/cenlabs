# mecanica-268 · Freno de banda: fuerza que se amplifica

**Revisión individual completa. Local, sin commit, push ni publicación; cierre global B pendiente.**

## Diferencia respecto del catálogo
Distinto del CVT156 y frenos de disco: banda diferencial con capstan, momento de cada extremo y balance de energía de una parada.

## Modelo y límites
Escenario: radioR=200 mm, arcoθ=240°, fuerzaF=80 N hacia arriba, brazo de mando l=200 mm y brazo resistente a=60 mm. E=exp(μθ); T1/T2=E durante deslizamiento, T1 mayor en el extremo inicial del arco. Momentos alrededor del pivote: Fl+T1b−T2a=0. T2=Fl/(a−bE); M=(T1−T2)R. Giro inverso: Mrev=FlR(E−1)/(aE−b). La solución positiva exige a−bE>0; el motor rechaza el bloqueo fuera de dominio. Inercia equivalenteJ=12 kg·m² y velocidad inicialω0=60 rad/s. ω=max(0,ω0−Mt/J), ts=Jω0/M, ángulo mostrado=[ω0te−Mte²/(2J)]/40, te=min(t,ts). CalorQ=J(ω0²−ω²)/2, potenciaMω, energía inicial21.600 J. Temperatura media orientativa20°C+Q/(8kg·460J/kgK).

Banda flexible ideal, deslizamiento de Coulomb con μ constante, tensiones cuasiestáticas y palanca rígida. Sin desgaste, deformación, calentamiento que cambie μ, elasticidad, holguras, motor ni control de accionamiento. Tras parar, las tensiones y M describen capacidad límite de deslizamiento, no un par que siga acelerando el rotor; la velocidad permanece cero. Inercia referida de máquina, no deducida sólo del tambor dibujado. Giro ralentizado ×1/40; el tiempo de parada conserva segundos reales. Demostración repuesta cada10s sin simular el motor de rearranque; adquisición de8s. Banda de espesor dibujado3–4mm, fórmula de banda delgada sobre radio nominal; las líneas de acción se trazan sobre ese radio. Palanca desplazada hacia el frente axialmente por claridad: equilibrio2D, sin flexión fuera del plano. El brazo b es distancia perpendicular a la tensión, no longitud del eslabón. Todo el rango de mandos conserva margen positivo hasta bloqueo. Temperatura uniforme orientativa, no mapa térmico superficial ni dictamen de seguridad.

## Archivos y continuación
`public/labs/_elementos-*.js`, `freno-banda-autoenergizado.html`, `_ficha-freno-banda-autoenergizado.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-268/`. Fuente: https://mechanics.ju.se/MachineElements/brakes-clutches.html

31.804 comprobaciones físicas correctas: brazos perpendiculares, tangencia, equilibrio de palanca, capstan, integración de presión/fricción, energía, parada sin inversión y rechazo de bloqueo. Margen mínimo a−bE=3,78263mm en todos los mandos. Cuatro recorridos completos con firmaee4991f339709a6df12f4601350432702a01a411dc46664f95b23def0e747370: orden, ensayo, reto, quiz, diagnósticos, instrumentos, TXT, ficha, calidad y arrastre. Pivote, pasadores, mando, giro y flechas de fuerza reales contrastados con el motor en extremos y centros. Cero errores/normales nulas/NaN;40 llamadas,20.094triángulos,54palabras,65% del alto en los cuatro tamaños. El primer intento falló en el auditor por representar0,30 como0,30000000000000004; se redondeó la entrada y se repitieron las cuatro pantallas.

16clips instalados y comprobados;184labs en manifiesto,7.828MP3 totales. Autocrítica: rueda metálica con radios y banda tangente, palanca y pasadores continuos; pivote regulable y tensiones responden al mismo estado. La inspección permite seguir cada extremo hasta el mando. Curvas DOM muestran parada hasta cero y fuerte diferencia de capacidad entre sentidos; sin cifras dentro del3D. Escenario inicial vivo, poca prosa, móvil sin desbordamiento. No se pinta el tambor incandescente: aumento medio de temperatura es pequeño y no se simula un mapa superficial.

Barrido oficial sano y portada propia capturada y revisada, sin HUD. TS y ESLint src limpios tras268; golden en actualización aditiva. Pendiente cierre global B con40recorridos actuales/Jestcompleto/regresión250yA/commitselectivo/publicación/loginreal. Siguiente269: síntesis de trayectoria, base140mm, manivela40mm, acoplador/balancín variables; preparación en work/PLAN-CUATRO-BARRAS-269.md del workspace. No confundir revisión individual con publicación.

QA 1366×768 DPR1: inicio correctos; revisión f584fa30398016401ca28d1a609e0467d82b38ad4a5bbe16583e78b45ebe3ec4; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión ee4991f339709a6df12f4601350432702a01a411dc46664f95b23def0e747370; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión ee4991f339709a6df12f4601350432702a01a411dc46664f95b23def0e747370; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión ee4991f339709a6df12f4601350432702a01a411dc46664f95b23def0e747370; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión ee4991f339709a6df12f4601350432702a01a411dc46664f95b23def0e747370; normales cero=0, sin errores ni desbordamiento.
