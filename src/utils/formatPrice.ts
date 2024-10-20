export function formatPrice(price: number) {
  if (Number.isInteger(price)) {
    return price.toString();
  }
  return parseFloat(price.toFixed(2)).toString();
}
