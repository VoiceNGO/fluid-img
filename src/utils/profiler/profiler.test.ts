import { Profiler } from './profiler';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Profiler', () => {
  let logs: string[] = [];
  let profiler: Profiler;
  let performanceNowMock: any;

  beforeEach(() => {
    logs = [];
    profiler = new Profiler((str) => logs.push(str));

    // Mock performance.now
    performanceNowMock = vi.spyOn(performance, 'now');
    let time = 0;
    performanceNowMock.mockImplementation(() => {
      time += 25; // Increment by 25ms each call
      return time;
    });
  });

  afterEach(() => {
    performanceNowMock.mockRestore();
  });

  it('should log elapsed time for a simple profile', () => {
    profiler.start('simple');
    profiler.end('simple');

    expect(logs).toHaveLength(1);
    expect(logs[0]).toBe('simple: 25.00ms');
  });

  it('should subtract nested profile times from parent profile', () => {
    profiler.start('outer'); // time = 25
    profiler.start('inner'); // time = 50
    profiler.end('inner'); // time = 75, logs inner: 25ms
    profiler.end('outer'); // time = 100, should log outer: 50ms (75ms)

    expect(logs).toHaveLength(2);
    expect(logs[0]).toBe('inner: 25.00ms');
    expect(logs[1]).toBe('outer: 50.00ms (75.00ms)');
  });

  it('should handle multiple levels of nesting', () => {
    profiler.start('level1'); // time = 25
    profiler.start('level2'); // time = 50
    profiler.start('level3'); // time = 75
    profiler.end('level3'); // time = 100, logs level3: 25ms
    profiler.end('level2'); // time = 125, logs level2: 50ms (75ms)
    profiler.end('level1'); // time = 150, logs level1: 50ms (125ms)

    expect(logs).toHaveLength(3);
    expect(logs[0]).toBe('level3: 25.00ms');
    expect(logs[1]).toBe('level2: 50.00ms (75.00ms)');
    expect(logs[2]).toBe('level1: 50.00ms (125.00ms)');
  });

  it('should respect minLoggingTime parameter', () => {
    // Mock performance.now to return fixed values
    let time = 0;
    performanceNowMock.mockReset();
    performanceNowMock.mockImplementation(() => {
      time += 5; // Only increment by 5ms each call
      return time;
    });

    profiler.start('fast', 10); // Won't log because total time will be less than 10ms
    profiler.end('fast');

    expect(logs).toHaveLength(0);
  });
});
