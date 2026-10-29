import { describe, expect, it } from 'vitest';
import { formatDate, yearOf } from '../../src/format/date.ts';
import {
  MIN_READING_MS,
  buildSteps,
  nextStepId,
  prevStepId,
  remapOnModeChange,
  stepDuration,
  type TimelineEvent,
} from '../../src/timeline/steps.ts';

// Fictional ids and dates: only the ordering logic is under test.
const ev = (id: string, iso: string, journeyId?: string): TimelineEvent => ({
  id,
  date: { iso },
  text: 'kurgu',
  journeyId,
});
const events = [
  ev('d', '1902-05-01'),
  ev('a', '1900-01-02', 'j1'),
  ev('c', '1900-07-09'),
  ev('b', '1900-03-04', 'j1'),
  ev('e', '1905', 'j2'),
];

describe('buildSteps', () => {
  it('olay: every event in date order', () => {
    expect(buildSteps(events, 'olay').map((e) => e.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('seyahat: only events with a journey', () => {
    expect(buildSteps(events, 'seyahat').map((e) => e.id)).toEqual(['a', 'b', 'e']);
  });
  it('yil: first event of each year, empty years skipped', () => {
    expect(buildSteps(events, 'yil').map((e) => e.id)).toEqual(['a', 'd', 'e']);
  });
  it('orders by id when dates are equal', () => {
    const tied = [ev('z', '1900-01-01'), ev('y', '1900-01-01')];
    expect(buildSteps(tied, 'olay').map((e) => e.id)).toEqual(['y', 'z']);
  });
  it('does not mutate its input', () => {
    const copy = [...events];
    buildSteps(events, 'olay');
    expect(events).toEqual(copy);
  });
});

describe('next / prev', () => {
  const steps = buildSteps(events, 'olay');
  it('walks forward and backward', () => {
    expect(nextStepId(steps, 'b')).toBe('c');
    expect(prevStepId(steps, 'b')).toBe('a');
  });
  it('is null at the ends (buttons disable, autoplay stops)', () => {
    expect(prevStepId(steps, 'a')).toBeNull();
    expect(nextStepId(steps, 'e')).toBeNull();
  });
  it('is null for an unknown or missing id', () => {
    expect(nextStepId(steps, 'nope')).toBe('a'); // index -1 + 1: the first step
    expect(prevStepId(steps, null)).toBeNull();
  });
});

describe('remapOnModeChange (A1, first rule)', () => {
  it('keeps the latest step not later than the current event', () => {
    expect(remapOnModeChange(events, 'c', 'seyahat')).toBe('b');
    expect(remapOnModeChange(events, 'd', 'yil')).toBe('d');
    expect(remapOnModeChange(events, 'c', 'yil')).toBe('a');
  });
  it('falls back to the first step when all are later', () => {
    const later = [ev('x', '1900-01-01'), ev('y', '1910-01-01', 'j')];
    expect(remapOnModeChange(later, 'x', 'seyahat')).toBe('y');
  });
  it('returns null when the mode has no steps', () => {
    expect(remapOnModeChange([ev('x', '1900-01-01')], 'x', 'seyahat')).toBeNull();
  });
  it('starts at the first step when nothing is current', () => {
    expect(remapOnModeChange(events, null, 'olay')).toBe('a');
  });
});

describe('stepDuration (A2)', () => {
  it('adds a reading time with a floor', () => {
    expect(stepDuration({ text: 'kısa' }, 800)).toBe(800 + MIN_READING_MS);
    expect(stepDuration({ text: 'x'.repeat(240) }, 800)).toBe(800 + 240 * 55);
  });
});

describe('formatDate (SPEC §2.3)', () => {
  it('writes day, month and year precision', () => {
    expect(formatDate({ iso: '1900-03-03', precision: 'day' })).toBe('3 Mart 1900');
    expect(formatDate({ iso: '1900-03', precision: 'month' })).toBe('Mart 1900');
    expect(formatDate({ iso: '1900', precision: 'year' })).toBe('1900');
  });
  it('writes a range with an en dash', () => {
    expect(formatDate({ iso: '1900', isoEnd: '1901', precision: 'range' })).toBe('1900 – 1901');
  });
  it('uses Turkish month names with their letters', () => {
    expect(formatDate({ iso: '1900-02-01', precision: 'day' })).toBe('1 Şubat 1900');
    expect(formatDate({ iso: '1900-08-30', precision: 'day' })).toBe('30 Ağustos 1900');
  });
  it('yearOf reads the first four digits', () => {
    expect(yearOf({ iso: '1923-10-29' })).toBe(1923);
  });
});
