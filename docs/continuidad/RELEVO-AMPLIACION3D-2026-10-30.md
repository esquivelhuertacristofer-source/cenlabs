# Informe de relevo · ampliación 3D de las 50 ciencias

Fecha: **30 de octubre de 2026, Ciudad de México**. Este informe es el punto de entrada vigente. Sustituye las notas cronológicas contradictorias de `RELEVO-AMPLIACION3D-EN-CURSO.md`, que se conservan como historial. El usuario ha pedido entregar el proyecto a otra IA; en este turno sólo se verificó el estado y se documentó, sin reanudar pruebas ni desarrollo.

## 1. Lo que quiere el usuario

Responder siempre en español. El usuario considera escuetas las escenas y pidió: «Metele mas papi, los veo muy escuetos y sobre todo en 3d». La mejora abarca **las 50 prácticas nuevas de Ciencias**, no una sola demostración ni otros 50 laboratorios.

Quiere herramientas útiles para estudiantes de carreras técnicas, ciencia entendible e imágenes impresionantes, con interacción real. Mantener el formato nativo del resto del catálogo, su ficha inicial, bitácora, adquisición, evaluación y guardado. No sustituir un mejor experimento por más texto o tornillos decorativos. Documentar cada práctica al ampliarla y distinguir implementación, pruebas, commit, push y publicación.

No se autorizó delegación ni subagentes. No crearlos salvo nueva autorización explícita o instrucciones aplicables. El objetivo pendiente es terminar la mejora, verificarla y publicarla conforme al proyecto; este informe no acredita ese cierre.

## 2. Ubicaciones y estado de entrega

| Elemento | Ubicación / estado |
|---|---|
| Repositorio de trabajo | `C:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard` |
| Worktree existente para publicar | `C:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-deploy` |
| Workspace de este chat | `C:/Users/crist/Documents/Codex/2026-10-21/files-pasted-by-the-user-texto` |
| Helpers de esta entrega | Subcarpeta `work/` del workspace del chat |
| Reglas del repositorio | `AGENTS.md`, `docs/ESTANDAR-LABS-CLASE-MUNDIAL.md` y `docs/continuidad/README.md` |
| HEAD comprobado el 30/10 | `9609fc23557c7f7d107df483dd6371b117ed5b0c` |
| Ampliación actual | Cambios **locales, sin commit, sin push y sin despliegue confirmado** |
| Último código publicado confirmado por esta IA | `297f91fa54515c4ffb600b7394b4d06f1d0d6e02` |
| Última versión Cloudflare confirmada por esta IA | `3cfad647-fa74-4034-8409-94cefbeba58a` |
| Plataforma | `https://www.cenlaboratorios.com.mx` |

No se volvió a consultar producción el 30/10: los datos de publicación anteriores son el último estado confirmado, no una comprobación nueva de hoy. El worktree de publicación estaba limpio en `297f91f` la última vez que se inspeccionó; verificarlo antes de usarlo.

Catálogo de referencia: **340 prácticas**: 250 de Mecánica y 90 de Ciencias. Las 50 que se están ampliando son:

- Física 11–24: 14 prácticas.
- Química 11–24: 14 prácticas.
- Matemáticas 11–22: 12 prácticas.
- Biología 11–20: 10 prácticas.

Las 50 ya estaban destacadas antes de esta revisión. No crear nuevas entradas ni alterar los 250 laboratorios de Mecánica para completar esta tarea.

## 3. Cambios implementados

### Montajes específicos de las 50 escenas

Nuevo archivo `src/components/ciencias/escenas/montajes.ts`, integrado desde `registro.ts`. Añade dos conjuntos o capas de inspección por práctica: cámaras ópticas, bastidores, bombas, válvulas, intercambiadores, conexiones, soportes, hornos abiertos, platinas y guías, según el experimento. La representación molecular utiliza capas de la propia estructura, sin mesas artificiales atravesando la proteína.

Se pasó de **108 a 208 piezas semánticas**. Los conjuntos utilizan materiales PBR y geometrías fusionadas para limitar llamadas de dibujo. El desmontaje está definido explícitamente para cada práctica: posiciones iniciales y desplazamientos propios, sin desplazamiento acumulativo.

### Exploración compartida

Archivos principales:

- `src/components/ciencias/EscenaCiencia.tsx`.
- `src/components/ciencias/ExploradorEscena.tsx`.
- `src/components/ciencias/PanelExploracion.tsx`.
- `src/components/ciencias/PilotoCiencia.tsx`.

El inspector incorpora desmontaje de 0 a 100 %, selección, aislamiento y corte visual. Mientras está abierto sustituye temporalmente los controles del ensayo. Al cerrarlo restaura los conjuntos y los ajustes visibles. Durante la inspección se deshabilitan pausa/revisión/reinicio para conservar la pausa de observación.

La pieza científica seleccionada se puede arrastrar directamente, además de usar el mando dorado. El gesto comparte inicio, movimiento y final, captura el puntero, suspende OrbitControls y libera la cámara al terminar. Cambia el parámetro del mismo store científico e invalida registros como antes. Los conjuntos pasivos siguen con `control: -1`: no fingir que una carcasa modifica la ciencia.

`root.userData.desmontaje` sólo afecta a la representación; no modifica parámetros, muestras ni cálculos. Se conservaron el reloj compartido, el ajuste de cámara al soltar el arrastre y los puentes `__cienciaDebug` / `__labDebug`.

### Mejoras particulares importantes

| Práctica | Trabajo realizado |
|---|---|
| Biología 11 | 129 posiciones Cα de 1LYZ, con cuentas por residuo; envolvente y traza inspeccionables y separables. Se retiró una primera mesa artificial que atravesaba la estructura. |
| Biología 12 | 3.892 posiciones Cα de 2XND; membrana dividida en dos monocapas desmontables y dos colas por lípido. Se conservan rotor c8, cabeza F1 y acoplamiento del modelo. |
| Biología 15 | Morfología gemante estática de las levaduras, conexiones del circuito y caldo translúcido; conserva el crecimiento y la aireación originales. |
| Biología 16 | Más ramificación bronquial y acinos, vinculados al escalado de volumen existente. Geometría anatómica esquemática, no CFD pulmonar. |
| Matemáticas 19 | Campo de descenso −∇f en planta. `landscapeGradient` en `src/domain/ciencias/decisiones.ts`; flechas derivadas de la función, sin modificar el algoritmo de búsqueda previo. |
| Química 12, HPLC | Vidrio sin escritura de profundidad, relleno translúcido y bandas cian/magenta visibles. Columna, bandas y fase estacionaria agrupadas para que aislar la columna conserve su contenido. Cámara `[2.2,2.5,2.8]` y laterales del horno cortados. |
| Química 12, último ajuste | `previewPaused: true` en `definiciones/quimica-12.ts`: mantiene las bandas iniciales visibles hasta Continuar o Adquirir. **El modelo numérico y su `sampleEvery: 0.02` previo no se cambiaron.** |

No presentar las cuentas Cα como todos los átomos, ni inventar cadenas laterales. El desmontaje de membrana es una operación de inspección, no ruptura biológica simulada. No convertir la visualización de fluidos bidimensionales en una afirmación de CFD tridimensional.

### Otros archivos modificados / nuevos

- `src/components/ciencias/escenas/biologia.ts`.
- `src/components/ciencias/escenas/instrumentos.ts`.
- `src/components/ciencias/escenas/refinamientos.ts`.
- `src/components/ciencias/escenas/registro.ts`.
- `src/components/ciencias/definiciones/quimica-12.ts`.
- `src/domain/ciencias/decisiones.ts`.
- `scripts/auditoria/ciencias50-recorridos.mjs`: selector del control contextual, ahora distinguido del deslizador de desmontaje.
- `scripts/auditoria/exploracion-ciencias50.mjs`: selecciona una pieza ajustable antes de comprobar el mando; los conjuntos nuevos del final son pasivos.
- `scripts/auditoria/ciencias50-versiones.mjs`: revisión de exploración **20**, recorridos nativos **320**.
- Nuevos auditores: `montajes-ciencias50.mjs`, `arrastre-directo-ciencias.mjs`, `verifica-estructuras3d.mjs`, `verifica-campo-descenso.mjs`.
- Las 50 fichas de `docs/continuidad/`, su índice y `ciencias50-ampliacion3d.md` registran trabajo local pendiente de cierre.

## 4. Evidencia comprobada y lo que NO está terminado

Se volvieron a leer los resultados el **30/10**, sin ejecutar pruebas nuevas:

| Comprobación de esta ampliación | Estado real |
|---|---|
| Desmontaje/restauración, 1600×900 y 390×844 | **100 correctas**: las 50 prácticas en ambos tamaños. |
| Arrastre directo sobre piezas | **8 correctos**: Q11, Q12, F12, F18, M12, M19, B12 y B15. |
| Recorridos nativos revisión 320 | **10/200 correctos**: Biología 11–20 a 1366×768. Faltan los otros 190, incluyendo repetir fallos de infraestructura. |
| Geometría de las 50 | 208 piezas; sin normales nulas ni valores no finitos, bajo 400.000 triángulos en la comprobación geométrica. |
| Estructuras moleculares | 4.021 residuos y 4.003 distancias interresiduo comprobadas contra los depósitos locales. |
| Campo de descenso | 3.721 puntos contrastados por diferencias centrales; error máximo ≈2,60×10⁻¹⁰. |
| Verificación de refinamientos | 21.544 comprobaciones correctas; error máximo de contornos ≈0,00952. |
| Manipulación / recursos compartidos | 37.274 comprobaciones correctas. El benchmark Node no equivale a FPS. |
| Jest | **Dos ejecuciones completas** anteriores correctas: 50 suites, 4.219 pruebas, 12 snapshots. La tercera, posterior al último ajuste de previsualización Q12, falló por lectura del entorno. |
| TypeScript / ESLint | Hubo pasadas limpias anteriores al último ajuste de previsualización. Reejecutar aisladas para cerrar el estado final. |
| Publicación de esta ampliación | **No realizada**. Tampoco se copiaron las 50 portadas finales ni se creó commit. |

El archivo `scripts/auditoria/.salida/montajes50/jest-final.json` sigue mostrando 4.219 correctas; corresponde a una ejecución anterior. **Su presencia no demuestra que la tercera ejecución pasara ni que se haya verificado otra vez la configuración final.**

Presupuestos observados: Biología 12 llegó a 374.576 triángulos y 65 llamadas; Biología 18 a 113 llamadas. Mantener los límites y volver a comprobar los estados de corte/aislamiento y calidad media.

### Dónde está la evidencia

Rutas relativas al repositorio:

- `scripts/auditoria/.salida/montajes50/`: informes, capturas iniciales/desmontadas, arrastres, logs y `estado-cierre.json`.
- `scripts/auditoria/.salida/ciencias50/`: informes nativos por ID/tamaño/DPR, capturas, TXT y portadas.
- `scripts/auditoria/.salida/exploracion50/`: comprobaciones de todas las piezas.
- `scripts/auditoria/.salida/ciencias50-especiales/` y `.salida/tunel-interactivo/`: casos específicos; no reutilizar los resultados de la publicación anterior como si fueran de esta ampliación.

Revisiones de desmontaje exigidas por el auditor actual: **2** para B11, B12, B15, B16, M19 y Q12; **1** para el resto. Se repitieron los casos modificados. Los antiguos resultados nativos 200–210 no acreditan esta revisión: exigir **320** y `flow`, `downloaded`, `exploration` verdaderos, con errores vacíos.

## 5. Bloqueo anterior y estado de procesos

En el barrido largo se observaron `ERR_INSUFFICIENT_RESOURCES`, esperas de fuentes y errores de lectura. No se aisló si la limitación principal era memoria, espacio, recursos del sistema u otra causa. No atribuirlo automáticamente al código del laboratorio.

Hubo fallos de chunk durante ediciones/HMR, repetidos después correctamente. Más tarde fallaron F11 por recursos, F12 por espera de fuentes y F13 por un timeout de interfaz. No darlos por correctos sin repetirlos.

El **30/10**, las lecturas cortas de archivos y Git volvieron a responder. Una consulta de procesos Node por los nombres de los auditores **no encontró esos procesos activos**. Esto no es una medición de memoria ni una garantía de que otros procesos estén libres.

El PID 30692 y las sesiones 78402/12986/69401/15306 pertenecen al historial del 29/10. **No matar hoy ese PID sin identificar de nuevo el proceso y su comando.** El archivo `estado-cierre.json` conserva `phase: recorridos-200`; está desactualizado como indicador de actividad y no acredita que siga corriendo.

No hay despliegue automático pendiente en la cola: el helper sólo ejecutaba pruebas. No reiniciar la cola antigua de 200 recorridos en un único navegador. Cambiarla primero a **grupos de cinco IDs y un tamaño por proceso de navegador**, cerrándolo entre grupos. Ejecutar Jest y compilaciones pesadas por separado de las auditorías gráficas.

## 6. Revisión visual pendiente

Se revisaron hojas de contacto de las capturas disponibles y se corrigieron escenas concretas. HPLC se volvió a inspeccionar: bandas visibles, lateral abierto y encuadre de aproximadamente 55 % del alto a 1600. Las monocapas se separan visualmente y los detalles biológicos nuevos son visibles en móvil.

Esto no sustituye la crítica final de las 50 en cuatro tamaños. Revisar especialmente B11/B12/B15/B16/M19/Q12 tras sus últimas iteraciones, y Q22 después de repetir su carga. El usuario rechazó la calidad previa: **las pruebas funcionales no equivalen a su aprobación visual**. Si una carcasa oculta el fenómeno, el objeto queda pequeño o la interacción se siente artificial, corregir antes de publicar y repetir sólo los casos afectados con revisión actualizada.

Leer el estándar completo. Entre sus condiciones: ficha nativa, escena protagonista desde el inicio, datos y gráficas en DOM, prosa inicial ≤120 palabras, PBR, normales correctas, presupuesto de rendimiento, calidad media nítida, movimiento reducido, un reloj y ciencia honesta. Preservar los arreglos anteriores de encuadre Bézier, túnel LBM, estado preparado de acústica, calificación entera y estabilidad de modales.

## 7. Secuencia exacta para retomar

1. Leer `AGENTS.md`, el estándar y este informe. Comprobar `git status` y procesos actuales; no usar PID históricos. Verificar recursos disponibles antes de volver a renderizar.
2. Identificar si ya existe el servidor del proyecto en 3011. No arrancar uno duplicado. Si hay que reiniciarlo, verificar su comando y directorio primero.
3. Ejecutar TypeScript, ESLint y Jest final **sin navegador de auditoría simultáneo**. Confirmar que el resultado JSON corresponde a esa nueva ejecución. No cambiar goldens para ocultar fallos.
4. Adaptar el helper de cola para grupos pequeños. Conservar los diez recorridos válidos con `--pendientes`; repetir F11–13 y completar las prácticas/tamaños faltantes.
5. Completar desmontajes en 1366 y 2020 DPR1,25; exploración de todas las piezas de las 50; ocho casos específicos y cuatro del túnel, con las revisiones actuales. Conservar los 100 desmontajes y ocho arrastres ya correctos cuando su código no cambie.
6. Revisar las capturas y la fluidez, documentando por práctica. Repetir sólo pruebas invalidadas por cambios, fallos o dudas concretas.
7. Preparar las 50 portadas finales y evidencia portable; cerrar fichas/autocrítica. Verificar explícitamente los guards de los helpers antes de ejecutarlos.
8. Crear commit sólo de los archivos de esta ampliación; publicar desde `cen-deploy` conservando las voces. No confundir push con despliegue.
9. Confirmar la versión real de Cloudflare, 50 accesos con login y cuatro ejercicios completados, guardados y leídos de vuelta con 10/10. Registrar commit, push, publicación y relevo final con datos reales.

### Ejemplo de una tanda pequeña (no ejecutado en este relevo)

PowerShell, con directorio de trabajo `cen-dashboard`:

```powershell
$env:QA_SIZES='1366,768,1'
node --experimental-strip-types --import ./scripts/_resolver-ts.mjs --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/auditoria/ciencias50-recorridos.mjs fisica-11 fisica-12 fisica-13 fisica-14 fisica-15 --pendientes
```

Tamaños pendientes de la matriz: 1366×768 DPR1, 1600×900 DPR1, 2020×1055 DPR1,25 y 390×844 DPR1. Cambiar `QA_SIZES` por cada tanda; no lanzar las cuatro matrices a la vez. Todos los navegadores automáticos deben usar `--mute-audio` y el stub de `speechSynthesis`; no eliminar el audio del producto.

## 8. Helpers del workspace y precauciones

Todos los siguientes están en `C:/Users/crist/Documents/Codex/2026-10-21/files-pasted-by-the-user-texto/work/`:

| Helper | Uso / advertencia |
|---|---|
| `cierre-ampliacion3d.mjs` | Cola anterior. **Adaptar a grupos pequeños antes de relanzar.** Sus procesos y sesiones anteriores no son una fuente de estado actual. |
| `registra-qa-ampliacion3d.mjs` | Lee evidencias por revisión y actualiza fichas/índice. No prueba, no hace commit ni publica. |
| `documenta-ampliacion3d.mjs` | Cabecera local y geometría. Puede sobrescribir el resumen de progreso; después usar el registrador. No ejecutar tras reorganizar fichas finales sin adaptarlo. |
| `contacto-montajes.py` | Hojas de contacto de capturas de1600; no acredita haber revisado por sí mismo las imágenes. |
| `fija-codigo-ampliacion3d.mjs` | Actualizado para11 archivos. **No ejecuta tsc/eslint**: marca sus códigos como0 suponiendo que el operador ya los verificó. Ejecutar las comprobaciones reales antes y confirmar frescura de Jest. El manifiesto antiguo puede seguir con10 archivos. |
| `prepara-entrega-ampliacion3d.mjs` | Borrador **no ejecutado**. Exige200 recorridos320,200 desmontajes vigentes,50 exploraciones20,8 arrastres,8 específicos,4 túnel,4219 tests y11 hashes; copia portadas y reorganiza fichas. Leer/adaptar antes de usar. No publica. |
| `conserva-voces-ciencias50.mjs` | Conservación/copia comprobada de voces hacia el worktree de publicación. |
| `refresca-indice-deploy50.mjs` | Refresca sólo stats de archivos generados después de demostrar que no hay diferencia de contenido; no usar como reset. |

Los demás scripts de `work/` aplicaron ediciones puntuales ya realizadas. **No volver a ejecutar migraciones** como `amplia-montajes.py`, `membrana-detallada.py`, `qa-montajes-directo.py`, `acabados-optica.py` o `columna-integrada.py`: sus reemplazos no son idempotentes.

Los helpers de cierre de la publicación anterior (`documenta-publicacion-ciencias50`, cierres de catálogo y similares) asumen otro estado. No ejecutarlos ciegamente ni declarar publicado por la mera presencia de sus documentos históricos.

## 9. Git: qué conservar y qué excluir

El 30/10, HEAD seguía en `9609fc2`; los cambios de la ampliación estaban sin preparar/commitear. Antes de continuar comprobar de nuevo para respetar trabajo posterior de otras personas.

Incluir selectivamente: los11 archivos de producto descritos, los auditores nuevos/modificados, fichas e índices de continuidad y las50 imágenes finales cuando estén verificadas. El nuevo `montajes.ts` y los nuevos auditores estaban sin seguimiento: no olvidarlos.

**No usar `git add .`, `git reset --hard` ni `git clean`.** Conservar y excluir cambios ajenos, entre ellos:

- Briefings de Mecánica 211–250 marcados como modificados; en la revisión previa eran cambios de stats/CRLF sin diferencia semántica. Verificar, no asumir ni borrar.
- `docs/RELEVO-SPRINT-INSIGNIA.md`.
- `scripts/_col.mjs`, `scripts/auditoria/.qa-inspeccion.mjs`.
- Antiguos scripts sin seguimiento como `ciencias-nativas.mjs`, `documenta-ciencias50.mjs` y `refina-preguntas-ciencias.mjs`.
- Credenciales, `.env`, `.dev.vars` y archivos privados.

## 10. Publicación y antecedentes

Con la verificación final cerrada, avanzar el worktree `cen-deploy` al commit verificado sin perder cambios. Conservar las **7.556 voces** del estado anterior. Usar `npm run deploy:cf`, o construir allí y desplegar el bundle ya construido. No construir en el repo del servidor mientras se audita: comparten `.next`.

La cadena usada antes era Next15.5.28, OpenNext1.20.12 y Wrangler4.151.2, con advertencias conocidas de Windows/versión no soportada. No ampliar la tarea actual con una actualización de dependencias sin motivo. Verificar las versiones reales si es necesario.

La comprobación real anterior utilizó `scripts/auditoria/ciencias50-produccion.mjs`, el documento privado `docs/CREDENCIALES-PILOTO-001.md` y la cuenta de prueba identificada como Sofía. No imprimir contraseñas, tokens ni identificadores privados. El resultado esperado de cierre es50 accesos y cuatro completados persistidos/leídos10/10; verificarlo otra vez para la nueva publicación.

Antecedente completo de la versión pública anterior: `outputs/RELEVO-CIENCIAS50-PUBLICADAS.md` del workspace. Notas cronológicas del trabajo actual: `outputs/RELEVO-AMPLIACION3D-EN-CURSO.md`. Para decidir el siguiente paso, **prevalece este informe del30/10 y la evidencia nueva comprobada**, no los mensajes históricos de «publicado» o «proceso activo».
