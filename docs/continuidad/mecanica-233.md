# mecanica-233 · Electroerosión por hilo: energía y avance

Estado al28-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Un hilo corta un contorno circular mediante descargas en un baño dieléctrico.

OT-233 · Corta a ≥0,18 mm/s con energía por pulso ≤0,30 J, hilo ≤240 °C y duración física ≤700 s.

Equipo e instrumentos: Electroerosionadora de hilo, contorno circular y balance energético.

## Modelo y alcance
Tensión80 V, frecuencia2000 Hz; P=80I·d, Ep=P/f. Rendimiento de arranque0,3 y energía específica200 J/mm³: Q=0,3P/200. Espesor10 mm, ranura0,3 mm: v=Q/3. Contorno R20 mm. Temperatura equivalente estacionaria=20+0,02P/0,06 °C. Volumen eliminado=Qτ.

Coeficientes sintéticos de balance, sin plasma, control real de gap, rugosidad predictiva, conicidad, rotura o certificado de proceso. El baño es dieléctrico representativo. Avance acelerado×60; destello representa potencia media, no cada pulso de2 kHz. La ranura se ensancha para verla y el ensayo reinicia ciclos independientes. Baño seccionado para mostrar el hilo; ranura visual ampliada×2.

Escalas: Avance×60 · destello de potencia media · ranura ampliada

Fuente del principio: https://www.makino.com/resources/content-library/article/archive/edm-wire-tutorial/198 . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/electroerosion-hilo-corte.html y _ficha-electroerosion-hilo-corte.js.
- Escena: public/labs/_maq-233.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-233/, briefing JSON, portada prac_233.webp y descriptor scripts/lab-src/electroerosion-hilo-corte.json.
- Construir entrada: node scripts/build-lab.mjs electroerosion-hilo-corte. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 233.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 233 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 233. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 233.

## Verificación
966 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 40 palabras iniciales; 38 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 40 palabras iniciales; 38 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 40 palabras iniciales; 54 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 40 palabras iniciales; 54 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 62 llamadas, 33446 triángulos y encuadre 65.0 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Gantry con guías laterales, travesaño enlazado al eje Z, cabezal de hilo, baño seccionado y ranura progresiva en una pieza circular. Se añadieron los apoyos y el travesaño móvil para evitar un cabezal flotante. Se apoyan por separado el disco y el anillo exterior, con sujeciones fuera del contorno de hilo. La ranura visual se amplía×2; el arranque usa su ancho físico. Se diferencia del186: erosión por descargas y balance de pulso, no corte por fresa.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código 77215fec415c24b8bf058342d9d32e64eb25240d empujado a main. Deploy exit0; Cloudflare 5df7b048-a686-46a2-9567-4b9ae5e83d65. Login real:122 destacadas, doce iframes exactos (231–240 más221/230), portadas HTTP200, geometría sana y consola limpia. También se comprobó el desfase de los rotores magnéticos en producción. Último laboratorio publicado:240. Los commits posteriores de documentación no cambian el código publicado.
