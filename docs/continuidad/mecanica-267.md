# mecanica-267 · Resortes: rigidez, esfuerzo y frecuencia

**Revisión individual completa. Local, sin commit, push ni publicación; cierre global B pendiente.**

## Diferencia respecto del catálogo
Distinto173 (volante bimasa),201 (identificación modal) y271 (amortiguamiento): dimensiona físicamente un resorte por alambre, diámetro, Wahl, masa de alambre y espacio entre espiras.

## Modelo y límites
Resorte helicoidal cercano a espira cerrada: G=78,5 GPa, densidad7850 kg/m³, Na=8 espiras activas y dos terminales de una vuelta sujetas en copas, Nt=10, longitud libre100 mm. k=Gd⁴/(8D³Na); índice C=D/d, Wahl K=(4C−1)/(4C−4)+0,615/C; τmax=K8FmaxD/(πd³). Área A=πd²/4, masa por vuelta m1=ρAπD, masa activa ma=8m1. Masa del carro3 kg; extremo móvil aporta m1, extremo fijo inmóvil. Rayleigh meff=3+m1+ma/3; fn=√(k/meff)/(2π). Precarga F=30 N; compresión de equilibrio δ=F/k. Pequeña oscilación de amplitud a=2 mm: longitud=L0−δ−a cos(ωt), fuerza de resorte=F+ka cos(ωt), Fmax=F+ka. Movimiento mostrado ×1/4; la frecuencia indicada es real. Terminales sin rectificar, altura sólida geométrica Hs=(Nt+1)d=11d.

Modelo lineal de torsión, ocho espiras activas y terminales sujetos; sin fatiga, pandeo, rozamiento, amortiguamiento ni contacto entre espiras. Guía horizontal soporta el peso; no hay gravedad axial. Masa de alambre por longitud de espira cerrada, sin corrección de hélice. Masa efectiva ma/3 aproxima el modo de desplazamiento lineal; no es solución exacta del continuo ni frecuencia de surge con ambos extremos fijos. La masa del carro es concentrada e incluye el equipo movido, no se deduce del volumen dibujado. Dos terminales tienen paso d y las activas reparten el tramo restante; las copas sujetan las vueltas inactivas. En todo el rango se conserva holgura hasta bloque durante la oscilación. No se simula rotura ni plastificación:220 MPa y dimensiones son límites didácticos del escenario, no homologación de material. Geometría de resorte a30 unidades/m, sin amplificar la amplitud. Flecha dorada: precarga externa30 N, escala0,012 unidades/N.

## Archivos y continuación
`public/labs/_elementos-*.js`, `resorte-helicoidal-rigidez-frecuencia.html`, `_ficha-resorte-helicoidal-rigidez-frecuencia.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-267/`. Fuente: https://www.maruho-htj.co.jp/en/mnet/design/compression/

47.923 comprobaciones físicas correctas: rigidez/energía torsional, Wahl, equilibrio, energía y frecuencia con masa activa. La masa efectiva Rayleigh se contrastó con la raíz del continuo x tan x=ma/M: error relativo≤2,74e−6 en todo el rango. Holgura mínima dinámica hasta bloque15,91745mm; sin contacto de espiras. Cuatro recorridos completos con firma084330ef4593ee4fe55f9af12912c537365cdb2e5aece1ed3c52dc1b68fa723b, incluido390×844 y2020×1055 DPR1,25. Se contrastan coordenadas y radio del alambre real, carro y altura de resorte con el modelo en extremos/centros. Orden, ensayo, reto, quiz, diagnósticos, instrumentos, TXT, ficha, calidad y arrastre correctos. Cero errores/normales nulas/NaN;19 llamadas,21.490triángulos,63palabras; altura65% en escritorio y55,62% en móvil. Barrido oficial sano.

16clips instalados y comprobados,183labs en manifiesto,7.812MP3 totales. Portada propia sinHUD capturada y revisada. Autocrítica: bancada con guía y carro en movimiento, resorte con alambre a escala y geometría que conserva su sección durante la compresión. Copas sujetan extremos inactivos; ruedas apoyan en guías y soporte fijo llega a bancada. La separación entre vueltas se ve en Inspección. No hay gráficos dentro del3D, prosa inicial corta, móvil sin scroll interno ni desbordamiento. La aproximación de masa y los límites del material están declarados; no sustituye una selección de catálogo por fatiga.

Pendientes: TS/lint/Jest completo y40recorridos del bloque estable, regresión250 yA, commit selectivo, publicación/login real. Siguiente268: freno diferencial de banda; fuente primaria universidad Jönköping y propuesta geométrica en work/PLAN-FRENO-268.md del workspace. No publicarlo por pasar pruebas individuales.

QA 1366×768 DPR1: inicio correctos; revisión 48fc85ca179e2dc298fc21f439d1a3330a65a0e3a7a78f71c0b27f5a38c8d740; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 084330ef4593ee4fe55f9af12912c537365cdb2e5aece1ed3c52dc1b68fa723b; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 084330ef4593ee4fe55f9af12912c537365cdb2e5aece1ed3c52dc1b68fa723b; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 084330ef4593ee4fe55f9af12912c537365cdb2e5aece1ed3c52dc1b68fa723b; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 084330ef4593ee4fe55f9af12912c537365cdb2e5aece1ed3c52dc1b68fa723b; normales cero=0, sin errores ni desbordamiento.
