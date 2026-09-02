/**
 * EL SERVICE WORKER: QUE UN LAB ABIERTO UNA VEZ SIGA ABRIÉNDOSE SIN RED.
 *
 * QUÉ HACÍA MAL EL ANTERIOR, y son tres cosas distintas:
 *
 *   1. Sembraba nueve URLs a mano y entre ellas NO estaba
 *      `/alumno/laboratorio/mecanica`, que es el hub de 120 de los 160 labs.
 *      Tres cuartas partes del catálogo quedaban fuera de la caché por una
 *      lista que se escribió cuando sólo había cuatro materias.
 *   2. No guardaba NADA en vivo. La regla era `caches.match() || fetch()`: si
 *      no estaba en la caché iba a la red y el resultado se tiraba. O sea que
 *      un alumno podía trabajar hora y media en un lab, y al día siguiente sin
 *      internet ese lab no abría, porque nunca se llegó a guardar.
 *   3. Al desplegar una versión nueva, la caché vieja se quedaba para siempre:
 *      no había `activate` que la borrara.
 *
 * LA REGLA DE AHORA, y por qué son dos y no una:
 *
 *   NAVEGACIÓN (las páginas)   red primero, caché si la red falla.
 *     Una página de Next puede cambiar en cualquier despliegue, así que servir
 *     la copia guardada de entrada dejaría a la escuela con una versión vieja
 *     sin manera de enterarse. Se intenta la red, y la copia es el paracaídas.
 *
 *   ACTIVOS (labs, audio, imágenes)   caché primero, y se guarda al pasar.
 *     Un `/labs/*.html`, un `/assets/voz/*.mp3` o un `/images/*.webp` es
 *     inmutable en la práctica: cuando cambia, cambia el despliegue entero y la
 *     caché se tira por versión. Servirlos de disco es lo que hace que el lab
 *     abra instantáneo y que siga abriendo sin red. Y AQUÍ SÍ SE GUARDA lo que
 *     se descarga, que es lo que faltaba.
 *
 * LO QUE NO SE TOCA. Sólo se guarda lo de este mismo origen y sólo las
 * peticiones GET: meter en caché la respuesta de `/api/resultados` sería
 * servirle a un alumno la calificación de otro.
 */

const VERSION = 'cen-labs-v2';
const CACHE = `${VERSION}`;

/* Lo mínimo para que la plataforma abra sin red la primera vez. Los labs NO se
   siembran: son 121 archivos de tres 3D cada uno, y precargarlos todos sería
   descargar el catálogo entero en la primera visita. Se guardan al visitarlos,
   que es cuando se sabe cuáles hacen falta. */
const SEMILLA = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/alumno/laboratorio/mecanica',
  '/alumno/laboratorio/quimica',
  '/alumno/laboratorio/fisica',
  '/alumno/laboratorio/biologia',
  '/alumno/laboratorio/matematicas',
];

/** Lo que se guarda al pasar. Todo esto es inmutable dentro de un despliegue. */
function esActivo(url) {
  return url.pathname.startsWith('/labs/')
    || url.pathname.startsWith('/labs-data/')
    || url.pathname.startsWith('/assets/')
    || url.pathname.startsWith('/images/')
    || url.pathname.startsWith('/_next/static/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      /* `addAll` es todo o nada: si una sola URL de la semilla falla —un 404 tras
         renombrar una ruta— la instalación entera se cae y el service worker no
         llega a existir. Se piden una por una y las que fallen se saltan. */
      .then((cache) => Promise.all(SEMILLA.map((u) => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r ?? caches.match('/'))),
    );
    return;
  }

  if (!esActivo(url)) return;

  event.respondWith(
    caches.match(req).then((guardado) => {
      if (guardado) return guardado;
      return fetch(req).then((res) => {
        /* Sólo se guarda lo que de verdad llegó bien. Un 404 o una respuesta
           parcial en caché es peor que no tener caché: se sirve para siempre y
           parece un bug del lab. */
        if (res.ok && res.status === 200) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        }
        return res;
      });
    }),
  );
});
