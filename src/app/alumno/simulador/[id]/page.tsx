import { Metadata } from 'next';
import SimuladorClient from './SimuladorClient';
import { ALL_BRIEFING_CONFIGS } from '@/data/briefingConfigs';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const config = ALL_BRIEFING_CONFIGS[resolvedParams.id];
  
  if (!config) return { title: "Simulador | CEN Labs" };

  return {
    title: `Lab: ${config.titulo} | CEN Labs`,
    description: config.subtitulo || config.bienvenida.substring(0, 160),
    openGraph: {
      title: `Simulador Virtual: ${config.titulo}`,
      description: `Inicia la práctica de ${config.titulo} en el ecosistema 2.5D de CEN Labs.`,
      images: [`/images/${resolvedParams.id.split('-')[0]}_3d.png`],
    }
  };
}

export default async function SimuladorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <SimuladorClient simuladorId={resolvedParams.id} />;
}
