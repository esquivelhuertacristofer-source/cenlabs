# mecanica-220 · Cavitación: aspiración de una bomba centrífuga

Estado al 26-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Observa el impulsor y ajusta la aspiración para mantener margen frente a la vaporización del líquido.

OT-220 · Mantén margen NPSH ≥1 m, caudal ≥2,5 L/s, potencia ≤1200 W y una hipótesis compatible con líquido continuo.

Instrumentos: Depósito, línea de aspiración, bomba seccionada y balance NPSH.

## Modelo y límites
Agua a 20 °C: ρ=998 kg/m³,pv=2340 Pa,patm=101325 Pa,g=9,81. Aspiración L=10 m,D=0,04 m,f=0,025,ΣK=4: hf=(fL/D+ΣK)v²/(2g). NPSHa=(patm−pv)/(ρg)+z−hf. Curva sintética NPSHr=2+0,12Q² m, Q en L/s. Hnom=25−0,8Q² m; indicador de déficit c=clamp(−margen/NPSHr,0,1); H=Hnom(1−0,15c),P=ρgQH/0,68.

Caudal impuesto para estudiar la aspiración; no resuelve el punto de operación de la instalación. NPSHr, reducción de altura y umbral de margen son sintéticos. NPSH3 real no garantiza ausencia de toda cavitación. Las burbujas representan déficit normalizado, no fracción de vapor ni dinámica Rayleigh–Plesset. Si NPSHa≤0 la hipótesis estacionaria deja de ser admisible. Impulsor estroboscópico ×1/120 y flujo visible ralentizado ×1/20.

Escala visual y temporal: Impulsor ×1/120 · flujo ×1/20 · burbujas esquemáticas

Fuente del principio: https://giw.ksb.com/blog/net-positive-suction-head . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/cavitacion-bomba-centrifuga.html y _ficha-cavitacion-bomba-centrifuga.js.
- Escena específica: public/labs/_fab-220.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-220/, briefing JSON, portada prac_220.webp y descriptor scripts/lab-src/cavitacion-bomba-centrifuga.json.
- Construcción: node scripts/build-lab.mjs cavitacion-bomba-centrifuga. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 220.
- Flujo: flujo-fabricacion-211-220.mjs --solo 220 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 220.

## Comprobaciones
1084 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 46 palabras de prosa inicial, 19 llamadas, encuadre 68.1 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 46 palabras de prosa inicial, 19 llamadas, encuadre 67.4 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 46 palabras de prosa inicial, 19 llamadas, encuadre 67.0 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 46 palabras de prosa inicial, 19 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
Bomba con carcasa abierta, cara de sección, cubierta transparente, álabes curvos, impulsor y burbujas. Se redujo la obstrucción de la cubierta para mostrar el fenómeno; Entorno conserva depósito y aspiración. Las burbujas indican déficit normalizado; no son una predicción de volumen de vapor. Fuera de NPSHa positivo se oculta la potencia no admisible. Se diferencia de102: aspiración y cavitación, no curva de fugas de una bomba hidráulica.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

Inspección y entorno comparten la misma geometría y pose. La prueba adicional comprueba transformaciones y, donde existen, matrices/colores de instancias para evitar que la inspección se congele.

## Publicación
Código c5d5e93d2adb73f41e07576d03cfc5a097d46d4b empujado a main. Deploy exit0; Cloudflare 2462ce45-d045-40a6-996e-7e2c82f97c77. Login real:102 destacadas, doce iframes exactos (211–220 y regresión201/210), portadas HTTP200, geometría sana y consola limpia. Último laboratorio publicado:220. Los commits posteriores de documentación no cambian el código publicado.
