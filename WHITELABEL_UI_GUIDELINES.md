# Guía de Diseño y Estilos (White-Label UI)
**Proyecto: CEN Laboratorios**

Este documento preserva la arquitectura UI/UX y los patrones visuales premium desarrollados para el "Student Hub" (`/alumno/inicio`). Estos lineamientos garantizan que cualquier futura adaptación (White-Label) para otras instituciones mantenga el nivel de calidad de "EdTech de Alta Gama".

## 1. Arquitectura de Layout Principal
- **Max Width Extremadamente Inmersivo:** Uso intensivo de `max-w-[1600px]` en grids de tarjetas y contenedores macro. Abandono de anchos constreñidos (5xl) para maximizar la pantalla en monitores ultrawide/grandes.
- **Muro de Mando (Bento Grid):** Uso de `grid-cols-1 lg:grid-cols-2` en lugar de carruseles con overflow. Las tarjetas de materias deben estar visibles simultáneamente para reducir carga cognitiva. Layout asimétrico 60%/40% interno en las tarjetas (texto a la izquierda, imagen derecha).

## 2. Paleta y Sistema Glassmorfismo (Modo Claro / Oscuro)
- **Fondos (Backgrounds):**
  - Light Mode: Gris perla muy limpio (`bg-[#F8FAFC]`).
  - Dark Mode: Tonos marinos profundos o casi negros (`dark:bg-[#060B14]`).  
- **Luces de Fondo (Mesh Gradients):** Círculos masivos colisionando con opacidades reducidas y filtros `blur-[150px]`. En Dark mode reducidos a un `opacity-30` global para no deslumbrar.
- **Grillas Arquitectónicas (Blueprint Pattern):** 
  - Estructura base insertada para dar sensación "técnica".
  - Light: `bg-[linear-gradient...,#0230470A_1px...]`
  - Dark: `bg-[linear-gradient...,#ffffff0A_1px...]`
- **Tarjetas Flotantes y Navbar (Glassmorphism Puros):**
  - Base: `bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm`.
  - Dark: `dark:bg-[#0A1121]/80 dark:border-white/10 dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]`.

## 3. Integración Avanzada de Activos Visuales ("Tiernos" y Premium)
- **Ilustraciones:** Estilo *Soft 3D Claymorphism*, iluminación de estudio, sin marcas de agua, ni texto incrustado. Paletas pasteles dominantes que complementan el gradiente UI.
- **"Full-Bleed" Fades (Transiciones sin Recortes):** 
  - Anclaje exacto: `absolute top-0 right-0 w-[60%] h-full object-cover`.
  - Transición Horizontal: Para fusionar la imagen con la tarjeta izquierda se usa `bg-gradient-to-r [ColorFadeBase] via-transparent to-transparent`.
- **Blend Modes:** Uso intensivo de `mix-blend-multiply` en modo claro para destruir los fondos grises/blancos generados por renders y mimetizarlos con el color de base de la tarjeta Tailwind.

## 4. Animaciones CSS Nativas e Interacciones
- **Staggered Load (Montaje Inicial):**
  Se inyectan clases `stagger-0, 1, 2, 3` a las tarjetas ligadas a un `@keyframes slideUpFade` (0px a 40px translateY) con demoras escalonadas de `0.1s`, `0.2s`, iteradas sobre el índice de los mapas.
- **Hover effects en Tarjetas:** 
  - `transition-transform duration-700 ease-out group-hover:scale-105 origin-right`.
  - Luces neón en sombra (Shadow Glow custom) que colorean según la materia elegida. Ej: `shadow-[0_20px_50px_-12px_rgba(33,158,188,0.4)]`.
- **Botones con Shift Activo:**
  - `transform hover:-translate-y-1 hover:translate-x-1 active:scale-95`.
  - Inclusión masiva de transiciones `transition-colors duration-500` para cambios suaves en Dark Mode.

## 5. UI Elements de Apoyo (UX)
- **Scrollbars estilo MacOS:** Personalizados mediante pseudos selectores `::-webkit-scrollbar` para evitar barras grises toscas, adaptándose dinámicamente si posee clase `.dark` la página contenedora.
- **Widgets de Gamificación:** Botones persistentes en la Header que incluyen estado del perfil e iconos redondeados (EJ: `bg-white/70 backdrop-blur-sm shadow-sm`). 
- **Banner de Reanudación ("Quick Resume"):** Layout horizontal aislado en la parte superior que incita la acción directa usando el ultimo historial del usuario.

## 6. Arquitectura de Rutas y Navegación Dinámica (Next.js 15+)
- **Resolución de Promesas en Params:** Para el catálogo dinámico de prácticas `src/app/alumno/laboratorio/[materia]/page.tsx`, se debió adaptar la arquitectura a la versión Next.js 15+ convirtiendo el componente a `async` y resolviendo los parámetros dinámicos mediante `await params` antes de inyectar las métricas de render y catálogos. *(Hacerlo de forma síncrona causa un break point invisible en Server Components).*
- **Flujo de Acceso Mockeado (Demo B2B):** Temporalmente se anuló el algoritmo de verificación en `/login` mediante un bypass de *timeout* (1.2s de simulación de carga) para apuntar directamente a `/alumno/inicio` a fin de agilizar presentaciones comerciales sin necesidad de validación de base de datos activa. El CTA de "Iniciar Sesión" del Landing también funciona como atajo directo opcional.

> **Nota para IAs/Devs futuros:** Nunca revertir el sistema de layout visual Bento Grid 2x2 por un flexbox oculto. Manten la jerarquía tipográfica con variables pesadas (Font-black, Text-5xl) para el balance de áreas blancas expandidas.

