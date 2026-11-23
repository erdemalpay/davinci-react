/**
 * Order quantities can be fractional (e.g. an item split 1/7 between players).
 * Floats cannot store most fractions exactly (7 × 1/7 = 0.9999999999999998),
 * so quantities are kept at 3 decimal places, matching the API.
 */
export const QUANTITY_EPSILON = 0.0005;

export function roundQuantity(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round(value * 1000) / 1000;
  return rounded === 0 ? 0 : rounded;
}
