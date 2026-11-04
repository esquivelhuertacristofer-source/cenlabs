# mecanica-269 · Cuatro barras: diseña una trayectoria

**Revisión individual completa. Local, sin commit, push ni publicación; cierre global B pendiente.**

## Diferencia respecto del catálogo
Distinto174 (limpiaparabrisas): síntesis de un punto de acoplador con plantilla, error porfase y mínimo de transmisión, no barrido de escobilla.

## Modelo y límites
Mecanismo plano: apoyos O=(0,0),D=(140,0) mm; manivela r=40 mm, giro uniforme7,5 rpm (una vuelta real en8 s). A=r(cosθ,sinθ). B es la intersección positiva de círculos de radios a,b centrados en A,D. Con dvec=D−A,s=|dvec|,u=dvec/s: x=(a²−b²+s²)/(2s),h=√(a²−x²),B=A+xu+h(−uy,ux). Punto P=A+0,65(B−A)+25mm·nAB. Se comparan360 fases uniformes con la plantilla propia fija: RMS=√[Σ|P−Pobjetivo|²/360], además del error máximo. Ángulo de transmisión agudo μ=acos|[(A−B)·(D−B)]/(ab)|. Se toma el mínimo durante360°. Velocidades por derivación del cierre: vB=vA+αdot k×(B−A)=βdot k×(B−D); vP se deriva en el mismo sistema.

Cinemática de barras rígidas y articulaciones ideales; sin pares, masas, elasticidad, fricción ni dinámica de motor. El objetivo es una trayectoria propia, no perfil de una máquina comercial. Error comparado en la misma fase de entrada, no distancia al punto más cercano ni ajuste libre de giro/escala. Rango completo Grashof estricto; las circunferencias se cortan sin tangencia durante toda la vuelta. El programa rechaza geometrías que no cierran fuera del rango. Planos axiales separados para evitar choques; pasadores unen las piezas y el soporte fijo. Longitudes a20 unidades/m; barras con chaflán y holgura ilustrativa. La línea dorada es la plantilla espacial objetivo, no una medida experimental. La línea turquesa acumula posiciones del lápiz durante una vuelta después de cada cambio de mandos; la predicción completa se reserva al instrumento después de validar. No se deducen fuerzas ni seguridad de máquina del ángulo por sí solo.

## Archivos y continuación
`public/labs/_elementos-*.js`, `cuatro-barras-sintesis-trayectoria.html`, `_ficha-cuatro-barras-sintesis-trayectoria.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-269/`. Fuente: https://www.mechref.org/dyn/four_bar_linkages_applications/

864.871 comprobaciones: cierre por solución angular independiente, longitudes, continuidad360°, velocidades por diferencias finitas, RMS/máximo y ángulo mínimo por posturas extremas frente al barrido. Cuatro recorridos actuales con firma1f18d4d6a7862ca7004793682cece35dbd054a686889f7287cac653bd25df6b6: orden, ensayo, validación, quiz, diagnóstico, instrumentos, TXT, ficha, calidad y arrastre real. Longitud entre ojos medida en malla, giros, centros, pasadores y punta del lápiz contrastados en extremos/centros de mandos. Cero errores/normales nulas/NaN;23 llamadas,27.182triángulos,58palabras,65% de altura en cuatro tamaños. Dos ejecuciones anteriores son históricas: la última libera la vista de Inspección móvil del panel de lecturas que ocultaba una articulación. Lecturas disponibles en Entorno e instrumento.

Se eliminaron triángulos degenerados de los biseles en vez de asignar normales arbitrarias. Eslabones aligerados con ojos, ranura y chaflanes; motor de entrada y pasadores de longitudes que conectan planos. No llamar deformación al cambio de dimensiones de diseño. La traza se reinicia al cambiar mandos y acumula un ciclo; no se adelanta una curva completa nueva antes de observarla. Plantilla dorada fija, sin longitudes solución en UI.

Autocrítica: no hay pizarras ni cifras en3D; barras y articulaciones legibles, plantilla fina y punta de lápiz destacada. Instrumento XY conserva la misma escala en ambos ejes y la transmisión se comprueba toda la vuelta. Inspección móvil revisada sin el panel sobrepuesto. Portada propia, estado inicial, inspección e instrumentos revisados; barrido oficial sano.16clips instalados y verificados,185labs en manifiesto,7.844MP3 totales. Golden aditivo en revisión; TS/lint/Jest completo siguen en cierre global.

Pendiente bloqueB:40recorridos de versión estable, diez verificas, Jest completo/TS/lint, regresión250yA, commitselectivo, despliegue y loginreal. Siguiente270: comparar chaveta/estriado/interferencia; propuesta y perfiles en work/PLAN-UNIONES-EJE-270.md y prototipos del workspace. No confundir estado local con publicación.

QA 1366×768 DPR1: inicio correctos; revisión 20a1bd365b6fa4a4247789cdf4ba95e082bef4e84cb5fdb42768b577afc94293; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 52a95a0db0b90e0a99c8ade44bce1722581f30daaabfc6f59e98021a7364aa79; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 52a95a0db0b90e0a99c8ade44bce1722581f30daaabfc6f59e98021a7364aa79; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 52a95a0db0b90e0a99c8ade44bce1722581f30daaabfc6f59e98021a7364aa79; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 52a95a0db0b90e0a99c8ade44bce1722581f30daaabfc6f59e98021a7364aa79; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 1f18d4d6a7862ca7004793682cece35dbd054a686889f7287cac653bd25df6b6; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 1f18d4d6a7862ca7004793682cece35dbd054a686889f7287cac653bd25df6b6; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 1f18d4d6a7862ca7004793682cece35dbd054a686889f7287cac653bd25df6b6; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 1f18d4d6a7862ca7004793682cece35dbd054a686889f7287cac653bd25df6b6; normales cero=0, sin errores ni desbordamiento.
