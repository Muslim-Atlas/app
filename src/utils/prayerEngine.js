import { Coordinates, CalculationMethod, PrayerTimes, Madhab, HighLatitudeRule, Rounding } from 'adhan';

/**
 * Calculates prayer times for a given location, date, and user settings.
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {Date} date 
 * @param {object} options 
 * @param {string} options.asrMethod - 'standard' (default) or 'hanafi'
 * @param {object} options.prayerOffsets - e.g. { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 }
 * @returns {object} formatted times: { Fajr: "HH:mm", Sunrise: "HH:mm", Dhuhr: "HH:mm", Asr: "HH:mm", Maghrib: "HH:mm", Isha: "HH:mm" }
 */
export function calculatePrayerTimes(latitude, longitude, date = new Date(), options = {}) {
  const { 
    asrMethod = 'standard', 
    prayerOffsets = {}, 
    calculationMethod = 'MuslimWorldLeague', 
    highLatitudeRule = 'Auto',
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } = options;

  const coordinates = new Coordinates(latitude, longitude);
  let params;

  // Configure calculation method
  // 'LondonUnifiedDefault' (Muslim Atlas calculation) uses the Moonsighting base with Rounding.None
  // so astronomical sunset/sunrise matches Google Search exactly without the +3m Moonsighting caution.
  if (calculationMethod === 'LondonUnified') {
    params = CalculationMethod.MoonsightingCommittee();
  } else if (calculationMethod === 'LondonUnifiedDefault') {
    params = CalculationMethod.MoonsightingCommittee();
    params.rounding = Rounding.None;
  } else if (typeof CalculationMethod[calculationMethod] === 'function') {
    params = CalculationMethod[calculationMethod]();
  } else {
    params = CalculationMethod.MuslimWorldLeague();
  }

  // Determine High Latitude Rule
  let rule = highLatitudeRule;
  if (rule === 'Auto') {
    // Default to SeventhOfTheNight above 48 degrees (e.g. UK in summer) to prevent failures
    rule = Math.abs(latitude) > 48 ? 'SeventhOfTheNight' : 'None';
  }

  // Configure High Latitude rule in parameters
  if (calculationMethod === 'LondonUnified') {
    // London Unified standard is TwilightAngle for summer twilight adjustments
    params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  } else if (rule === 'SeventhOfTheNight') {
    params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  } else if (rule === 'TwilightAngle') {
    params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  } else if (rule === 'MiddleOfTheNight') {
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  } else {
    // None / default
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  }

  // Configure Madhab for Asr calculation
  if (asrMethod === 'hanafi') {
    params.madhab = Madhab.Hanafi;
  } else {
    params.madhab = Madhab.Shafi; // Standard (Shafi, Maliki, Hanbali)
  }

  // Calculate base prayer times
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  // Helper to format Date to HH:mm string with local timezone offset applied
  const formatAndAdjust = (time, offsetMinutes = 0) => {
    if (!time) return '';
    // Apply manual minute offset
    const adjustedTime = new Date(time.getTime() + offsetMinutes * 60000);
    
    // Format based on the requested timezone
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timeZone
    });
    return formatter.format(adjustedTime);
  };

  const times = {
    Fajr: formatAndAdjust(prayerTimes.fajr, prayerOffsets.Fajr || 0),
    Sunrise: formatAndAdjust(prayerTimes.sunrise, prayerOffsets.Sunrise || 0),
    Dhuhr: formatAndAdjust(prayerTimes.dhuhr, prayerOffsets.Dhuhr || 0),
    Asr: formatAndAdjust(prayerTimes.asr, prayerOffsets.Asr || 0),
    Maghrib: formatAndAdjust(
      calculationMethod === 'LondonUnifiedDefault' ? prayerTimes.sunset : prayerTimes.maghrib,
      prayerOffsets.Maghrib || 0
    ),
    Isha: formatAndAdjust(prayerTimes.isha, prayerOffsets.Isha || 0),
  };

  // When in 'LondonUnifiedDefault' (Muslim Atlas Default) and online apiTimings are provided,
  // apply Google/API sunrise & sunset (maghrib) but ALWAYS apply user's manual corrections!
  if (calculationMethod === 'LondonUnifiedDefault' && options.apiTimings) {
    if (options.apiTimings.Sunrise) {
      times.Sunrise = adjustTimeString(options.apiTimings.Sunrise, prayerOffsets.Sunrise || 0);
    }
    if (options.apiTimings.Maghrib) {
      times.Maghrib = adjustTimeString(options.apiTimings.Maghrib, prayerOffsets.Maghrib || 0);
    }
  }

  return times;
}

/**
 * Adjusts a "HH:mm" or "HH:mm (BST)" time string by a given minute offset (+/-).
 * Preserves 24-hour wrap-around (00:00 - 23:59).
 *
 * @param {string} timeStr - e.g. "06:15", "06:15 (BST)", "18:30"
 * @param {number} offsetMinutes - e.g. +2, -5
 * @returns {string} formatted "HH:mm"
 */
export function adjustTimeString(timeStr, offsetMinutes = 0) {
  if (!timeStr) return '';
  const clean = String(timeStr).split(' ')[0].trim();
  if (!clean.includes(':')) return clean;

  const [hStr, mStr] = clean.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return clean;

  const offset = Number(offsetMinutes) || 0;
  if (offset === 0) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}`;
  }

  let totalMinutes = h * 60 + m + offset;
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(newH)}:${pad(newM)}`;
}
