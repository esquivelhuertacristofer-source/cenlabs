"use client";

/**
 * src/components/simulador/LabRegistry.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Facade cliente de los componentes de lab. Deriva PILOTO_REGISTRY /
 * BITACORA_REGISTRY del registro autogenerado LAB_COMPONENTS (cada lab define
 * su Piloto/Bitácora en src/labs/<id>/components.ts). El spinner de carga vive
 * en src/labs/_loader.tsx.
 *
 * mecánica es bespoke (iframe HTML + BitacoraMecanica compartida) y NO aparece
 * aquí ni en el registro de componentes.
 */
import { LAB_COMPONENTS } from '@/labs/_components';

export const PILOTO_REGISTRY: Record<string, any> = Object.fromEntries(
  Object.entries(LAB_COMPONENTS).map(([id, c]) => [id, c.Piloto])
);

export const BITACORA_REGISTRY: Record<string, any> = Object.fromEntries(
  Object.entries(LAB_COMPONENTS).map(([id, c]) => [id, c.Bitacora])
);
