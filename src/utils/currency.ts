/**
 * Formats a monetary value to standard display format, e.g. 1350 -> "৳1,350.00"
 */
export function formatCurrency(amount: number, symbol = '৳'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0.00`;
  }
  const parts = amount.toFixed(2).split('.');
  // Add thousands commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${symbol}${parts.join('.')}`;
}

/**
 * Parses raw input string into valid number.
 */
export function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : Math.round(value * 100) / 100;
  if (!value) return 0;
  const clean = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}
