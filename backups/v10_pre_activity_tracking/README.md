# 🧪 CEN LABS - Laboratorios Interactivos de Ciencias

> Plataforma de simulación educativa para prácticas de Química, Física, Biología y Matemáticas.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Prácticas Disponibles](#-prácticas-disponibles)
- [Stack Tecnológico](#-stack-tecnológico)
- [Setup Local](#-setup-local)
- [Variables de Entorno](#-variables-de-entorno)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Documentación](#-documentación)
- [ ] [EXPERIMENTAL PHASE] (Próximamente)
- [x] **[VERSION GOLD v9.0](WALKTHROUGH_GOLD.md)** - Estado Estable Actual
- [Contribuir](#-contribuir)

---

## ✨ Características

- **40 Simulaciones Interactivas** - Prácticas de laboratorio virtuales
- **Motor Maestro de Simulación** - Arquitectura Zustand con persistencia
- **Bitácoras Digitales** - Panel educativo 30% / Simulación 70%
- **Análisis Científico Gold** - Motor de regresión y estadísticas integrado
- **Bilingüismo 2.0 (ES/EN)** - Soporte profundo de idiomas en toda la plataforma
- **Voz Premium Femenina** - Narración automatizada de protocolos
- **Diseño Industrial Premium** - Soft-Claymorphism, Glassmorphism, Dark Mode
- **Audio Engine Programado** - Feedback auditivo para interacciones
- **Soporte Multi-Materia** - Química, Física, Biología, Matemáticas
- **Preparado para Supabase** - Backend opcional con autenticación JWT

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CEN LABS ENGINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐         ┌─────────────────────────────┐  │
│  │   SIDEBAR 30%  │         │      WORKSTAGE 70%         │  │
│  │                 │         │                             │  │
│  │  • Guía         │         │  ┌───────────────────────┐│  │
│  │  • Maestro      │         │  │   PILOTO (Simulación)  ││  │
│  │  • Conceptos    │         │  │                        ││  │
│  │  • Bitácora     │         │  │   Animaciones 60 FPS   ││  │
│  │  • Herramientas  │         │  │   Framer Motion        ││  │
│  │                 │         │  │                        ││  │
│  └─────────────────┘         │  └───────────────────────┘│  │
│                              └─────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    ZUSTAND STORE                        ││
│  │  simuladorStore.ts (1544 líneas)                         ││
│  │  • Timer global     • Estado de 40 prácticas             ││
│  │  • Checkpoints     • Persistencia en localStorage       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
MASTER_DATA (simuladoresData.ts)
        │
        ▼
SimuladorClient.tsx (Motor)
        │
        ├──► renderSimulator() ──► PilotoXXX.tsx
        │
        └──► renderBitacora() ──► BitacoraXXX.tsx
                                        │
                                        ▼
                                useSimuladorStore (Zustand)
                                        │
                                        ▼
                        ┌───────────────┴───────────────┐
                        │                               │
                   localStorage                  /api/resultados
                   (Fallback)                   (Supabase)
```

---

## 🧪 Prácticas Disponibles

### Química (10 prácticas)
| # | Práctica | Descripción |
|---|----------|-------------|
| 1 | Construcción Atómica | Armado de isótopos (Protones, Neutrones, Electrones) |
| 2 | Leyes de los Gases | Cámara de presión (Ley de Gay-Lussac) |
| 3 | Balanceo Estequiométrico | Balanza de masa interactiva |
| 4 | Reactivo Limitante | Síntesis de Haber |
| 5 | Preparación de Soluciones | Molaridad con balanza analítica |
| 6 | Solubilidad y Cristalización | Curvas KNO₃ |
| 7 | Titulación Ácido-Base | Bureta con indicador fenolftaleína |
| 8 | Equilibrio Químico | Principio de Le Châtelier |
| 9 | Celdas Galvánicas | Pila electroquímica |
| 10 | Destilación Fraccionada | Separación etanol/agua |

### Física (10 prácticas)
| # | Práctica | Descripción |
|---|----------|-------------|
| 1 | Tiro Parabólico | Cañón con física realista |
| 2 | Plano Inclinado | Leyes de Newton |
| 3 | Péndulo Simple | Periodo y gravedad |
| 4 | Ley de Hooke | Constante elástica |
| 5 | Colisiones 1D | Conservación de momento |
| 6 | Principio de Arquímedes | Empuje y flotabilidad |
| 7 | Dilatación Térmica | Coeficiente α |
| 8 | Ley de Ohm | Circuito V=I·R |
| 9 | Electrostática | Ley de Coulomb |
| 10 | Motor Eléctrico | Inducción electromagnética |

### Biología (10 prácticas)
| # | Práctica | Descripción |
|---|----------|-------------|
| 1 | Microscopio Virtual | Célula animal/vegetal |
| 2 | Transporte Celular | Ósmosis y tonicidad |
| 3 | Síntesis de Proteínas | Dogma central |
| 4 | Fotosíntesis | Producción de O₂ |
| 5 | Leyes de Mendel | Genética mendeliana |
| 6 | Selección Natural | Polillas del abedul |
| 7 | Sistema Nervioso | Arco reflejo |
| 8 | Electrocardiograma | ECG dinámico |
| 9 | Sistema Digestivo | Enzimas y pH |
| 10 | Dinámica de Poblaciones | Modelo Lotka-Volterra |

### Matemáticas (10 prácticas)
| # | Práctica | Descripción |
|---|----------|-------------|
| 1 | Cuadráticas | Parábolas interactivas |
| 2 | Sistemas 2x2 | Triangulación |
| 3 | Escala Richter | Logaritmos |
| 4 | Teorema de Pitágoras | Geometría dinámica |
| 5 | Círculo Trigonométrico | Ondas sen/cos |
| 6 | Transformaciones | Isometrías y homotecia |
| 7 | Ley de Snell | Refracción |
| 8 | La Derivada | Recta tangente |
| 9 | Sumas de Riemann | Integración numérica |
| 10 | Máquina de Galton | Distribución normal |

---

## 🛠 Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 16.2.1 | Framework |
| React | 19.2.4 | UI Library |
| TypeScript | 5.0 | Tipado |
| Zustand | 5.0.12 | State Management |
| Framer Motion | 12.38.0 | Animaciones |
| Tailwind CSS | 4.0 | Estilos |
| Lucide React | 1.7.0 | Iconos |
| Recharts | 3.8.1 | Gráficos |

---

## 🚀 Setup Local

### Requisitos
- Node.js 20+
- npm / yarn / pnpm

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd cen-dashboard

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev
```

### Build de Producción

```bash
npm run build
npm start
```

---

## 🔐 Variables de Entorno

Ver `.env.example` para configuración completa.

```bash
# Supabase (Opcional)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Seguridad
IP_SALT=tu-ip-salt
```

> **Nota**: La aplicación funciona sin Supabase usando localStorage como fallback.

---

## 📁 Estructura del Proyecto

```
cen-dashboard/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/resultados/          # API routes
│   │   ├── alumno/                   # Rutas de alumno
│   │   │   ├── laboratorio/[materia]/ # Catálogos por materia
│   │   │   └── simulador/[id]/      # Motor de simulación
│   │   └── login/                   # Autenticación
│   │
│   ├── components/
│   │   ├── Piloto*.tsx             # Simulaciones (40)
│   │   └── bitacoras/              # Bitácoras (40)
│   │       └── Bitacora*.tsx
│   │
│   ├── store/
│   │   └── simuladorStore.ts        # Estado global (1544 líneas)
│   │
│   ├── data/
│   │   └── simuladoresData.ts       # MASTER_DATA (40 prácticas)
│   │
│   ├── lib/
│   │   ├── supabase.ts              # Cliente Supabase
│   │   └── mockData.ts              # Datos de prueba
│   │
│   └── utils/
│       └── audioEngine.ts           # Sistema de audio
│
├── public/                           # Assets estáticos
├── GOLD_STANDARD_RULES.md           # Reglas de implementación
├── GDD_PRACTICAS.md                 # Game Design Document
├── ESTANDAR_VISUAL_LABS.md          # Guía de estilos
└── .env.example                     # Variables de entorno
```

---

## 🔧 Desarrollo

### Scripts Disponibles

```bash
npm run dev      # Desarrollo (hot reload)
npm run build    # Build de producción
npm run start    # Iniciar producción
npm run lint     # Linting ESLint
```

### Agregar Nueva Práctica

1. Crear `PilotoNuevaPractica.tsx` en `src/components/`
2. Crear `BitacoraNuevaPractica.tsx` en `src/components/bitacoras/`
3. Agregar datos en `MASTER_DATA` (`simuladoresData.ts`)
4. Registrar en `SimuladorClient.tsx` (switch cases)
5. Definir estado en `simuladorStore.ts`

### Reglas de Oro

Ver `GOLD_STANDARD_RULES.md` para estándares de implementación.

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| `GOLD_STANDARD_RULES.md` | Reglas de implementación del Motor |
| `GDD_PRACTICAS.md` | Game Design Document (Química) |
| `ESTANDAR_VISUAL_LABS.md` | Guía de estilos y UI |
| `NAVEGACION.md` | Mapa de rutas |
| `WHITELABEL_UI_GUIDELINES.md` | Personalización de marca |

### GDDs por Materia

- [x] Química (GDD_PRACTICAS.md)
- [ ] Física (ver `GDD_FISICA.md`)
- [ ] Biología (ver `GDD_BIOLOGIA.md`)
- [ ] Matemáticas (ver `GDD_MATEMATICAS.md`)

---

## 🤝 Contribuir

Ver `CONTRIBUTING.md` para guías de desarrollo.

```bash
# Crear branch
git checkout -b feature/nueva-practica

# Commit con conventional commits
git commit -m "feat: agregar práctica de cinética química"

# Push y PR
git push origin feature/nueva-practica
```

---

## 📄 Licencia

Privado - CEN Labs © 2024-2026

---

## 🔗 Links

- [Documentación Next.js](https://nextjs.org/docs)
- [Zustand Docs](https://zustand-demo.pmnd.rs)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com)
