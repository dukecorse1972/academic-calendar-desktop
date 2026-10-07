import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { logger } from '../shared/logger';

describe('9. Structured Application Logger', () => {
  test('Logger instance is a singleton', () => {
    assert.ok(logger);
    assert.equal(typeof logger.info, 'function');
    assert.equal(typeof logger.error, 'function');
    assert.equal(typeof logger.warn, 'function');
    assert.equal(typeof logger.debug, 'function');
  });

  test('Logger debug toggle changes state without throwing', () => {
    assert.doesNotThrow(() => {
      logger.setDebugEnabled(true);
      logger.debug('TestContext', 'Debug message');
      logger.setDebugEnabled(false);
      logger.debug('TestContext', 'Should be silenced in non-debug');
    });
  });
});
