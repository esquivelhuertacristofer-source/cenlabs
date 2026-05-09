import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CEN Labs - Laboratorios Virtuales',
    short_name: 'CEN Labs',
    description: 'Plataforma de simulación de laboratorios de ciencias de alto nivel.',
    start_url: '/alumno/laboratorio/quimica',
    display: 'standalone',
    background_color: '#023047',
    theme_color: '#023047',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
}
