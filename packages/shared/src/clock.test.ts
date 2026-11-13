import { describe, expect, it } from 'vitest';
import { FakeClock } from './clock';

describe('clock — FakeClock', () => {
  it('menghasilkan waktu tetap', () => {
    const clock = new FakeClock('2026-11-13T05:00:00Z');
    expect(clock.now().toISOString()).toBe('2026-11-13T05:00:00.000Z');
  });

  it('todayJakarta = WIB dari UTC', () => {
    const clock = new FakeClock('2026-11-13T05:00:00Z');
    expect(clock.todayJakarta()).toBe('2026-11-13');
  });

  it('todayJakarta menyeberang tengah malam WIB', () => {
    // 2026-11-13 18:00 UTC = 2026-11-14 01:00 WIB
    const clock = new FakeClock('2026-11-13T18:00:00Z');
    expect(clock.todayJakarta()).toBe('2026-11-14');
  });

  it('currentPeriodJakarta YYYY-MM', () => {
    const clock = new FakeClock('2026-11-13T05:00:00Z');
    expect(clock.currentPeriodJakarta()).toBe('2026-11');
  });

  it('advance memajukan waktu', () => {
    const clock = new FakeClock('2026-11-13T05:00:00Z');
    clock.advance(24 * 60 * 60 * 1000);
    expect(clock.todayJakarta()).toBe('2026-11-14');
  });
});
