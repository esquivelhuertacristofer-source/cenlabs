# mecanica-234 · Soldadura ultrasónica: sonotrodo y energía

Estado al28-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Un sonotrodo vibra sobre dos piezas plásticas y concentra calor en la unión.

OT-234 · Obtén interfaz150–200 °C, energía útil100–170 J, potencia ≤450 W y tiempo de vibración ≤0,9 s.

Equipo e instrumentos: Prensa ultrasónica, conjunto vibratorio y dos piezas termoplásticas.

## Modelo y alcance
Frecuencia20 kHz; amplitud pico A. Amortiguamiento equivalente c=30 N·s/m: P=½c(2πfA)². Potencia útil0,65P. Interfaz concentrada C=0,8 J/K,H=0,5 W/K: T=20+(0,65P/H)(1−exp(−Ht/C)). Colapso ilustrativo0,3 mm·clamp((T−120)/60). Fuerza prescrita300 N.

Parámetros sintéticos; sin identificación de material, campo acústico, viscoelasticidad no lineal ni predicción de resistencia. La vibración se amplifica×100 y se ralentiza×1/10000; el ciclo térmico se ralentiza×1/10. Ambos usan el mismo reloj con escalas separadas rotuladas. Color de interfaz es falso color de temperatura; no incandescencia. El sólido vibra a escala física y el contorno transparente muestra la amplificación; el colapso se amplía×20 y la tapa se ensancha para conservar volumen. El ultrasonido cesa antes del mantenimiento.

Escalas: Contorno vibratorio×100 y×1/10000 · térmica×1/10 · colapso×20

Fuente del principio: https://www.emerson.com/is/content/emerson/en/corporate/branson/documents/dcm01314-manual-ultraseal-20ex-vgx-4kw-rev-03.pdf . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/soldadura-ultrasonica-polimeros.html y _ficha-soldadura-ultrasonica-polimeros.js.
- Escena: public/labs/_maq-234.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-234/, briefing JSON, portada prac_234.webp y descriptor scripts/lab-src/soldadura-ultrasonica-polimeros.json.
- Construir entrada: node scripts/build-lab.mjs soldadura-ultrasonica-polimeros. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 234.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 234 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 234. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 234.

## Verificación
806 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 45 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 45 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 45 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 45 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 11 llamadas, 7022 triángulos y encuadre 65.0 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Conjunto transductor/amplificador/sonotrodo con piezas plásticas. El sólido vibra a escala física y un contorno transparente muestra la amplificación; se eliminó una malla de alambre demasiado ruidosa. El colapso visual ensancha la tapa para conservar volumen. La temperatura puede rebasar la ventana en un ajuste inválido; no predice degradación del polímero. Se diferencia del165/212: unión de polímero por vibración, no resistencia ni MIG.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código 77215fec415c24b8bf058342d9d32e64eb25240d empujado a main. Deploy exit0; Cloudflare 5df7b048-a686-46a2-9567-4b9ae5e83d65. Login real:122 destacadas, doce iframes exactos (231–240 más221/230), portadas HTTP200, geometría sana y consola limpia. También se comprobó el desfase de los rotores magnéticos en producción. Último laboratorio publicado:240. Los commits posteriores de documentación no cambian el código publicado.
