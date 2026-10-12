/**
 * KIT 3D COMPARTIDO de los labs base (física, química, biología, matemáticas).
 *
 * ESCALA: 1 u = 1 dm = 10 cm  →  1 mm = 0,01 u (helper `mm()`), 1 u³ = 1 L.
 *   Un vaso de 250 mL mide 0,70 × 0,95 u; una bureta de 50 mL, 7,2 u de alto.
 *
 * CONVENCIONES
 *   - La cubierta de la mesa de LabStage está en y = 0. Cada pieza tiene el origen
 *     en el centro de su base (apoyada) y el eje en +Y, salvo donde se indica
 *     (bureta y embudo: origen en la punta; resorte: cuelga hacia −Y).
 *   - +Z mira al alumno (cámara); la pared del laboratorio está en −Z.
 *   - Ángulos de torno: 0 = +Z, π/2 = +X (convención de LatheGeometry).
 *   - Toda pieza acepta las props de <group> (position, rotation, scale…).
 *   - Calidad: LabStage la pone en contexto ("alta" | "media"); las piezas la leen.
 *   - Volúmenes en mL, longitudes en u, fuerzas en N, temperaturas en °C.
 *   - Sin red: ninguna pieza descarga nada (fuentes, HDR, texturas: todo local o
 *     dibujado en lienzo).
 */
export * from './perfiles';
export * from './calculos';
export * from './geometria';
export * from './texturas';
export * from './materiales';
export * from './LabStage';
export * from './texto';
export * from './Liquido';
export * from './cristaleria';
export * from './montaje';
export * from './instrumentos';
export * from './mecanica';
export * from './matematicas';
// La plantilla de pantalla (DOM) vive en src/components/simulador/LabLayout.tsx
