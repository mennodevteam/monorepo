/** هر K معادل ۱۰۰۰ توکن؛ برچسب مثلاً 1000K یعنی ۱۰۰۰×۱۰۰۰ توکن. */
export const TOKENS_PER_K = 1000;

export const PRESET_K_UNITS = [1000, 2000, 5000] as const;

export function kUnitsToTokens(kUnits: number): number {
  return Math.floor(kUnits) * TOKENS_PER_K;
}

/** عدد صحیح توکن با ارقام لاتین (بدون جداکنندهٔ هزارگان). */
export function formatTokenIntegerEn(tokens: number | null | undefined): string {
  if (tokens == null || !Number.isFinite(tokens)) {
    return '—';
  }
  return Math.trunc(tokens).toLocaleString('en-US', { useGrouping: false });
}

/** نمایش موجودی/حجم با پسوند K و ارقام لاتین. */
export function formatTokensKLabel(tokens: number | null | undefined): string {
  if (tokens == null || !Number.isFinite(tokens)) {
    return '—';
  }
  if (tokens === 0) {
    return '0';
  }
  const k = tokens / TOKENS_PER_K;
  if (tokens % TOKENS_PER_K === 0) {
    return `${Math.round(k).toLocaleString('en-US', { useGrouping: false })}K`;
  }
  const rounded = Math.round(k * 10) / 10;
  const text = rounded.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 1, minimumFractionDigits: 0 });
  return `${text.replace(/\.0$/, '')}K`;
}
