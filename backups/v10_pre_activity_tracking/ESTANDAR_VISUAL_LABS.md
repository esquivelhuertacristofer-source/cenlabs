# Estándar Visual y de Implementación: Laboratorios CEN

Este documento consolida el trabajo realizado para profesionalizar y estandarizar la arquitectura visual y de usuario (UI/UX) de los Laboratorios Interactivos de Ciencias (iniciando por Química). Funciona como la **Base de Verdad (Single Source of Truth)** para cualquier futura implementación de Física, Biología y Matemáticas.

---

## 1. El Hub de Prácticas (Catálogo Maestro)

El diseño del Catálogo abandona las listas estáticas genéricas y se rige bajo un sistema dinámico premium basado en *Soft-Claymorphism*.

### 1.1 Estructura Visual de la Tarjeta (Bento Style)
*   **Contraste Positivo:** Las tarjetas siempre usan un fondo sólido (`bg-white` o derivado super oscuro en modo noche) flotando sobre un marco general tenuemente gris (`bg-slate-50`).
*   **Spotlight Interactivo (Glow Effect):** Se recubre la tarjeta con un efecto rastreador sobre el cursor (`onMouseMove`) que dibuja un foco de luz radial, entregando microinteracciones reactivas e inmersivas tipo *high-end tech*.
*   **Jerarquía de Información:** Etiquetas encapsuladas (`Pills`) separan lógicamente el Módulo (ej. *Fisicoquímica*) del ID de práctica (`QUIMICA-7`).

### 1.2 Imágenes 3D Inyectadas (Assets)
*   Las imágenes 3D de las prácticas **jamás** deben ensuciar el contenido textual de la tarjeta ni sobrepasarlo rompiendo la grilla.
*   **Patrón de Máscara (Horizontal Fade):** El asset 3D se posiciona a la derecha (width ~35%) usando `object-cover`. Obligatoriamente, se coloca un gradiente por encima que funde el color de la tarjeta con la imagen (`bg-gradient-to-r from-white via-transparent to-transparent`) borrando las líneas de corte brusco y dando un efecto etéreo.

### 1.3 Sistema de Filtrado Inteligente y Persistencia
*   **Navegación Intuitiva (Tabs):** Grandes, clickeables, con contadores integrados y colores sólidos (ej. Cerúleo `#219EBC`) al estar activos.
*   **Estado Recordado:** Al salir del Simulador usando la navegación hacia atrás, el `localStorage` recuerda y reimprime la pestaña activa ("Fisicoquímica", etc.) sin forzar al usuario a iniciar desde el Tab número 1 cada vez.
*   **Buscador Dual:** Se garantiza a nivel código que exista un `input` de búsqueda global (por teoría o por título de práctica).
*   **Pills de Duración:** Filtros rápidos que dividen la base de datos visualmente sin recargas (ej. `< 40m` y `> 40m`).

---

## 2. Pantalla de Práctica (El Motor del Simulador `SimuladorClient.tsx`)

La interfaz final en la que aterriza el alumno posee una arquitectura rigurosa para potenciar el espacio y la concentración.

### 2.1 Layout y Bloqueo Responsivo
*   **Split-screen (30/70):** El panel educativo lateral conforma el 30% del área y aloja la Instrucción, Bitácora y Variables teóricas. La «Mesa de Trabajo» tiene propiedad sobre el 70% restante.
*   **Mobile Block (Bloqueo en Smartphone):** Dado el escaso poder de pantalla para un simulador pesado, es normativo bloquear el acceso desde móvil. Se monta una cortina sobre el DOM global pidiendo al usuario trasladarse a Tablet/PC.

### 2.2 Inventario Inferior (Mac Dock)
*   En lugar de ocultar herramientas interactivas vitales en acordeones del panel lateral izquierdo, todo elemento instanciable (pipetas, mecheros, tubos, microscopios) reside en un **Dock flotante central-inferior**.
*   El dock responde con animaciones vivas cuando un ítem se "hoveréa" (`hover:scale-125 -translate-y-4`), haciéndolo super accesible para mecánicas *Drag & Drop*.

### 2.3 Switch Inmersivo (Mesa Dark Mode Aislada)
Este estándar exige la capacidad de tener "Luces Dinámicas" dentro de la mesa.
*   **Aislamiento del Entorno:** Un botón de "Apagar Luces" (Moon/Sun icon) afecta única y exclusivamente el recuadro que pertenece a la *Mesa de Trabajo*, no interviniendo en la lectura del manual (que se sigue viendo en light mode limpio).
*   **Sombras y Atmósfera:** Su estado `isWorktableDark = true` modifica la cuadrícula arquitectónica del fondo, eleva las sombras a tonos nocturnos y activa un brillo neón (`drop-shadow-2xl` estilo luminoso) desde los componentes de los lados, logrando una inmersión dramática (por ejemplo, al encender un mechero, el fuego rebota contrastando increíble en la pantalla).

---
*Documento guardado para servir de guía definitiva en la evolución del Dashboard Lab.*
