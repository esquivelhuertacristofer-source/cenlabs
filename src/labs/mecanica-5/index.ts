import type { LabModule } from '../_types';
import briefing from './briefing';

// Lab iframe 3D (three.js): solo aporta briefing. El simulador HTML se declara en
// catalogo.ts (simuladorHtml) y lo embebe MecanicaShellClient por <iframe>.
const lab: LabModule = {
  id: 'mecanica-5',
  briefing,
};

export default lab;
