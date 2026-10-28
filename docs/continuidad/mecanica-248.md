# mecanica-248 · Pintura en polvo: transporte y captura electrostática

Estado al28-10-2026: PUBLICADO y verificado con login real.

## Orden y competencia profesional
OT-248 · Consigue captura80–95 %, espesor60–90 µm y corriente de polvo capturado ≤2 µA.

Equipo e instrumentos: Cabina seccionada, nube de partículas y balance de masa y carga.

Una pistola envía partículas cargadas hacia una placa conectada a tierra y forma una capa de polvo. Compara campo eléctrico, captura y espesor antes del curado.

## Modelo y límites
Campo uniforme E=V/0,2 m. Partículas40 µm,ρp=1500 kg/m³,µaire=1,8·10⁻⁵ Pa·s: τ=ρpd²/(18µ). Carga específica uniforme en128 clases de0,0001 a0,0009 C/kg. Movimiento desde v0=0,5 m/s: x=v0t+(q/m)Eτ[t−τ(1−exp(−t/τ))]. Captura si alcanza0,2 m en0,2 s. Espesor=ṁη/(ρp·ancho0,2 m·velocidad0,04 m/s). Corriente suma de cargas capturadas.

Campo y distribución de carga sintéticos, sin corona, carga espacial, resistividad, geometría de bordes, retroionización o cámara de curado. Tiempo de vuelo es el mismo del modelo; recorrido visual escalado5 unidades/m y espesor×200. Espesor equivalente de masa depositada, no película curada ni eficiencia comercial. Corriente sólo del polvo, no consumo total de pistola.

Escalas: Campo uniforme · vuelo0,2 s · espesor visual×200 · sin curado

Principio consultado: https://www.nordson.com/en/About-Us/Newsroom/Industrial-Coating-Systems-News/Complete-Guide-to-Powder-Coating . Geometría y constantes de escenario propias, no datos comerciales.

## Archivos y receta para retomar
- public/labs/pintura-polvo-electrostatica.html, _ficha-pintura-polvo-electrostatica.js y escena _ind-248.js.
- _industria-modelos.js: funciones puras; _industria-definiciones.js: contrato; _industria-runtime.js: orden, ensayo e informe; _industria-instrumentos.js: lecturas y curvas DOM; _industria-escenas.js y _industria-piezas.js. Se reutilizan utilidades geométricas anteriores.
- src/labs/mecanica-248/, briefing JSON, portada prac_248.webp y descriptor scripts/lab-src/pintura-polvo-electrostatica.json.
- Build: node scripts/build-lab.mjs pintura-polvo-electrostatica.
- Física: node scripts/auditoria/verifica-industria-241-250.mjs --solo 248.
- Flujo: node scripts/auditoria/flujo-industria-241-250.mjs --solo 248 --inspeccion. --reanudar conserva informe.json; QA_REPORT cambia salida.
- Sincronía y geometría: sincronia-industria.mjs; admite --solo 248. Revelado: protecciones-industria.mjs. Portada: scripts/portadas/capturar-industria.mjs --solo 248.
- Evidencia: scripts/auditoria/.salida/industria-241-250/. No ejecutar los generadores históricos de work/ sobre escenas refinadas.

## Pruebas
907 comprobaciones numéricas;14738 en la tanda. Valores iniciales rechazados y solución interior sobre la rejilla de controles aceptada. Ensayo completo obligatorio, validación manual, quiz barajado, tres diagnósticos, instrumento, descarga de informe y caducidad del registro al modificar/restaurar un control.
- 1366×768, DPR1: 43 palabras iniciales; 16 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 1600×900, DPR1: 43 palabras iniciales; 16 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 2020×1055, DPR1.25: 43 palabras iniciales; 16 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 390×844, DPR1: 43 palabras iniciales; 16 llamadas; encuadre65.0 %; sin errores ni desbordamiento.

Revisión final1366: 16 llamadas y28014 triángulos, 43 palabras. Diez comparaciones de sincronía de pose/geometría/instancias y diez pruebas geométricas específicas. Altura real de mallas visibles comprobada en244/249;20 protecciones de curvas. Diez portadas propias y10/10 sin CDN.44 suites,3496 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; entradas anteriores sin cambios semánticos.

## Autocrítica y originalidad
Cabina, pistola, placa suspendida, conductor de tierra, colector y nube instanciada. Cada clase de carga sigue la solución de arrastre viscoso en campo uniforme. Se ve la capa de masa equivalente con espesor amplificado. No se confunde la corriente de polvo con la de corona ni la deposición con curado. Nuevo proceso de recubrimiento y balance de captura.

La prosa inicial queda en47 palabras como máximo. Los instrumentos están en DOM y los contratos cerrados; la escena muestra el fenómeno desde la entrada. Se corrigieron ocultaciones y apoyos antes del cierre. No se afirma eficacia educativa medida sin evaluación con docentes y estudiantes.

## Publicación
Código 0bb42a6f3eed2bb571f3e147198427dd7a390b0b empujado a main. Deploy exit0; Cloudflare e5306733-c84e-4c5d-953c-39ff27b3a0cc. Login real:132 destacadas,12 iframes exactos (241–250 más236/240), portadas HTTP200, geometría sana y consola limpia. Comprobadas además la fase magnética236, el volumen de chapa240 y las articulaciones del hexápodo250 en producción. Último laboratorio publicado:250. Los commits posteriores de documentación no cambian el código publicado.
