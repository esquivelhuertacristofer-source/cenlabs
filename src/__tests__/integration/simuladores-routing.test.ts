/**
 * INTEGRATION TEST — Simuladores Routing
 *
 * Validates that MASTER_DATA contains all expected simulator entries.
 * This test exists specifically to prevent the 2026-05-11 production incident
 * where 30/40 simulators returned 404 due to missing MASTER_DATA keys on Vercel.
 *
 * If this test fails, DO NOT deploy.
 */

import { MASTER_DATA } from '@/data/simuladoresData';

const SUBJECTS = ['quimica', 'fisica', 'biologia', 'matematicas'] as const;
const SIMULATORS_PER_SUBJECT = 10;
const TOTAL_SIMULATORS = SUBJECTS.length * SIMULATORS_PER_SUBJECT;

describe('Simuladores routing — MASTER_DATA integrity', () => {
  it(`has exactly ${TOTAL_SIMULATORS} simulators`, () => {
    const keys = Object.keys(MASTER_DATA);
    expect(keys.length).toBe(TOTAL_SIMULATORS);
  });

  it.each(SUBJECTS)('%s has exactly %d simulators', (subject) => {
    const keys = Object.keys(MASTER_DATA).filter((k) => k.startsWith(subject + '-'));
    expect(keys.length).toBe(SIMULATORS_PER_SUBJECT);
  });

  it.each(
    SUBJECTS.flatMap((subject) =>
      Array.from({ length: SIMULATORS_PER_SUBJECT }, (_, i) => `${subject}-${i + 1}`)
    )
  )('simulator "%s" exists and has required fields', (id) => {
    const sim = MASTER_DATA[id as keyof typeof MASTER_DATA];
    expect(sim).toBeDefined();
    expect(typeof (sim as any).titulo).toBe('string');
    expect(typeof (sim as any).mision).toBe('string');
    expect(Array.isArray((sim as any).pasos)).toBe(true);
    expect((sim as any).pasos.length).toBeGreaterThan(0);
  });

  it('all simulator IDs match the expected format', () => {
    const validFormat = /^(quimica|fisica|biologia|matematicas)-([1-9]|10)$/;
    Object.keys(MASTER_DATA).forEach((id) => {
      expect(id).toMatch(validFormat);
    });
  });
});
