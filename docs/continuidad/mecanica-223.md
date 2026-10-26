# mecanica-223 · Cadena de rodillos: efecto poligonal

Estado al26-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Una cadena real avanza eslabón a eslabón sobre dos ruedas dentadas y su velocidad oscila.

OT-223 · Transporta a 0,8–1,2 m/s, ondulación ≤1 % y carga en apoyos ≤300 N.

Equipo e instrumentos: Cadena de 80 pasos, dos ruedas y balance de tracción.

## Modelo y alcance
Paso p=12,7 mm, 80 eslabones, ruedas iguales de z dientes pares. R=p/[2sin(π/z)], C=(80−z)p/2. Velocidad media=pzn/60; instantánea=ωRcosδ, |δ|≤π/z. Ondulación=(vmax−vmin)/vmedia. Potencia útil 120 W y pretensión 50 N: ΔT=P/vmedia; carga aproximada=100+ΔT.

Geometría de paso exacto; contorno del diente ilustrativo, sin perfil normalizado de fabricante, desgaste, vibración o elasticidad. Selección limitada a ruedas iguales y z par. Giro estroboscópico ×1/30; esfuerzos y velocidades se expresan en tiempo físico.

Escalas: Paso exacto · giro ×1/30 · potencia útil 120 W

Fuente del principio: https://www.renold.com/upload/renoldswitzerland/roller_chain_designer_guide.pdf . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/cadena-rodillos-efecto-poligonal.html y _ficha-cadena-rodillos-efecto-poligonal.js.
- Escena: public/labs/_proc-223.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-223/, briefing JSON, portada prac_223.webp y descriptor scripts/lab-src/cadena-rodillos-efecto-poligonal.json.
- Construir entrada: node scripts/build-lab.mjs cadena-rodillos-efecto-poligonal. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 223.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 223 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 223.

## Verificación
34024 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 46 palabras iniciales; 14 llamadas; encuadre 66.7 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 46 palabras iniciales; 14 llamadas; encuadre 66.7 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 46 palabras iniciales; 14 llamadas; encuadre 66.7 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 46 palabras iniciales; 14 llamadas; encuadre 47.7 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Cadena de80 eslabones con placas redondeadas, rodillos, dientes y apoyos. La geometría cierra con paso constante para cada número de dientes permitido. Se corrigió el eje de los rodillos dentados para que no salieran lateralmente como barras. No simula desgaste ni perfil normalizado. Es distinto del208: transmisión por cadena y efecto poligonal, no frecuencia de una correa.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

La prueba geométrica adicional verifica los80 pasos directamente sobre las matrices de rodillos renderizados.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:220.
