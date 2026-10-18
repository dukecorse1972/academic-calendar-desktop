import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PREDEFINED_PALETTES, getPaletteById } from '../shared/palettes';
import { GoogleCalendarAdapter } from '../injected/adapter/GoogleCalendarAdapter';
import { OnboardingModal } from '../injected/ui/onboardingModal';

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

  test('OnboardingModal supports opening in edit mode for reconfiguring subjects', () => {
    const modal = OnboardingModal.getInstance();
    assert.ok(modal);
    assert.equal(typeof modal.open, 'function');
    assert.equal(typeof modal.close, 'function');

    // Test that close marks completed without throwing
    modal.close();
  });

  test('Supports dynamic subject lists with 8+ simultaneous courses without errors', () => {
    const adapter = GoogleCalendarAdapter.getInstance();
    const subjects8 = [
      { name: 'Anatomía', color: '#98D5E8' },
      { name: 'Fisiología', color: '#A1D0CA' },
      { name: 'Bioquímica', color: '#F0F4A3' },
      { name: 'Histología', color: '#FFB6D9' },
      { name: 'Bioestadística', color: '#FFDFB5' },
      { name: 'Inmunología', color: '#E3B1C3' },
      { name: 'Genética Médica', color: '#C6B6D3' },
      { name: 'Microbiología', color: '#88C0D0' }
    ];

    // Mock localStorage storage
    const storage: Record<string, string> = {
      gcal_academic_subjects: JSON.stringify(subjects8)
    };
    (global as any).localStorage = {
      getItem: (k: string) => storage[k] || null,
      setItem: (k: string, v: string) => { storage[k] = v; }
    };

    const detected = adapter.getDetectedClasses();
    assert.equal(detected.length, 8);
    assert.ok(detected.includes('Microbiología'));
    assert.ok(detected.includes('Genética Médica'));

    // Check color assignment for 8th subject
    const colorMap = adapter.getSubjectColorMap();
    const c8 = adapter.findSubjectColor('Microbiología', colorMap);
    assert.ok(Boolean(c8));
    assert.match(c8, /^#[0-9A-Fa-f]{6}$/);
  });

  test('Visualization preferences: defaults preserve creator cleanliness (Zero Disruption)', () => {
    const adapter = GoogleCalendarAdapter.getInstance();
    
    // Clear mock storage
    const storage: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (k: string) => storage[k] || null,
      setItem: (k: string, v: string) => { storage[k] = v; }
    };

    // By default, birthdays are hidden and other calendars are preserved/shown by default [P0-03]
    assert.equal(adapter.shouldHideBirthdays(), true, 'Birthdays must be hidden by default');
    assert.equal(adapter.shouldShowOtherCalendars(), true, 'Other calendars must be shown by default');

    // When explicitly toggled by user in settings (Ctrl+,)
    storage['gcal_hide_birthdays'] = 'false';
    storage['gcal_show_other_calendars'] = 'false';
    assert.equal(adapter.shouldHideBirthdays(), false, 'Birthdays should be visible when opted in');
    assert.equal(adapter.shouldShowOtherCalendars(), false, 'Other calendars should be hidden when opted out');
  });

  test('Dynamic subject resolution does not override custom subjects with hardcoded keywords', () => {
    const adapter = GoogleCalendarAdapter.getInstance();
    const customMap = new Map<string, string>([
      ['arquitectura de computadores', '#112233'],
      ['computadores y redes', '#445566']
    ]);

    // Should resolve exact matches directly from map
    assert.equal(adapter.findSubjectColor('arquitectura de computadores', customMap), '#112233');
    assert.equal(adapter.findSubjectColor('computadores y redes', customMap), '#445566');
  });
});

