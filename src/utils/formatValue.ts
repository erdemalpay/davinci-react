export function formatAmount(value: number) {
  return (Math.round(value * 100) / 100).toFixed(2);
}
