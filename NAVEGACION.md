# 🗺️ Mapa de Navegación y Flujo de Usuario - CEN Labs

Este documento define la estructura de rutas y los flujos de navegación para los diferentes roles del sistema (Profesor y Alumno).

---

## 🔓 FASE 1: Zona Pública

**Landing / Login** → `/`

1. El usuario accede a la landing page.
2. Completa el **FORMULARIO** de acceso.
3. El sistema realiza un **REDIRECT** según el rol:
   - **Si rol = 'profesor'** → `/profesor/dashboard`
   - **Si rol = 'alumno'** → `/alumno/inicio`

---

## 👨‍🏫 FASE 2: Flujo del Profesor

Rutas y secuencia de acciones para el perfil docente:

1. **Dashboard Principal:** `/profesor/dashboard`
2. **Gestión de Alumnos:** `/profesor/alumnos` (vía sidebar)
3. **Detalle de Alumno:** `/profesor/alumnos/[id]` (click en alumno)
4. **Modo Instructor (Laboratorios):** `/alumno/inicio` (acceso desde sidebar → Laboratorios)
   - *Nota: Se rehúsa la vista de alumno sin guardar métricas.*
5. **Selección de Materia:** `/alumno/laboratorio/[materia]` (click en materia)
6. **Simulador:** `/alumno/simulador/[id]` (click en práctica)

---

## 👨‍🎓 FASE 3: Flujo del Alumno

Rutas y secuencia de acciones para el perfil estudiante:

1. **Inicio / Hub:** `/alumno/inicio`
2. **Repositorio de Materia:** `/alumno/laboratorio/[materia]` (click en tarjeta de materia)
3. **Simulador:** `/alumno/simulador/[id]` (click en práctica #N)
4. **Finalización de Práctica:**
   - Regresa al repositorio: `/alumno/laboratorio/[materia]`
   - O continúa a la siguiente: `/alumno/simulador/[id+1]`
   - O vuelve al inicio: `/alumno/inicio`

---

## 🗺️ Mapa Visual Completo

```text
                    ┌─────────────┐
                    │  /          │  ← Landing + Login
                    │  (público)  │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼──────┐           ┌──────▼──────┐
       │ /profesor/  │           │  /alumno/   │
       │  dashboard  │           │   inicio    │
       └──────┬──────┘           └──────┬──────┘
              │                         │
       ┌──────▼──────┐           ┌──────▼──────┐
       │ /profesor/  │           │ /alumno/    │
       │  alumnos    │           │ laboratorio │
       │  ?grupo=X   │           │ /[materia]  │
       └──────┬──────┘           └──────┬──────┘
              │                         │
       ┌──────▼──────────────┐          │
       │ /profesor/alumnos/  │          │
       │      [id]           │          │
       └─────────────────────┘    ┌────▼────────┐
                                  │ /alumno/    │
                                  │ simulador/  │
                                  │  [id]       │
                                  └─────────────┘
```

---

## 🔄 Ciclo de Navegación Libre

Ejemplo de navegación fluida:

1. `/alumno/inicio` → Click Química
2. `/alumno/laboratorio/quimica` → Click Práctica 5
3. `/alumno/simulador/quimica-5` → Botón "Volver"
4. `/alumno/laboratorio/quimica` → Click Práctica 8
5. `/alumno/simulador/quimica-8` → Botón "Volver al Hub"
6. `/alumno/inicio` → Click Biología
7. `/alumno/laboratorio/biologia` ... (etc.)
