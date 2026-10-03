export const compact = (value) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
export const moneyCompact = (value) => '$' + compact(value);
export function price(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 0.01 ? 6 : 2,
    maximumFractionDigits: value < 0.01 ? 8 : value < 1 ? 4 : 2,
  }).format(value);
}
export const percent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
export const number = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
