# Ficha de práctica — Domina el multímetro: exactitud, resolución y categorías (`mecanica-12`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** este lab es la **implementación de referencia del molde P (panel de
> instrumento)** para las prácticas de D10/D2 (`docs/LISTA-MAESTRA-200-PRACTICAS.md`, d10-01).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-12
sector: mecanica-electronica
practica_maestra: "d10-01 — Domina el multímetro: exactitud, resolución y categorías (molde P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.1 (Electrónica/Tecnología, resultado I.1) · AUT-Y eléctrico"   # ⚑ confirmar claves exactas del plan vigente
modulo: "Instrumentación, diagnóstico y metrología (D10)"
submodulo: "Medición eléctrica con multímetro digital"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de seleccionar función y rango de un multímetro
  digital de 6000 cuentas, expresar cada medición como lectura ± incertidumbre
  U = ±(% de lectura + dígitos), reconocer el efecto de carga de la impedancia de entrada
  y elegir el instrumento según la categoría de medición (CAT II/III/IV) del punto de prueba.
actividad_clave: >
  Resuelve 4 mediciones reales (fuente de CD, tomacorriente de 127 V~, resistor fuera de
  circuito y divisor de alta impedancia) reportando cada resultado con su banda de
  incertidumbre y justificando el rango elegido y la categoría de medición aplicable.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica las partes del DMM: display de 6000 cuentas, selector de función, bornas (COM, VΩ, mA, A) y el marcado de seguridad CAT III 600 V / CAT II 1000 V."
  - "Caso 1 (fuente 5 V, V⎓): mide en rango 6 V y en rango 60 V; calcula la resolución = rango/6000 y la incertidumbre U = ±(% de lectura + dígitos·resolución) en cada rango, y compara."
  - "Caso 2 (tomacorriente, V~): mide los 127 V de la red; ubica el punto en la instalación (tomacorriente = CAT II; tablero = CAT III; acometida = CAT IV) y decide si el instrumento es apto."
  - "Caso 3 (resistor 4.7 kΩ ±5 %, Ω): mide FUERA de circuito; verifica que el valor medido cae dentro de la banda de tolerancia del componente considerando también la U del instrumento."
  - "Caso 4 (divisor 1 MΩ/1 MΩ alimentado con 10 V): mide el nodo central; explica la lectura de ≈4.76 V (no 5.00 V) por el efecto de carga de la Z_in de 10 MΩ en paralelo con la rama inferior."
  - "Reporta cada resultado con la incertidumbre redondeada a 2 cifras significativas y la lectura alineada a esa resolución (criterio GUM, JCGM 100 §7.2.6)."
  - "Explora los modos de protección: OL por sobre-rango, bloqueo 'err' al medir Ω en circuito energizado y fusible de 400 mA al conectar la entrada mA en paralelo con una fuente."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 61010-1 — categorías de medición CAT II/III/IV y requisitos de seguridad de equipos de medición"
  - "IEC 61010-2-033 — requisitos particulares para multímetros de mano"
  - "JCGM 100:2008 (GUM) / NMX-CH-140-IMNC-2002 — expresión de la incertidumbre de medida"
  - "NOM-029-STPS-2011 — mantenimiento de instalaciones eléctricas: seguridad en la medición"
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "DMM de 6000 cuentas con autorango y rangos manuales; resolución = rango/6000 recalculada por rango."
  - "Incertidumbre por especificación de hoja de datos: U = ±(% de lectura + N dígitos), distinta por función (V⎓, V~, Ω, mA)."
  - "Redondeo metrológico del resultado: U a 2 cifras significativas y lectura alineada (GUM)."
  - "Efecto de carga real: Z_in = 10 MΩ en V⎓ → el divisor 1 MΩ/1 MΩ a 10 V lee 4.762 V, no 5.000 V."
  - "Valor real del resistor distinto del nominal (4687 Ω vs 4.7 kΩ) para que la verificación de tolerancia sea un juicio, no una lectura."
  - "Sobre-rango (OL), bloqueo por Ω en circuito energizado y fusible de 400 mA en la entrada mA — con estado persistente."
  - "Marcado de categorías CAT en el instrumento y decisión CAT II/III/IV por punto de medición."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Deriva térmica, envejecimiento ni historial de calibración del instrumento (la spec se asume vigente)."
  - "True-RMS vs respuesta promedio: la red se modela senoidal pura, así que la distinción no se ejercita."
  - "Ruido de la medición (la lectura es estable); la incertidumbre mostrada es la de especificación, no una dispersión estadística tipo A."
  - "Transitorios reales de la red ni la física del arco interno; la categoría CAT se enseña como regla de selección, no como ensayo destructivo."
  - "Capacitancia, frecuencia, temperatura ni prueba de diodos — sólo V⎓, V~, Ω y mA."
  - "Los porcentajes de exactitud son típicos de un DMM 6000 cuentas clase media, NO la hoja de datos de un modelo comercial específico."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de las 4 mediciones: función, rango, lectura ± U, y justificación de tolerancia (caso 3) y efecto de carga (caso 4)."
evidencia_desempeno: "Guía de observación de la selección de función/rango y del respeto a las categorías CAT en el simulador."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué una medición sin incertidumbre no es una medición (briefing.ts)."
desarrollo: "Práctica en el simulador: 4 casos guiados + exploración de OL/err/fusible."
cierre: "Ficha técnica (capa 2) con el modelo matemático, tabla de especificaciones y retos de transferencia."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "IEC 61010-1:2010+AMD1:2016 — Safety requirements for electrical equipment for measurement, control, and laboratory use — Part 1 (categorías de medición)."
  - "IEC 61010-2-033 — Particular requirements for hand-held multimeters."
  - "JCGM 100:2008 — Evaluation of measurement data — Guide to the expression of uncertainty in measurement (GUM), §7.2.6 (cifras significativas de U)."
  - "NMX-CH-140-IMNC-2002 — Guía para la expresión de incertidumbre en las mediciones (adopción mexicana de la GUM)."
  - "DOF — NOM-029-STPS-2011 — Mantenimiento de las instalaciones eléctricas en los centros de trabajo, condiciones de seguridad."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ETR-I.1 / AUT-Y / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Las especificaciones de exactitud usadas (p. ej. ±(0.5 % + 2 díg.) en V⎓) son representativas de un DMM 6000 cuentas de gama media; un experto debería confirmar que son razonables como valores de enseñanza."
  - "⚑ El fusible de 400 mA y la Z_in de 10 MΩ son valores típicos de la clase de instrumento, no de un modelo certificado específico."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (molde P de referencia):** d10-01 es la primera implementación
   del molde P (panel de instrumento) que se replica en el resto de D10 y en los paneles de
   D2. Si el contrato de fidelidad y el nivel matemático (incertidumbre GUM completa) son
   correctos y sostenibles, se replica; si sobra o falta, se ajusta antes de la tanda T2.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/multimetro.html](../../../public/labs/multimetro.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela) y la línea `Ref:` con la normatividad,
   de modo que el alumno y el evaluador ven las fronteras del modelo dentro de la práctica.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) validar los porcentajes de exactitud por función como valores de enseñanza;
   (c) señalar cualquier práctica de seguridad (CAT, Ω energizado, entrada mA) que un
   instrumentista consideraría imprecisa o sobre-afirmada.
