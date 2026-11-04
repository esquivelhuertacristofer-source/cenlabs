# Mecánica 291 · PID de velocidad con anti-windup

**Simulador y revisión funcional en local. Narración pendiente.**

El banco presenta una saturación deliberada y una caída de consigna. El alumno ajusta la ganancia Ziegler–Nichols y la corrección del integrador, ensaya, valida y exporta un informe. El giro del rodillo usa la integral de velocidad. El indicador luminoso sigue la tensión aplicada.

La planta equivalente tiene tres retardos de 0,25 s. El cálculo de ganancia y periodo últimos se contrastó con la respuesta compleja. La integración de la planta bajo retención del mando se contrastó con un escalón analítico. La comparación con un paso de 2,5 ms verifica la recuperación frente al modelo de 5 ms. El ajuste de referencia recupera la banda en 1,54 s. Con la corrección desactivada tarda 4,03 s.

El flujo completo pasó en 1366×768, 1600×900, 2020×1055 con DPR 1,25 y 390×844. Incluye la orden, el ensayo, la validación, el quiz, el instrumento y el TXT. El barrido del simulador pasó y la portada se revisó.

Archivos en `public/labs/_control-avanzado-*`, `src/labs/mecanica-291` y el auditor `verifica-pid-ziegler-nichols-antiwindup.mjs`. La evidencia queda en `scripts/auditoria/.salida/control-avanzado/291-informe.json`.

Retomar la síntesis de voz desde el listado preparado en el workspace. El proceso Qwen terminó con acceso inválido de Windows durante la carga. Continuar con Bode 292. Entrega local autorizada el 4 de noviembre de 2026.

## Revisión visual

61 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El rotor del banco y el testigo de mando dan dos lecturas visuales. El oscilograma ayuda a medir la recuperación después de saturar.
