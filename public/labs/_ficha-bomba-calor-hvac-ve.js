/* Ficha técnica · Climatización y bomba de calor del vehículo eléctrico — contenido específico del lab */
fichaTecnica({
  title: 'Climatización y bomba de calor del vehículo eléctrico',
  intro: 'Este laboratorio representa el <b>circuito de refrigerante de un coche eléctrico</b> en corte: compresor eléctrico de espiral con su motor e inversor, bobina de la cabina dentro de su conducto con soplador, válvula de expansión electrónica y bobina exterior con su ventilador, junto a la cabina, el paquete de baterías y un calentador resistivo (PTC) de comparación. El mismo circuito calienta (bomba de calor) o enfría (aire acondicionado, con el flujo invertido). Lo que se mueve, se colorea y se calcula sale de un modelo verificado contra las tablas de NIST; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el compresor de espiral con carcasa, estátor de chapas con cabezas de bobina de cobre, rotor con imanes, espirales fija y orbitante e inversor integrado con su cable trifásico; la bobina de la cabina y la exterior, ambas con tubos en serpentín y paquete de aletas cortado por la mitad; el soplador de la cabina, el ventilador exterior, la válvula de expansión con su actuador, el calentador PTC, la cabina con ocupante y el paquete de baterías con su placa fría. El refrigerante va coloreado por fase y sus partículas siguen el mismo reloj que el punto del diagrama p–h.',
    omitidos: [
      '<b>Válvula de cuatro vías y válvulas de retención</b>: para pasar de calefacción a refrigeración se invierte el sentido del flujo en el mismo trazado.',
      '<b>Acumulador, deshidratador, separador de aceite y aceite del compresor</b>.',
      '<b>Escarcha y ciclo de deshielo</b> en la bobina exterior: sólo aparecen como avería del diagnóstico.',
      '<b>Chiller y circuito de refrigerante líquido de la batería</b>: la batería se dibuja, pero no intercambia calor en el modelo.',
      '<b>Humedad del aire</b> (calor latente y deshumidificación) y el recalentamiento de la cabina por mezcla de aire fresco.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Un circuito de A/C real trabaja a presiones de <b>12 a 20 bar</b> y su refrigerante puede <b>causar congelación en la piel</b> y desplazar el oxígeno. Se recupera con equipo homologado y personal certificado. Los valores son didácticos, no los de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Refrigerante', 'R134a: T<sub>c</sub>, P<sub>c</sub>, ω', '374,21 K · 4,059 MPa · 0,3268'],
      ['Ecuación de estado', 'Peng–Robinson, α de Soave', 'κ = 0,37464 + 1,54226ω − 0,26992ω²'],
      ['cp del gas ideal', 'polinomio de libro, J/(mol·K)', '19,4006 + 0,258531·T − 1,29665·10⁻⁴·T²'],
      ['Referencia de entalpía', 'IIR', 'h = 200 kJ/kg y s = 1 kJ/(kg·K), líquido saturado a 0 °C'],
      ['p<sub>sat</sub>(0 °C) y p<sub>sat</sub>(50 °C)', 'motor frente a NIST', '0,2918 y 1,3207 MPa (0,2928 y 1,3179)'],
      ['Error máximo, −30…60 °C', 'p<sub>sat</sub>, h<sub>g</sub>, h<sub>fg</sub>, s<sub>g</sub>', '0,4 % · 1,4 % · 2,4 % · 1,0 %'],
      ['Compresor', 'cilindrada y régimen máximo', '34 cm³ · 9 000 rpm'],
      ['Rendimientos', 'η<sub>is</sub> máx. en r<sub>p</sub> = 3,4 · motor · inversor', '0,72 − 0,14·ln²(r<sub>p</sub>/3,4) · 0,92 · 0,96'],
      ['Cabina', 'pérdidas, ocupante, consigna', '100 W/K · 100 W · 22 °C'],
      ['Vehículo', 'masa, C<sub>rr</sub>, C<sub>d</sub>A, η, batería útil', '1 850 kg · 0,010 · 0,62 m² · 0,88 · 55,8 kWh'],
      ['Punto de referencia', '−10 °C, aire ×1, subenf. 5 K', 'COP 1,93 · 1,60 kW · 4 308 rpm · 99 °C']
    ]
  },
  s3: [
    'Manómetros de alta y baja presión, y termómetros de contacto en las tuberías, para medir <b>sobrecalentamiento y subenfriamiento</b>.',
    'Equipo de recuperación y carga de refrigerante, báscula y detector de fugas.',
    'Escáner del vehículo para leer la presión del circuito, la velocidad del compresor y las temperaturas de las bobinas.',
    'Termómetro de rejillas y anemómetro para el caudal y la temperatura del aire de salida.'
  ],
  s4: {
    intro: 'El orden del laboratorio (predicción, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. Un diagnóstico real de la climatización añade:',
    items: [
      'Conectar el juego de manómetros con el sistema parado y en marcha, y comparar las presiones con las de una bomba sana a esa temperatura exterior.',
      'Calcular el sobrecalentamiento a la salida de la bobina evaporadora y el subenfriamiento a la salida de la condensadora.',
      'Buscar fugas con detector electrónico o tinte y comprobar la carga pesando el refrigerante recuperado.',
      'Revisar el estado del filtro de habitáculo, el soplador y la limpieza de las aletas de la bobina exterior.'
    ]
  },
  s5: {
    modela: 'el <b>ciclo ideal-real por compresión de vapor</b> en régimen permanente: propiedades de R134a con la ecuación de estado de <b>Peng–Robinson</b> (saturación por igualdad de fugacidad, entalpía y entropía por funciones de desviación, compresión isentrópica y real con η<sub>is</sub>, expansión isentálpica, COP de calefacción y de refrigeración); los intercambiadores por <b>efectividad–NTU</b> con UA ∝ caudal<sup>0,6</sup> y ventiladores con potencia ∝ caudal³; el compresor con rendimiento volumétrico por espacio muerto, régimen máximo y temperatura de descarga límite; el calor que pide la cabina, la comparación con el calentador resistivo y la <b>autonomía</b> a velocidad constante con F = m·g·C<sub>rr</sub> + ½ρC<sub>d</sub>Av². Se comprueba contra las tablas de NIST, la relación de Clapeyron, el balance de energía del ciclo y un barrido numérico del óptimo del reto.',
    noModela: 'la <b>dinámica</b> del calentamiento de la cabina, la <b>caída de presión</b> en tuberías y bobinas, el sobrecalentamiento real del evaporador ni la <b>distribución</b> de líquido y vapor dentro de la bobina; tampoco el <b>aceite</b>, la humedad ni la escarcha. Peng–Robinson sin traslación de volumen subestima la densidad del líquido (hasta un 6 %) y deja las entalpías de vapor hasta un 1,4 % por encima de NIST, y su Z crítico (0,307) no es el real del R134a (0,26). El cp ideal es un polinomio de libro; el R134a no es el refrigerante de los coches nuevos (R1234yf, R744). La zona de subenfriamiento (+0,043·sc² K) y los rendimientos del compresor son <b>correlaciones didácticas</b>, igual que los umbrales del reto. Los giros visuales van a 1/40 del real. No es CFD, FEM ni una certificación.'
  },
  s6: [
    'Peng y Robinson, <i>A New Two-Constant Equation of State</i> (Industrial & Engineering Chemistry Fundamentals, 1976).',
    'Poling, Prausnitz y O\'Connell, <i>The Properties of Gases and Liquids</i> (coeficientes de cp ideal).',
    'Tillner-Roth y Baehr (1994) y NIST Chemistry WebBook, propiedades saturadas del R134a (estado de referencia IIR).',
    'Çengel y Boles, <i>Termodinámica</i>, capítulo del ciclo de refrigeración por compresión de vapor.',
    'Guzzella y Sciarretta, <i>Vehicle Propulsion Systems</i>, para la ecuación de carga de ruta.'
  ]
});
