import type { LabModule } from '../_types';
import contenido from './contenido';
import tutorSteps from './tutorSteps';
import quiz from './quiz';
import objetivos from './objetivos';

const lab: LabModule = {
  id: 'fisica-2',
  contenido,
  tutorSteps,
  quiz,
  objetivos,
};

export default lab;
