import type { LabModule } from '../_types';
import contenido from './contenido';
import briefing from './briefing';
import tutorSteps from './tutorSteps';
import quiz from './quiz';
import objetivos from './objetivos';

const lab: LabModule = {
  id: 'fisica-2',
  contenido,
  briefing,
  tutorSteps,
  quiz,
  objetivos,
};

export default lab;
