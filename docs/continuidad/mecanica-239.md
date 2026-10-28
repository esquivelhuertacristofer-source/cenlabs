# mecanica-239 · Robot flexible: curvatura y tendones

Estado al28-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Una columna flexible curva su cuerpo con tendones y aproxima una herramienta a un objetivo.

OT-239 · Alcanza el objetivo patrón con error ≤5 mm, fuerza diferencial ≤7 N y flexión máxima ≤90°. Objetivo cartesiano: (71.78,247.84,124.32) mm.

Equipo e instrumentos: Robot continuo de tendones, guías, herramienta y objetivo espacial.

## Modelo y alcance
Columna inextensible L=0,3 m; tendones a r=20 mm. Diferencia antagonista Δl=2rθ; curvatura κ=θ/L. Rigidez EI=0,03 N·m² y momento equivalente Fr=EIκ. Punta: [R(1−cosθ)cosφ,Rsinθ,R(1−cosθ)sinφ]. Objetivo de banco (x,y,z)=(0.071776,0.247835,0.124319) m. Barrido de ensayo entre0,5 y1 de la flexión solicitada; error del reto en extensión máxima.

Curvatura constante, sin fuerzas externas, estiramiento de tendones, torsión, fricción de guiado o hiperelasticidad. Fuerza diferencial de un par antagonista ideal, no tensión total de todos los cables. Objetivo conocido para practicar cinemática, no calibración oculta ni robot médico. Movimiento prescrito de ensayo en8 s.

Escalas: Curvatura constante · barrido8 s · objetivo conocido

Fuente del principio: https://www.opencontinuumrobotics.com/101/2022/12/09/tdcr-cc-model.html . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/robot-flexible-tendones.html y _ficha-robot-flexible-tendones.js.
- Escena: public/labs/_maq-239.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-239/, briefing JSON, portada prac_239.webp y descriptor scripts/lab-src/robot-flexible-tendones.json.
- Construir entrada: node scripts/build-lab.mjs robot-flexible-tendones. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 239.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 239 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 239. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 239.

## Verificación
206 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 47 palabras iniciales; 13 llamadas; encuadre 65.5 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 47 palabras iniciales; 13 llamadas; encuadre 65.5 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 47 palabras iniciales; 13 llamadas; encuadre 65.5 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 47 palabras iniciales; 13 llamadas; encuadre 65.6 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 13 llamadas, 21274 triángulos y encuadre 65.5 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Columna continua con discos perforados para espina y cuatro tendones, cuerpo translúcido, herramienta y objetivo cartesiano. Se abrieron realmente las guías para que los tendones no atravesaran discos macizos. Curvas y punta se actualizan desde la misma curvatura. Se diferencia del166/169: flexión distribuida de una columna, no articulaciones rígidas. No es robot médico ni predice contacto.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

El informe añade datos adquiridos: longitudes/tensiones de cables, respuesta temporal de régimen o longitudes de tendones, según el banco.

## Publicación
Código 77215fec415c24b8bf058342d9d32e64eb25240d empujado a main. Deploy exit0; Cloudflare 5df7b048-a686-46a2-9567-4b9ae5e83d65. Login real:122 destacadas, doce iframes exactos (231–240 más221/230), portadas HTTP200, geometría sana y consola limpia. También se comprobó el desfase de los rotores magnéticos en producción. Último laboratorio publicado:240. Los commits posteriores de documentación no cambian el código publicado.
