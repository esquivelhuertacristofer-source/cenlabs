export function validatePracticaId(practicaId: string): boolean {
  const regex = /^(quimica|fisica|matematicas|biologia)-\d{1,2}$/;
  return regex.test(practicaId);
}

export function validateScore(score: number): boolean {
  return typeof score === 'number' && score >= 0 && score <= 100;
}
