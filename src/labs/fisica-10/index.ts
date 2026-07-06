import type { LabModule } from '../_types';
import contenido from './contenido';
import briefing from './briefing';
import tutorSteps from './tutorSteps';
import quiz from './quiz';

const lab: LabModule = {
  id: 'fisica-10',
  contenido,
  briefing,
  tutorSteps,
  quiz,
};

export default lab;
