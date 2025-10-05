export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}