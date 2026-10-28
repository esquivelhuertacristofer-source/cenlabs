# mecanica-240 · Plegado de chapa: fuerza y recuperación elástica

Estado al28-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Un punzón forma una chapa sobre una matriz en V y la pieza se abre ligeramente al descargar.

OT-240 · Obtén ángulo descargado89–91°, fuerza ≤5,5 kN, material ≥280 MPa y carrera ≤10 mm.

Equipo e instrumentos: Plegadora abierta, punzón, matriz y chapa con recuperación elástica.

## Modelo y alcance
Chapa100×80×1,5 mm; V18 mm, radio neutro R3,75 mm, E210000 MPa. Contactos geométricos: s=(V/2)tan a+R(1−sec a), β=2a. Curvatura elástica recuperada Δκ=3σy/(Et), aproximación de momento plástico. βlibre=β(1−RΔκ); Rlibre=R/(1−RΔκ), conserva longitud de arco. Fuerza equivalente F=1,42σy·80·1,5²/18. Desarrollo neutro=Rβ.

Modelo reducido elástico perfectamente plástico, sin endurecimiento, fricción, anisotropía, espesor variable, fractura o tabla real de plegado. Coeficiente de fuerza del escenario; no se usa para ajustar una prensa real. Geometría neutra y longitud de100 mm conservadas. El retorno del punzón es prescrito; no hay FEM de contacto. Ciclo de8 s.

Escalas: Longitud neutra conservada · recuperación ideal · ciclo8 s

Fuente del principio: https://www.ssab.com/en/support/how-to-process/how-to-bend/bending/20-questions . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/plegado-chapa-recuperacion.html y _ficha-plegado-chapa-recuperacion.js.
- Escena: public/labs/_maq-240.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-240/, briefing JSON, portada prac_240.webp y descriptor scripts/lab-src/plegado-chapa-recuperacion.json.
- Construir entrada: node scripts/build-lab.mjs plegado-chapa-recuperacion. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 240.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 240 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 240. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 240.

## Verificación
1086 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 50 palabras iniciales; 10 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 50 palabras iniciales; 10 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 50 palabras iniciales; 10 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 50 palabras iniciales; 10 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 10 llamadas, 2906 triángulos y encuadre 65.0 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Prensa con cilindro, punzón de nariz redondeada, matriz en V y chapa sólida. Se conserva el volumen de la chapa en cuatro fases, incluidas descarga y recuperación; el ángulo recuperado sale del momento elástico ideal. El contacto y retorno del actuador son prescritos, sin FEM. Tema distinto del205: conformado y sobreplegado, no parada por cortina óptica.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código 77215fec415c24b8bf058342d9d32e64eb25240d empujado a main. Deploy exit0; Cloudflare 5df7b048-a686-46a2-9567-4b9ae5e83d65. Login real:122 destacadas, doce iframes exactos (231–240 más221/230), portadas HTTP200, geometría sana y consola limpia. También se comprobó el desfase de los rotores magnéticos en producción. Último laboratorio publicado:240. Los commits posteriores de documentación no cambian el código publicado.
