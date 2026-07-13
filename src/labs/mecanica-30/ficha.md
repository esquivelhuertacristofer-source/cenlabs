# Ficha de práctica — Bus CAN: Diagnóstico con Osciloscopio (`mecanica-30`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-30
sector: autotronica
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "Autotrónica (CONALEP 2023 TT3 — tablero, accesorios, CAN-BUS; CECyTE-2017 módulo OBD I-II/ECU)"
modulo: "Diagnóstico electrónico del automóvil"                 # ⚑ mismo módulo que mecanica-11/mecanica-28/mecanica-29; confirmar clave exacta con el plan vigente
submodulo: "Diagnóstico de la red de comunicación CAN con osciloscopio (capa física)"  # ⚑ confirmar clave exacta
ocupacion_SINCO: "7541 — Mecánicos y reparadores de vehículos de motor"  # ⚑ verificar clave SINCO 2011 (misma familia que d10-06/07/08)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de interpretar en el osciloscopio la traza
  diferencial CAN_H/CAN_L de un bus CAN de alta velocidad, relacionar su forma con los
  niveles recesivo/dominante y con la terminación de 120 Ω en cada extremo, y distinguir
  un bus sano de uno con terminador faltante (ringing), en cortocircuito (diferencial
  ausente), o en arbitraje normal entre dos nodos (no una falla).
actividad_clave: >
  Diagnostica un bus CAN en 4 casos guiados (sano, terminador faltante, cortocircuito
  CAN_H–CAN_L, arbitraje entre dos nodos) leyendo la traza diferencial del osciloscopio
  y relacionándola con la causa eléctrica correspondiente.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Conecta las puntas del osciloscopio (o las virtuales del simulador) a CAN_H y CAN_L del bus, y selecciona medición diferencial (canal A − canal B) para visualizar la señal que realmente decodifica un transceptor CAN, no cada hilo por separado."
  - "Identifica el nivel recesivo (bus en reposo, ningún nodo transmitiendo un bit dominante): ambos hilos convergen cerca de 2.5 V, diferencial ≈0 V."
  - "Identifica el nivel dominante (un nodo transmitiendo un bit 0 lógico): CAN_H sube a ~3.5 V, CAN_L baja a ~1.5 V, diferencial ≈2 V — valores representativos de un transceptor típico de alta velocidad (ISO 11898-2); consulta la hoja de datos del transceptor específico para cifras exactas."
  - "Verifica la terminación: un bus CAN de alta velocidad requiere un resistor de 120 Ω en cada uno de sus dos extremos físicos (nunca en nodos intermedios); combinados en paralelo, vistos desde cualquier punto del bus, se comportan como ≈60 Ω."
  - "Reconoce la firma de un terminador faltante: la traza diferencial no se asienta limpiamente al nivel dominante o recesivo, sino que oscila (ringing) por reflexiones antes de estabilizarse — el bus puede seguir 'funcionando' con errores intermitentes en vez de fallar de inmediato."
  - "Reconoce la firma de un cortocircuito CAN_H–CAN_L: al quedar ambos hilos forzados al mismo potencial, la diferencial nunca se desarrolla (permanece cerca de 0 V) aunque los nodos sigan intentando transmitir — el bus queda mudo."
  - "Distingue el arbitraje bit a bit no destructivo (dos nodos transmitiendo a la vez, resuelto por el identificador con más bits dominantes tempranos) de una falla real: en arbitraje normal la traza diferencial sigue mostrando niveles limpios recesivo/dominante, solo que dos fuentes compiten por el bus durante el campo de identificador."
normatividad:          # 🔒 verificar clave y vigencia
  - "ISO 11898-1:2024 — capa de enlace de datos CAN (formato de trama, arbitraje bit a bit no destructivo por prioridad de identificador, bits recesivo/dominante)"
  - "ISO 11898-2:2026 — capa física CAN de alta velocidad (señalización diferencial CAN_H/CAN_L, terminación de 120 Ω en cada extremo del bus)"
  - "Bosch CAN Specification 2.0 (1991) — especificación original de referencia histórica para el protocolo, base de las normas ISO 11898 vigentes"
  - "Nota de rigor: los documentos ISO 11898-1/-2 son de pago (no de acceso abierto); esta ficha se apoya en la triangulación de fuentes secundarias técnicas de fabricantes de semiconductores (Texas Instruments SLLA270, Microchip AN228) y en la propia especificación Bosch CAN 2.0 (de acceso abierto), consistentes entre sí en los valores de voltaje y terminación citados — ver banderas_incertidumbre y fuentes."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La señalización diferencial CAN_H/CAN_L con sus niveles representativos recesivo (~2.5 V ambos hilos, diferencial ≈0 V) y dominante (CAN_H≈3.5 V, CAN_L≈1.5 V, diferencial ≈2 V), consistentes con ISO 11898-2 para CAN de alta velocidad."
  - "La terminación de 120 Ω en cada uno de los dos extremos físicos del bus y su efecto combinado de ≈60 Ω visto desde cualquier nodo — nunca presentado como un resistor de 60 Ω instalado aparte."
  - "La firma de ringing (oscilación antes de asentarse) que deja un terminador faltante en la traza diferencial, distinguible de un bus sano."
  - "La firma de un cortocircuito CAN_H–CAN_L: diferencial que no se desarrolla, bus mudo."
  - "El arbitraje bit a bit no destructivo entre dos nodos con identificadores distintos, mostrando que el nodo con más bits dominantes tempranos gana el bus sin colisión ni retransmisión — la propiedad que distingue a CAN de una red con CSMA/CD."
simulador_NO_modela:   # 🔒 evita el error 'motor con solo pistones y rotores'
  - "La decodificación real de una trama CAN completa (SOF, campo de arbitraje/identificador, RTR, control, datos, CRC, ACK, EOF) bit a bit — el simulador muestra el efecto agregado en la traza diferencial, no un decodificador de protocolo."
  - "El bit-stuffing (inserción de un bit de polaridad opuesta tras 5 bits idénticos consecutivos) que forma parte del mecanismo real de codificación CAN."
  - "El estado de 'bus-off' que alcanza un nodo tras acumular demasiados errores de transmisión (contador TEC > 255), ni la máquina de estados de manejo de errores (activo/pasivo/bus-off) de ISO 11898-1."
  - "Buses CAN multi-segmento con gateways o pasarelas entre distintas redes del vehículo (p. ej. bus de carrocería vs. bus de motor) — el simulador modela un solo segmento de bus con nodos simples."
  - "CAN FD (Flexible Data-Rate) ni ninguna variante de mayor velocidad/payload extendido — el simulador modela exclusivamente CAN clásico de alta velocidad según ISO 11898-2."
  - "Las curvas de conmutación específicas de un transceptor comercial (p. ej. tiempos de subida/bajada, capacitancia de línea) — los valores de voltaje mostrados son representativos y no sustituyen la hoja de datos del fabricante."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de diagnóstico: identificación correcta de cada uno de los 4 casos (sano, terminador faltante, cortocircuito, arbitraje) a partir de la traza diferencial, con la causa eléctrica correspondiente."
evidencia_desempeno: "Guía de observación del recorrido por los 4 casos guiados y del razonamiento al distinguir ringing de cortocircuito, y arbitraje normal de una falla real."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: continuidad directa con el osciloscopio (mecanica-25) y el escáner OBD-II/readiness (mecanica-11, mecanica-28, mecanica-29) — de leer señales individuales a leer la red que las transporta entre ECUs (briefing.ts)."
desarrollo: "Práctica en el simulador: 4 casos guiados (sano, terminador faltante, cortocircuito, arbitraje) sobre un panel de osciloscopio virtual con traza diferencial CAN_H/CAN_L y controles para alternar cada falla."
cierre: "Ficha técnica (capa 2) con el contrato de fidelidad y la tabla de los 4 casos con sus voltajes representativos CAN_H/CAN_L/diferencial."
# --- Veracidad ---
fuentes:               # 🔒 verificadas mediante fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §13)
  - "ISO 11898-1:2024 e ISO 11898-2:2026 — normas vigentes citadas por nombre y número (documentos de pago, no de acceso abierto en esta sesión — ver banderas_incertidumbre)."
  - "Bosch CAN Specification Version 2.0 (1991, bosch-can2.0.pdf) — especificación técnica original de acceso abierto, fuente primaria directa para bits recesivo/dominante, arbitraje no destructivo y terminación, leída en esta sesión."
  - "Texas Instruments SLLA270 (ti-slla270.pdf) — nota de aplicación de fabricante de transceptores CAN, fuente secundaria técnica usada para triangular los valores representativos de voltaje diferencial (recesivo ≈0 V / dominante ≈2 V)."
  - "Microchip AN228 (microchip-an228.pdf) — nota de aplicación de fabricante, segunda fuente secundaria independiente para triangular los mismos valores de voltaje y la terminación de 120 Ω por extremo."
  - "docs/LISTA-MAESTRA-200-PRACTICAS.md, fila d10-09 — trazabilidad curricular oficial verificada (AUT-C TT3 'tablero, accesorios, CAN-BUS'; AUT-Y ECU) y molde P+S, segunda implementación de ese molde en D10 tras d10-07/mecanica-28."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (programa_oficial / modulo / submodulo / ocupacion_SINCO): reutiliza sin verificar el mismo anclaje de mecanica-11/28/29; faltan las CLAVES exactas del plan vigente — verificar contra el documento oficial antes de publicar la trazabilidad. La columna 'Trazabilidad' de la lista maestra marca esta práctica como 'AUT-C TT3; AUT-Y ECU'."
  - "⚑ Las normas ISO 11898-1:2024 e ISO 11898-2:2026 son documentos de pago; esta ficha se apoya en triangulación de fuentes secundarias de fabricantes (TI, Microchip) más la especificación Bosch CAN 2.0 original de acceso abierto, consistentes entre sí, pero NO se leyó el texto ISO íntegro — verificar contra el texto ISO oficial si un revisor tiene acceso."
  - "⚑ Los valores de voltaje (recesivo ≈2.5 V/hilo, dominante CAN_H≈3.5 V/CAN_L≈1.5 V) son representativos de un transceptor de alta velocidad típico; transceptores específicos pueden variar — el simulador y esta ficha lo señalan como 'valores representativos', nunca como una cifra exacta universal."
  - "⚑ El molde P+S de este lab es el segundo de esa clase en D10 (tras d10-07/mecanica-28); valorar con el experto si la profundidad del panel de osciloscopio (sin decodificación real de trama) es suficiente para el nivel, o si amerita una fase adicional que muestre al menos el campo de arbitraje bit a bit de forma simplificada."
  - "⚑ No se verificó en fuente primaria si el plan CONALEP 2023 TT3 usa literalmente la cadena 'CAN-BUS' en su nombre de submódulo o solo en descripción de contenido — la lista maestra la cita como tal, pero esta ficha no tuvo acceso directo al documento curricular completo del plan vigente esta sesión."
```

## Notas para el revisor experto

1. **Lugar en la secuencia curricular:** d10-09 continúa el hilo de d10-07 (`mecanica-28`,
   diagnóstico de un código de falla ya leído) y de d10-08 (`mecanica-29`, veredicto de
   aprobación), pero cambia de capa: en vez de leer QUÉ dice un DTC o decidir el veredicto
   final, enseña CÓMO viajan esos datos entre las ECU físicamente — la red CAN que hace
   posible todo lo anterior. Es el segundo molde P+S de D10 (el primero fue d10-07/
   `mecanica-28`), combinando panel de osciloscopio virtual (P) con el motor de simulación
   de bus/circuito subyacente (S) que genera la traza diferencial en tiempo real según el
   caso activo.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/bus-can.html](../../../public/labs/bus-can.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela), igual que `mecanica-11`,
   `mecanica-12`, `mecanica-24`–`mecanica-29`.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑
   (compartidas sin verificar con `mecanica-11`/`28`/`29`); (b) confirmar si el plan
   CONALEP 2023 TT3 usa literalmente "CAN-BUS" como aparece en la lista maestra; (c)
   opinar si los valores representativos de voltaje (2.5 V / 3.5 V / 1.5 V) deben
   ajustarse a una familia de transceptor específica o mantenerse genéricos; (d) validar
   que la ausencia de decodificación de trama real (bit-stuffing, CRC, campos completos)
   es una simplificación razonable para este nivel.
4. **Diferencia respecto a mecanica-25/28/29:** `mecanica-25` enseña a usar el
   osciloscopio de forma genérica (periodo, frecuencia, disparo) sobre señales simples;
   `mecanica-28` usa el escáner para clasificar UN código ya leído; `mecanica-29` decide
   el veredicto global de la verificación. `mecanica-30` (este lab) da un paso distinto:
   usa el osciloscopio, ya dominado en `mecanica-25`, sobre una señal específica y más
   compleja —la diferencial de dos hilos de un bus de red— para diagnosticar la CAPA
   FÍSICA que sostiene la comunicación detrás de todo lo que `mecanica-11`/`28`/`29` ya
   asumían como dado.
