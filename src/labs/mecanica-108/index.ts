import type { LabModule } from '../_types';

// Lab iframe 3D (three.js): no tiene datos de simulador React. El simulador HTML
// se declara en catalogo.ts (simuladorHtml) y lo embebe MecanicaShellClient por
// <iframe>; el briefing se publica como activo estático (ver _briefing-meta.ts).
// Su presencia aquí es lo que da de alta el lab en el registro LABS.
const lab: LabModule = { id: 'mecanica-108' };

export default lab;
