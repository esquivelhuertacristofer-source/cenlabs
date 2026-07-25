# MEC-74 · Dimensionamiento de Conductores y Protecciones

**Dominio:** D1 Circuitos Eléctricos · Instalaciones eléctricas
**Práctica del backlog:** d1-16 · **Molde:** S (Explora / Selección / Reto)
**Simulador:** `/labs/dimensionamiento-conductor.html`
**Slug de construcción:** `dimensionamiento-conductor`

## Qué enseña

Seleccionar el calibre de un conductor de un circuito derivado monofásico (127 V) cumpliendo **dos
criterios a la vez**:

1. **Ampacidad** — el conductor debe soportar la corriente sin sobrecalentarse: `ampacidad ≥ I`.
2. **Caída de tensión** — a la carga le debe llegar tensión suficiente: `%e = e/V·100 ≤ 3 %`, con
   `e = 2·ρ·L·I / S` (el factor 2 = ida y retorno por dos conductores).

El calibre correcto es el **más delgado** que cumple **ambos**. La lección central: en corridas largas
la **caída** —no la ampacidad— decide el calibre.

## Física (verificada)

- `ρ_Cu = 0.0175 Ω·mm²/m` (cobre a temperatura de operación), `V = 127 V`, límite de caída = 3 %.
- Catálogo de cobre THW 14 AWG → 4/0 con ampacidad de la Tabla 310-15(b)(16) a 75 °C.
- Ampacidad **usable** = valor de tabla, salvo 14/12/10 AWG topados a 15/20/30 A por el **Art. 240.4(D)**
  (por eso un circuito de 20 A usa calibre 12, no 14).
- Reto: `I ∈ {12,16,20,24,30,40} A`, `L ∈ {15,25,35,50,70,90} m` → 36 escenarios, todos con solución en
  catálogo; en 30/36 (83 %) la caída obliga a subir calibre por encima de lo que pediría la ampacidad
  sola (la trampa de dimensionar solo por corriente); respuestas correctas AWG 14→2.

## Verificación en dos capas

1. **Numérica** (`node -e`): fórmula `e=2ρLI/S`, selección por dos criterios, catálogo del Reto (36
   escenarios, todos solubles, dominancia de la caída 30/36).
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): **25 checks OK,
   0 errores de consola** — trampa I=16/L=25 (ampAWG=12 pero mínimo=10 por caída), corrida corta sin
   trampa, sobrecarga de ampacidad, selección conserva estado, Reto aprueba con el mínimo y falla con la
   trampa y con sobredimensionar, 20 escenarios sorteados todos solubles, quiz correcto/incorrecto en los
   3 modos (posiciones barajadas).

## Referencias

NOM-001-SEDE-2022 Art. 310, Tabla 310-15(b)(16), Art. 240.4(D) · Enríquez Harper · NEC 310.16 /
240.4(D) · IEC 60228 · verificación numérica propia.
