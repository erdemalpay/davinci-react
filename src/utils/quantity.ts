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

const MAX_DENOMINATOR = 12;

/**
 * Text for showing a quantity. Split items read as fractions ("1/7",
 * "1 1/3") instead of 0.14285714285714302 or 0.143; quantities with a short
 * decimal (0.5, 0.25, 1.6) stay decimal, anything else gets 3 decimals.
 */
export function formatQuantity(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "";
  }
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const whole = Math.floor(abs + QUANTITY_EPSILON);
  const rest = abs - whole;
  if (rest < QUANTITY_EPSILON) return sign + String(whole);

  const hundredths = Math.round(abs * 100) / 100;
  if (Math.abs(abs - hundredths) < QUANTITY_EPSILON) {
    return sign + String(hundredths);
  }

  for (let denominator = 2; denominator <= MAX_DENOMINATOR; denominator++) {
    const numerator = Math.round(rest * denominator);
    if (
      numerator > 0 &&
      numerator < denominator &&
      Math.abs(rest - numerator / denominator) < QUANTITY_EPSILON
    ) {
      const fraction = `${numerator}/${denominator}`;
      return sign + (whole > 0 ? `${whole} ${fraction}` : fraction);
    }
  }
  return sign + String(roundQuantity(abs));
}
