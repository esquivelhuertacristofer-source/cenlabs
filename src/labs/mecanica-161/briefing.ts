import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-161",
  titulo: "Faros matriciales adaptativos: ver mucho sin deslumbrar",
  subtitulo: "Autotrónica",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Controlas los faros del coche para iluminar bien el camino sin deslumbrar al que viene de frente.\nDe noche, las luces altas te dejan ver al peatón de lejos, pero le quitan la vista al conductor del coche que se acerca.\nUn faro matricial está hecho de muchos LED. Una cámara ve al coche que viene y apaga sólo los LED que lo apuntan, así queda una zona oscura que lo sigue.\nTu trabajo: calcular hasta dónde llega la luz, elegir cuántos LED, qué tan ancha es la zona oscura y qué tan fuerte es la luz, y comprobar que el peatón se ve y que nadie sale deslumbrado.`,
  conceptos: [
    { icono: '💡', nombre: 'La luz se acaba con la distancia', descripcion: 'La luz que llega a un punto baja con el cuadrado de la distancia: al doble de lejos llega cuatro veces menos. Por eso las luces bajas sólo alcanzan unas decenas de metros.' },
    { icono: '🚗', nombre: 'La zona oscura', descripcion: 'La cámara ve al coche que viene y se apagan los LED que lo apuntan. Como la cámara tarda, la zona oscura necesita un margen; si el margen es muy ancho, se apaga también al peatón.' },
    { icono: '🌧️', nombre: 'Clima, ropa y curvas', descripcion: 'La lluvia apaga la luz, la ropa oscura necesita más luz para verse y en una curva el peatón queda fuera del centro del haz si el faro no gira con el volante.' },
  ],
  mision: [
    'Calcula hasta dónde llega un faro o cuántos grados ocupa el coche que viene.',
    'Elige cuántos LED, el margen y la fuerza de la luz para ver al peatón sin deslumbrar al otro conductor.',
    'Diagnostica por qué falla otro faro: cámara lenta, LED muy gruesos, luz débil o zona oscura sin margen.',
  ],
  aplicaciones: [
    { area: 'Alumbrado adaptativo', ejemplo: 'Los faros matriciales de los coches actuales mantienen las luces altas encendidas y recortan la luz alrededor de los otros vehículos.' },
    { area: 'Seguridad vial nocturna', ejemplo: 'Ver antes a un peatón o a un ciclista de ropa oscura, que con luces bajas aparece demasiado tarde para frenar.' },
    { area: 'Visión por computadora', ejemplo: 'La cámara que detecta vehículos, motos y señales decide qué segmentos apagar; su retraso fija el margen necesario.' },
  ],
};

export default briefing;
