import { TutorStep } from '@/components/DrQuantumTutor';
import { fromRegistry } from '@/labs/_registry';

const LEGACY_ALL_TUTOR_STEPS: Record<string, TutorStep[]> = {};

export const ALL_TUTOR_STEPS: Record<string, TutorStep[]> = {
  ...LEGACY_ALL_TUTOR_STEPS,
  ...fromRegistry('tutorSteps'),
};
