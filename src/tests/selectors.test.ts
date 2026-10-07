import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RESILIENT_SELECTORS } from '../injected/adapter/selectors';

describe('8. Resilient DOM Selectors & Strategy Dictionaries', () => {
  test('RESILIENT_SELECTORS includes robust semantic fallbacks for save button', () => {
    assert.ok(RESILIENT_SELECTORS.saveButton.includes('#xSaveBu'));
    assert.ok(RESILIENT_SELECTORS.saveButton.some((s) => s.includes('Guardar')));
    assert.ok(RESILIENT_SELECTORS.saveButton.some((s) => s.includes('Save')));
  });

  test('RESILIENT_SELECTORS includes robust semantic fallbacks for delete button', () => {
    assert.ok(RESILIENT_SELECTORS.deleteButton.includes('#xDelBu'));
    assert.ok(RESILIENT_SELECTORS.deleteButton.some((s) => s.includes('Eliminar')));
    assert.ok(RESILIENT_SELECTORS.deleteButton.some((s) => s.includes('Delete')));
  });

  test('RESILIENT_SELECTORS includes robust ARIA fallbacks for calendar rows and chips', () => {
    assert.ok(RESILIENT_SELECTORS.calendarRow.some((s) => s.includes('[role="checkbox"]')));
    assert.ok(RESILIENT_SELECTORS.eventChip.includes('[data-eventchip]'));
  });

  test('RESILIENT_SELECTORS includes robust cascade for top header mount targets', () => {
    assert.ok(RESILIENT_SELECTORS.headerMountTargets.includes('.gb_v'));
    assert.ok(RESILIENT_SELECTORS.headerMountTargets.includes('.gb_ae'));
    assert.ok(RESILIENT_SELECTORS.headerMountTargets.includes('header'));
    assert.ok(RESILIENT_SELECTORS.headerMountTargets.includes('div[role="banner"]'));
  });
});
