# mecanica-270 · Eje y cubo: tres formas de transmitir par

**Revisión individual completa en local.**

## Diferencia respecto del catálogo
Comparación resistente de tres modos de unión; distinta del montaje térmico de rodamiento215. No repite el calentamiento de un aro: distingue geometría de contacto, aplastamiento y agarre por fricción.

## Modelo y límites
Chaveta12×8 mm, apoyada4 mm en cada flanco resistente del eje/cubo; límite de cortante60 MPa y de aplastamiento100 MPa del escenario. Tkey=min(τadm bLd/2,σadm hLd/4). Estriado paralelo didáctico de12 dientes, diámetro medio40 mm y altura útil2 mm; número efectivo0,75×12=9: Tspline=σadm neff hflanco L d/2. Ajuste de eje macizo/cubo grueso del mismo acero: E=210 GPa,ν=0,30,μ=0,12,d=40 mm,D=75 mm. Exceso DIAMETRAL efectivoδ: p=δE/[d·2D²/(D²−d²)]. Capacidad de fricción Tfit=μpπd²L/2. Lamé en cubo: A=p a²/(b²−a²),B=p a²b²/(b²−a²); σr=A−B/r²,σθ=A+B/r²,ur=[(1−ν)Ar+(1+ν)B/r]/E, a=d/2,b=D/2. En eje us=−p(1−ν)a/E y δ=2[uh(a)−us(a)].

Modelos estáticos ideales por cortante/aplastamiento, reparto equivalente de dientes y fricción uniforme. Sin resistencia de raíz de estriado, torsión global del eje, fatiga, concentraciones, efectos de extremos ni deformación plástica. Límites y factor de reparto propios del escenario; no perfil DIN/ISO ni ajuste de tolerancias homologado. δ es interferencia efectiva ideal tras posibles pérdidas, no tamaño medido ni selección H7/p6; se omiten rugosidad, temperatura y montaje. El modelo elástico es de tensión plana y materiales iguales. Diámetro nominal40 mm; estriado de raíz38 mm, cabeza radial21 mm y espesor tangencial3 mm, no se evalúa su reducción de sección. Chavetero con asiento centrado a√(20²−6²) mm para conservar4 mm de apoyo lateral por mitad; holgura de techo50µm. Estriado hembra con holgura radial50µm ilustrativa. Cubos muestran sólo la mitad axial trasera; contorno frontal indica la mitad omitida, pero las capacidades usan L completa. Geometría ensamblada nominal concéntrica; deformaciones micrométricas en instrumento, sin solapar los diámetros libres. Giro de inspección prescrito15 rpm sin carga, no simulación de deslizamiento ni rotura bajo250 N·m. Flechas en el ajuste: presión sobre el eje, escala5×10⁻⁹ unidades/Pa.

## Archivos y continuación
`public/labs/_elementos-*.js`, `eje-cubo-chaveta-estriado-interferencia.html`, `_ficha-eje-cubo-chaveta-estriado-interferencia.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-270/`. Fuente: https://mechanics.ju.se/MachineElements/shaft-hub.html

21.567 comprobaciones del modelo de contacto, compatibilidad diametral, equilibrio de Lamé y capacidades. Cuatro recorridos completos de la revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23. La malla verifica dimensiones de chaveta, perfil de estriado, mitad axial y vectores de presión. Portada final inspeccionada. Narración de 16 clips instalada.

Pendiente la regresión conjunta del bloque 261–270. Retomar las filas faltantes con el auditor y --reanudar.

QA 1366×768 DPR1: inicio correctos; revisión f3cab7bbc7904bc712fa74a039d13ee5f5f10a804f4e420739f75bbfa8898bc3; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio correctos; revisión fb9d08acfd8ce7ae10b35a18316be1b9c43ff4144539fc6694d72ddad8ef5917; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión f84a20a73db9d6c6d1c6aa0b6472d71f3884cdb5998bf520f786fe9faeced66f; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión f84a20a73db9d6c6d1c6aa0b6472d71f3884cdb5998bf520f786fe9faeced66f; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión f84a20a73db9d6c6d1c6aa0b6472d71f3884cdb5998bf520f786fe9faeced66f; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión f84a20a73db9d6c6d1c6aa0b6472d71f3884cdb5998bf520f786fe9faeced66f; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23; normales cero=0, sin errores ni desbordamiento.
