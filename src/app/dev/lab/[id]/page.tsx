/**
 * /dev/lab/<id> — SOLO DESARROLLO. Monta el mismo SimuladorClient que
 * /alumno/simulador/<id>, pero sin la puerta de login, para que la sonda de
 * Playwright (scripts/auditoria/sonda-labs-base.mjs) pueda abrir y fotografiar
 * los labs base en local. Sin usuario en el store no se escribe nada en
 * Supabase. En producción responde 404.
 */
import { notFound } from 'next/navigation';
import SimuladorClient from '@/app/alumno/simulador/[id]/SimuladorClient';

export const dynamic = 'force-dynamic';

export default async function LabDev({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { id } = await params;
  return <SimuladorClient simuladorId={id} />;
}
