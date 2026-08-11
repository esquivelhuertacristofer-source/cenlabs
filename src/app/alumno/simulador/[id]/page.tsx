import { Metadata } from 'next';
import SimuladorClient from './SimuladorClient';
import MecanicaShellClient from './MecanicaShellClient';
import { BRIEFING_META } from '@/labs/_briefing-meta';

export const dynamic = 'force-dynamic';

// El briefing completo ya no vive en el servidor: se publica como activo estático
// y lo pide el cliente (ver @/data/briefingConfigs). Pero el <head> tiene que salir
// en el HTML que devuelve el worker, así que de los 823 KB de prosa se queda con
// los tres campos que se imprimen aquí — unos 40 KB. La descripción se compone
// exactamente igual que antes: `subtitulo` y, si está vacío, los primeros 160
// caracteres de `bienvenida` (el codegen ya guarda ese recorte).
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const config = BRIEFING_META[resolvedParams.id];

  if (!config) return { title: "Simulador | CEN Labs" };

  return {
    title: `Lab: ${config.titulo} | CEN Labs`,
    description: config.subtitulo || config.bienvenidaCorta,
    openGraph: {
      title: `Simulador Virtual: ${config.titulo}`,
      description: `Inicia la práctica de ${config.titulo} en el ecosistema 2.5D de CEN Labs.`,
      images: [`/images/${resolvedParams.id.split('-')[0]}_3d.webp`],
    }
  };
}

export default async function SimuladorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  // Los labs de Mecánica e Ingeniería son experiencias 3D autónomas (three.js)
  // que se embeben a pantalla completa con su propio shell dedicado.
  if (resolvedParams.id.startsWith('mecanica-')) {
    return <MecanicaShellClient simuladorId={resolvedParams.id} />;
  }

  return <SimuladorClient simuladorId={resolvedParams.id} />;
}
