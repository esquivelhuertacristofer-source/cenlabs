# mecanica-231 · Robot suspendido: cables, tensiones y cabrestantes

Estado al28-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Cuatro cabrestantes trasladan una carga suspendida manteniendo todos los cables en tracción.

OT-231 · Traslada ≥12 kg en la trayectoria prescrita con tensiones 12–110 N y potencia máxima de izado ≤80 W.

Equipo e instrumentos: Robot por cables, cuatro cabrestantes y registro de longitudes y tensiones.

## Modelo y alcance
Anclajes (±s,2,2,±s) m. Unión común: x=0,45sin(2πt/20), y=0,8, z=0,35cos(2πt/20). Masa total=carga+6 kg. Unidades de cable ui=(ai−x)/Li. Reparto de mínima norma T=Aᵀ(AAᵀ)⁻¹[0,mg,0]; AT equilibra el peso. dLi/dt=−ui·v. Tambor de radio40 mm y eficiencia0,8. Se revisan241 posiciones del recorrido.

Modelo cuasiestático de traslación: los cuatro cables convergen en una rótula común y no controlan orientación ni guiñada. Sin aceleración de carga, elasticidad, pandeo, control real de winches o certificación de elevación. Tensiones negativas se rechazan; no representan cables que empujan. Recorrido acelerado×2.

Escalas: Trayectoria×2 · equilibrio cuasiestático · orientación libre

Fuente del principio: https://www.nist.gov/publications/design-and-workspace-analysis-6-6-cable-suspended-parallel-robot . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/robot-cables-tensiones.html y _ficha-robot-cables-tensiones.js.
- Escena: public/labs/_maq-231.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-231/, briefing JSON, portada prac_231.webp y descriptor scripts/lab-src/robot-cables-tensiones.json.
- Construir entrada: node scripts/build-lab.mjs robot-cables-tensiones. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 231.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 231 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 231. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 231.

## Verificación
1926 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 39 palabras iniciales; 45 llamadas; encuadre 65.2 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 39 palabras iniciales; 45 llamadas; encuadre 65.2 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 39 palabras iniciales; 45 llamadas; encuadre 65.2 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 39 palabras iniciales; 45 llamadas; encuadre 65.1 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 45 llamadas, 15326 triángulos y encuadre 65.2 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Pórtico con cuatro cabrestantes, tambores, cables convergentes, rótula y plataforma cargada. Longitudes, vueltas de tambor y tensiones se relacionan con la pose calculada. Se conserva la orientación libre de una unión común; no presentarlo como plataforma de seis grados de libertad. Se diferencia del169/170: cables que sólo traccionan y reparto unilateral, no brazos rígidos ni cilindros.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

El informe añade datos adquiridos: longitudes/tensiones de cables, respuesta temporal de régimen o longitudes de tendones, según el banco.

## Publicación
Código 77215fec415c24b8bf058342d9d32e64eb25240d empujado a main. Deploy exit0; Cloudflare 5df7b048-a686-46a2-9567-4b9ae5e83d65. Login real:122 destacadas, doce iframes exactos (231–240 más221/230), portadas HTTP200, geometría sana y consola limpia. También se comprobó el desfase de los rotores magnéticos en producción. Último laboratorio publicado:240. Los commits posteriores de documentación no cambian el código publicado.
