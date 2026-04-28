"use client";

import dynamic from 'next/dynamic';

const PlaneamientoContent = dynamic(() => import('@/components/PlaneamientoContent'), { 
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-dash-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">
          Cargando Planeamientos...
        </p>
      </div>
    </div>
  )
});

export default function PlaneamientoPage() {
  return <PlaneamientoContent />;
}
