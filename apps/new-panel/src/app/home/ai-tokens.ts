/** هر K معادل ۱۰۰۰ توکن؛ برچسب مثلاً 1000K یعنی ۱۰۰۰×۱۰۰۰ توکن. */
export const TOKENS_PER_K = 1000;

export const PRESET_K_UNITS = [1000, 2000, 5000] as const;

export function kUnitsToTokens(kUnits: number): number {
  return Math.floor(kUnits) * TOKENS_PER_K;
}

/** نمایش موجودی/حجم با پسوند K (برای مضارب ۱۰۰۰ توکن). */
export function formatTokensKLabel(tokens: number | null | undefined): string {
  if (tokens == null || !Number.isFinite(tokens)) {
    return '—';
  }
  if (tokens === 0) {
    return '0';
  }
  const k = tokens / TOKENS_PER_K;
  if (tokens % TOKENS_PER_K === 0) {
    return `${Math.round(k)}K`;
  }
  const rounded = Math.round(k * 10) / 10;
  return `${String(rounded).replace(/\.0$/, '')}K`;
}
