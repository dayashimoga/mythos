import { describe, it, expect, beforeEach } from 'vitest';
import { Logger } from '../../src/core/Logger';

describe('Logger Structured Logging', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
    logger.clear();
    logger.setMinLevel('DEBUG');
  });

  it('records logs with levels and tags', () => {
    logger.info('TestTag', 'Test message', { detail: 1 });
    logger.debug('DebugTag', 'Debug message');
    logger.warn('WarnTag', 'Warn message');
    logger.error('ErrorTag', 'Error message');

    const logs = logger.getRecentLogs();
    expect(logs.length).toBe(4);
    expect(logs[0].level).toBe('INFO');
    expect(logs[0].tag).toBe('TestTag');
    expect(logs[0].message).toBe('Test message');
    expect(logs[1].level).toBe('DEBUG');
    expect(logs[2].level).toBe('WARN');
    expect(logs[3].level).toBe('ERROR');
  });

  it('respects minLevel threshold', () => {
    logger.setMinLevel('WARN');
    logger.debug('Ignore', 'Should not display in high level');
    logger.info('Ignore', 'Should not display in high level');
    logger.warn('Show', 'Warning visible');

    const recent = logger.getRecentLogs();
    expect(recent.length).toBe(3); // buffered
  });

  it('clears log buffer on demand', () => {
    logger.info('Tag', 'msg');
    expect(logger.getRecentLogs().length).toBe(1);

    logger.clear();
    expect(logger.getRecentLogs().length).toBe(0);
  });
});
