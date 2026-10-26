# mecanica-225 · Robot de orugas: giro y esfuerzo de tracción

Estado al26-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Controla dos orugas independientes y observa cómo su diferencia de velocidad hace girar el robot.

OT-225 · Avanza ≥0,5 m/s en un radio de 1–1,6 m, con par ≤20 N·m y potencia ≤250 W.

Equipo e instrumentos: Robot de orugas, transmisión independiente y trayectoria del centro.

## Modelo y alcance
v=(vR+vL)/2; ψ̇=(vR−vL)/b, b=0,45 m. Masa 60 kg, contacto 0,6 m. Resistencia longitudinal=0,04mg. Momento lateral sintético M=0,6mg·0,6/4·tanh(ψ̇/0,25). FL+FR=0,04mg; (FR−FL)b/2=M. Radio motriz 0,09 m; eficiencia motriz 0,8 y regenerativa 0,6. Pose por integración exacta del arco.

Cinemática ideal sin deslizamiento; resistencia lateral cuasiestática regularizada, no dinámica de suelo ni modelo predictivo de consumo real. Sólo avance positivo. Cámara solidaria al centro: el suelo se desplaza como referencia. Demostración ×1/5; trayectoria y fuerzas numéricas en unidades físicas.

Escalas: Cámara acompañante · movimiento ×1/5 · contacto ideal

Fuente del principio: https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2019.00046/full . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/robot-orugas-giro-traccion.html y _ficha-robot-orugas-giro-traccion.js.
- Escena: public/labs/_proc-225.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-225/, briefing JSON, portada prac_225.webp y descriptor scripts/lab-src/robot-orugas-giro-traccion.json.
- Construir entrada: node scripts/build-lab.mjs robot-orugas-giro-traccion. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 225.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 225 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 225.

## Verificación
964 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 45 palabras iniciales; 8 llamadas; encuadre 64.1 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 45 palabras iniciales; 8 llamadas; encuadre 64.1 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 45 palabras iniciales; 8 llamadas; encuadre 64.1 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 45 palabras iniciales; 8 llamadas; encuadre 61.2 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Robot con dos lazos de oruga, zapatas, rodillos, reductores, cuerpo, antena y cámara frontal. Se ajustaron separación y longitud de contacto al modelo métrico; la cámara acompaña al centro y el suelo indica el desplazamiento. La resistencia lateral es un proxy declarado. Es distinto del200: giro por tracción diferencial y esfuerzo de contacto, no estimación de pose de un AMR de ruedas.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:220.
