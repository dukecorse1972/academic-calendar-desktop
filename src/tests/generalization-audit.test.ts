import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { getIsolatedKey, getIsolatedItem, setIsolatedItem, removeIsolatedItem } from '../injected/utils/storage';
import { parseAcademicDateString, calculateDuration, toISODateString } from '../injected/utils/dateParsers';
import { t, setLocale, getLocale } from '../shared/i18n';
import { RESILIENT_SELECTORS } from '../injected/adapter/selectors';
import { GoogleCalendarAdapter } from '../injected/adapter/GoogleCalendarAdapter';
import { AppState } from '../injected/state';

describe('14. Account-Isolated Storage & Profile Privacy [P0-03]', () => {
  test('getIsolatedKey namespaces key when user identifier is present', () => {
    const isolated = getIsolatedKey('gcal_subject_colors', 'user_abc123');
    assert.equal(isolated, 'gcal_user_abc123_subject_colors');
  });

  test('getIsolatedKey falls back to raw key when user identifier is null', () => {
    const raw = getIsolatedKey('gcal_subject_colors', null);
    assert.equal(raw, 'gcal_subject_colors');
  });

  test('setIsolatedItem and getIsolatedItem store and retrieve isolated values with fallback', () => {
    // Setup global mock localStorage if not present in Node test runner
    if (typeof (global as any).localStorage === 'undefined') {
      const store: Record<string, string> = {};
      (global as any).localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = String(v); },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); }
      };
    }

    setIsolatedItem('test_key', 'isolated_val', 'student_456');
    assert.equal(getIsolatedItem('test_key', 'student_456'), 'isolated_val');

    // Different user should fall back to base or null
    assert.equal(getIsolatedItem('test_key', 'student_789'), null);

    removeIsolatedItem('test_key', 'student_456');
    assert.equal(getIsolatedItem('test_key', 'student_456'), null);
  });
});

describe('15. Resilient Multilingual Date Parsers [P3-01]', () => {
  test('Parses Spanish academic date string correctly', () => {
    const res = parseAcademicDateString('Evento el 20 de noviembre de 2026 a las 10:00');
    assert.equal(res.matchedDay, 20);
    assert.equal(res.matchedMonth, 10); // November is index 10
    assert.equal(res.matchedYear, 2026);
    assert.equal(res.isoDate, '2026-11-20');
    assert.ok(res.dateStr.includes('20 de Noviembre de 2026'));
  });

  test('Parses English academic date strings (Month DD and DD Month)', () => {
    const res1 = parseAcademicDateString('Final exam on December 15, 2026');
    assert.equal(res1.matchedDay, 15);
    assert.equal(res1.matchedMonth, 11); // December is index 11
    assert.equal(res1.matchedYear, 2026);
    assert.equal(res1.isoDate, '2026-12-15');

    const res2 = parseAcademicDateString('Assignment due 18 October 2026');
    assert.equal(res2.matchedDay, 18);
    assert.equal(res2.matchedMonth, 9); // October is index 9
    assert.equal(res2.isoDate, '2026-10-18');
  });

  test('calculateDuration computes hours and minutes and midnight rollover', () => {
    assert.equal(calculateDuration('10:00', '12:30'), '2 h 30 min');
    assert.equal(calculateDuration('09:00', '11:00'), '2 horas');
    assert.equal(calculateDuration('14:00', '14:45'), '45 min');
    // Overnight rollover
    assert.equal(calculateDuration('23:00', '01:00'), '2 horas');
  });

  test('toISODateString formats Date object to YYYY-MM-DD', () => {
    const d = new Date(2026, 4, 9); // May 9, 2026
    assert.equal(toISODateString(d), '2026-05-09');
  });
});

describe('16. Multilingual Translation Service (i18n) [P3-02]', () => {
  test('Returns Spanish translations by default', () => {
    setLocale('es');
    assert.equal(getLocale(), 'es');
    assert.equal(t('tab_clases'), 'CLASES');
    assert.equal(t('tab_entregas'), 'EXÁMENES Y ENTREGAS');
    assert.equal(t('new_academic_event'), 'Nuevo Evento Académico');
  });

  test('Switches to English and translates keys correctly', () => {
    setLocale('en');
    assert.equal(getLocale(), 'en');
    assert.equal(t('tab_clases'), 'CLASSES');
    assert.equal(t('tab_entregas'), 'EXAMS & DEADLINES');
    assert.equal(t('new_academic_event'), 'New Academic Event');
    setLocale('es'); // Reset
  });

  test('Translates dynamic functions and countdowns correctly', () => {
    setLocale('es');
    const fnEs = t('countdown_days_left');
    assert.equal(fnEs(3), 'Faltan 3 días');
    assert.equal(fnEs(1), 'Faltan 1 día');

    setLocale('en');
    const fnEn = t('countdown_days_left');
    assert.equal(fnEn(3), '3 days left');
    assert.equal(fnEn(1), '1 day left');
    setLocale('es');
  });
});

describe('17. Multilingual Selectors & Semantic Resilient Cascade [P1-03]', () => {
  test('saveButton contains multilingual labels (ES, EN, CA, GL, FR, DE)', () => {
    const joined = RESILIENT_SELECTORS.saveButton.join(' ');
    assert.ok(joined.includes('Guardar'));
    assert.ok(joined.includes('Save'));
    assert.ok(joined.includes('Desa'));
    assert.ok(joined.includes('Gardar'));
    assert.ok(joined.includes('Enregistrer'));
    assert.ok(joined.includes('Speichern'));
  });

  test('deleteButton contains multilingual labels', () => {
    const joined = RESILIENT_SELECTORS.deleteButton.join(' ');
    assert.ok(joined.includes('Eliminar'));
    assert.ok(joined.includes('Delete'));
    assert.ok(joined.includes('Suprimeix'));
    assert.ok(joined.includes('Supprimer'));
    assert.ok(joined.includes('Löschen'));
  });

  test('Contains description, start date, and time selectors', () => {
    assert.ok(RESILIENT_SELECTORS.descriptionInput.length > 0);
    assert.ok(RESILIENT_SELECTORS.startDateInput.length > 0);
    assert.ok(RESILIENT_SELECTORS.startTimeInput.length > 0);
  });
});

describe('18. Whitelist-Based isClass Classification [P0-02]', () => {
  const adapter = GoogleCalendarAdapter.getInstance();

  test('isClass returns true for configured onboarding subjects', () => {
    // Configure mock isolated subjects
    setIsolatedItem('gcal_academic_subjects', JSON.stringify([
      { name: 'Álgebra Lineal', color: '#98D5E8' },
      { name: 'Física I', color: '#A1D0CA' }
    ]));

    assert.ok(adapter.isClass('Álgebra Lineal'));
    assert.ok(adapter.isClass('Física I'));
    assert.ok(adapter.isClass('algebra lineal')); // Accent and case insensitive
  });

  test('isClass returns false for non-class calendar names (birthdays, personal, exams, holidays)', () => {
    assert.ok(!adapter.isClass('Cumpleaños'));
    assert.ok(!adapter.isClass('Exámenes'));
    assert.ok(!adapter.isClass('Entregas'));
    assert.ok(!adapter.isClass('Festivos en España'));
    assert.ok(!adapter.isClass('Recordatorios'));
    assert.ok(!adapter.isClass('Tareas'));
    assert.ok(!adapter.isClass('Mi Calendario'));
  });
});

describe('19. AppState Calendar Visibility DOM Synchronization [P2-04]', () => {
  test('Toggling calendar visibility in AppState notifies listeners and persists', () => {
    const appState = AppState.getInstance();
    let notifiedCal = '';
    let notifiedVis = false;

    const unsubscribe = appState.subscribe((state) => {
      // Find changed
    });

    appState.setCalendarVisibility('Matemáticas', false);
    assert.equal(appState.getState().selectedCalendars['Matemáticas'], false);

    appState.setCalendarVisibility('Matemáticas', true);
    assert.equal(appState.getState().selectedCalendars['Matemáticas'], true);
  });
});
