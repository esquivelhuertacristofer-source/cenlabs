import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-144",
  titulo: "Postratamiento SCR con AdBlue: NOx, dosificación y amoníaco residual",
  subtitulo: "Autotrónica · cuánto AdBlue inyectar para limpiar el humo de un diésel",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Controlas cuánto líquido AdBlue inyectas para limpiar el humo de un diésel. Al abrir el laboratorio ya está funcionando: el motor suelta un gas dañino, el NOx (puntos rojos), y un recorrido de seis pasos te lo explica sin siglas sin definir.

El AdBlue es agua con urea. Se rocía en el escape, el calor lo convierte en amoníaco y el catalizador lo guarda en sus paredes (se pintan de azul) y lo hace reaccionar con el NOx hasta dejar nitrógeno y agua.

Pero hay que acertar: si inyectas poco, el NOx pasa; si inyectas mucho, sobra amoníaco y se escapa; y si el escape está frío, la urea se pega en cristales.

Tu misión es hallar el ajuste que deja salir poco NOx y poco amoníaco sin gastar de más. La respuesta no está escrita: sale de la física, y no está en los extremos.`,
  conceptos: [
    { icono: '🔴', nombre: 'NOx', descripcion: 'Óxidos de nitrógeno que suelta un motor diésel. Irritan los pulmones y forman smog; por eso se limpian antes de salir al aire.' },
    { icono: '💧', nombre: 'AdBlue', descripcion: 'Agua con urea al 32,5 %. No es combustible: se rocía en el escape y, con calor, se vuelve amoníaco.' },
    { icono: '🔵', nombre: 'Amoníaco guardado', descripcion: 'El catalizador guarda amoníaco en sus paredes. Cuanto más caliente está, menos puede guardar, y si sobra se escapa por el tubo.' },
    { icono: '🌡️', nombre: 'Ventana de temperatura', descripcion: 'El catalizador sólo limpia bien en un rango de temperatura: muy frío la urea cristaliza, muy caliente el amoníaco se quema.' },
  ],
  mision: [
    'Sigue el recorrido paso a paso: el humo sucio, el AdBlue, el amoníaco, el catalizador y la salida.',
    'En «Probar», mueve la dosis y la temperatura mínima para inyectar, y mira cómo cambian el NOx y el amoníaco que salen.',
    'En el reto, calcula los litros de AdBlue por hora y luego ajusta dosis, temperatura y calentamiento para cumplir el límite de NOx sin pasarte de amoníaco.',
    'Diagnostica una falla por sus lecturas y contesta la pregunta de cierre.',
  ],
  aplicaciones: [
    { area: 'Automoción y transporte', ejemplo: 'Los camiones, autobuses y muchos coches diésel modernos llevan SCR con AdBlue para cumplir las normas Euro VI.' },
    { area: 'Taller y diagnóstico', ejemplo: 'Si el testigo de AdBlue se enciende, lo común es un inyector tapado por cristales, una urea de mala calidad o un catalizador envejecido.' },
  ],
};

export default briefing;
