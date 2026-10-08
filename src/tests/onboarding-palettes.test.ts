import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PREDEFINED_PALETTES, getPaletteById } from '../shared/palettes';
import { GoogleCalendarAdapter } from '../injected/adapter/GoogleCalendarAdapter';

describe('10. Specialized Color Palettes & Aesthetic Theme Systems', () => {
  test('Contains all 4 specialized palettes: Mildliner, Catppuccin, Nord, Morandi', () => {
    const ids = PREDEFINED_PALETTES.map((p) => p.id);
    assert.ok(ids.includes('mildliner'), 'Should include Zebra Mildliner palette');
    assert.ok(ids.includes('catppuccin'), 'Should include Catppuccin palette');
    assert.ok(ids.includes('nord'), 'Should include Nord palette');
    assert.ok(ids.includes('morandi'), 'Should include Morandi palette');
  });

  test('All palette colors have valid 7-character hex codes (#RRGGBB)', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const palette of PREDEFINED_PALETTES) {
      assert.ok(palette.colors.length >= 5, `${palette.id} should have at least 5 colors`);
      for (const color of palette.colors) {
        assert.match(color.hex, hexRegex, `Color ${color.name} in ${palette.id} must be valid hex`);
      }
    }
  });

  test('Zebra Mildliner palette contains authentic study highlighter shades', () => {
    const mildliner = getPaletteById('mildliner');
    assert.equal(mildliner.id, 'mildliner');
    const hexes = mildliner.colors.map((c) => c.hex.toUpperCase());
    assert.ok(hexes.includes('#98D5E8'), 'Should include Mild Blue');
    assert.ok(hexes.includes('#A1D0CA'), 'Should include Mild Blue Green');
    assert.ok(hexes.includes('#F0F4A3'), 'Should include Mild Yellow');
    assert.ok(hexes.includes('#FFB6D9'), 'Should include Mild Pink');
  });

  test('Catppuccin palette contains authentic soft pastel hues', () => {
    const catppuccin = getPaletteById('catppuccin');
    assert.equal(catppuccin.id, 'catppuccin');
    const hexes = catppuccin.colors.map((c) => c.hex.toLowerCase());
    assert.ok(hexes.includes('#74c7ec'), 'Should include Sapphire');
    assert.ok(hexes.includes('#a6e3a1'), 'Should include Green');
    assert.ok(hexes.includes('#cba6f7'), 'Should include Mauve');
  });

  test('Nord palette contains authentic Frost & Aurora specifications', () => {
    const nord = getPaletteById('nord');
    assert.equal(nord.id, 'nord');
    const hexes = nord.colors.map((c) => c.hex.toUpperCase());
    assert.ok(hexes.includes('#88C0D0'), 'Should include Frost Cyan (nord8)');
    assert.ok(hexes.includes('#81A1C1'), 'Should include Frost Blue (nord9)');
    assert.ok(hexes.includes('#A3BE8C'), 'Should include Aurora Green (nord14)');
  });

  test('Morandi palette contains authentic dusty and earthy tones', () => {
    const morandi = getPaletteById('morandi');
    assert.equal(morandi.id, 'morandi');
    const hexes = morandi.colors.map((c) => c.hex.toUpperCase());
    assert.ok(hexes.includes('#99B9C6'), 'Should include Morandi Blue');
    assert.ok(hexes.includes('#A9B4A1'), 'Should include Morandi Green');
  });

  test('getPaletteById falls back gracefully to default palette for unknown id', () => {
    const fallback = getPaletteById('non-existent-palette');
    assert.equal(fallback.id, 'mildliner');
  });
});

describe('11. Dynamic Academic Subjects & Resilient Calendar Integration', () => {
  test('getDetectedClasses returns realistic academic subjects fallback', () => {
    const adapter = GoogleCalendarAdapter.getInstance();
    const subjects = adapter.getDetectedClasses();
    assert.ok(Array.isArray(subjects));
    assert.ok(subjects.length >= 4);
    assert.ok(subjects.includes('Matemáticas') || subjects.includes('Clase 1'));
  });

  test('Color map matches configured subject names deterministically', () => {
    const adapter = GoogleCalendarAdapter.getInstance();
    const colorMap = adapter.getSubjectColorMap();
    assert.ok(colorMap instanceof Map);
    assert.ok(colorMap.size > 0);

    const mathColor = adapter.findSubjectColor('Matemáticas', colorMap);
    assert.ok(Boolean(mathColor));
    assert.match(mathColor, /^#[0-9A-Fa-f]{6}$/);
  });
});
