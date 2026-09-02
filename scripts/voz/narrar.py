# -*- coding: utf-8 -*-
"""
LA VOZ DE LA PLATAFORMA.

QUE SUSTITUYE Y POR QUE. Hasta hoy el unico narrador de CEN Labs era
`audio.playGuide()` en `src/utils/audioEngine.ts`: `speechSynthesis` del
navegador, con `pitch = 1.1`. Eso tiene tres problemas y ninguno se arregla
ajustandolo.

  1. LA VOZ NO ES LA MISMA EN DOS MAQUINAS. `getVoices()` devuelve lo que ese
     equipo tenga instalado. En la laptop de una escuela suele ser la SAPI vieja
     de Windows. El alumno de un salon y el del salon de al lado no oyen a la
     misma persona, y ninguno de los dos oye lo que se aprobo.
  2. `pitch = 1.1` ES EXACTAMENTE EL ERROR QUE YA SE PAGO EN LA PLATAFORMA DE
     ROBOTICA. Subir el tono no le pide al modelo que hable mas agudo: desplaza
     la frecuencia de lo ya sintetizado y arrastra los formantes, que son las
     resonancias que hacen que una voz suene a persona de cierta edad y cierto
     tamaño. Subirlos encoge la garganta. El cliente lo describio alli con estas
     palabras: «a veces se escucha como niña, otras como monstruo». No hay dosis
     pequeña que salve eso; es el mecanismo. Aqui el tono se queda en +0Hz y no
     se vuelve a tocar.
  3. NO SE PUEDE PROBAR. Un audio que se sintetiza en el navegador del alumno no
     se puede revisar antes de entrar al salon. Estos MP3 si: estan en disco,
     se oyen, y si uno esta mal se rehace ese y nada mas.

QUE ES ESTO. Graba con `es-MX-DaliaNeural` —el motor neuronal de Microsoft, por
`edge_tts`— las 6 668 frases de los 160 briefings, una por archivo. El navegador
solo reproduce MP3, asi que la voz es la misma en la computadora del salon, en
la tableta y en el telefono de la maestra.

POR QUE UNA FRASE POR ARCHIVO Y NO UN PARRAFO. Porque un parrafo entero sale con
un solo ritmo, y un solo ritmo sostenido es justo lo que hace que una voz suene
a maquina por buena que sea. Partido por frases, cada una se dice con el ritmo
de SU papel, el reproductor mete la pausa que le toca y ademas sabe en todo
momento que frase esta sonando, asi que la puede marcar en pantalla mientras la
dice. Ver `src/components/voz/Lector.tsx`.

LOS RITMOS ESTAN MEDIDOS SOBRE ESTE CORPUS, no copiados. Se sintetizaron seis
frases reales de los briefings y se leyo la duracion del `SentenceBoundary` que
manda el propio servicio:

    +0 %  143      +14 %  163      +26 %  180
    +8 %  155      +18 %  169      +30 %  186
   +10 %  158      +22 %  175

Son PALABRAS ESCRITAS por minuto, y esa distincion importa: «14,60» cuenta como
una palabra y se dice «catorce coma sesenta», que son tres. Por eso esta escala
va muy por debajo de las 218 palabras/min que la plataforma de robotica midio a
+0 % con la MISMA voz —alli el texto es de niños de cuatro años y no lleva
cifras—. Las dos medidas son correctas y no se pueden intercambiar; copiar los
ritmos de alla habria dejado esto un 25 % mas rapido de lo que parece.

El cuerpo del texto va en +12 %, que cae en la banda de 155-165 en la que
narran los audiolibros y los cursos, y es donde un alumno puede seguir prosa
tecnica leyendo a la vez. Los papeles se abren alrededor de ese centro.

LOS ESTILOS DE AZURE NO SIRVEN por este camino: `newscast` y `cheerful` los lee
el motor en voz alta. Medido en la plataforma de robotica. No reintentarlo.

NO PIDE MAQUINA. `edge_tts` es una llamada de red al servicio de Microsoft: no
hay modelo local, ni CPU, ni GPU. Se puede correr con cualquier otra cosa al
lado.

ES IDEMPOTENTE. Guarda un indice con la huella del texto y el ritmo de cada
clip; al relanzarlo solo hace lo que falta o lo que cambio. Interrumpirlo no
cuesta nada, y con casi siete mil clips eso no es un lujo.

  python scripts/voz/narrar.py                    lo que falte
  python scripts/voz/narrar.py --rehacer          todo otra vez
  python scripts/voz/narrar.py --solo mecanica-120
  python scripts/voz/narrar.py --limite 50        para probar sin bajarlo todo
"""
import asyncio
import hashlib
import io
import json
import os
import sys

import edge_tts

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FUENTE = os.path.join(RAIZ, 'zz-voz.json')
DESTINO = os.path.join(RAIZ, 'public', 'assets', 'voz')
INDICE = os.path.join(DESTINO, 'indice.json')

# LA VOZ ES MEXICANA PORQUE LA PLATAFORMA LO ES, y ademas es la que mas recorrido
# de tono tiene por si sola: la plataforma de robotica midio 181 Hz de recorrido
# en Dalia contra 147 de la mejor voz «Multilingual» nueva de Microsoft.
VOZ = 'es-MX-DaliaNeural'

# NO SE TOCA. Ver el punto 2 de la cabecera.
TONO = '+0Hz'

# EL RITMO NO SE DECIDE AQUI. Viene resuelto en cada fila de `zz-voz.json`,
# porque la tabla de papeles la comparten el narrador y el reproductor y vive en
# `src/lib/voz/decir.ts`. Si estuviera copiada aqui, cambiar la direccion de un
# papel serian dos ediciones en dos lenguajes y la segunda se olvida.
#
# Para saber que hace cada papel y por que lleva ese ritmo, mirar ese archivo.
# Lo que se decide AQUI es solo como se graba: la voz, el tono y los reintentos.

# Cuantos clips a la vez. Es red, no maquina: seis van comodos y el servicio no
# se queja. Subirlo mas empieza a devolver cortes a media frase.
A_LA_VEZ = 6

# Reintentos por clip. MEDIDO: en una tanda de veinticinco pruebas, una devolvio
# `NoAudioReceived` y al repetirla salio bien. El fallo es pasajero y sin esto
# deja un hueco mudo en mitad de un briefing.
INTENTOS = 3

# Por debajo de esto el archivo no es audio, es un error que se guardo.
MINIMO_BYTES = 900


def firma(texto, ritmo):
    return hashlib.sha1((texto + '@' + ritmo).encode('utf-8')).hexdigest()[:12]


async def uno(fila, indice, sem, avance):
    carpeta, clave, texto = fila['carpeta'], fila['clave'], fila['texto']
    ritmo = fila['ritmo']
    ruta_rel = '%s/%s.mp3' % (carpeta, clave)
    destino = os.path.join(DESTINO, carpeta, clave + '.mp3')
    f = firma(texto, ritmo)

    if not avance['rehacer'] and indice.get(ruta_rel) == f and os.path.exists(destino):
        avance['saltados'] += 1
        return

    async with sem:
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        for intento in range(INTENTOS):
            try:
                com = edge_tts.Communicate(texto, VOZ, rate=ritmo, pitch=TONO)
                await com.save(destino)
                tam = os.path.getsize(destino)
                if tam < MINIMO_BYTES:
                    raise IOError('audio vacio (%d bytes)' % tam)
                indice[ruta_rel] = f
                avance['hechos'] += 1
                break
            except Exception as e:  # noqa: BLE001
                if intento == INTENTOS - 1:
                    avance['fallos'].append((ruta_rel, '%s: %s' % (type(e).__name__, str(e)[:70])))
                else:
                    await asyncio.sleep(1.5 * (intento + 1))

    n = avance['hechos'] + avance['saltados'] + len(avance['fallos'])
    if n % 200 == 0:
        print('  %5d / %d' % (n, avance['total']), flush=True)


def guarda_indice(indice):
    os.makedirs(DESTINO, exist_ok=True)
    io.open(INDICE, 'w', encoding='utf-8').write(json.dumps(indice, indent=0, sort_keys=True))


async def main():
    rehacer = '--rehacer' in sys.argv
    solo = sys.argv[sys.argv.index('--solo') + 1] if '--solo' in sys.argv else None
    limite = int(sys.argv[sys.argv.index('--limite') + 1]) if '--limite' in sys.argv else None

    if not os.path.exists(FUENTE):
        print('No existe %s. Corre antes:\n  node scripts/voz/extraer-voz.mjs > zz-voz.json' % FUENTE)
        return 1

    filas = json.load(io.open(FUENTE, encoding='utf-8'))
    if solo:
        filas = [f for f in filas if f['carpeta'] == solo]
    if limite:
        filas = filas[:limite]
    if not filas:
        print('Ninguna fila coincide.')
        return 1

    indice = {}
    if os.path.exists(INDICE):
        indice = json.load(io.open(INDICE, encoding='utf-8'))

    avance = {'total': len(filas), 'hechos': 0, 'saltados': 0, 'fallos': [], 'rehacer': rehacer}
    sem = asyncio.Semaphore(A_LA_VEZ)
    print('%d clips · voz %s · tono %s' % (len(filas), VOZ, TONO), flush=True)

    # Se guarda el indice pase lo que pase: si esto se corta a la mitad, lo ya
    # narrado tiene que contar en el siguiente arranque.
    try:
        await asyncio.gather(*[uno(f, indice, sem, avance) for f in filas])
    finally:
        guarda_indice(indice)

    peso = sum(os.path.getsize(os.path.join(r, n))
               for r, _, ns in os.walk(DESTINO) for n in ns if n.endswith('.mp3'))
    print('\nhechos %d · ya estaban %d · fallos %d · %.1f MB en disco'
          % (avance['hechos'], avance['saltados'], len(avance['fallos']), peso / 1e6))
    for ruta, e in avance['fallos'][:20]:
        print('  FALLO %s  %s' % (ruta, e))
    return 1 if avance['fallos'] else 0


sys.exit(asyncio.run(main()))
