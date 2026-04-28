import SimuladorClient from './SimuladorClient';

export default async function SimuladorPage({ params }: { params: Promise<{ id: string }> }) {
  // Resolvemos los parámetros dinámicos de la ruta de Next.js 15+ de forma segura
  const resolvedParams = await params;
  
  return <SimuladorClient simuladorId={resolvedParams.id} />;
}
