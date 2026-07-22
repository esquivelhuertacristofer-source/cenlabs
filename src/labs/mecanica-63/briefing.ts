import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-63',
  titulo: 'Máxima Transferencia de Potencia',
  subtitulo: 'Circuitos Eléctricos · Optimización de carga',
  acento: '#2A9D8F',
  duracion: 35,
  videoUrl: '',
  bienvenida: `Ya sabes reducir cualquier caja negra a su equivalente de Thévenin: un voltaje Vth en serie con una resistencia Rth. Ahora viene la pregunta que realmente le importa a un ingeniero de diseño: si tú eliges el valor de la carga que conectas a esa fuente, ¿qué valor de RL hace que la carga reciba la MAYOR potencia posible?

La intuición engaña aquí. Uno podría pensar que una carga muy pequeña (casi un cortocircuito) recibe más potencia porque "deja pasar más corriente", o que una carga muy grande recibe más porque "toma casi todo el voltaje". Ambas intuiciones son incorrectas: con RL→0 el voltaje sobre la carga se desploma a cero: P=I²RL→0. Con RL→∞ la corriente se desploma a cero: P=V²/RL→0. En algún punto intermedio hay un máximo — y ese punto es exactamente RL = Rth, ni un ohm más ni uno menos.

En este banco reutilizas el mismo motor de análisis nodal (MNA) y el mismo elemento amperímetro ideal de tu laboratorio de Thévenin/Norton para explorar esa curva de potencia en vivo: barres distintos valores de RL sobre una red fija, grafica P(RL) y observa cómo se dobla la curva alrededor de su pico. Después mides simultáneamente la potencia entregada a la carga y la potencia total que entrega la fuente, y descubres el dato que sorprende a la mayoría: en el punto de máxima potencia transferida, la eficiencia es de solo 50 % — la mitad de la energía se disipa dentro de la propia fuente. Maximizar potencia y maximizar eficiencia son objetivos distintos, y a veces opuestos. Y en el reto final, caracterizas una caja negra sellada por el método experimental de Voc/Isc y predices el valor exacto de RL que maximizaría la transferencia, sin ver jamás los componentes internos.`,
  conceptos: [
    { icono: '📈', nombre: 'Curva de potencia P(RL)', descripcion: 'La potencia entregada a una carga, P(RL) = Vth²·RL/(RL+Rth)², crece desde cero, alcanza un único máximo y vuelve a caer a cero — nunca es monótona en RL.' },
    { icono: '🎯', nombre: 'Condición de máxima transferencia', descripcion: 'El máximo de P(RL) ocurre exactamente cuando RL = Rth (se demuestra igualando dP/dRL = 0). En ese punto, Pmáx = Vth²/(4·Rth).' },
    { icono: '⚖️', nombre: 'Potencia vs. eficiencia', descripcion: 'En el punto de máxima potencia (RL=Rth), la corriente que fluye disipa tanta energía en Rth como en RL: la eficiencia η = RL/(RL+Rth) vale exactamente 50 %. Para alta eficiencia se necesita RL >> Rth, a costa de entregar menos potencia total.' },
    { icono: '🔌', nombre: 'Acoplamiento de impedancias', descripcion: 'Elegir RL = Rth para maximizar potencia se llama "acoplar" la carga a la fuente — un criterio de diseño distinto (y a veces contrario) al de maximizar el voltaje o la eficiencia entregados a esa misma carga.' },
  ],
  mision: [
    'EXPLORA · Sobre una red fija con Rth conocida, barre distintos valores de RL, observa la curva P(RL) trazada en vivo y verifica que el pico medido coincide con RL = Rth y con Pmáx = Vth²/(4·Rth).',
    'EFICIENCIA · Para cada RL que pruebes, compara la potencia entregada a la carga contra la potencia total entregada por la fuente y confirma que η = 50 % exactamente en el punto de máxima potencia — y que se puede alcanzar eficiencia mayor solo entregando menos potencia.',
    'RETO · Caja negra real: mide Voc e Isc en las terminales, calcula Vth y Rth por el método experimental, y predice el valor de RL que maximizaría la transferencia de potencia — el mismo procedimiento que un ingeniero aplica antes de acoplar una carga a una fuente desconocida.',
  ],
  aplicaciones: [
    { area: 'Sistemas de audio', ejemplo: 'Un amplificador con salida de 8 Ω entrega su máxima potencia a una bocina de 8 Ω — por eso las bocinas se venden clasificadas por impedancia, no por potencia únicamente.' },
    { area: 'Antenas y líneas de transmisión de RF', ejemplo: 'Un transmisor de radio se diseña para que la impedancia de la antena "acople" con la impedancia de salida del transmisor (típicamente 50 Ω); un desacople reduce drásticamente la potencia radiada.' },
    { area: 'Paneles solares y captación de energía', ejemplo: 'Los controladores de carga con MPPT (Maximum Power Point Tracking) ajustan continuamente su resistencia de entrada efectiva para igualarla a la resistencia interna del panel bajo la luz solar del momento, maximizando la energía cosechada — el mismo principio de este laboratorio, aplicado en tiempo real.' },
  ],
};

export default briefing;
