# mecanica-238 · Cojinete aerostático: película y restrictor

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Un disco gira sin contacto sobre una película de aire presurizada.

OT-238 · Soporta ≥400 N con película8–16 µm, consumo ≤2 L/min y rigidez ≥70 N/µm.

Equipo e instrumentos: Cojinete de aire seccionado, disco flotante y red de restricción.

## Modelo y alcance
Receso Ri30 mm, exterior Ro40 mm, eje10 mm; presión de suministro300 kPa manométricos. Área efectiva integra presión uniforme de receso y descenso logarítmico de la pista. Pr=W/Aef. Restrictor Cr=2·10⁻¹¹(d/0,3)⁴; C=π/[6µln(Ro/Ri)], µ=1,8·10⁻⁵ Pa·s. Q=Cr(Ps−Pr)=Ch³Pr. K=3W(1−Pr/Ps)/h. Q se refiere a presión del receso; aire libre se obtiene por relación de presiones absolutas.

Red equivalente linealizada de gas con coeficientes sintéticos; no resuelve Reynolds compresible, distribución 3D, estabilidad neumática o arranque. La presión logarítmica es la aproximación de película lineal usada para el área efectiva. Sin caudal real de fabricante. Película visual×1000; giro×1/200.

Escalas: Película×1000 · giro×1/200 · red linealizada sintética

Fuente del principio: https://www.newwayairbearings.com/wp-content/uploads/2021/07/NWAB-Design-and-App-Guide-ver-12-2021.pdf . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/cojinete-aerostatico-restrictor.html y _ficha-cojinete-aerostatico-restrictor.js.
- Escena: public/labs/_maq-238.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-238/, briefing JSON, portada prac_238.webp y descriptor scripts/lab-src/cojinete-aerostatico-restrictor.json.
- Construir entrada: node scripts/build-lab.mjs cojinete-aerostatico-restrictor. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 238.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 238 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 238. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 238.

## Verificación
647 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 38 palabras iniciales; 30 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 38 palabras iniciales; 30 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 38 palabras iniciales; 30 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 38 palabras iniciales; 30 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 30 llamadas, 8050 triángulos y encuadre 65.0 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Cojinete con receso, pista, suministro, restrictor, disco, eje y carga axial. Película ampliada×1000. Las superficies axisimétricas se mantienen geométricamente invariantes al girar; las marcas del disco muestran el giro, evitando que una caja delimitadora conservadora agrande falsamente el encuadre. Se diferencia del181/215: sustentación aerostática, no defectos ni montaje térmico de rodamientos.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:230.
