/**
 * /dev/muestrario-3d — SOLO DESARROLLO. Vitrina del kit 3D compartido
 * (src/components/simuladores/_kit). La fotografía scripts/auditoria/muestrario-kit.mjs.
 *   ?s=<seccion>&calidad=alta|media
 * En producción responde 404.
 */
import { notFound } from 'next/navigation';
import MuestrarioCliente from './MuestrarioCliente';

export const dynamic = 'force-dynamic';

export default async function Muestrario3D({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const sp = await searchParams;
  return <MuestrarioCliente seccionInicial={sp.s ?? 'quimica'} calidadInicial={sp.calidad === 'media' ? 'media' : 'alta'} pieza={sp.p} foto={sp.foto === '1'} />;
}
