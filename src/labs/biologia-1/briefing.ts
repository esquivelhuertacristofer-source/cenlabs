import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'BIO-01',
    titulo: 'Microscopio Virtual',
    subtitulo: 'Límites de Resolución y Citología',
    acento: '#10b981',
    duracion: 30,
    videoUrl: 'https://youtu.be/1elp96ecPGY',
    bienvenida: `¡Bienvenido al Laboratorio de Óptica! Soy el Dr. Quantum. Hoy dominaremos la física de la luz para ver lo invisible.\n\nEn biología, hacer zoom no sirve de nada si pierdes la resolución. Aprenderás por qué el Límite de Abbe es la ley máxima.\n\nTu misión: Configurar el microscopio para ver orgánulos celulares.`,
    conceptos: [
      { icono: '🔬', nombre: 'Resolución', descripcion: 'Distancia mínima para ver dos puntos separados.' },
      { icono: '👁️', nombre: 'Apertura (NA)', descripcion: 'Capacidad del lente para captar luz.' },
      { icono: '🎯', nombre: 'Magnificación', descripcion: 'Aumento total (Ocular x Objetivo).' },
      { icono: '⚙️', nombre: 'Focales', descripcion: 'Tornillos Macro y Micro para ajuste de nitidez.' }
    ],
    mision: [
      'Inicia con 4x para localizar la muestra.',
      'Pasa a 40x y usa solo el tornillo micrométrico.',
      'Calcula la magnificación total.',
      'Aplica la fórmula de resolución de Abbe.',
      'Captura la micrografía validada.'
    ],
    aplicaciones: [
      { area: 'Oncología', ejemplo: 'Detección de células cancerígenas en tejidos.' },
      { area: 'Forense', ejemplo: 'Identificación de bacterias en escenas del crimen.' },
      { area: 'Botánica', ejemplo: 'Estudio de estomas y cloroplastos en hojas.' }
    ]
  };

export default briefing;
