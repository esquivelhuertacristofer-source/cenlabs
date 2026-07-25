# MEC-76 · Coordinación de Protecciones y Curvas Tiempo-Corriente

**Dominio:** D1 Circuitos Eléctricos · Instalaciones eléctricas
**Práctica del backlog:** d1-18 · **Molde:** S (pizarrón log-log: Explora / Coordinación / Reto) — **CIERRA D1 18/18**
**Simulador:** `/labs/coordinacion-protecciones.html`
**Slug de construcción:** `coordinacion-protecciones`

## Qué enseña

Leer y usar la curva tiempo-corriente de un interruptor termomagnético miniatura (MCB) para
proteger un circuito y coordinar dos interruptores en serie.

1. **Dos mecanismos** — térmico (bimetálico, sobrecarga, retardo inverso) y magnético (electroimán,
   cortocircuito, instantáneo ~10 ms). El umbral magnético define el **tipo de curva**: B (3–5× In),
   C (5–10× In), D (10–20× In).
2. **Energía pasante I²t = I²·t** — a menor tiempo de disparo, menos energía estresa al cable.
3. **Selección de In** por `Ib ≤ In ≤ Iz` y **de curva** por el pico de arranque m (m<3:B, 3≤m<5:C, 5≤m<10:D).
4. **Coordinación / selectividad** — el derivado debe disparar antes que el general en todo el rango.

Lección central honesta: la selectividad MCB-MCB en cortocircuito **no es automática** — si ambos
alcanzan su umbral magnético con la misma falla, disparan juntos (~10 ms) y se pierde la coordinación;
la general necesita un umbral bastante mayor (más In y/o curva más alta).

## Física (verificada node -e)

- **Térmico:** `t(x) = kT/(x²−xp²)` con `x=I/In`, `xp=1.13` (no-disparo convencional), `kT=110`
  (ajustado a las compuertas IEC 60898). Verificado: 1.13×→∞ (no dispara); 1.45×→133 s (<1 h);
  2.55×→21 s (en [1,60] s).
- **Magnético:** disparo instantáneo (0.01 s) si `x ≥ Im`, con `Im = 5 / 10 / 20` para B/C/D.
- **Energía pasante:** `I²t = I²·t_disparo`. A una falla de 15× In, B/C disparan magnético
  (I²t≈576 A²s) pero D sigue térmico (I²t≈28321 A²s, ~50× más): elegir D "por si acaso" sacrifica
  la protección de cortocircuito.
- **Oráculos del Reto:** `bestIn(Ib,Iz)` = menor In normalizado con Ib≤In≤Iz; `bestCurve(m)` =
  primera curva con m < umbral bajo (m<3:B, 3≤m<5:C, 5≤m<10:D; m≥10: ninguna estándar). Catálogo
  In = {6,10,16,20,25,32,40} A. 6 escenarios de carga, todos solubles (m<10).
- **Selectividad (modelo honesto):** la selectividad MCB-MCB es TOTAL solo hasta la corriente de
  disparo instantáneo de la general `Is = In_general · Im_general`; por encima de Is ambos alcanzan el
  piso magnético (~10 ms) y la discriminación ya no la garantizan las curvas (se necesita tabla del
  fabricante o limitación de corriente). Verificado por barrido de corriente de falla: 16A-C / 40A-D →
  selectivo hasta Is=800 A; 16A-C / 25A-C → selectivo hasta Is=250 A; 16A-C / 16A-C → no coordina (la
  general no supera a la derivada). Subir el In y/o la curva de la general amplía el rango selectivo.

## Verificación en dos capas

1. **Numérica** (`node -e`): ajuste térmico a las compuertas 1.13/1.45/2.55× In; comparación de I²t
   por curva ante una misma falla; unicidad de `bestIn`/`bestCurve` en los 6 escenarios; barrido de
   selectividad de pares selectivo/no selectivo.
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): three.js
   por CDN import map (file:// falla por CORS).

## Referencias

IEC 60898-1 (MCB, curvas B/C/D) · NOM-001-SEDE-2022 Art. 240 (protección contra sobrecorriente) ·
IEC 60947-2 (interruptores industriales) · Enríquez Harper, *Protección de instalaciones eléctricas*
(Limusa) · verificación numérica propia.
