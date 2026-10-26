# mecanica-228 · Rugosímetro: perfil, filtro y muestreo

Estado al26-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Una punta recorre una superficie mecanizada y separa ondulación de rugosidad mediante un filtro.

OT-228 · Separa ondulación con fuga ≤0,1 µm y conserva ≥95 % de la rugosidad; toma ≥20 muestras por onda corta en ≤20 s.

Equipo e instrumentos: Rugosímetro, perfil mecanizado y separación gaussiana.

## Modelo y alcance
Perfil de 4 mm: amplitudes 2/0,65/0,2 µm y longitudes 2/0,08/0,04 mm; última fase 0,7 rad. Paso alto gaussiano H=1−exp[−ln2(λc/λ)²]. Ra=media|r| y Rq=√media(r²), 4000 puntos periódicos. Muestreo de adquisición 200 Hz; muestras por onda corta=0,04·200/v.

Perfil sintético periódico y filtro analítico sin efectos de borde, no evaluación ISO completa. Punta ideal sin convolución por radio ni dinámica de palpador. Altura de topografía ×100, punta ampliada esquemática. El modelo evalúa retención y muestreo, no certifica acabado real.

Escalas: Topografía ×100 · punta ideal ampliada · adquisición 200 Hz

Fuente del principio: https://pml.nist.gov/VSC/Help/Filters/Gaussian.jsp . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/rugosimetro-filtro-perfil.html y _ficha-rugosimetro-filtro-perfil.js.
- Escena: public/labs/_proc-228.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-228/, briefing JSON, portada prac_228.webp y descriptor scripts/lab-src/rugosimetro-filtro-perfil.json.
- Construir entrada: node scripts/build-lab.mjs rugosimetro-filtro-perfil. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 228.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 228 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 228.

## Verificación
355 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 43 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 43 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 43 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 43 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Palpador sobre una topografía que conserva sus componentes al cambiar el filtro. Se aumentó el muestreo geométrico y se conectó la punta con el perfil; columna y guía permanecen en inspección. Altura×100 y punta ideal declaradas. Es distinto del204: textura y filtrado del perfil, no dimensiones de una pieza mediante CMM.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código aae1fdb064a568c64ee6fcc04bfcc2d0fd643a35 empujado a main. Deploy exit0; Cloudflare df771c75-c957-4014-b1d2-8a99f0c330d3. Login real:112 destacadas, doce iframes exactos (221–230 más211/220), portadas HTTP200, geometría sana y consola limpia. Último laboratorio publicado:230. Los commits posteriores de documentación no cambian el código publicado.
