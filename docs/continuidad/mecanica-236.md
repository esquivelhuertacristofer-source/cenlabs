# mecanica-236 · Engranaje magnético: transmisión sin contacto

Estado al28-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Dos coronas de imanes y un modulador fijo transmiten par con velocidades opuestas.

OT-236 · Entrega ≥120 W con margen ≥2 N·m, par de entrada ≤3,5 N·m y entrehierro ≥1,5 mm.

Equipo e instrumentos: Acoplamiento magnético coaxial abierto, imanes alternos y freno de banco.

## Modelo y alcance
Pares polares4 y11, modulador fijo15 polos; 4ωentrada+11ωsalida=0. Entrada600 rpm. Ley de banco Tmáx=14exp(−0,5(g−1)) N·m, g en mm. T=Tmáxsinδ; en sincronismo δ=asin(Tcarga/Tmáx). Tin=(4/11)Tcarga y balance ideal de potencia.

Capacidad exponencial sintética, no FEM magnético ni curva de fabricante. Imanes y líneas representan el principio, sin histéresis ni pérdidas. Si la carga excede la capacidad, un freno externo retiene la salida para el ensayo de par; no se simula su dinámica de deslizamiento. Giro×1/120 y entrehierro visual ampliado.

Escalas: Giro×1/120 · entrehierro ampliado · campo esquemático

Fuente del principio: https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/joe.2018.8238 . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/engranaje-magnetico-coaxial.html y _ficha-engranaje-magnetico-coaxial.js.
- Escena: public/labs/_maq-236.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-236/, briefing JSON, portada prac_236.webp y descriptor scripts/lab-src/engranaje-magnetico-coaxial.json.
- Construir entrada: node scripts/build-lab.mjs engranaje-magnetico-coaxial. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 236.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 236 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 236. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 236.

## Verificación
569 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 39 palabras iniciales; 37 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 39 palabras iniciales; 37 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 39 palabras iniciales; 37 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 39 palabras iniciales; 41 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 41 llamadas, 31682 triángulos y encuadre 65.0 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Rotores coaxiales de8 y22 imanes alternos, modulador fijo de15 polos, retorno de acero, carcasa abierta y freno posterior. Se comprueban relación polar y equilibrio de par; se separó el desfase eléctrico del reloj para evitar sobrescribir la lectura. El entrehierro visual está ampliado y la capacidad exponencial es sintética. Se diferencia del167/183: acoplamiento de campo sin contacto, no dientes flexibles o disco cicloidal.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código 77215fec415c24b8bf058342d9d32e64eb25240d empujado a main. Deploy exit0; Cloudflare 5df7b048-a686-46a2-9567-4b9ae5e83d65. Login real:122 destacadas, doce iframes exactos (231–240 más221/230), portadas HTTP200, geometría sana y consola limpia. También se comprobó el desfase de los rotores magnéticos en producción. Último laboratorio publicado:240. Los commits posteriores de documentación no cambian el código publicado.
