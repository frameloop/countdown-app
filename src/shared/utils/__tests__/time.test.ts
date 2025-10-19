/**
 * Pruebas unitarias para las utilidades de tiempo
 * 
 * Verifica:
 * - Formateo correcto de tiempo
 * - Parsing de diferentes formatos
 * - Normalización de valores
 * - Conversiones entre formatos
 */

import { describe, it, expect } from 'vitest';
import {
  formatTime,
  parseTime,
  parseKeypadInput,
  normalizeSeconds,
  toMinutesAndSeconds,
  fromMinutesAndSeconds,
  isValidTime,
  toKeypadString
} from '../time';

describe('formatTime', () => {
  it('should format seconds only for values < 60', () => {
    expect(formatTime(30)).toBe('30');
    expect(formatTime(5)).toBe('05');
    expect(formatTime(0)).toBe('00');
  });

  it('should format mm:ss for values >= 60', () => {
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(3661)).toBe('61:01');
  });
});

describe('parseTime', () => {
  it('should parse ss format correctly', () => {
    expect(parseTime('30')).toBe(30);
    expect(parseTime('05')).toBe(5);
    expect(parseTime('00')).toBe(0);
  });

  it('should parse mm:ss format correctly', () => {
    expect(parseTime('01:30')).toBe(90);
    expect(parseTime('05:00')).toBe(300);
    expect(parseTime('00:00')).toBe(0);
  });

  it('should handle invalid input', () => {
    expect(parseTime('')).toBe(0);
    expect(parseTime('invalid')).toBe(0);
    expect(parseTime('1:2:3')).toBe(0);
  });
});

describe('parseKeypadInput', () => {
  it('should parse numbers < 100 as seconds', () => {
    expect(parseKeypadInput('30')).toBe(30);
    expect(parseKeypadInput('59')).toBe(59);
    expect(parseKeypadInput('0')).toBe(0);
  });

  it('should parse numbers >= 100 as mmss', () => {
    expect(parseKeypadInput('130')).toBe(90); // 1:30
    expect(parseKeypadInput('500')).toBe(300); // 5:00
    expect(parseKeypadInput('0000')).toBe(0); // 00:00
  });

  it('should handle invalid input', () => {
    expect(parseKeypadInput('')).toBe(0);
    expect(parseKeypadInput('abc')).toBe(0);
    expect(parseKeypadInput('-10')).toBe(0);
  });

  it('should limit seconds to 59', () => {
    expect(parseKeypadInput('165')).toBe(119); // 1:65 becomes 1:59 = 119 seconds
    expect(parseKeypadInput('199')).toBe(119); // 1:99 becomes 1:59 = 119 seconds
  });
});

describe('normalizeSeconds', () => {
  it('should keep valid values unchanged', () => {
    expect(normalizeSeconds(30)).toBe(30);
    expect(normalizeSeconds(3661)).toBe(3661);
  });

  it('should clamp negative values to 0', () => {
    expect(normalizeSeconds(-10)).toBe(0);
    expect(normalizeSeconds(-1)).toBe(0);
  });

  it('should clamp values > 99:59', () => {
    expect(normalizeSeconds(6000)).toBe(5999); // 99:59
    expect(normalizeSeconds(10000)).toBe(5999);
  });
});

describe('toMinutesAndSeconds', () => {
  it('should convert seconds correctly', () => {
    expect(toMinutesAndSeconds(90)).toEqual({ minutes: 1, seconds: 30 });
    expect(toMinutesAndSeconds(3661)).toEqual({ minutes: 61, seconds: 1 });
    expect(toMinutesAndSeconds(30)).toEqual({ minutes: 0, seconds: 30 });
  });
});

describe('fromMinutesAndSeconds', () => {
  it('should convert to total seconds correctly', () => {
    expect(fromMinutesAndSeconds(1, 30)).toBe(90);
    expect(fromMinutesAndSeconds(61, 1)).toBe(3661);
    expect(fromMinutesAndSeconds(0, 30)).toBe(30);
  });
});

describe('isValidTime', () => {
  it('should validate correct time strings', () => {
    expect(isValidTime('30')).toBe(true);
    expect(isValidTime('01:30')).toBe(true);
    expect(isValidTime('99:59')).toBe(true);
  });

  it('should reject invalid time strings', () => {
    expect(isValidTime('')).toBe(false);
    expect(isValidTime('invalid')).toBe(false);
    expect(isValidTime('100:00')).toBe(false);
    expect(isValidTime('00:60')).toBe(false);
  });
});

describe('toKeypadString', () => {
  it('should convert seconds to mmss format', () => {
    expect(toKeypadString(90)).toBe('0130');
    expect(toKeypadString(300)).toBe('0500');
    expect(toKeypadString(30)).toBe('0030');
    expect(toKeypadString(0)).toBe('0000');
  });
});
