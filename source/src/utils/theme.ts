import type { AccentColor, BaseWindowColor, ThemeConfig } from '../types/startup';

export const BASE_LIMITS = {
  hue: { min: 0, max: 360 },
  saturation: { min: 0, max: 100 },
  lightness: { min: 5, max: 45 },
  opacity: { min: 35, max: 98 },
} as const;

export const ACCENT_LIMITS = {
  hue: { min: 0, max: 360 },
  saturation: { min: 0, max: 100 },
  lightness: { min: 30, max: 90 },
} as const;

/**
 * Default smoked-glass charcoal window & matte off-white/ice accent
 * matching the Windows 11 acrylic utility mockup without neon glow.
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  base: {
    hue: 215,
    saturation: 12,
    lightness: 18,
    opacity: 78,
  },
  accent: {
    hue: 192,
    saturation: 18,
    lightness: 88,
  },
};

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampBaseColor(input: Partial<BaseWindowColor> | undefined): BaseWindowColor {
  const d = DEFAULT_THEME_CONFIG.base;
  return {
    hue: clampNumber(input?.hue ?? d.hue, BASE_LIMITS.hue.min, BASE_LIMITS.hue.max),
    saturation: clampNumber(
      input?.saturation ?? d.saturation,
      BASE_LIMITS.saturation.min,
      BASE_LIMITS.saturation.max,
    ),
    lightness: clampNumber(
      input?.lightness ?? d.lightness,
      BASE_LIMITS.lightness.min,
      BASE_LIMITS.lightness.max,
    ),
    opacity: clampNumber(
      input?.opacity ?? d.opacity,
      BASE_LIMITS.opacity.min,
      BASE_LIMITS.opacity.max,
    ),
  };
}

export function clampAccentColor(input: Partial<AccentColor> | undefined): AccentColor {
  const d = DEFAULT_THEME_CONFIG.accent;
  return {
    hue: clampNumber(input?.hue ?? d.hue, ACCENT_LIMITS.hue.min, ACCENT_LIMITS.hue.max),
    saturation: clampNumber(
      input?.saturation ?? d.saturation,
      ACCENT_LIMITS.saturation.min,
      ACCENT_LIMITS.saturation.max,
    ),
    lightness: clampNumber(
      input?.lightness ?? d.lightness,
      ACCENT_LIMITS.lightness.min,
      ACCENT_LIMITS.lightness.max,
    ),
  };
}

export function clampThemeConfig(input: Partial<ThemeConfig> | undefined): ThemeConfig {
  return {
    base: clampBaseColor(input?.base),
    accent: clampAccentColor(input?.accent),
  };
}

/**
 * Converts HSL (H: 0..360, S: 0..100, L: 0..100) to RGB (0..255).
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hue < 60) {
    [rPrime, gPrime, bPrime] = [c, x, 0];
  } else if (hue < 120) {
    [rPrime, gPrime, bPrime] = [x, c, 0];
  } else if (hue < 180) {
    [rPrime, gPrime, bPrime] = [0, c, x];
  } else if (hue < 240) {
    [rPrime, gPrime, bPrime] = [0, x, c];
  } else if (hue < 300) {
    [rPrime, gPrime, bPrime] = [x, 0, c];
  } else {
    [rPrime, gPrime, bPrime] = [c, 0, x];
  }

  return [
    Math.round((rPrime + m) * 255),
    Math.round((gPrime + m) * 255),
    Math.round((bPrime + m) * 255),
  ];
}

/**
 * WCAG 2.1 relative luminance for an RGB triple (0..255).
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const linearize = (channel: number): number => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function getContrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

const DARK_INK = '#0b0e12';
const DARK_INK_LUM = getRelativeLuminance(11, 14, 18);

const LIGHT_INK = '#ffffff';
const LIGHT_INK_LUM = getRelativeLuminance(255, 255, 255);

/**
 * Picks whichever ink color (#0b0e12 or #ffffff) yields higher WCAG contrast
 * against the supplied HSL background.
 */
export function getReadableForeground(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  const bgLum = getRelativeLuminance(r, g, b);
  const contrastWithDark = getContrastRatio(bgLum, DARK_INK_LUM);
  const contrastWithLight = getContrastRatio(bgLum, LIGHT_INK_LUM);
  return contrastWithDark >= contrastWithLight ? DARK_INK : LIGHT_INK;
}

export function isThemeDefault(theme: ThemeConfig): boolean {
  const b = theme.base;
  const a = theme.accent;
  const db = DEFAULT_THEME_CONFIG.base;
  const da = DEFAULT_THEME_CONFIG.accent;
  return (
    b.hue === db.hue &&
    b.saturation === db.saturation &&
    b.lightness === db.lightness &&
    b.opacity === db.opacity &&
    a.hue === da.hue &&
    a.saturation === da.saturation &&
    a.lightness === da.lightness
  );
}

/**
 * Generates live CSS custom properties applied to the app shell container.
 */
export function buildThemeCssVariables(rawTheme: ThemeConfig): Record<string, string> {
  const theme = clampThemeConfig(rawTheme);
  const { hue: bh, saturation: bs, lightness: bl, opacity: bo } = theme.base;
  const { hue: ah, saturation: as, lightness: al } = theme.accent;

  const alpha = Number((bo / 100).toFixed(2));
  const innerAlpha = Number(Math.max(0.24, Math.min(0.82, alpha * 0.68)).toFixed(2));
  const rowActiveAlpha = Number(Math.max(0.32, Math.min(0.92, alpha * 0.84)).toFixed(2));
  const rowInactiveAlpha = Number(Math.max(0.16, Math.min(0.65, alpha * 0.48)).toFixed(2));
  const panelAlpha = Number(Math.max(0.45, Math.min(0.96, alpha + 0.06)).toFixed(2));

  const accentFg = getReadableForeground(ah, as, al);
  const accentHoverLightness = al > 55 ? Math.max(25, al - 6) : Math.min(94, al + 7);
  const accentSoftAlpha = 0.16;

  // Keep text readable even when base window lightness is dragged up toward 45%
  const baseTextStrong = bl >= 38 ? '#ffffff' : '#f2f5f8';
  const baseTextMuted = bl >= 38 ? 'rgba(245, 248, 252, 0.78)' : 'rgba(214, 222, 232, 0.66)';
  const baseTextDim = bl >= 38 ? 'rgba(235, 241, 248, 0.62)' : 'rgba(182, 193, 206, 0.50)';

  return {
    '--sc-window-bg': `hsla(${bh}, ${bs}%, ${bl}%, ${alpha})`,
    '--sc-panel-bg': `hsla(${bh}, ${bs}%, ${Math.max(5, bl - 2)}%, ${panelAlpha})`,
    '--sc-inner-bg': `hsla(${bh}, ${bs}%, ${Math.max(4, bl - 4)}%, ${innerAlpha})`,
    '--sc-row-active-bg': `hsla(${bh}, ${bs}%, ${Math.min(56, bl + 8)}%, ${rowActiveAlpha})`,
    '--sc-row-inactive-bg': `hsla(${bh}, ${bs}%, ${Math.max(4, bl - 2)}%, ${rowInactiveAlpha})`,
    '--sc-control-bg': `hsla(${bh}, ${bs}%, ${Math.min(54, bl + 6)}%, ${Math.min(0.86, alpha)})`,
    '--sc-border': 'rgba(255, 255, 255, 0.12)',
    '--sc-border-subtle': 'rgba(255, 255, 255, 0.08)',
    '--sc-border-active': 'rgba(255, 255, 255, 0.18)',
    '--sc-text': baseTextStrong,
    '--sc-text-muted': baseTextMuted,
    '--sc-text-dim': baseTextDim,
    '--sc-accent': `hsl(${ah}, ${as}%, ${al}%)`,
    '--sc-accent-hover': `hsl(${ah}, ${as}%, ${accentHoverLightness}%)`,
    '--sc-accent-fg': accentFg,
    '--sc-accent-soft': `hsla(${ah}, ${as}%, ${al}%, ${accentSoftAlpha})`,
    '--sc-switch-off-bg': `hsla(${bh}, ${Math.max(6, bs)}%, ${Math.max(4, bl - 6)}%, 0.78)`,
  };
}
