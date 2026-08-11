import type { LabModule } from '../_types';
import contenido from './contenido';
import tutorSteps from './tutorSteps';
import quiz from './quiz';

const lab: LabModule = {
  id: 'biologia-3',
  contenido,
  tutorSteps,
  quiz,
};

export default lab;
