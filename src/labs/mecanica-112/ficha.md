# MEC-112 · Contrasta el ciclo Diésel y el autoencendido contra el techo ideal

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-02 — *Contrasta el ciclo Diésel y el autoencendido* (molde S+P)
- **Simulador:** `/labs/ciclo-diesel-autoencendido.html`
- **Slug:** `ciclo-diesel-autoencendido`
- **Ancla curricular:** AUT-Y motores · UAX Termodinámica
- **Fuentes de referencia:** Heywood, *Internal Combustion Engine Fundamentals* (1988, caps. 10, 11 y 13) · Hardenberg y Hase, SAE 790493 (1979) · Livengood y Wu, *5th Symposium on Combustion* (1955) · Watson, Pilley y Marzouk, SAE 800029 (1980) · Woschni, SAE 670931 (1967) · Chen y Flynn, SAE 650733 (1965) · Brunt, Rai y Emtage, SAE 981052 (1998) · EN 590 y ASTM D975 (especificación del gasóleo) · EN 116 (punto de obstrucción de filtro en frío)

---

## Qué enseña

1. Que **el ciclo Diésel no tiene un techo ideal: tiene tres, y la diferencia entre ellos es la lección**. En el compacto urbano a r = 16, con el **mismo calor** y la **misma compresión**, el aire frío promete **58,88 %** si el calor entra a presión constante, **61,91 %** si entra como en el ciclo **dual de Seiliger** —parte a volumen constante, parte a presión constante— y **67,01 %** si entrara todo a volumen constante, como en un Otto. El motor real de ese punto da **46,44 %** indicado y **38,29 %** al freno.
2. Que **esos 28,72 puntos de brecha se reparten y cada tramo tiene causa**: **5,10** por quemar a presión y no a volumen constante, **3,03** más por hacerlo de forma progresiva en vez de instantánea —eso es exactamente lo que separa el dual del Diésel puro—, **1,62** porque la admisión cierra a **−140° ATDC** y quien gobierna es la relación efectiva `r_ef = 14,731`, **10,83** por la combustión real y las pérdidas de Woschni, y **8,14** por bombeo, fricción y bomba de inyección.
3. Que **la bomba de inyección se paga y casi nunca se contabiliza**. El trabajo de bombear el combustible al riel es **0,479 bar** de presión media en el urbano —el **21,1 %** de todo su rozamiento— y **0,489** en la camioneta —el **21,2 %**—, frente a **0,154 bar** y el **9,1 %** del tractor atmosférico, que inyecta a 1 000 bar en lugar de a 1 800.
4. Que **en un Diésel el encendido no se ordena: se espera**. El retardo se integra con **Livengood-Wu** sobre **Hardenberg-Hase**, cuya energía de activación depende del cetano: `E_a = 618 840/(CN + 25)` vale **7 833,4 · 8 142,6 · 8 716,1 · 9 236,4 J/mol** para CN 54, 51, 46 y 42. En las cinco soluciones firmadas el retardo va de **2,42° a 3,68°** de cigüeñal.
5. Que **el ruido lo hace la masa que entró mientras el motor no se había encendido todavía**. Esa fracción premezclada β vale **0,095 a 0,159** en las cinco soluciones firmadas —y hasta **0,361** en la rejilla completa—, quema con un pico de Wiebe rápido y produce el gradiente `dp/dθ` que mide el acelerómetro del banco.
6. Que **con calor idéntico el combustible sigue decidiendo**. Los cuatro gasóleos del urbano queman exactamente **1 143,6 J**, y aun así el B20 inyecta **28,25 mg** y el marino **27,06 mg**; el retardo va de **3,61°** (B20, CN 54) a **3,84°** (marino, CN 42) y el ruido de **9,75** a **10,45 bar/°**. El ranking de ruido **sigue al cetano, no a la masa**. Y el más ruidoso es además el más eficiente: **38,48 %** frente a **38,29 %**.
7. Que **subir el riel no multiplica el caudal: lo multiplica por su raíz**. De 600 a 1 800 bar el gasto pasa de **14,2892 a 25,6415 g/s**, un factor **1,7945** —lineal daría 3,0000—, porque Bernoulli manda `√(p_iny − p_SOI)` y la contrapresión en el instante de inyectar son **59,5 bar** en las cuatro. El retardo **no se mueve**: 3,66° en las cuatro presiones. Lo que cambia es la duración: de **41,10° a 22,90°**, y con ella la eficiencia al freno de **28,79 a 38,29 %**.
8. Que **las dos ayudas de arranque en frío no se suman igual**. La rejilla calienta el aire **antes** de comprimirlo, así que sus **50,5 K** llegan al PMS multiplicados por `r_ef^(n−1) = 2,673` convertidos en **135,0 K**; con el γ = 1,4 del libro parecerían **165,0 K**, un regalo fantasma de **30,0 K**. La bujía incandescente del urbano añade **178,7 K después** de comprimir y no se multiplica por nada. Con la misma rejilla, el mismo gasóleo y los mismos −5 °C, el tractor a **r = 14 se queda 8,0 K corto y no arranca**, y a **r = 21 sobra por 98,7 K**: la compresión es la primera bujía.
9. Que **un pliego son seis criterios simultáneos, y el que decide no es el que más tumba**. De los **3 200** puntos de la rejilla sólo **1 460** son mecánicamente construibles y sólo **202** pasan los seis. La fase tumba **805** y decide **73**; el escape tumba **568** y decide **35**; el par tumba **446** y decide apenas **13**; el ruido tumba sólo **166** y decide **23**. Y el **arranque en frío** —el criterio que ningún banco de rodillos mide— tumba **750** y decide él solo **204**, más que los otros cinco juntos.

---

## Lógica (verificada en `scratchpad/motor_diesel.mjs` + `test_diesel.mjs`, 279 937 comprobaciones, 0 fallos)

### Constantes selladas

| Símbolo | Valor | Qué es |
|---|---|---|
| `TH_IVC` / `TH_EVO` | −140° · +130° ATDC | Ventana del ciclo cerrado: cierre de admisión y apertura de escape |
| `H_PASO` | 0,5° de cigüeñal | Paso del RK4 — **540 pasos, 541 puntos** por ciclo |
| `R_GAS` / `P_ATM` | 287 J/(kg·K) · 101 325 Pa | Gas ideal de la carga; presión de referencia del retardo |
| `CP_FRIO` / `CV_FRIO` / `G_FRIO` | 1 005 · 718 J/(kg·K) · 1,4 | **Sólo** para los tres techos ideales de aire frío y para el contraste del arranque |
| `HH_A` · `HH_B` | 0,36 · 0,22 | Hardenberg-Hase: `τ[°] = (0,36 + 0,22·S_p)·exp[E_a/(R·T)·…]` |
| `HH_EA` / `HH_CN0` | 618 840 · 25 | `E_a = 618 840/(CN + 25)` en J/mol — el cetano entra **aquí** |
| `HH_TREF` · `HH_P0` · `HH_PC` · `HH_PMIN` | 17 190 · 21,2 · 12,4 · 12,6 | Términos de temperatura y de presión de la correlación original |
| `A_PREM` / `M_PREM` | 6,908 · 2,0 | Wiebe premezclado: exponente **m + 1 = 3**, y se **corta** al agotarse |
| `A_DIF` / `M_DIF` | 2,50 · 0,55 | Wiebe difusivo: exponente **m + 1 = 1,55**, **sin corte** |
| `D_P0` / `D_P1` | 3,2 · 0,85 | Duración del pico premezclado: `Δθ_P = 3,2 + 0,85·θ_ret` |
| `K_SPR` / `D_MIX` | 1,55 · 14,0 | Duración de la cola difusiva: `Δθ_D = 1,55·θ_iny + 14,0·√(S_p/10)` |
| `K_PREM` · `BETA_MIN` · `BETA_MAX` | 0,85 · 0,02 · 0,95 | Fracción de la dosis del retardo que llega a premezclarse, con sus topes |
| `C1_WOS` / `C2_WOS` / `N_MOT` | 2,28 · 3,24·10⁻³ · 1,35 | Woschni y el politrópico de la presión de arrastre que lo alimenta |
| `ETA_COMB` | 0,985 | Combustión incompleta e intersticios |
| `TH_TARDE` / `K_TARDE` | 40° · 0,0050 | Penalización por CA90 tardío: `1 − 0,005·(CA90 − 40)` |
| `CF_A…CF_D` | 0,55 · 0,0060 · 0,0450 · 0,00080 | Chen-Flynn en bar, bar/bar, bar/(m/s) y bar/(m/s)² |
| `K_FUGA` / `ETA_BOM` | 2,2 · 0,72 | Sobrecaudal y rendimiento de la bomba de inyección → `fmep_iny` |
| `N_HI` / `DN_ARR` / `RPM_ARR` | 1,37 · 0,17 · 140 rpm | Politrópico **declarado** de arrastre en frío: `n = 1,37 − 0,17·(140/rpm)^0,5` |
| `TAI_0` · `TAI_K` · `TAI_CN0` | 735 K · 6,0 · 45 | Umbral térmico de autoinflamación: `T_AI = 735 − 6·(CN − 45)` |
| `LAM_HUMO` | 1,25 | Límite clásico de humo de un DI — **se declara y se mide, nunca decide** |
| `K_PORT` | 0,78 | Pérdida en el conducto hasta la brida del colector |
| `ANIOS` | 5 | Horizonte del coste de propiedad |
| `R_G` · `SOI_G` · `PINY_G` | 14…21 · 2·6·10·14·18° · 600·1 000·1 400·1 800 bar | La rejilla: **3 200** combinaciones, **1 460** mecánicamente construibles |

### El ciclo cerrado, paso a paso

| Magnitud | Expresión | Qué decide |
|---|---|---|
| Volumen | `V(θ) = V_c + A_p·(L + a − a·cos θ − √(L² − a²·sen²θ))` | Biela-manivela exacto: la asimetría compresión/expansión es real |
| Relación efectiva | `r_ef = V(−140°)/V_c` | **12,895 a 19,310** en la rejilla, frente a las nominales 14 a 21 |
| γ del gas | `γ = (1 − x_p)·γ_aire(T) + x_p·γ_q(T)` | `γ_aire(300 K) = 1,400`; `γ_q(2 500 K) = 1,251` (Brunt-Rai-Emtage) |
| c_p del aire | Tabla interpolada | **1 002,5 J/(kg·K)** a 200 K y **1 274,0** a 2 500 K: no es una constante |
| Caudal de inyector | `ṁ = n_or·C_d·A_or·√(2·ρ·Δp)` | Bernoulli: el caudal va con **la raíz** de la diferencia de presiones |
| Retardo | `1/τ` integrado desde el SOI hasta que `∫dt/τ = 1` (Livengood-Wu) | Cuándo empieza a arder — **2,126° a 8,245°** en la rejilla |
| Premezclado | `β = mín(m_comb, ṁ·t_ret)·0,85/m_comb`, acotado a [0,02 · 0,95] | Cuánta masa entró antes del encendido — **0,050 a 0,361** |
| Quemado | `x_b = β·Wiebe_P + (1 − β)·Wiebe_D` | Pico premezclado **cortado** + cola difusiva **sin cortar** |
| Calor a pared | `h_c = 3,26·B^(−0,2)·p^0,8·T^(−0,55)·w^0,8` | Woschni, evaluado **en cada subpaso del RK4** |
| Fase | CA10, CA50 y CA90 por bisección de 60 pasos sobre `x_b` | El criterio de fase del pliego mira **CA50** |
| Presiones medias | `bmep = imep_g − pmep − fmep_mec − fmep_iny` | Todo el laboratorio razona como el taller: en bar |
| Escape | Punto fijo sobre `T_esc` hasta 0,05 K; `T_brida = T_par + (T_esc − T_par)·0,78` | Lo que ve el termopar de la brida, no lo que hay en el cilindro |

> **La convergencia está medida, no supuesta —y aquí es peor que en el ciclo Otto, así que se dice**: bajar el paso de 0,5° a 0,25° mueve la eficiencia al freno **0,0435 puntos** y la presión de pico **0,1229 bar** en el punto de referencia del urbano; bajar de 0,25° a 0,125° la mueve ya sólo **0,0005 puntos**. El punto fijo de la temperatura de escape converge en **1 a 4 iteraciones** en las **1 460** configuraciones construibles, con un residuo máximo de **0,04996 K** y ninguna sin converger.

### Las cinco máquinas

| Máquina | V_d × cil. | D/S · biela | rpm · S_p | p_adm · T_adm | Inyector | Ayuda en frío · T_hom | Carga anual |
|---|---|---|---|---|---|---|---|
| Tractor 3,3 L DI atmosférico | 1 100,1 cm³ × 3 | 104,0/129,5 · 208 mm | 2 200 · 9,50 m/s | 97 kPa · 315 K | 5 × 167,0 µm · C_d 0,72 | Rejilla · **−5 °C** | 34 000 kWh |
| Camioneta 2,8 L CRDi turbo | 699,5 × 4 | 94,0/100,8 · 162 | 2 600 · 8,74 | **200** · 320 | 7 × 143,5 · 0,75 | Bujías · **−20 °C** | 19 000 |
| Planta de emergencia 6,0 L | 1 000,4 × 6 | 108,0/109,2 · 176 | 1 800 · 6,55 | 180 · 318 | 6 × 148,7 · 0,75 | Ambas · **−15 °C** | **380 000** |
| Compacto urbano 1,5 L CRDi | 375,2 × 4 | 75,5/83,8 · 135 | **3 600** · **10,06** | 190 · 315 | 8 × 98,6 · **0,78** | Bujías · **−25 °C** | 8 400 |
| Motor marino 9,0 L | 1 500,4 × 6 | 128,0/116,6 · 190 | **1 500** · **5,83** | **220** · 322 | 8 × 143,9 · 0,75 | Agua · **+5 °C** | 352 000 |

Y su pliego, que es lo que decide si una calibración se firma:

| Máquina | r ≤ | p_iny ≤ | p_máx | dp/dθ ≤ | T_brida ≤ | bmep ≥ | Ventana de CA50 | Calor por ciclo |
|---|---|---|---|---|---|---|---|---|
| Tractor | **21** | **1 000 bar** | 95 bar | **8,6 bar/°** | 850 K | 6,45 bar | 4°–14° | 2 036 J |
| Camioneta | 18 | 1 800 | **150** | **12,5** | 800 | 11,60 | 4°–14° | 2 210 |
| Planta | 17 | 1 400 | 130 | 10,0 | 775 | 10,25 | 4°–14° | 2 750 |
| Urbano | 17 | 1 800 | 125 | 10,5 | **808** | 10,30 | **4°–16°** | **1 161** |
| Marino | **16** | 1 600 | 140 | **9,4** | **772** | **12,10** | 4°–14° | **4 805** |

### Los cuatro combustibles

| Combustible | CN | PCI | ρ | AFR est. | CFPP | Precio | `E_a` | `T_AI` |
|---|---|---|---|---|---|---|---|---|
| Gasóleo urbano bajo azufre | 51 | 42,7 MJ/kg | 0,832 kg/L | 14,50 | **−28 °C** | 1,35 €/L | 8 142,6 J/mol | 699,0 K |
| Gasóleo agrícola | 46 | 42,6 | 0,838 | 14,48 | **−4** | **0,92** | 8 716,1 | 729,0 |
| Biodiésel B20 | **54** | **41,1** | 0,845 | **14,02** | −18 | **1,48** | **7 833,4** | **681,0** |
| Gasóleo marino | **42** | **42,9** | **0,855** | **14,55** | −6 | **0,78** | **9 236,4** | **753,0** |

> El cetano entra **dos veces y en direcciones opuestas**: baja la energía de activación —el B20 se enciende antes— y baja el umbral térmico de arranque en frío. Por eso el B20 tiene el **mayor margen térmico** de los cuatro a −20 °C (**144,9 K**) y aun así **no arranca**: su punto de obstrucción de filtro está a −18 °C.

### Los tres techos y la realidad: urbano a r = 16, SOI 10° y 1 800 bar

| Escalón | Valor | Lo que se pierde |
|---|---|---|
| Techo Otto (calor a volumen constante) | 67,01 % | — |
| Techo dual de Seiliger (α = 1,279) | 61,91 % | **5,10 pts** por quemar a presión y no a volumen constante |
| Techo Diésel puro (r_c = 2,539) | 58,88 % | **3,03 pts** por quemar progresivamente y no de golpe |
| Techo Diésel con r_ef = 14,731 | 57,26 % | **1,62 pts** porque la admisión cierra a −140°, no en el PMI |
| **η indicada del ciclo real** | **46,44 %** | **10,83 pts** de combustión real, γ variable y Woschni |
| **η al freno** | **38,29 %** | **8,14 pts** de bombeo, fricción y bomba de inyección |

> El escalón de **5,10 puntos** entre el Otto y el dual es la respuesta numérica a la pregunta que nadie contesta en clase: *si el Diésel comprime más, ¿por qué su ciclo ideal rinde menos que el del Otto a igual compresión?* Porque una parte del calor entra mientras el pistón ya está bajando, y el gas se expande **desde un volumen mayor**: en este punto la expansión efectiva del Diésel puro es **6,302** y la del dual **7,814**, frente a los **16** del Otto.

### El retardo, medido: cinco soluciones firmadas

| Máquina | r / SOI / p_iny / combustible | θ_ret | β | Δθ_P | Δθ_D | CA10 / CA50 / CA90 | dp/dθ | λ |
|---|---|---|---|---|---|---|---|---|
| Tractor | **21 / 6° / 1 000 / marino** | **3,68°** | **0,159** | **6,33°** | 44,16° | 0,48 / 13,72 / **37,50** | 7,88/8,6 | 1,555 |
| Camioneta | **18 / 6° / 1 800 / urbano** | 2,94 | 0,141 | 5,70 | **40,65** | −0,42 / 12,09 / 33,83 | 12,27/12,5 | 1,843 |
| Planta | **17 / 6° / 1 400 / urbano** | 2,44 | 0,110 | — | — | — / 12,22 / — | 9,32/10,0 | 1,919 |
| Urbano | **16 / 10° / 1 800 / urbano** | 3,66 | 0,136 | 6,31 | **49,54** | −3,32 / 12,25 / **38,70** | 10,08/10,5 | 1,813 |
| Marino | **15 / 10° / 1 400 / marino** | **2,42** | **0,095** | — | — | — / 9,89 / — | 9,39/9,4 | **1,991** |

> **Ninguna de las cinco paga la penalización por quemar tarde**: sus CA90 van de 33,14° a 38,70°, todos por debajo del umbral de 40°, así que `penTarde = 1,0000` en las cinco. No es que la penalización no exista —en la rejilla completa baja hasta **0,8174**—: es que **el criterio de fase del pliego ya obliga a quemar pronto**, y ésa es justamente la lección. Y el **margen de humo** va de **0,305 a 0,741** sobre λ = 1,25 en las cinco: se mide y se declara en pantalla, pero **no es un criterio**, porque el banco pide una energía fija por ciclo y con la dosis fija λ apenas se mueve.

### Las cinco soluciones firmadas, por dentro

| Máquina | r_ef | Q | m_comb | p_máx @ θ | T_máx | T_brida | imep_g | bmep | Par | Potencia | η ind. | η freno | bsfc | Coste 5 años |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tractor | **19,310** | 2 005,5 J | 47,46 mg | 81,4 bar @ 5,5° | **1 888 K** | 823 K | 8,757 | 6,955 | 182,6 N·m | 42,1 kW | 47,31 % | 37,58 % | 223,3 g/kWh | 34 634 € |
| Camioneta | 16,563 | 2 176,8 | 51,76 | **136,3** @ 7,0 | 1 795 | 777 | **15,225** | **12,664** | 282,0 | 76,8 | **48,19** | **40,08** | **210,3** | 32 422 |
| Planta | 15,646 | 2 708,8 | 64,40 | 112,8 @ 7,5 | 1 745 | 756 | 12,990 | 10,903 | 520,8 | 98,2 | 47,26 | 39,66 | 212,6 | **655 325** |
| Urbano | 14,731 | 1 143,6 | **27,19** | 117,9 @ 6,5 | 1 754 | 797 | 14,370 | 11,851 | **141,5** | 53,4 | **46,44** | **38,29** | 220,2 | **15 004** |
| Marino | **13,810** | **4 732,9** | **112,00** | 126,6 @ 7,5 | **1 734** | 755 | 14,892 | 12,720 | **911,2** | **143,1** | 46,50 | 39,72 | **211,3** | 339 232 |

Y el reparto de la brecha entre el techo Otto y el freno, máquina a máquina:

| Máquina | Otto ideal | → dual | → Diésel | → r_ef | → indicada | → freno | Brecha total |
|---|---|---|---|---|---|---|---|
| Tractor | **70,41 %** | 5,75 | 1,96 | 1,50 | **13,89** | **9,74** | **32,84 pts** |
| Camioneta | 68,53 | 5,23 | 2,08 | 1,53 | 11,49 | 8,11 | 28,45 |
| Planta | 67,80 | 5,32 | 2,08 | 1,55 | 11,60 | 7,59 | 28,14 |
| Urbano | 67,01 | 5,10 | 3,03 | 1,62 | 10,83 | 8,14 | 28,72 |
| Marino | **66,15** | **4,55** | **3,19** | 1,62 | **10,29** | **6,78** | **26,43** |

> El tractor tiene **el techo ideal más alto del banco** (70,41 %, porque comprime a 21) y **la brecha más grande** (32,84 puntos): comprimir más sube el techo y encarece todo lo que hay debajo. Es el mismo motor que, con la misma rejilla y el mismo gasóleo, **no arrancaría a r = 14**.

### Dónde se va el trabajo: presiones medias

| Máquina | imep_g | − pmep | − fmep mecánico | − fmep de inyección | = bmep | La inyección es… |
|---|---|---|---|---|---|---|
| Tractor | 8,757 | 0,110 | 1,538 | **0,154** | 6,955 | **9,1 %** del rozamiento |
| Camioneta | 15,225 | 0,250 | 1,822 | **0,489** | 12,664 | **21,2 %** |
| Planta | 12,990 | 0,200 | 1,556 | 0,331 | 10,903 | 17,5 % |
| Urbano | 14,370 | 0,250 | 1,791 | 0,479 | 11,851 | **21,1 %** |
| Marino | 14,892 | 0,200 | 1,599 | 0,373 | 12,720 | 18,9 % |

### Mismo calor, cuatro combustibles: urbano a r = 16, SOI 10° y 1 800 bar

Los cuatro queman **exactamente 1 143,6 J**. Lo único que cambia es el combustible.

| Combustible | CN | m_comb | ṁ | θ_iny | θ_ret | β | dp/dθ | CA50 | η al freno |
|---|---|---|---|---|---|---|---|---|---|
| Gasóleo urbano | 51 | 27,19 mg | 25,6415 g/s | 22,90° | 3,66° | 0,136 | 10,08 | 12,25° | 38,29 % |
| Agrícola | 46 | 27,25 | — | — | 3,75 | 0,139 | 10,23 | 12,23 | 38,33 |
| B20 | **54** | **28,25** | — | — | **3,61** | 0,130 | **9,75** | **12,76** | **38,06** |
| Marino | **42** | **27,06** | — | — | **3,84** | **0,145** | **10,45** | **11,95** | **38,48** |

> El B20 es el que **más masa** inyecta —tiene el poder calorífico más bajo— y el **más silencioso**; el marino es el que **menos masa** inyecta y el **más ruidoso**, y además el **más eficiente** de los cuatro. Quien manda en el ruido es el **cetano**, porque decide cuánto tiempo sigue entrando combustible antes de que arda nada.

### El riel no adelanta la combustión: la acorta. Urbano a r = 16 y SOI 10°

En las cuatro presiones el gas está a **59,5 bar** cuando se abre el inyector, así que el retardo es **el mismo: 3,66°**.

| p_iny | ṁ | θ_iny | Δθ_D | CA90 | penTarde | fmep_iny | dp/dθ | η al freno | bsfc |
|---|---|---|---|---|---|---|---|---|---|
| 600 bar | 14,2892 g/s | **41,10°** | 77,75° | **65,75°** | **0,8712** | 0,160 | 5,43 | **28,79 %** | **292,8** |
| 1 000 | 18,8490 | 31,16 | 62,33 | 51,02 | 0,9449 | 0,266 | 7,37 | 34,35 | 245,5 |
| 1 400 | 22,5030 | 26,10 | 54,49 | 43,48 | 0,9826 | 0,373 | 8,87 | 37,04 | 227,6 |
| 1 800 | **25,6415** | **22,90** | 49,54 | 38,70 | **1,0000** | **0,479** | **10,08** | **38,29** | **220,2** |

> Triplicar la presión multiplica el caudal por **1,7945**, que es exactamente `√((1 800 − 59,5)/(600 − 59,5))`. Si el caudal fuese lineal con la presión, el factor sería **3,0000**. Y la factura tiene dos partidas: la bomba pasa de costar **0,160** a **0,479 bar** de presión media, y el ruido de **5,43** a **10,08 bar/°**. Se gana igualmente **9,50 puntos** de eficiencia al freno.

### El muro cambia de nombre según el mando

Barrido de compresión en el urbano (SOI 10°, 1 800 bar, gasóleo urbano):

| r | η al freno | p_máx | dp/dθ | T_brida | Veredicto |
|---|---|---|---|---|---|
| 14 | 37,62 % | 102,1 bar | 8,86 | **812 K** | **Falla el escape** (límite 808) |
| 15 | 38,00 | 109,9 | 9,54 | 804 | **Válida** |
| 16 | 38,29 | 117,9 | 10,08 | 797 | **Válida** |
| 17 | **38,53** | **125,9** | **10,75** | 790 | **Falla ruido y presión** |

Barrido de inicio de inyección en el urbano (r = 16, 1 800 bar, gasóleo urbano):

| SOI | CA50 | dp/dθ | p_máx | η al freno | Veredicto |
|---|---|---|---|---|---|
| 2° | 20,30° | 7,03 | — | 35,15 % | Falla fase y escape |
| 6° | 16,28 | 8,74 | — | 36,99 | Falla fase |
| 10° | 12,25 | 10,08 | 117,9 | 38,29 | **Válida** |
| 14° | 8,22 | 10,87 | 129,8 | **38,55** | Falla ruido y presión |
| 18° | 4,19 | 11,04 | 141,3 | 38,25 | Falla ruido y presión |

> Adelantar la inyección **también alarga el retardo** —de 3,50° a 4,27° en este barrido—, porque el inyector abre antes, cuando el aire todavía está más frío y menos comprimido. Por eso la ventana de fase se estrecha por los dos lados: tarde se quema mal y pronto se rompe.

### El arranque en frío, cada máquina a su temperatura de homologación

| Máquina | Ayuda | t | rpm | T_hom | n | ΔT rejilla | ΔT bujía | T en el PMS | T_AI | Margen |
|---|---|---|---|---|---|---|---|---|---|---|
| Tractor | Rejilla | 20 s | 200 | −5 °C | 1,3321 | **50,5 K** | — | 851,7 K | 753,0 | **+98,7 K** |
| Camioneta | Bujías | 8 s | 220 | −20 °C | 1,3354 | — | **176,8 K** | 825,9 | 699,0 | **+126,9** |
| Planta | Ambas | 15 s | 180 | −15 °C | 1,3271 | 35,0 | 142,5 | 863,2 | 699,0 | **+164,2** |
| Urbano | Bujías | 6 s | 250 | −25 °C | 1,3389 | — | 178,7 | 796,1 | 699,0 | +97,1 |
| Marino | Agua | 900 s | 150 | **+5 °C** | 1,3212 | 58,9 | — | 783,3 | 753,0 | **+30,3** |

> El motor marino es el que menos margen tiene (**30,3 K**) **a pesar** de homologar a +5 °C, porque quema gasóleo marino de CN 42, el de umbral más alto del banco (753,0 K). Y el criterio de arranque **no le falla ni una vez** en sus 180 configuraciones: es el único criterio del pliego con cero bajas en una máquina, y se dice en la ficha en lugar de disimularlo.

Y el contraste que da nombre a la práctica —misma rejilla, mismo gasóleo marino, mismos −5 °C, sólo cambia la compresión:

| Tractor | r_ef | Multiplicador `r_ef^(n−1)` | ΔT en el PMS | T en el PMS | Margen | ¿Arranca? |
|---|---|---|---|---|---|---|
| r = 14 | 12,902 | 2,338 | 118,1 K | 745,0 K | **−8,0 K** | **NO** |
| r = 21 | 19,310 | **2,673** | **135,0 K** | 851,7 K | **+98,7 K** | **SÍ** |

> Con el γ = 1,4 del libro, esos 50,5 K de rejilla parecerían **165,0 K** en el PMS en lugar de 135,0: un **regalo fantasma de 30,0 K** que este simulador no se cobra, porque usa el politrópico declarado de arrastre. Y compárese con la bujía del urbano, que añade **178,7 K después** de comprimir: más grados, pero sin multiplicar.

### Los seis criterios y el censo del pliego

Rejilla completa: **5 máquinas × 8 relaciones × 5 inicios × 4 presiones × 4 combustibles = 3 200**, de las que **1 460** caben en la máquina —cada motor tiene su `r_máx` y su presión de riel máxima—. Pasan los seis a la vez **202**, el **13,8 %**.

| Criterio | Qué mide | Tumba | Decide él solo |
|---|---|---|---|
| Fase de la combustión | CA50 dentro de la ventana del pliego | **805** | **73** |
| Gradiente de presión | `dp/dθ ≤ dp_lím` (el acelerómetro) | **166** | 23 |
| Presión máxima | Pico contra el límite del bloque | 173 | **19** |
| Temperatura de escape | Brida del colector contra su límite | 568 | 35 |
| Par entregado | `bmep ≥ bmep_mín` | 446 | **13** |
| Arranque en frío | Enciende **y** el combustible fluye a T_hom | **750** | **204** |

Repartido por máquina (bajas totales / suspensos en solitario):

| Máquina | Construibles | Válidas | Fase | Ruido | Presión | Escape | Par | Frío |
|---|---|---|---|---|---|---|---|---|
| Tractor | 320 | 75 | 167/35 | 37/10 | 23/3 | 117/14 | 80/**0** | 90/28 |
| Camioneta | 400 | 31 | 208/11 | 54/2 | 57/3 | 150/6 | 97/1 | **300/91** |
| Planta | 240 | 42 | 132/12 | 26/4 | 28/1 | 87/5 | 61/**0** | 120/40 |
| Urbano | 320 | **15** | 193/5 | 29/**0** | 45/4 | 138/5 | 122/**0** | 240/45 |
| Marino | 180 | 39 | 105/10 | 20/7 | 20/8 | 76/5 | 86/12 | **0/0** |

> El **par** tumba 446 combinaciones en todo el banco y decide sólo **13**, y en **tres máquinas de cinco no decide ni una vez**: cuando falta par, casi siempre falla algo más. El **ruido** hace lo contrario: tumba la sexta parte que la fase y aun así decide 23 veces. Y el **arranque en frío** es el criterio con el reparto más desigual del banco: **300 bajas y 91 decisiones en solitario** en la camioneta y **cero** en el motor marino, que homologa a +5 °C.

Por qué la camioneta es el caso duro: a **−20 °C**, con r = 18, sus cuatro combustibles llegan **exactamente a los mismos 825,9 K** en el PMS y **los cuatro superan** su umbral térmico —el B20 con el mayor margen de los cuatro, **144,9 K**, frente a los 126,9 K del gasóleo urbano—, pero **tres de los cuatro han gelificado antes de llegar al inyector**. De sus 400 configuraciones construibles, **91** caen sólo por eso.

### La calibración más eficiente **no se firma en ninguna de las cinco**

| Máquina | Mejor construible | η al freno | Qué incumple | Firmada | Renuncia |
|---|---|---|---|---|---|
| Tractor | 21 / 10° / 1 000 / marino | 37,78 % | **Ruido** | 37,58 % | 0,20 pts |
| Camioneta | 18 / 10° / 1 800 / marino | **40,29** | **Ruido**, presión y frío | 40,08 | 0,21 |
| Planta | 17 / 10° / 1 400 / marino | 39,74 | **Ruido** y frío | 39,66 | 0,08 |
| Urbano | 17 / 14° / 1 800 / marino | 38,89 | **Ruido**, presión y frío | 38,29 | **0,60** |
| Marino | 16 / 10° / 1 400 / marino | 39,95 | **Ruido** | 39,72 | 0,23 |

> En **las cinco** la mejor calibración construible es infirmable, y en **las cinco** la lista de criterios que la tumban **incluye el ruido**. También en las cinco esa mejor calibración usa **gasóleo marino**, el de cetano más bajo: el mismo combustible que da la mejor eficiencia da el peor gradiente de presión.

### El dinero, esta vez, no desempata

El coste es el combustible que consume la carga anual real de cada máquina durante cinco años: `C = 5·W_año·3,6·10⁶/(η_b·PCI)/ρ·precio`.

| Máquina | Válidas | Óptima | La válida más cara | Diferencia |
|---|---|---|---|---|
| Tractor | 75 | 34 634 € | 73 113 € | **+38 479 €** |
| Camioneta | 31 | 32 422 | 34 699 | +2 277 |
| Planta | 42 | 655 325 | 779 142 | **+123 817** |
| Urbano | 15 | 15 004 | 16 153 | +1 149 |
| Marino | 39 | 339 232 | 700 918 | **+361 686** |

> A diferencia del laboratorio del ciclo Otto, aquí **la válida más eficiente resulta ser también la más barata en las cinco máquinas**, así que el sobrecoste de firmar la óptima es **cero** y el dinero no desempata nada. Se dice tal cual —y no se inventa un conflicto que los números no dan—: lo que el dinero mide en esta práctica es **cuánto cuesta equivocarse dentro de lo válido**, y en el motor marino son **361 686 €** de combustible en cinco años por firmar mal una calibración que también pasaba el pliego.

---

## Modos del simulador

- **EL CICLO CERRADO.** La traza p–V y p–θ de IVC a EVO con la columna de gas coloreada por fracción quemada, el manómetro de cilindro, la fracción premezclada y la difusiva dibujadas por separado, y los **tres techos ideales** al lado, para que la brecha se vea y no se cuente.
- **EL RETARDO.** La integral de Livengood-Wu creciendo desde el SOI, el chorro entrando mientras no pasa nada, y el pico premezclado que sale de toda esa masa acumulada. Es donde se ve por qué el cetano decide el ruido.
- **EL RIEL.** El barrido de presión de inyección con el caudal, la duración, la penalización por fase tardía y el gradiente de presión: la raíz de Bernoulli contra la línea recta que casi todo el mundo espera.
- **EL ARRANQUE EN FRÍO.** Compresión de arrastre con politrópico declarado, las dos ayudas puestas donde de verdad actúan —antes y después de comprimir—, el umbral térmico del combustible y la **puerta del filtro en frío**, que se cierra aunque la temperatura sobre.
- **EL CENSO DEL PLIEGO.** Las configuraciones construibles de la máquina pasadas por los seis criterios, con la columna de **bajas totales** al lado de la de **suspensos en solitario**, y las combinaciones no construibles marcadas como tales en lugar de escondidas.
- **EL RETO.** Se sortea una máquina y arrancas con la calibración mal puesta. Si no vale, el diagnóstico da la **cifra y el límite** del criterio caído; si vale pero no es la más barata de alimentar, compara costes. Nunca da la respuesta.

### Qué dicen —y qué no dicen— las pistas

Las tres pistas destapan **un mando cada una** —combustible, luego compresión, luego presión de riel— y **ninguna destapa el inicio de inyección**, que es el que hay que razonar. El embudo real:

| Máquina | Válidas | Tras la 1.ª (combustible) | Tras la 2.ª (r) | Tras la 3.ª (p_iny) |
|---|---|---|---|---|
| Tractor | 75 | 24 | 2 | **1** |
| Camioneta | 31 | **31** | 4 | **1** |
| Planta | 42 | 22 | 4 | **1** |
| Urbano | 15 | **15** | 4 | **1** |
| Marino | 39 | 10 | 4 | **2** |

> En la **camioneta** y en el **urbano** la primera pista **no descarta nada**: todas sus válidas usan ya gasóleo urbano de bajo azufre, porque los otros tres gelifican a su temperatura de homologación. Y en el **motor marino** las tres pistas juntas dejan **dos** candidatas, no una: el inicio de inyección, que ninguna pista destapa, es el que decide. Se dice aquí porque el alumno tiene derecho a saber cuándo la ayuda deja de serlo.

---

## Qué NO modela

- **El lazo abierto.** No se simulan admisión ni escape: el ciclo va de IVC a EVO. El bombeo es un modelo de presiones medias, no un bucle integrado, y por eso la telemetría lo llama `pmep` y no «trabajo de bombeo medido». La animación 3D recorre sólo esa ventana, así que el salto de +130° a −140° es visible y está declarado.
- **La cámara de combustión real.** El pistón que se dibuja tiene la cabeza **plana** y no hay bol en ω: el motor resuelve el volumen muerto equivalente de culata plana, `V_c = V_d/(r − 1)`. Dos cámaras distintas con la misma relación darían aquí el mismo resultado, y en el banco no.
- **El chorro.** La longitud del chorro que se dibuja es la **fracción de dosis ya inyectada**, no una correlación de penetración: no hay ángulo de cono, ni atomización, ni evaporación gota a gota, ni impacto en la pared, ni interacción entre los orificios.
- **El modelo multizona y la química.** La cámara es **una sola masa** con γ ponderado por la fracción de productos: no hay zona de gas sin quemar, ni mecanismo cinético, ni especies. Por lo mismo **no hay emisiones** —ni NOx, ni CO, ni hollín—: el margen de humo se calcula a partir de λ y se declara como lectura, nunca como criterio.
- **La discontinuidad declarada del pico premezclado.** El Wiebe premezclado se corta cuando se agota, lo que deja un salto de **0,1 %** en la fracción quemada. Está medido, es del orden del error de integración y se declara en vez de disimularlo.
- **La sobrealimentación.** Los 200, 190, 180 y 220 kPa de admisión son datos del enunciado, no la salida de un turbocompresor: no hay mapa, ni desfase, ni intercooler, ni válvula de descarga, ni EGR.
- **La inyección múltiple.** Hay **una sola inyección** por ciclo: no hay piloto, ni post-inyección, ni control de la tasa. Justamente por eso el gradiente de presión es tan duro de cumplir, y ésa es una lección honesta sobre por qué existen las inyecciones piloto.
- **El régimen variable, las fugas y el desgaste.** Cada máquina se evalúa a **un solo régimen**: no hay curva de par contra revoluciones. La masa atrapada es constante entre IVC y EVO —sin blow-by ni consumo de aceite—, la temperatura de pared es fija, y no hay depósitos, ni altitud, ni transitorios.
- **La economía real.** Precios, cargas anuales, temperaturas de homologación y límites del pliego son valores de proyecto representativos, no cotizaciones ni medidas de un motor concreto: sirven para **ordenar** alternativas, no para presupuestar. Las correlaciones sí son las publicadas, con sus constantes originales. Tampoco se corrigen las potencias a SAE J1349 ni a ISO 1585.

---

## Verificación

**Capa 1 — motor sellado, 279 937 comprobaciones, 0 fallos** (`scratchpad/motor_diesel.mjs`, `test_diesel.mjs`): la geometría de biela-manivela y su volumen instantáneo contra el cálculo directo, la relación efectiva en el cierre de admisión, la tabla de c_p y las dos correlaciones de γ con su ponderación por fracción de productos, las dos leyes de Wiebe con sus exponentes y el corte del pico premezclado, el caudal de Bernoulli del inyector y la duración de inyección que sale de él, la correlación de Hardenberg-Hase con su energía de activación dependiente del cetano y su integración por Livengood-Wu, la convergencia del RK4 frente a paso mitad y cuarto, el balance de energía del ciclo cerrado, la transferencia de Woschni acumulada en cada subpaso, el punto fijo de la temperatura de escape y su residuo en las 1 460 configuraciones construibles, la fricción de Chen-Flynn junto al trabajo de la bomba de inyección, los tres ciclos ideales —Otto, dual y Diésel— calculados a igual calor y su ordenación, la compresión de arrastre en frío con politrópico declarado y las dos ayudas puestas donde actúan, el umbral térmico y la puerta del punto de obstrucción de filtro, los seis criterios sobre las 1 460 construibles, el censo completo de bajas totales y suspensos en solitario, la unicidad de la solución de cada máquina y el embudo de las tres pistas.

**Capa 2 — el laboratorio ya construido, dentro de un navegador real, 161 756 comprobaciones, 0 fallos** (`scratchpad/pw_diesel.mjs`): la página se carga sin un solo error de consola; las constantes, el catálogo de combustibles y el de las cinco máquinas se leen de la pantalla y se comparan con el motor; las funciones selladas se muestrean en la página y en el motor; se barren las cinco máquinas configuración a configuración contrastando el cuerpo del simulador contra el motor; se rehacen el censo, la lista de válidas, la solución única, los empates y el embudo de pistas; se comprueban los barridos de cada eje y el de arranque en frío; los seis modos con su rótulo, su telemetría y su informe; las cuatro filas vivas contra la traza —136 puntos, uno cada dos grados, comparados uno a uno con los del motor—; que la columna de gas dibujada es exactamente V(θ); que la barra de selectores ofrece la rejilla entera marcando con ⚠ lo que esa máquina no monta y que cambiar de máquina nunca deja heredada una configuración imposible; los cuatro veredictos del reto letra por letra, incluida la firma; que el cuestionario tiene una sola respuesta correcta en cada modo y se baraja; que las quince piezas contestan con lo que deciden; que el escenario nuevo recorre máquinas y ejes sin repetirse y reabre siempre el laboratorio; el recorrido guiado de punta a punta; y un barrido final de 90 pantallas sin nada roto en ningún modo ni máquina.

> Regla de la casa aplicada sin excepción: **toda cifra citada en la prosa —ficha, briefing, catálogo, informe y cuestionario— está rederivada del motor sellado**, y las unidades se leen del motor, nunca del nombre de la variable.
