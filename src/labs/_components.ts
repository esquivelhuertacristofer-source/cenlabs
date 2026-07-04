'use client';

/**
 * src/labs/_components.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API pública del registro de COMPONENTES de labs (Piloto/Bitácora vía dynamic).
 * El facade LabRegistry.tsx importa `LAB_COMPONENTS` desde aquí.
 *
 * Client-only: cada entrada son wrappers de next/dynamic hacia componentes
 * pesados (three.js, etc.). Mantiene el code-splitting intacto.
 */
import { LAB_COMPONENTS } from './_components.generated';

export { LAB_COMPONENTS };
