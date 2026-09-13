import { calculatePrayerTimes } from '../../src/utils/prayerEngine';

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
});
