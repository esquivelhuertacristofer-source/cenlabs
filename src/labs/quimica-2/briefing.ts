import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'QMI-02',
    titulo: 'Leyes de los Gases Ideales',
    subtitulo: 'Cinética Molecular y Termodinámica',
    acento: '#219EBC',
    duracion: 40,
    videoUrl: 'https://youtu.be/ooLnSYsMcZA',
    bienvenida: `¡Bienvenido al Laboratorio de Termodinámica! Soy el Dr. Quantum y hoy vamos a explorar cómo la energía térmica se traduce en presión.\n\nManipularemos el volumen, la temperatura y la cantidad de sustancia para validar la Ley Universal de los Gases (PV=nRT).\n\nTu misión: estabilizar la cámara en la presión objetivo sin exceder el límite de seguridad de 7.0 atm. ¡El borosilicato tiene sus límites!`,
    conceptos: [
      { icono: '🌡️', nombre: 'Temperatura (T)', descripcion: 'Energía cinética promedio de las moléculas (en Kelvin).' },
      { icono: '📦', nombre: 'Volumen (V)', descripcion: 'Espacio disponible para las partículas.' },
      { icono: '⚖️', nombre: 'Materia (n)', descripcion: 'Cantidad de sustancia en moles.' },
      { icono: '⚡', nombre: 'Presión (P)', descripcion: 'Fuerza de choque contra las paredes del contenedor.' },
      { icono: '🧊', nombre: 'Ley de Boyle', descripcion: 'Relación inversa entre P y V a T constante.' },
      { icono: '⚠️', nombre: 'Punto de Colapso', descripcion: 'Límite estructural del contenedor (7 atm).' }
    ],
    mision: [
      'Ajusta la TEMPERATURA para ver la velocidad molecular.',
      'Manipula el VOLUMEN y verifica la Ley de Boyle.',
      'Usa el control de MOLES para ver cómo afecta la densidad.',
      'Logra la PRESIÓN OBJETIVO indicada.',
      'Registra 3 hallazgos en tu Bitácora.'
    ],
    aplicaciones: [
      { area: 'Ingeniería Aeroespacial', ejemplo: 'Control de presión en tanques de combustible criogénico.' },
      { area: 'Medicina', ejemplo: 'Regulación de presión en ventiladores mecánicos.' },
      { area: 'Buceo', ejemplo: 'Efectos de la presión en la solubilidad de gases en la sangre.' }
    ]
  };

export default briefing;
