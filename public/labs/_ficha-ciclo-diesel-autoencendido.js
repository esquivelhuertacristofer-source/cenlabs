fichaTecnica({
  title: 'Ficha técnica · Ciclo Diésel y autoencendido',
  intro:
    'Este laboratorio contrasta tres cosas que suelen confundirse: el ciclo Diésel de los libros, el ciclo Dual que de verdad describe a un motor de inyección directa, y lo que sale por el cigüeñal de un motor concreto. ' +
    '(1) Nadie ordena el encendido. Se inyecta en un ángulo (SOI) y la combustión empieza cuando la integral de Livengood-Wu del retardo de Hardenberg-Hase llega a 1: el laboratorio calcula el retardo, no lo declara. ' +
    '(2) Los tres techos ideales se calculan con el MISMO gamma de aire frío (1,4) y el MISMO calor. En el punto de referencia (urbano, r 16, SOI 10°, 1 800 bar, UBA) valen Otto 67,01 %, Dual 61,91 % y Diésel 58,88 %, mientras el motor da 46,44 % indicado y 38,29 % al freno. La brecha de 28,72 puntos se reparte: 5,10 por quemar a presión constante en vez de a volumen constante, 3,03 más por el reparto real Dual→Diésel, 1,62 por comprimir desde el cierre de admisión y no desde el PMI, 10,83 por la combustión real (Wiebe, calor a las paredes, quemado tardío) y 8,14 de fricción y bombeo. ' +
    '(3) La dosis en masa la fija el combustible, no el banco: los cuatro combustibles liberan exactamente el mismo calor (1 143,6 J) porque la masa se calcula como Qdem/PCI, y sin embargo el B20 inyecta 28,25 mg y el destilado marino 27,06 mg. El más ruidoso es el de menor cetano, no el de más masa. ' +
    '(4) El riel no es lineal: el caudal va con la raíz de la caída de presión. De 600 a 1 800 bar el gasto sube 1,7945 veces, no 3. ' +
    '(5) En frío, la rejilla calienta el AIRE y la compresión multiplica ese calentamiento; la bujía incandescente calienta el SITIO y no se multiplica. Por eso el mismo tractor con la misma rejilla y el mismo combustible no arranca con r 14 (falta 8,0 K) y arranca con r 21 (sobran 98,7 K). ' +
    '(6) Un combustible puede tener el mejor margen térmico y aun así no llegar al inyector: a −20 °C los cuatro superan el umbral de autoencendido y solo el UBA de invierno pasa el CFPP. ' +
    '(7) En las cinco máquinas la calibración de mejor rendimiento NO es firmable, y en las cinco falla siempre por ruido de combustión. ' +
    'Si una cifra de esta ficha no coincide con la del simulador, la ficha está mal.',

  s1: {
    presentes: [
      'Periodo cerrado real IVC (−140°) → EVO (+130°) integrado con Runge-Kutta de 4.º orden a 0,5° de cigüeñal: 540 pasos y 541 puntos por ciclo.',
      'Volumen instantáneo exacto de biela-manivela V(θ) con la longitud de biela real de cada motor, no la aproximación senoidal.',
      'Propiedades del gas variables: cp del aire tabulado en 32 puntos de 200 K a 2 500 K (1 002,5 → 1 274,0 J/kg·K) y gamma de quemados gamma = 1,338 − 6,0e−5·T + 1,0e−8·T², mezclados por fracción de productos.',
      'Retardo de autoencendido de Hardenberg-Hase (1979) con sus constantes originales, INTEGRADO por el criterio de Livengood-Wu: el ángulo de inicio de combustión es un resultado, no una entrada.',
      'Energía de activación dependiente del número de cetano: Ea = 618 840/(CN + 25) J/mol.',
      'Caudal del inyector por Bernoulli a través de los orificios reales (número, diámetro y coeficiente de descarga de cada motor), con la contrapresión del cilindro en el instante de inyección.',
      'Fracción premezclada calculada como la masa realmente inyectada durante el retardo, no leída de una correlación.',
      'Liberación de calor de doble Wiebe con la asimetría del diagrama diésel: el pico premezclado se agota y se corta, la cola de difusión no.',
      'Transferencia de calor a las paredes por la correlación de Woschni con sus dos términos (arrastre y combustión).',
      'Fricción de Chen-Flynn en función de la presión de pico y de la velocidad media del pistón, MÁS el trabajo real de la bomba de inyección.',
      'Bombeo (pmep) por la diferencia entre presión de escape y de admisión.',
      'Gases residuales: se resuelve por punto fijo la temperatura de la mezcla al cierre de admisión y por iteración externa la temperatura de escape, hasta menos de 0,05 K.',
      'Relación de compresión efectiva rEf = V(IVC)/Vc, siempre menor que la geométrica.',
      'Tres techos ideales de aire frío calculados a la vez —Otto, Diésel y Dual (Seiliger)— con el mismo gamma y el mismo calor, y además el techo Diésel recalculado con rEf.',
      'Arranque en frío: politrópica de arrastre con exponente declarado dependiente del régimen y del diámetro, umbral térmico de autoencendido por cetano, y punto de obstrucción de filtro en frío (CFPP).',
      'Dos ayudas de arranque físicamente distintas: rejilla de precalentamiento del aire de admisión (se multiplica con la compresión) y bujía incandescente en cámara (no se multiplica).',
      'Pliego industrial de seis criterios simultáneos: fase de combustión (CA50), ruido (dp/dθ), presión de pico, temperatura en la brida de escape, par mínimo y arranque en frío a la temperatura de homologación.',
      'Coste de combustible a 5 años calculado con la carga anual, el rendimiento al freno, el poder calorífico, la densidad y el precio de cada combustible.',
    ],
    omitidos: [
      'Modelo multizona o de dos zonas: aquí hay una sola zona con propiedades medias. No se separa el gas quemado del sin quemar.',
      'Química detallada de la combustión y de la formación de contaminantes: no se calculan NOx, hollín, CO ni HC. El margen de humo se declara como lectura, no como criterio.',
      'Penetración y atomización del chorro: el chorro dibujado indica qué fracción de la dosis ya salió, no hasta dónde llegó.',
      'Bol en la cabeza del pistón: la corona se dibuja plana porque el motor solo resuelve el equivalente de cámara plana Vc = Vd/(r − 1).',
      'Movimiento del aire dentro del cilindro (swirl, squish, tumble): entra en el modelo únicamente por las constantes de la doble Wiebe y de Woschni.',
      'Dinámica del sistema de inyección: no hay ondas de presión en el riel, ni retardo del inyector, ni inyecciones piloto o posteriores. Un solo pulso.',
      'Sobrealimentación como sistema: la presión y la temperatura de admisión son datos de cada máquina, no salida de un turbo con su mapa.',
      'Cruce de válvulas y barrido: el periodo abierto no se integra; los residuales entran por la fracción calculada al cierre.',
      'Fugas por segmentos durante la carrera de compresión caliente: solo se contabilizan en el arranque, dentro del exponente politrópico declarado.',
      'Transitorios: cada punto es un régimen estacionario. No hay aceleraciones, ni calentamiento del motor, ni deriva térmica.',
      'Desgaste, envejecimiento y ensuciamiento del inyector: la única variable de tiempo es el coste acumulado a 5 años.',
      'Variación cilindro a cilindro y dispersión ciclo a ciclo: el motor es determinista y todos los cilindros son iguales.',
      'Sistema de postratamiento (DOC, DPF, SCR) y su contrapresión.',
      'Vibración estructural y ruido radiado: el acelerómetro del laboratorio mide dp/dθ del gas, que es la excitación, no el ruido que se oye fuera.',
      'Elasticidad mecánica del tren alternativo y esfuerzos en biela y cigüeñal.',
      'Precio real de mercado de los combustibles y de la electricidad: los precios y las cargas anuales son valores de proyecto.',
    ],
  },

  s2: {
    title: 'Constantes selladas, correlaciones y cifras del pliego',
    warn: 'Los precios de combustible, las cargas anuales, las temperaturas de homologación y los límites del pliego son valores de proyecto REPRESENTATIVOS, no medidas de un motor concreto. Las correlaciones sí son las publicadas, con sus constantes originales.',
    rows: [
      ['Concepto', 'Fórmula o criterio', 'Valores sellados', 'Comentario'],

      ['Techo Otto ideal', 'η = 1 − r^(1−γ), γ = 1,4', 'r 14 → 65,20 % · r 16 → 67,01 % · r 21 → 70,41 %', 'Combustión a volumen constante. Es la cota superior de todo y NO la alcanza ningún diésel: quemar así exigiría que toda la dosis estuviera ya mezclada en el PMS.'],
      ['Techo Diésel ideal', 'η = 1 − (1/γ)·r^(1−γ)·(rc^γ − 1)/(rc − 1)', 'Punto de referencia: 58,88 % con rc = 2,539', 'Combustión a presión constante. Cuesta 8,13 puntos frente a Otto con el mismo r y el mismo calor, porque el gas se expande mientras aún se quema.'],
      ['Techo Dual (Seiliger)', 'η = 1 − r^(1−γ)·(α·rc^γ − 1)/((α−1) + γ·α·(rc−1))', 'Punto de referencia: 61,91 % con α = 1,279 y rc = 2,048', 'Es el techo honesto de un DI: una parte del calor entra a volumen casi constante (la premezcla) y el resto a presión. α se lee del pico de presión real del motor, no se supone.'],
      ['α real del ciclo', 'α = p_max / (p_adm · r^1,4)', 'Firmadas: 1,183 (tractor) · 1,192 (camioneta) · 1,187 (planta) · 1,279 (urbano) · 1,299 (marino)', 'Cuanto más premezclado quema el motor, más se parece a Otto y mayor es α. El motor marino y el urbano son los que más "pican" a volumen constante.'],
      ['Expansión tras la combustión', 'r/rc', 'Diésel 6,302 · Dual 7,814 · Otto 16', 'Aquí está el motivo del escalón: el ciclo Otto expande 16 veces todo el calor; el Diésel ideal solo 6,3 veces la parte que quema al final.'],
      ['Reparto de la brecha', 'Otto ideal → freno, punto de referencia', '5,10 + 3,03 + 1,62 + 10,83 + 8,14 = 28,72 puntos', 'Forma del ciclo 8,13 · compresión efectiva 1,62 · combustión real y paredes 10,83 · fricción y bombeo 8,14. La brecha total va de 26,43 (marino) a 32,84 puntos (tractor).'],

      ['Retardo de autoencendido', 'τ = (0,36 + 0,22·Sp)·exp[Ea·(1/(R·T) − 1/17190)·(21,2/(p − 12,4))^0,63]', 'Hardenberg-Hase 1979, τ en grados de cigüeñal', 'La correlación ya lleva dentro el efecto del régimen a través de la velocidad media del pistón, por eso devuelve grados y no segundos.'],
      ['', 'Ea = 618 840/(CN + 25) J/mol', 'CN 42 → 9 236,4 · CN 46 → 8 716,1 · CN 51 → 8 142,6 · CN 54 → 7 833,4 J/mol', 'Más cetano, menos energía de activación, menos retardo. Es el único sitio por donde entra el número de cetano al ciclo caliente.'],
      ['', 'p mínima declarada 12,6 bar, exponente acotado a 40', 'Suelo para no cruzar el polo de la correlación en 12,4 bar', 'El polo no es físico: es la forma de la correlación. El motor declara el suelo en vez de dejar que la presión lo atraviese.'],
      ['Integral de encendido', '∫ dt/τ(p,T) = 1 (Livengood-Wu)', 'Se acumula por trapecios desde el SOI, con interpolación lineal en el paso donde cruza 1', 'Nadie manda encender. El ángulo de inicio de combustión sale de la historia completa de presión y temperatura desde que empieza la inyección.'],
      ['Retardo obtenido', 'θ_ret = θ_SOC − θ_SOI', 'Firmadas: 2,42° a 3,68° · rango global 2,126° a 8,245°', 'Al adelantar la inyección el retardo CRECE: se inyecta antes, en gas más frío y menos comprimido. En el punto de referencia pasa de 3,50° a 4,27° al pasar de SOI 2° a SOI 18°.'],

      ['Wiebe premezclada', 'x = 1 − exp(−6,908·y³), y = (θ−θ_SOC)/Δθ_P, cortada en y = 1', 'A = 6,908 · m = 2,0 (exponente m+1 = 3)', 'Es un pico que se agota: con A = 6,908 está quemada al 99,9 % cuando y = 1, y ahí se corta. Al cortarla se declara una discontinuidad del 0,1 %, preferible a una cola infinita que no existe.'],
      ['Wiebe de difusión', 'x = 1 − exp(−2,50·y^1,55), SIN corte', 'A = 2,50 · m = 0,55 (exponente m+1 = 1,55)', 'Su duración es una escala de mezcla, no un final: y sigue creciendo más allá de 1 y la cola se apaga sola. Esa asimetría es la forma del diagrama diésel.'],
      ['Fracción premezclada', 'β = 0,85·(masa inyectada durante el retardo)/m_comb, acotada a [0,02 · 0,95]', 'Firmadas: 0,095 a 0,159 · rango global 0,050 a 0,361', 'No es una correlación: es masa. Lo que entró antes de que arrancara la llama es lo que puede quemar de golpe.'],
      ['Duración premezclada', 'Δθ_P = 3,2 + 0,85·θ_ret', 'Firmadas: 5,26° a 6,33°', 'Cuanto más largo el retardo, más ancho el pico, porque hay más masa esperando.'],
      ['Duración de difusión', 'Δθ_D = 1,55·θ_iny + 14,0·√(Sp/10)', 'Firmadas: 40,64° a 49,54°', 'La cola dura lo que dura la inyección más el tiempo de mezcla, y el tiempo de mezcla se escala con la velocidad del pistón.'],
      ['Quemado tardío', 'pen = 1 − 0,0050·máx(0, CA90 − 40°)', 'Firmadas: 1,0000 en las cinco (CA90 va de 33,14° a 38,70°) · rango global 0,8174 a 1,0000', 'Lo que llega al final encuentra un gas que ya se expande y se enfría, y no acaba de oxidarse. Ninguna de las cinco firmadas paga esta penalización: el pliego de fase ya las obliga a quemar pronto. Como CA90 nunca pasa de 130°, la penalización no puede bajar de 0,55 por geometría.'],
      ['Eficiencia de combustión', 'η_c = 0,985 · mín(1; 0,90 + 0,25·(λ−1)) · pen', 'Calor liberado = Qdem · η_c', 'El calor NO se conoce al empezar: depende de dónde caiga la combustión, y eso lo decide el retardo. Por eso el ciclo se resuelve en dos pasadas.'],

      ['Transferencia de calor', 'h = 3,26·B^−0,2·p^0,8·T^−0,55·w^0,8 (Woschni)', 'C1 = 2,28 · C2 = 3,24e−3 (solo tras el encendido)', 'El segundo término solo se enciende cuando hay combustión: mide cuánto se aparta la presión real de la de arrastre.'],
      ['Calor perdido', 'Q_ht / Q liberado', 'Firmadas: 11,1 % a 13,8 % · rango global 7,0 % a 20,5 %', 'Es la mayor de las pérdidas reales dentro del cilindro. Un motor pequeño y rápido pierde proporcionalmente más porque tiene más superficie por unidad de volumen.'],
      ['Área de intercambio', 'A = πB²/2 + 4V/B', 'Culata + corona + camisa descubierta', 'Cámara plana equivalente: no hay bol, así que la corona aporta un disco y la camisa lo que descubre el pistón.'],

      ['Caudal del inyector', 'ṁ = cd·n·(π/4)·d²·√(2·Δp·ρ)', 'Δp = p_riel − p_cilindro en el SOI, mínimo 1 bar', 'Bernoulli puro. La contrapresión no es despreciable: en el punto de referencia el cilindro está a 59,5 bar cuando se abre el inyector.'],
      ['Ley de la raíz', 'ṁ(1800)/ṁ(600) = √((1800−59,5)/(600−59,5))', 'Medido 1,7945 · raíz teórica 1,7945 · lineal daría 3,0000', 'Triplicar la presión del riel no triplica el caudal: lo multiplica por 1,79. La duración de inyección baja de 41,10° a 22,90°, no a un tercio.'],
      ['Duración de inyección', 't_iny = m_comb/ṁ · θ_iny = t_iny·6·rpm', 'Firmadas: 17,78° a 22,90°', 'Los grados que dura la inyección dependen del régimen: el mismo pulso en tiempo ocupa más cigüeñal cuanto más rápido gira el motor.'],
      ['Efecto del riel (referencia)', 'urbano r 16, SOI 10°, UBA, cuatro presiones', '600 → η_B 28,79 %, bsfc 292,8 · 1 000 → 34,35 %, 245,5 · 1 400 → 37,04 %, 227,6 · 1 800 → 38,29 %, 220,2', 'Subir el riel gana 9,50 puntos, pero el retardo NO cambia (3,66° en las cuatro): el riel decide cuánto tarda en entrar la dosis, no cuándo prende.'],
      ['Coste de subir el riel', 'fmep_iny = 2,2·m_comb·p_iny/(ρ·0,72·V_d)', '0,160 bar a 600 · 0,479 bar a 1 800', 'La bomba se paga con el mismo cigüeñal que mueve el coche. En la camioneta y el urbano la inyección es ya el 21 % de toda la fricción.'],

      ['Fricción mecánica', 'fmep = 0,55 + 0,0060·p_max + 0,0450·Sp + 0,00080·Sp² (Chen-Flynn)', 'Firmadas: 1,538 a 1,822 bar · rango global 1,297 a 2,105 bar', 'Sube con la presión de pico: apretar la relación de compresión también aprieta los cojinetes.'],
      ['Bombeo', 'pmep = (p_esc − p_adm)', 'Firmadas: 0,110 a 0,250 bar', 'En un diésel sin mariposa el bombeo es casi anecdótico frente a la fricción: 0,25 bar contra 2,3.'],
      ['Balance de presiones medias', 'imep_G − pmep − fmep_mec − fmep_iny = bmep', 'Referencia urbano: 14,370 − 0,250 − 1,791 − 0,479 = 11,851 bar', 'Cada resta es visible en el pizarrón. El 21,1 % de la fricción del urbano es la bomba de inyección.'],

      ['Geometría', 'V(θ) = Vc + Ap·(L + a − a·cos θ − √(L² − a²·sen²θ))', 'Vc = Vd/(r − 1)', 'Exacta, con la biela real. La columna de gas dibujada en 3D vale V(θ) exactamente, no una aproximación.'],
      ['Compresión efectiva', 'rEf = V(IVC)/Vc', 'Firmadas: 13,810 a 19,310 · rango global 12,895 a 19,310', 'El motor no comprime desde el PMI sino desde que cierra la admisión. Cuesta 1,50 a 1,62 puntos del techo ideal, y es la pérdida que nadie apunta.'],
      ['Residuales', 'f_res por punto fijo con la masa atrapada al EVO', 'Firmadas: 2,04 % a 3,21 % · rango global 1,96 % a 3,53 %', 'Calientan la carga fresca antes de comprimir; en frío eso no existe, y por eso el arranque se resuelve aparte.'],
      ['Dosis', 'm_comb = Qdem/PCI', 'Referencia: 27,06 mg (marino) a 28,25 mg (B20) para el MISMO calor', 'La energía pedida la fija el banco; la masa la fija el combustible. Quien tiene menos poder calorífico tiene que inyectar más masa para dar lo mismo.'],
      ['Exceso de aire', 'λ = m_aire/(m_comb·AFR)', 'Firmadas: 1,555 a 1,991 · rango global 1,541 a 1,992', 'En diésel solo entra aire: λ no se regula con mariposa, sale de cuánto aire cabe y cuánta dosis se pide.'],
      ['Margen de humo', 'λ − 1,25', 'Firmadas: +0,305 a +0,741', 'Límite clásico de humo de un DI. NO es criterio del pliego porque con dosis fija λ apenas se mueve: el laboratorio lo mide y lo declara en vez de fingir que decide algo.'],
      ['Temperatura de brida', 'T_brida = T_pared + 0,78·(T_esc − T_pared)', 'Firmadas: 755 K a 823 K · rango global 716 K a 887 K', 'El termopar no está en la válvula: está aguas abajo, y el conducto ya se llevó parte del calor.'],

      ['Diésel UBA de invierno', 'CN 51 · PCI 42,7 MJ/kg · ρ 0,832 · AFR 14,50', 'CFPP −28 °C · 1,35 €/L · umbral térmico 699,0 K', 'El caro que arranca en cualquier sitio. Es el que firma tres de las cinco máquinas.'],
      ['Gasóleo agrícola B', 'CN 46 · PCI 42,6 MJ/kg · ρ 0,838 · AFR 14,48', 'CFPP −4 °C · 0,92 €/L · umbral térmico 729,0 K', 'Barato, pero se congela pronto. Nunca firma: pierde en frío contra el UBA y en calidad contra el B20.'],
      ['Biodiésel B20', 'CN 54 · PCI 41,1 MJ/kg · ρ 0,845 · AFR 14,02', 'CFPP −18 °C · 1,48 €/L · umbral térmico 681,0 K', 'El de mejor cetano y menor umbral: es el que menos retardo da y el más silencioso (9,75 bar/° frente a 10,45 del marino). Su problema es el precio y el poder calorífico.'],
      ['Destilado marino DMA', 'CN 42 · PCI 42,9 MJ/kg · ρ 0,855 · AFR 14,55', 'CFPP −6 °C · 0,78 €/L · umbral térmico 753,0 K', 'El más barato y el de mejor rendimiento en el punto de referencia (38,48 %), pero el de mayor retardo y por tanto el más ruidoso. Firma solo donde el ruido y el frío lo permiten.'],

      ['Tractor 3,3 L DI atmosférico', '104,0 × 129,5 mm · 3 cil · 3,300 L · 2 200 rpm · Sp 9,50 m/s', 'Rejilla · homologa a −5 °C · 34 000 kWh/año · r ≤ 21 · riel ≤ 1 000 bar', 'Firmada 21/6°/1 000/marino: η_B 37,58 % · 182,6 N·m · 42,1 kW · 34 634 €.'],
      ['Camioneta 2,8 L CRDi turbo', '94,0 × 100,8 mm · 4 cil · 2,798 L · 2 600 rpm · Sp 8,74 m/s', 'Bujías · homologa a −20 °C · 19 000 kWh/año · r ≤ 18 · riel ≤ 1 800 bar', 'Firmada 18/6°/1 800/UBA: η_B 40,08 % (la mejor) · 282,0 N·m · 76,8 kW · 32 422 €.'],
      ['Planta de emergencia 6,0 L', '108,0 × 109,2 mm · 6 cil · 6,002 L · 1 800 rpm · Sp 6,55 m/s', 'Rejilla y bujías · homologa a −15 °C · 380 000 kWh/año · r ≤ 17 · riel ≤ 1 400 bar', 'Firmada 17/6°/1 400/UBA: η_B 39,66 % · 520,8 N·m · 98,2 kW · 655 325 €.'],
      ['Compacto urbano 1,5 L CRDi', '75,5 × 83,8 mm · 4 cil · 1,501 L · 3 600 rpm · Sp 10,06 m/s', 'Bujías · homologa a −25 °C · 8 400 kWh/año · r ≤ 17 · riel ≤ 1 800 bar · CA50 hasta 16°', 'Firmada 16/10°/1 800/UBA: η_B 38,29 % · 141,5 N·m · 53,4 kW · 15 004 €. Es el punto de referencia de toda esta ficha.'],
      ['Motor marino 9,0 L', '128,0 × 116,6 mm · 6 cil · 9,002 L · 1 500 rpm · Sp 5,83 m/s', 'Precalentamiento por agua · homologa a +5 °C · 352 000 kWh/año · r ≤ 16 · riel ≤ 1 400 bar', 'Firmada 15/10°/1 400/marino: η_B 39,72 % · 911,2 N·m · 143,1 kW · 339 232 €.'],

      ['Criterio de fase', 'CA50 dentro de la ventana del pliego', '4° a 14° (16° en el urbano) · tumba 805 de 1 460 · decide solo 73 veces', 'Es el que más veces tumba una calibración. Quemar tarde no rompe nada, simplemente no cumple el contrato.'],
      ['Criterio de ruido', 'dp/dθ máximo ≤ límite', '7,88 a 12,27 bar/° en las firmadas · límites 8,6 a 12,5 · tumba 166 · decide solo 23', 'Es el criterio que hace que la mejor calibración de las CINCO máquinas sea infirmable. Nunca falta en la lista de fallos del óptimo.'],
      ['Criterio de presión', 'p_max ≤ límite mecánico', '81,4 a 136,3 bar en las firmadas · límites 95 a 150 · tumba 173 · decide solo 19', 'Casi siempre viene acompañado del ruido: lo que sube el pico es lo mismo que sube su pendiente.'],
      ['Criterio de escape', 'T_brida ≤ límite del turbo o del colector', '755 a 823 K en las firmadas · límites 772 a 850 K · tumba 568 · decide solo 35', 'Es el que castiga las relaciones de compresión bajas: menos expansión, más calor por el escape.'],
      ['Criterio de par', 'bmep ≥ mínimo del banco', '6,955 a 12,720 bar en las firmadas · tumba 446 · decide solo 13', 'Nunca decide solo en el tractor, en la planta ni en el urbano: cuando falta par, ya falla algo más.'],
      ['Criterio de arranque', 'Arranca a la temperatura de homologación', 'Tumba 750 · decide solo 204 (el que más)', 'Es el criterio que más veces es el ÚNICO motivo del rechazo. En la camioneta tumba 300 de 400 y decide solo 91 veces.'],

      ['Arrastre en frío', 'n = 1,37 − 0,17·exp(−rpm/140)·√(0,090/B)', 'Firmadas: 1,3212 (marino) a 1,3389 (urbano)', 'Politrópica de arrastre con exponente declarado: engloba las fugas por segmentos y la pérdida a unas paredes que están a la temperatura ambiente.'],
      ['Umbral térmico', 'T_AI = 735 − 6,0·(CN − 45)', '681,0 K (B20) a 753,0 K (marino)', 'Más cetano, menos temperatura hace falta. Es el mismo cetano que acorta el retardo en caliente.'],
      ['Rejilla de admisión', 'ΔT sobre el AIRE, antes de comprimir', 'Tractor +50,5 K a la entrada → ×2,673 = 135,0 K en el PMS', 'Se multiplica por rEf^(n−1). Si se usara gamma = 1,4 en vez del exponente real de arrastre, se regalarían 30,0 K que el motor frío no tiene.'],
      ['Bujía incandescente', 'ΔT en el SITIO, después de comprimir', 'Urbano +178,7 K · camioneta +176,8 K, sin multiplicar', 'Calienta un punto de la cámara, no la carga entera: por eso su aportación entra al final y no se amplifica.'],
      ['Efecto de la compresión', 'Mismo motor, misma rejilla, mismo combustible', 'Tractor a −5 °C con marino: r 14 → margen −8,0 K, NO arranca · r 21 → +98,7 K, arranca', 'La relación de compresión es una ayuda de arranque en frío tan real como la rejilla, y no gasta batería.'],
      ['Gel de combustible', 'T_amb ≥ CFPP', 'Camioneta a −20 °C: los CUATRO superan el umbral térmico, solo el UBA pasa el CFPP', 'El B20 tiene el MAYOR margen térmico (+144,9 K) y aun así no llega al inyector. Arrancar no es solo tener calor: es que el combustible fluya.'],
      ['Margen más ajustado', 'T_PMS − T_AI a la temperatura de homologación', 'Marino +30,3 K · urbano +97,1 K · tractor +98,7 K · camioneta +126,9 K · planta +164,2 K', 'El marino homologa a +5 °C y aun así es el más justo: r 15, combustible de CN 42 y solo precalentamiento por agua.'],

      ['Coste a 5 años', '5 años · kWh/año · 3,6e6/(η_B·PCI·ρ) · precio', 'De 15 004 € (urbano) a 655 325 € (planta)', 'Es el desempate del pliego. Entre dos calibraciones válidas gana la barata, y la barata no siempre es la del combustible barato.'],
      ['Rejilla del reto', '8 r × 5 SOI × 4 presiones × 4 combustibles', '640 por máquina · 3 200 en total · 1 460 construibles · 202 válidas', 'Lo que no es construible lo marca la máquina (r máxima y riel máximo), y el simulador lo señala con ⚠ antes de calcularlo.'],
      ['Válidas por máquina', 'De las construibles de cada una', 'Tractor 75/320 · camioneta 31/400 · planta 42/240 · urbano 15/320 · marino 39/180', 'El urbano es el más estrecho: 15 combinaciones de 320. Homologa a −25 °C y encima gira a 3 600 rpm.'],
      ['El óptimo no es firmable', 'Mejor η_B construible de cada máquina', 'Tractor 37,78 % · camioneta 40,29 % · planta 39,74 % · urbano 38,89 % · marino 39,95 % — las CINCO fallan, y las cinco por ruido', 'Es el resultado central del laboratorio: el pliego no pide el mejor motor, pide el mejor motor que cumpla todo a la vez.'],
      ['Y tampoco es la más cara', 'Válida más cara vs firmada, a 5 años', 'Tractor +38 479 € · camioneta +2 277 € · planta +123 817 € · urbano +1 149 € · marino +361 686 €', 'En las cinco máquinas la válida más eficiente resulta ser también la más barata, así que la firmada gana los dos desempates a la vez.'],
      ['Embudo de pistas', 'Combustible → relación de compresión → presión de riel', 'Tractor 75→24→2→1 · camioneta 31→31→4→1 · planta 42→22→4→1 · urbano 15→15→4→1 · marino 39→10→4→2', 'El SOI no se pista nunca: es lo último que queda por decidir. En la camioneta y el urbano la primera pista no descarta nada, porque el combustible ya estaba forzado por el frío.'],

      ['Convergencia del paso', 'Runge-Kutta 4 a 0,5° · 0,25° · 0,125°', 'η_B 38,2945 → 38,3380 → 38,3385 % · p_max 117,8571 → 117,9800 bar', 'Halvar el paso mueve 0,0435 puntos de rendimiento y 0,1229 bar de pico; volver a halvarlo mueve 0,0005 puntos. El paso de 0,5° está a menos de 0,05 puntos de la respuesta convergida, y la ficha lo declara en vez de presumir de exactitud.'],
      ['Convergencia del escape', 'Bucle externo sobre T_esc', 'Desviación máxima sobre las 1 460 construibles: 0,04996 K · 0 sin converger · de 1 a 4 iteraciones', 'Todas convergen por debajo del umbral declarado de 0,05 K. Ninguna se queda a medias y ninguna se declara "no convergida".'],
      ['Rangos globales', 'Sobre las 1 460 combinaciones construibles', 'η_I 29,95-48,67 % · η_B 23,77-40,29 % · p_max 42,3-183,4 bar · T_max 1 314-2 097 K · CA50 −0,430° a 34,390° · dp/dθ 2,430-15,263 bar/°', 'El barrido cubre desde motores que casi no queman hasta motores que se romperían. Todo se calcula; solo una parte se puede firmar.'],
    ],
  },

  s3: [
    'Seis modos con la misma física detrás: ciclo, retardo, riel, frío, censo y reto. Ninguno recalcula nada por su cuenta: los seis leen el mismo motor sellado.',
    'Motor en 3D con el periodo cerrado real: la columna de gas dibujada vale exactamente V(θ), el color indica la fracción quemada y la opacidad la presión respecto al límite mecánico.',
    'Manómetro de cilindro con aguja instantánea, acelerómetro de ruido que marca dp/dθ contra el límite del pliego y brida de escape que se pone al rojo con la temperatura calculada en el termopar.',
    'Cuadro de seis pilotos, uno por criterio del pliego, que se encienden y se apagan mientras se mueven los mandos: se ve cuál es el que impide firmar.',
    'Diagrama p-V con los tres techos ideales superpuestos —Otto, Diésel y Dual— dibujados con el mismo calor y el mismo gamma que la curva real.',
    'Modo retardo: se ve crecer la integral de Livengood-Wu hasta 1 y el instante exacto en que arranca la combustión, junto con la doble Wiebe y su reparto premezcla/difusión.',
    'Modo riel: barrido de las cuatro presiones disponibles con la ley de la raíz cuadrada visible, la duración de inyección, el quemado tardío y lo que cuesta la bomba.',
    'Modo frío: politrópica de arrastre, aportación de la rejilla multiplicada por la compresión, aportación de la bujía sin multiplicar, umbral térmico del combustible y puerta del CFPP, todo sobre la misma barra de temperatura.',
    'Modo censo: las 640 combinaciones de cada máquina clasificadas por criterio, con las no construibles marcadas ⚠, y el recuento de cuántas veces cada criterio decide él solo.',
    'Modo reto: buscar la calibración firmable más barata de cada máquina, con un embudo de tres pistas que nunca revela el ángulo de inyección.',
  ],

  s4: {
    intro: 'Recorrido recomendado, de lo que se ve a lo que se firma:',
    items: [
      '1. Abre el modo ciclo con el compacto urbano tal como aparece y mira el diagrama p-V con los tres techos encima. Anota los tres números: 67,01, 61,91 y 58,88 por ciento.',
      '2. Compara esos tres con el rendimiento indicado (46,44 %) y con el del freno (38,29 %). Todo lo que falta hasta 28,72 puntos está desglosado en el pizarrón.',
      '3. Toca la columna de gas y comprueba que el volumen dibujado es el mismo que usa el cálculo. Nada de lo que ves es decorativo.',
      '4. Pasa al modo retardo y observa cómo la integral sube hasta 1 antes de que empiece a quemar. Retrasa el SOI y verás que el retardo se ACORTA, no se alarga.',
      '5. Cambia el combustible sin tocar nada más. El calor liberado no se mueve (1 143,6 J en los cuatro) pero la masa inyectada sí, y el ruido cambia con el cetano, no con la masa.',
      '6. Ordena los cuatro por ruido: el B20 (CN 54) da 9,75 bar/° y el marino (CN 42) da 10,45. El orden es exactamente el del número de cetano invertido.',
      '7. Ve al modo riel y recorre las cuatro presiones. Fíjate en dos cosas a la vez: el retardo NO cambia (3,66° en las cuatro) y el rendimiento sube 9,50 puntos.',
      '8. Comprueba la ley de la raíz: el gasto se multiplica por 1,7945 al pasar de 600 a 1 800 bar, y no por 3. La contrapresión del cilindro, 59,5 bar, es la que rompe la proporción.',
      '9. Mira lo que cuesta: la bomba pasa de 0,160 a 0,479 bar de presión media, o sea el 21,1 % de toda la fricción del urbano.',
      '10. Entra al modo frío con el tractor. Baja la relación de compresión de 21 a 14 sin tocar la rejilla ni el combustible: el margen pasa de +98,7 K a −8,0 K y el motor deja de arrancar.',
      '11. Cambia al urbano y compara las dos ayudas: la rejilla del tractor aporta 50,5 K que la compresión multiplica hasta 135,0 K, mientras la bujía del urbano aporta 178,7 K que no se multiplican por nada.',
      '12. Pon la camioneta a −20 °C y prueba los cuatro combustibles. Los cuatro superan el umbral térmico; tres no llegan al inyector. El B20, que es el que más margen térmico tiene, es uno de los tres.',
      '13. Abre el modo censo y busca por qué el urbano solo tiene 15 calibraciones válidas de 320. Después mira el criterio que más veces decide él solo: es el arranque en frío, con 204 de 1 460.',
      '14. Antes de ir al reto, busca la mejor calibración construible de cada máquina y lee por qué falla. En las cinco aparece el ruido de combustión.',
      '15. Ahora sí, resuelve el reto de las cinco máquinas. Si te atascas, pide las pistas en orden; ninguna te dirá el ángulo de inyección, que es justo el mando que más cambia el resultado.',
    ],
  },

  s5: {
    modela:
      'Un motor diésel de inyección directa durante su periodo cerrado, con el encendido calculado y no ordenado, la dosis repartida entre premezcla y difusión según cuánta masa entró antes de la llama, el calor perdido a las paredes por Woschni, la fricción de Chen-Flynn con el trabajo real de la bomba de inyección, los tres techos ideales de aire frío para comparar, y un arranque en frío que separa lo térmico (¿hace bastante calor?) de lo físico (¿fluye el combustible?). Encima, un pliego industrial de seis criterios y un desempate por dinero a cinco años.',
    noModela:
      'No modela la química (nada de NOx ni hollín), ni el chorro (ni penetración ni gotas), ni el bol del pistón, ni el movimiento del aire dentro del cilindro, ni el sistema de inyección como sistema (un solo pulso, sin piloto ni post, sin ondas en el riel), ni el turbo como máquina, ni el periodo abierto, ni transitorios, ni dispersión ciclo a ciclo, ni postratamiento, ni el ruido radiado que se oye desde fuera. Todo lo que aparece en pantalla sale de una sola zona con propiedades medias.',
  },

  s6: [
    'Hardenberg, H. O. y Hase, F. W. (1979). "An Empirical Formula for Computing the Pressure Rise Delay of a Fuel from its Cetane Number and from the Relevant Parameters of Direct-Injection Diesel Engines". SAE 790493. Es de donde salen 0,36 · 0,22 · 618 840/(CN+25) · 17 190 · 21,2 · 12,4 · 0,63, sin retocar ninguna.',
    'Livengood, J. C. y Wu, P. C. (1955). "Correlation of Autoignition Phenomena in Internal Combustion Engines and Rapid Compression Machines". 5.º Symposium (International) on Combustion. Es el criterio de la integral acumulada hasta 1 que hace del encendido un resultado.',
    'Watson, N., Pilley, A. D. y Marzouk, M. (1980). "A Combustion Correlation for Diesel Engine Simulation". SAE 800029. Es la forma de doble Wiebe con pico premezclado y cola de difusión.',
    'Woschni, G. (1967). "A Universally Applicable Equation for the Instantaneous Heat Transfer Coefficient in the Internal Combustion Engine". SAE 670931. Constantes C1 = 2,28 y C2 = 3,24e−3 del periodo cerrado.',
    'Chen, S. K. y Flynn, P. F. (1965). "Development of a Single Cylinder Compression Ignition Research Engine". SAE 650733. Es la fricción como polinomio de la presión de pico y de la velocidad media del pistón.',
    'Heywood, J. B. (2018). "Internal Combustion Engine Fundamentals", 2.ª ed., McGraw-Hill. Capítulos 5 y 10: ciclos ideales Otto, Diésel y Dual (Seiliger), compresión efectiva y balance de presiones medias.',
    'Stone, R. (2012). "Introduction to Internal Combustion Engines", 4.ª ed., Palgrave Macmillan. Capítulo 5: por qué el ciclo Dual describe un DI mejor que el Diésel de presión constante.',
    'UNE-EN 590 y UNE-EN 116: requisitos del gasóleo de automoción y determinación del punto de obstrucción de filtro en frío (CFPP). Los grados de CFPP de los cuatro combustibles son valores de proyecto dentro de las clases de la norma.',
    'UNE-EN 14214 y UNE-EN 590 anexo: mezclas con éster metílico de ácidos grasos, de donde vienen el mayor cetano y el menor poder calorífico del B20.',
    'ISO 8178 e ISO 3046: condiciones de referencia y declaración de prestaciones de motores alternativos de combustión interna; es el marco del que se toma la idea de homologar a una temperatura declarada.',
    'Verificación numérica propia: toda la física vive en un motor sellado, motor_diesel.mjs, verificado con test_diesel.mjs mediante 279 937 comprobaciones sin un solo fallo, incluidas la conservación de la energía paso a paso, la convergencia del escape en las 1 460 combinaciones construibles y el contraste de los tres ciclos ideales contra sus formas cerradas. Las cifras de esta ficha se extrajeron después con ficha_diesel.mjs, ficha2_diesel.mjs y ficha3_diesel.mjs, sin escribir a mano ni un solo número. El laboratorio ya construido se volvió a verificar dentro de un navegador real con pw_diesel.mjs: 161 756 comprobaciones más, también sin un solo fallo, contrastando punto por punto lo que se dibuja en pantalla contra lo que devuelve el motor sellado.',
  ],
});
