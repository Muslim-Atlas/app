import { calculatePrayerTimes, adjustTimeString } from '../../src/utils/prayerEngine';

describe('prayerEngine Unit Tests', () => {
  const londonLat = 51.5074;
  const londonLng = -0.1278;
  const testDate = new Date('2026-06-15T12:00:00Z');
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  it('calculates 5 daily prayer times plus sunrise in HH:mm format', () => {
    const times = calculatePrayerTimes(londonLat, londonLng, testDate, {
      calculationMethod: 'MuslimWorldLeague',
      asrMethod: 'standard',
    });

    expect(times).toBeDefined();
    expect(times.Fajr).toMatch(timeRegex);
    expect(times.Sunrise).toMatch(timeRegex);
    expect(times.Dhuhr).toMatch(timeRegex);
    expect(times.Asr).toMatch(timeRegex);
    expect(times.Maghrib).toMatch(timeRegex);
    expect(times.Isha).toMatch(timeRegex);

    // Convert to comparable minutes from midnight
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    expect(toMinutes(times.Fajr)).toBeLessThan(toMinutes(times.Sunrise));
    expect(toMinutes(times.Sunrise)).toBeLessThan(toMinutes(times.Dhuhr));
    expect(toMinutes(times.Dhuhr)).toBeLessThan(toMinutes(times.Asr));
    expect(toMinutes(times.Asr)).toBeLessThan(toMinutes(times.Maghrib));
    expect(toMinutes(times.Maghrib)).toBeLessThan(toMinutes(times.Isha));
  });

  it('calculates later Asr time for Hanafi madhab compared to standard Shafi', () => {
    const shafiTimes = calculatePrayerTimes(londonLat, londonLng, testDate, {
      calculationMethod: 'MuslimWorldLeague',
      asrMethod: 'standard',
    });

    const hanafiTimes = calculatePrayerTimes(londonLat, londonLng, testDate, {
      calculationMethod: 'MuslimWorldLeague',
      asrMethod: 'hanafi',
    });

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    expect(toMinutes(hanafiTimes.Asr)).toBeGreaterThan(toMinutes(shafiTimes.Asr));
  });

  it('applies manual minute offsets correctly', () => {
    const baseTimes = calculatePrayerTimes(londonLat, londonLng, testDate, {
      calculationMethod: 'MuslimWorldLeague',
      prayerOffsets: { Maghrib: 0 },
    });

    const offsetTimes = calculatePrayerTimes(londonLat, londonLng, testDate, {
      calculationMethod: 'MuslimWorldLeague',
      prayerOffsets: { Maghrib: 15 },
    });

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const diff = toMinutes(offsetTimes.Maghrib) - toMinutes(baseTimes.Maghrib);
    expect(diff).toBe(15);
  });

  it('supports LondonUnified / LondonUnifiedDefault calculation method', () => {
    const timesDefault = calculatePrayerTimes(londonLat, londonLng, testDate, {
      calculationMethod: 'LondonUnifiedDefault',
    });
    const timesUnified = calculatePrayerTimes(londonLat, londonLng, testDate, {
      calculationMethod: 'LondonUnified',
    });

    expect(timesDefault.Fajr).toMatch(timeRegex);
    expect(timesDefault.Maghrib).toMatch(timeRegex);
    expect(timesUnified.Fajr).toMatch(timeRegex);
  });

  it('supports various calculation authorities without throwing', () => {
    const authorities = ['Karachi', 'Egyptian', 'NorthAmerica', 'MuslimWorldLeague', 'Dubai', 'Qatar', 'Kuwait'];

    authorities.forEach((method) => {
      const times = calculatePrayerTimes(londonLat, londonLng, testDate, { calculationMethod: method });
      expect(times.Fajr).toMatch(timeRegex);
      expect(times.Dhuhr).toMatch(timeRegex);
    });
  });

  it('supports various high latitude rules', () => {
    const rules = ['Auto', 'SeventhOfTheNight', 'TwilightAngle', 'MiddleOfTheNight', 'None'];

    rules.forEach((rule) => {
      const times = calculatePrayerTimes(londonLat, londonLng, testDate, { highLatitudeRule: rule });
      expect(times.Fajr).toMatch(timeRegex);
      expect(times.Isha).toMatch(timeRegex);
    });
  });

  describe('adjustTimeString utility', () => {
    it('adjusts positive and negative minutes correctly', () => {
      expect(adjustTimeString('06:15', 5)).toBe('06:20');
      expect(adjustTimeString('06:15', -10)).toBe('06:05');
      expect(adjustTimeString('06:15', 0)).toBe('06:15');
    });

    it('strips timezone suffixes like (BST)', () => {
      expect(adjustTimeString('06:15 (BST)', 3)).toBe('06:18');
      expect(adjustTimeString('19:45 (BST)', 0)).toBe('19:45');
    });

    it('wraps around midnight correctly', () => {
      expect(adjustTimeString('00:05', -10)).toBe('23:55');
      expect(adjustTimeString('23:55', 10)).toBe('00:05');
    });

    it('gracefully handles missing or invalid input', () => {
      expect(adjustTimeString('', 5)).toBe('');
      expect(adjustTimeString(null, 5)).toBe('');
      expect(adjustTimeString('invalid', 5)).toBe('invalid');
    });
  });

  describe('LondonUnifiedDefault manual offset corrections on API timings', () => {
    const mockApiTimings = {
      Sunrise: '06:10 (BST)',
      Maghrib: '19:20 (BST)',
    };

    it('applies manual corrections to Google/API sunrise and maghrib times', () => {
      const times = calculatePrayerTimes(londonLat, londonLng, testDate, {
        calculationMethod: 'LondonUnifiedDefault',
        apiTimings: mockApiTimings,
        prayerOffsets: {
          Sunrise: 3,
          Maghrib: -5,
        },
      });

      expect(times.Sunrise).toBe('06:13');
      expect(times.Maghrib).toBe('19:15');
    });

    it('uses unadjusted Google/API times when manual offsets are 0', () => {
      const times = calculatePrayerTimes(londonLat, londonLng, testDate, {
        calculationMethod: 'LondonUnifiedDefault',
        apiTimings: mockApiTimings,
        prayerOffsets: {
          Sunrise: 0,
          Maghrib: 0,
        },
      });

      expect(times.Sunrise).toBe('06:10');
      expect(times.Maghrib).toBe('19:20');
    });
  });
});
