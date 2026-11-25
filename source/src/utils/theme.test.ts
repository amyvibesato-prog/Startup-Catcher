import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildThemeCssVariables,
  clampThemeConfig,
  DEFAULT_THEME_CONFIG,
  getContrastRatio,
  getReadableForeground,
  getRelativeLuminance,
  hslToRgb,
  isThemeDefault,
} from './theme';

test('hslToRgb converts primary hues and neutrals accurately', () => {
  assert.deepEqual(hslToRgb(0, 0, 0), [0, 0, 0]);
  assert.deepEqual(hslToRgb(0, 0, 100), [255, 255, 255]);
  assert.deepEqual(hslToRgb(0, 100, 50), [255, 0, 0]);
  assert.deepEqual(hslToRgb(120, 100, 50), [0, 255, 0]);
  assert.deepEqual(hslToRgb(240, 100, 50), [0, 0, 255]);
});

test('getReadableForeground guarantees accessible contrast for light and dark accents', () => {
  // Light matte off-white accent should pick dark text
  const fgOnLight = getReadableForeground(192, 18, 88);
  assert.equal(fgOnLight, '#0b0e12');

  // Deep saturated blue accent should pick light text
  const fgOnDark = getReadableForeground(225, 80, 35);
  assert.equal(fgOnDark, '#ffffff');

  // Verify contrast ratio across full lightness sweep stays >= 4.5:1
  for (let l = 30; l <= 90; l += 10) {
    for (const h of [0, 60, 140, 210, 290]) {
      const fg = getReadableForeground(h, 70, l);
      const [bgR, bgG, bgB] = hslToRgb(h, 70, l);
      const bgLum = getRelativeLuminance(bgR, bgG, bgB);
      const fgLum =
        fg === '#0b0e12'
          ? getRelativeLuminance(11, 14, 18)
          : getRelativeLuminance(255, 255, 255);
      assert.ok(
        getContrastRatio(bgLum, fgLum) >= 4.5,
        `Expected >= 4.5 contrast for hsl(${h}, 70%, ${l}%), got ${getContrastRatio(bgLum, fgLum)}`,
      );
    }
  }
});

test('clampThemeConfig enforces slider bounds safely', () => {
  const clamped = clampThemeConfig({
    base: { hue: 999, saturation: -10, lightness: 80, opacity: 10 },
    accent: { hue: -5, saturation: 150, lightness: 5 },
  });

  assert.equal(clamped.base.hue, 360);
  assert.equal(clamped.base.saturation, 0);
  assert.equal(clamped.base.lightness, 45);
  assert.equal(clamped.base.opacity, 35);

  assert.equal(clamped.accent.hue, 0);
  assert.equal(clamped.accent.saturation, 100);
  assert.equal(clamped.accent.lightness, 30);
});

test('buildThemeCssVariables maps default semi-transparent smoked glass and accent variables', () => {
  const vars = buildThemeCssVariables(DEFAULT_THEME_CONFIG);
  assert.equal(vars['--sc-window-bg'], 'hsla(215, 12%, 18%, 0.78)');
  assert.equal(vars['--sc-accent'], 'hsl(192, 18%, 88%)');
  assert.equal(vars['--sc-accent-fg'], '#0b0e12');
  assert.equal(isThemeDefault(DEFAULT_THEME_CONFIG), true);
  assert.equal(
    isThemeDefault({
      ...DEFAULT_THEME_CONFIG,
      base: { ...DEFAULT_THEME_CONFIG.base, opacity: 60 },
    }),
    false,
  );
});
