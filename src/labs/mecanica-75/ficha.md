# MEC-75 · Puesta a Tierra y Resistencia de Tierra

**Dominio:** D1 Circuitos Eléctricos · Instalaciones eléctricas
**Práctica del backlog:** d1-17 · **Molde:** E+S (Ensamble 3D + Suelo/Electrodo/Reto)
**Simulador:** `/labs/puesta-a-tierra-wenner.html`
**Slug de construcción:** `puesta-a-tierra-wenner`

## Qué enseña

Diseñar un sistema de puesta a tierra en dos pasos: **medir** la resistividad del suelo y
**dimensionar** el electrodo para bajar de la resistencia objetivo.

1. **Método de Wenner** — 4 electrodos equidistantes (separación `a`): el telurómetro mide
   `R = ρ/(2πa)` y se despeja `ρ = 2π·a·R`. En suelo homogéneo ρ es constante con `a`.
2. **Fórmula de Dwight** — resistencia de una varilla vertical `R₁ = ρ/(2πL)·[ln(8L/d) − 1]`,
   con `d = 0.0159 m` (copperweld 5/8"). N varillas alejadas en paralelo: `R_N ≈ R₁/N`.
3. **Objetivos** — 25 Ω (general), 10 Ω (deseable), 5 Ω (subestaciones/pararrayos).

Lección central honesta: en suelos muy resistivos (arena seca, roca) ni 8 varillas de 6 m bajan de
25 Ω → hace falta malla, anillo o tratamiento del suelo (bentonita/GEM).

## Física (verificada)

- `dwight(ρ,L) = ρ/(2πL)·[ln(8L/D) − 1]`, `D = 0.0159 m`; `Rn = dwight/N`; Wenner `R = ρ/(2πa)`,
  `ρ = 2π·a·R` (recupera ρ exacto en suelo homogéneo — verificado node -e).
- Suelos (Ω·m): pantano 30, arcilla 100, arena húmeda 200, arena seca 500, roca 1000.
- Catálogos del Reto: `L ∈ {1.5, 3.0, 4.5, 6.0}` m, `N ∈ {1,2,3,4,6,8}`, objetivos `{25, 10, 5}` Ω.
- Regla del mínimo (única): minimizar N y, para ese N, minimizar L tal que `R_N ≤ objetivo`.
- **11 pares (suelo, objetivo) con solución** de los 15 posibles; los 4 imposibles (arena seca y roca
  a ≤10 y ≤5 Ω) se reservan para exploración libre en el modo Electrodo (lección de honestidad).
  Cada par soluble tiene configuración mínima única, confirmada por node -e.

## Verificación en dos capas

1. **Numérica** (`node -e`): convergencia Wenner simplificado↔completo, grid de Dwight por suelo y
   longitud, y los 11 pares del Reto con configuración mínima única y minimal (la config con menos N o
   menor L falla el objetivo).
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): pendiente
   de ejecutar en esta sesión (mismo patrón que d1-16: three.js por CDN import map, `file://` falla CORS).

## Referencias

NOM-001-SEDE-2022 Art. 250 · IEEE 81 (medición) · IEEE 142 / fórmula de Dwight · NOM-022-STPS-2015 ·
resistividades de suelo de rangos típicos de literatura · verificación numérica propia.
