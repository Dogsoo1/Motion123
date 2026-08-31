/** Presentation helpers. Money is in $M throughout the engine. */

export function money(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `$${(value / 1000).toFixed(2)}B`;
  }
  return `$${value.toFixed(decimals)}M`;
}

export function moneyExact(value: number): string {
  return `$${value.toFixed(1)}M`;
}

export function pct(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function signedPct(value: number, decimals = 1): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function multiple(value: number): string {
  return `${value.toFixed(1)}x`;
}

export function titleCase(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
