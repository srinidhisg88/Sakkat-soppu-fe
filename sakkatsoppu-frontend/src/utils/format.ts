// Shared formatting helpers for unit labels and weights

export function formatWeightFromGrams(g?: number | null): string | undefined {
  if (typeof g !== 'number' || !Number.isFinite(g) || g <= 0) return undefined;
  if (g >= 1000) {
    const kg = g / 1000;
    // Use up to one decimal if needed (e.g., 1.5 kg), otherwise integer kg
    const display = Number.isInteger(kg) ? kg.toString() : kg.toFixed(1);
    return `${display} kg`;
  }
  return `${Math.round(g)} g`;
}

export function normalizeUnitLabel(label?: string | null): string | undefined {
  const raw = (label ?? '').toString().trim();
  if (!raw) return undefined;
  // If it's already in kg (e.g., '1 kg' or '1.5kg'), keep as is
  if (/\bkg\b/i.test(raw)) return raw;
  // Try to parse numbers followed by 'g'
  const m = raw.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  if (m) {
    const grams = parseFloat(m[1]);
    const fmt = formatWeightFromGrams(grams);
    if (fmt) return raw.replace(m[0], fmt);
  }
  return raw;
}

export function deriveUnitLabel(opts: {
  unitLabel?: string | null;
  g?: number | null;
  pieces?: number | null;
}): string | undefined {
  const { unitLabel, g, pieces } = opts;
  const normalized = normalizeUnitLabel(unitLabel ?? undefined);
  if (normalized) return normalized;
  const weight = formatWeightFromGrams(g ?? undefined);
  if (weight) return weight;
  if (typeof pieces === 'number' && pieces > 0) {
    return `${pieces} piece${pieces === 1 ? '' : 's'}`;
  }
  return undefined;
}

export function derivePriceForUnit(price: number, opts: {
  g?: number | null;
  unitLabel?: string | null;
}): string | undefined {
  const { g, unitLabel } = opts;
  const weight = formatWeightFromGrams(g ?? undefined);
  if (weight) return `${price} for ${weight}`;
  const normalized = normalizeUnitLabel(unitLabel ?? undefined);
  if (normalized) return `${price} for ${normalized}`;
  return undefined;
}
