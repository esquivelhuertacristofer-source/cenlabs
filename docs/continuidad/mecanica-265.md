# mecanica-265 · Cojinete hidrodinámico: película y fricción

**Revisión individual completa. Local; sin commit, push ni publicación. Cierre global B pendiente.**

## Diferencia respecto del catálogo
Distinto del238: éste sostiene una carga mediante aceite arrastrado por el giro; no usa aire presurizado ni un restrictor aerostático.

## Modelo y límites
Cojinete corto: R=25 mm, L=20 mm, holgura radial c=50 µm, carga W=2000 N, rugosidad RMS combinada de 4 µm. h=c(1+εcosθ). Para 0<θ<π: p=3µΩcεsinθ(L²/4−z²)/h³; p=0 en el resto y en z=±L/2. A=µΩRL³/c²; Wx=−Aε²/(1−ε²)², Wy=πAε/[4(1−ε²)^(3/2)]. Se resuelve √(Wx²+Wy²)=W por bisección. φ=atan2(Wy,−Wx), campo girado γ=π/2+φ para que la fuerza del aceite sea vertical ascendente. hmin=c(1−ε), λ=hmin/4µm. Fricción de perfil circunferencial lineal: Fv=2πµΩR²L/[c√(1−ε²)], f=Fv/W, par=RFv y pérdidas=par·Ω. Caudal lateral total Q=ΩRcLε. Flujo medio: dθ/dt=Ω/2, dz/dt=Ωcεsinθ·z/(2h); zh es constante a lo largo de una trayectoria.

Aproximación isoviscosa de Ocvirk con L/D=0,4 y holgura pequeña; presión positiva en media circunferencia, sin cavitación conservativa en masa. La fricción usa Couette integrada en 360° conforme al perfil lineal del informe NACA; no se añade una corrección de gradiente circunferencial de otra aproximación. Sin temperatura, elasticidad, presión de alimentación ni contacto de asperezas. λ<3 indica que no se cumple la separación objetivo, no un cálculo de desgaste. Se dibuja media longitud axial, desde z=−L/2 hasta la sección central z=0: ahí se ve la presión máxima. Holgura y excentricidad ampliadas ×60, giro ×1/200; esa ampliación distorsiona las proporciones radiales, no las cifras. Flechas turquesa: presión local en la sección central (6×10⁻⁸ unidades/Pa), no fuerzas integradas; flecha dorada: carga de 2000 N (0,0002 unidades/N). Color falso de presión: azul 0 a rojo 20 MPa, saturado por encima; no es el color real del aceite. La vista transparente muestra trazadores del flujo promediado a través del espesor, sólo en la región convergente: se reponen al salir por un extremo o alcanzar θ=π. No representan moléculas ni densidad de aceite. Límites didácticos, sin recomendar un aceite SAE real.

## Archivos y continuación
`public/labs/_elementos-*.js`, `cojinete-hidrodinamico-pelicula.html`, `_ficha-cojinete-hidrodinamico-pelicula.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-265/`. Fuente: https://ntrs.nasa.gov/citations/19930083541

Revisión individual:443.035 comprobaciones físicas correctas, incluyendo Reynolds, integración de presión/fuerza, fricción, caudal y trayectorias medias. Cuatro recorridos completos actuales con firma fd6d7a7072a2948222b5e7313fed249d915f6e72ca88f0775d7970ccbef65742. Se contrastan holgura, excentricidad, colores, vectores y matrices de48 trazadores con el modelo. Cero errores/normales nulas/NaN;49 llamadas,12.470 triángulos iniciales,53 palabras,65% del alto. Barrido oficial sano.15 clips instalados y verificados;7.780 MP3 totales, anteriores preservados.

Autocrítica visual: escena viva con eje satinado y casquillo de bronce. Mapa falso de presión legible; flujo inspeccionable mediante transparencia. Los puntos son pequeños para caber en la película: se acerca con Orbit/Inspección. No son moléculas. Gráficas externas con unidad y máximo separados, sin pizarras ni cifras en3D. Se revisaron móvil, flujo, instrumentos y portada propia. El capturador ahora oculta el HUD anidado del shell.

Pendiente:40 recorridos con B estable, Jest completo/TS/lint, regresión250 y A, commit selectivo y publicación/login real. Retomar266:6005/6205/6305, carga equivalente y L10, mismo eje25mm, tablas NSK de una edición.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión fd6d7a7072a2948222b5e7313fed249d915f6e72ca88f0775d7970ccbef65742; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión fd6d7a7072a2948222b5e7313fed249d915f6e72ca88f0775d7970ccbef65742; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión fd6d7a7072a2948222b5e7313fed249d915f6e72ca88f0775d7970ccbef65742; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión fd6d7a7072a2948222b5e7313fed249d915f6e72ca88f0775d7970ccbef65742; normales cero=0, sin errores ni desbordamiento.

1 noviembre: portada regenerada con HUD anidado oculto y revisada visualmente. En263 esto también incorpora el ajuste de eje/taladro descrito previamente. No equivale a publicación ni al cierre global de B.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23; normales cero=0, sin errores ni desbordamiento.
