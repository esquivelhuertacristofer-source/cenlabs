/* Ficha técnica — Circuito equivalente del motor de inducción por ensayos (CD, vacío, rotor bloqueado) */
fichaTecnica({
  title: 'Circuito equivalente del motor de inducción: ensayos de CD, vacío y rotor bloqueado (IEEE 112)',
  intro: 'El modelo arma un banco de ensayos para un <b>motor de inducción trifásico jaula de ardilla</b> y reproduce, en secuencia, los tres ensayos clásicos que la norma IEEE Std 112 define para obtener los parámetros del circuito equivalente en T por fase: el ensayo de <b>corriente directa (CD)</b> para la resistencia de estátor R1, el ensayo de <b>vacío</b> para la rama de magnetización y las pérdidas rotacionales, y el ensayo de <b>rotor bloqueado</b> (a frecuencia reducida) para las reactancias de dispersión X1/X2\' y la resistencia referida de rotor R2\'. Con los tres ensayos completos, el lab arma el circuito equivalente completo, calcula el equivalente de Thévenin visto desde el entrehierro y traza la curva par-deslizamiento resultante, incluyendo el par de arranque y el par máximo (breakdown torque).',
  s1: {
    presentes: 'Motor de inducción de banco (carcasa, tapas, eje y polea, reutilizando el modelo de motor de d5-05/d5-06); fuente de ensayo con instrumentos digitales de voltaje, corriente y potencia trifásica; dial de selección de ensayo ligado a los cuatro casos (CD, vacío, rotor bloqueado, circuito equivalente); cableado de banco; y un tablero-pizarrón que dibuja el circuito equivalente en T con sus valores calculados y, en el último caso, la curva de par contra deslizamiento con el punto de arranque y el punto de par máximo marcados.',
    omitidos: [
      '<b>Corrección por temperatura del devanado (§5.2.1 IEEE 112)</b>: la norma exige corregir la resistencia de CD medida en frío a la temperatura de operación del devanado (o repetir el ensayo con la máquina caliente); el simulador usa la lectura de banco tal cual, sin esa corrección.',
      '<b>Dependencia de R2\' con la frecuencia de deslizamiento (efecto piel en las barras del rotor)</b>: en motores de doble jaula o barra profunda, la resistencia efectiva del rotor cambia con el deslizamiento porque la corriente se redistribuye hacia la superficie de la barra a alto deslizamiento; el modelo trata R2\' como una sola constante obtenida del ensayo de rotor bloqueado, válida para el diseño NEMA B estándar que asume aquí.',
      '<b>Saturación de la reactancia de magnetización Xm con la tensión aplicada</b>: en un motor real, Xm no es estrictamente constante — cae si el núcleo se satura a tensiones por encima de la nominal; el simulador calcula Xm una sola vez a partir del ensayo de vacío a tensión nominal y la mantiene fija en el resto de los cálculos.',
      '<b>Temporizador y protecciones del banco real</b>: relevador térmico, enclavamientos de seguridad para bloquear el rotor mecánicamente durante el ensayo de rotor bloqueado; no participan en el cálculo de los parámetros del circuito equivalente y se omiten para no saturar el ensamble con piezas sin efecto en la física mostrada.',
    ],
  },
  s2: {
    title: 'Ecuaciones de los tres ensayos y del circuito equivalente (IEEE Std 112)',
    warn: 'Vf = tensión de fase (Y). Los cuatro ensayos se muestran con lecturas de referencia fijas del simulador (⚑ ver §6), no de un datasheet de fabricante.',
    rows: [
      ['Ensayo', 'Cláusula', 'Fórmula', 'Nota'],
      ['CD (estátor)', '§5.4', 'R1 = Rlínea-línea / 2', 'conexión Y; sin corrección por temperatura (ver §1, omitidos)'],
      ['Vacío', '§5.7', 'Znl=Vf/Inl · Rnl=(P3/3)/Inl² · Xnl=√(Znl²−Rnl²) · Prot=Pnl3−3·Inl²·R1', 'separa pérdidas rotacionales (fricción+ventilación+núcleo) de las de cobre del estátor'],
      ['Rotor bloqueado', '§5.9.1', 'Zbl=Vf/Ibl · Rbl=(P3/3)/Ibl² · Xbl(ftest)=√(Zbl²−Rbl²) · Xbl(fn)=(fn/ftest)·Xbl(ftest)', 'ensayo a frecuencia reducida para no forzar corriente/par excesivos con el rotor detenido; la reactancia se corrige a la frecuencia nominal'],
      ['Circuito equivalente', '§5.9.2.2', 'X1=0.4·Xbl(fn) · X2\'=0.6·Xbl(fn) (reparto NEMA diseño B) · Xm=Xnl−X1 · R2\'=Rbl−R1', 'Xm cuelga después de R1+jX1 en la topología en T (no antes, a diferencia de la aproximación de transformador de d5-02)'],
      ['Thévenin y par-deslizamiento', '—', 'Zth=jXm(R1+jX1)/(R1+j(X1+Xm)) · Vth=V1·jXm/(R1+j(X1+Xm)) · sMaxT=R2\'/√(Rth²+(Xth+X2\')²)', 'ns=120·f/polos (rpm); T(s) se evalúa con el circuito de Thévenin visto desde el entrehierro'],
    ],
  },
  s3: [
    'Motor de inducción de banco con datos de placa conocidos — sustituido aquí por las lecturas ilustrativas del simulador (ver §6).',
    'Fuente de CD regulada con amperímetro y voltímetro de CD, para el ensayo de resistencia de estátor.',
    'Autotransformador trifásico variable (variac) para ajustar la tensión aplicada en los ensayos de vacío y de rotor bloqueado.',
    'Vatímetros (método de dos vatímetros) o analizador de potencia trifásico, para las lecturas de potencia de los tres ensayos de CA.',
    'Medio de bloqueo mecánico del rotor (freno, cuña o acoplamiento fijo) y, de ser necesario, fuente de frecuencia variable para ensayar el rotor bloqueado por debajo de la frecuencia nominal, según §5.9.1.',
  ],
  s4: {
    intro: 'El lab reduce cada ensayo a la aplicación instantánea de su fórmula sobre una lectura de referencia fija. Un ensayo de banco real involucra ajustar el variac hasta el punto de ensayo y vigilar límites térmicos mientras se toman las lecturas.',
    items: [
      'Ajuste manual de tensión con el autotransformador hasta alcanzar el punto de ensayo (p. ej. corriente nominal en rotor bloqueado): el modelo usa una sola lectura fija de referencia por ensayo en vez del barrido real que permite verificar linealidad y descartar errores de lectura.',
      'Bloqueo mecánico real del rotor durante el ensayo de rotor bloqueado, realizado con rapidez (segundos) para no sobrecalentar el devanado con corriente cercana a la nominal y el rotor sin ventilación propia: el modelo asume el rotor detenido de forma instantánea, sin ese límite de tiempo.',
      'Corrección por temperatura del devanado tras el ensayo de CD (§5.2.1): el modelo usa el valor de referencia sin esta corrección, ya señalado en §1 como omisión explícita.',
      'Verificación de que el rotor acelera y llega a velocidad nominal a partir del par de arranque calculado: el modelo entrega la curva par-deslizamiento estática completa, pero no simula la aceleración del rotor en el tiempo (esa dinámica es el objeto de la curva par-velocidad de d5-06).',
    ],
  },
  s5: {
    modela: 'el método de tres ensayos de IEEE Std 112 para obtener el circuito equivalente en T de un motor de inducción: resistencia de estátor por CD (§5.4), separación de pérdidas rotacionales y rama de magnetización por el ensayo de vacío (§5.7), reactancias de dispersión y resistencia de rotor referida por el ensayo de rotor bloqueado a frecuencia reducida con corrección a la frecuencia nominal (§5.9.1); el reparto de reactancia de dispersión X1=0.4·Xbl / X2\'=0.6·Xbl propio del diseño NEMA B (§5.9.2.2); la topología en T correcta, con la rama de magnetización jXm después de la rama serie del estátor (R1+jX1), a diferencia de la aproximación simplificada de transformador usada en d5-02; y el equivalente de Thévenin visto desde el entrehierro junto con la curva par-deslizamiento completa, incluyendo el par de arranque y la ubicación exacta del par máximo (breakdown torque).',
    noModela: 'la corrección por temperatura del devanado (§5.2.1); la dependencia de la resistencia de rotor R2\' con la frecuencia de deslizamiento por efecto piel en las barras (relevante en motores de doble jaula o barra profunda); la saturación de la reactancia de magnetización Xm con la tensión aplicada; los límites térmicos de tiempo del ensayo de rotor bloqueado real; ni la aceleración del rotor en el tiempo bajo el par calculado (el modelo evalúa la curva par-deslizamiento en régimen estático, no la rampa dinámica hasta velocidad nominal, que es el objeto de d5-06).',
  },
  s6: [
    '⚑ Las lecturas de referencia de los tres ensayos (CD: Rlínea-línea=0.612 Ω; vacío: 230 V / 8.2 A / 640 W; rotor bloqueado a 15 Hz: 44.5 V / 27.6 A / 1650 W) son valores <b>ilustrativos del simulador</b> para un motor de 4 polos, consistentes en orden de magnitud con un motor de inducción trifásico pequeño-mediano, pero no corresponden a la placa de un motor comercial específico; no deben citarse como dato de fabricante.',
    '⚑ Referencia normativa: IEEE Std 112 (Standard Test Procedure for Polyphase Induction Motors and Generators) — cláusulas §5.4 (ensayo de CD), §5.7 (ensayo de vacío), §5.9.1 (ensayo de rotor bloqueado a frecuencia reducida) y §5.9.2.2 (reparto de reactancia de fuga por diseño NEMA). El texto exacto de estas cláusulas no ha sido verificado palabra por palabra por un experto revisor; se citan como referencia general del método.',
    'El reparto de reactancia de dispersión X1=0.4·Xbl / X2\'=0.6·Xbl sigue la convención NEMA de diseño B; es una de varias convenciones de reparto aceptadas por la norma según la clase de diseño del motor (diseño A: 0.5/0.5; diseño B: 0.4/0.6; diseño C: 0.3/0.7) y se declara aquí explícitamente como supuesto de diseño, no como medición.',
    'Referencia curricular: programas EM-IV y ELE-III (máquinas eléctricas — motor de inducción), según la lista maestra de esta práctica.',
  ],
});
