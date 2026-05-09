/**
 * Utilidades matemáticas para análisis científico avanzado.
 * Permite calcular regresiones lineales y coeficientes de determinación (R²).
 */

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  formula: string;
}

export const calculateLinearRegression = (data: { x: number; y: number }[]): RegressionResult | null => {
  const n = data.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
    sumY2 += point.y * point.y;
  }

  const denominator = (n * sumX2 - sumX * sumX);
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Cálculo de R²
  const rNumerator = (n * sumXY - sumX * sumY);
  const rDenominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  const r = rDenominator !== 0 ? rNumerator / rDenominator : 0;
  const r2 = r * r;

  const formula = `y = ${slope.toFixed(3)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept).toFixed(3)}`;

  return {
    slope,
    intercept,
    r2,
    formula
  };
};
