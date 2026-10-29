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
const SIMULATORS_PER_SUBJECT = {quimica:24,fisica:24,biologia:20,matematicas:22} as const;
const TOTAL_SIMULATORS = Object.values(SIMULATORS_PER_SUBJECT).reduce((sum,n)=>sum+n,0);

describe('Simuladores routing — MASTER_DATA integrity', () => {
  it(`has exactly ${TOTAL_SIMULATORS} simulators`, () => {
    const keys = Object.keys(MASTER_DATA);
    expect(keys.length).toBe(TOTAL_SIMULATORS);
  });

  it.each(SUBJECTS)('%s tiene su inventario completo', (subject) => {
    const keys = Object.keys(MASTER_DATA).filter((k) => k.startsWith(subject + '-'));
    expect(keys.length).toBe(SIMULATORS_PER_SUBJECT[subject]);
  });

  it.each(
    SUBJECTS.flatMap((subject) =>
      Array.from({ length: SIMULATORS_PER_SUBJECT[subject] }, (_, i) => `${subject}-${i + 1}`)
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
    const validFormat = /^(quimica|fisica|biologia|matematicas)-([1-9][0-9]*)$/;
    Object.keys(MASTER_DATA).forEach((id) => {
      expect(id).toMatch(validFormat);
    });
  });
});
