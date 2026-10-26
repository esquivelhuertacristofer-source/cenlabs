# mecanica-227 · Interferómetro láser: ambiente y error de coseno

Estado al26-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Un reflector móvil cambia el camino óptico; compensa el aire y alinea el haz para medir desplazamiento.

OT-227 · Obtén error ≤0,3 µm en patrones 50/100/150 mm, desalineación ≤0,1° y compensación ambiental dentro de 1 °C de la referencia.

Equipo e instrumentos: Banco óptico, reflector móvil y referencias de longitud.

## Modelo y alcance
λvac=632,8 nm. Índice simplificado n(T)=1+0,00027·293,15/(273,15+T). N=2nrealLcosα/λvac; Lestimada=Nλvac/(2nestimado). Se evalúan tres longitudes conocidas. Movimiento L=75+50sin(2πt/8) mm. El termómetro patrón pertenece al banco y su valor se revela tras validar. El informe guarda fase fraccionaria y lectura de las tres referencias.

Índice sintético dependiente sólo de temperatura; no ecuación Edlén completa ni compensación de presión/humedad. Conteo ideal de fase fraccionaria, sin ruido ni pérdidas de franjas. El detector visual muestrea una intensidad y no resuelve todas las oscilaciones ópticas. No certifica metrología real.

Escalas: Fase ideal · detector muestreado · ley n(T) reducida

Fuente del principio: https://www.renishaw.com/resourcecentre/en/details/white-paper-environmental-compensation-of-linear-laser-interferometer-readings--94445 . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/interferometro-laser-compensacion.html y _ficha-interferometro-laser-compensacion.js.
- Escena: public/labs/_proc-227.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-227/, briefing JSON, portada prac_227.webp y descriptor scripts/lab-src/interferometro-laser-compensacion.json.
- Construir entrada: node scripts/build-lab.mjs interferometro-laser-compensacion. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 227.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 227 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 227.

## Verificación
724 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 47 palabras iniciales; 16 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 47 palabras iniciales; 19 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 47 palabras iniciales; 19 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 47 palabras iniciales; 19 llamadas; encuadre 59.4 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Banco óptico con riel, carro, emisor, divisor, brazo de referencia, detector y reflector. Se añadieron apoyos y el recorrido completo al encuadre para evitar recortar el carro. El informe registra fases ideales y tres referencias. No resuelve compensación atmosférica completa. Es distinto del198/196: interferometría de desplazamiento, no alineación de ejes ni triangulación.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

Referencia oculta en Modelo/Ficha hasta validar y retirada al cambiar el ajuste; comprobado en escritorio y móvil. Informe con datos adquiridos comprobado mediante descarga.

Recorrido del reflector comprobado a lo largo de un período sin salir del encuadre.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:220.
