import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculatePrayerTimes } from './src/utils/prayerEngine';
import { PrayerWidget } from './src/widgets/PrayerWidget';

const ASR_METHOD_KEY = '@muslimatlas_asr_method';
const PRAYER_OFFSETS_KEY = '@muslimatlas_prayer_offsets';
const CALCULATION_METHOD_KEY = '@muslimatlas_calc_method';
const HIGH_LATITUDE_RULE_KEY = '@muslimatlas_high_lat_rule';

/**
 * Loads all widget config from AsyncStorage.
 */
async function loadWidgetConfig() {
  let lat = 51.5074; // London fallback
  let lng = -0.1278;
  let asrMethod = 'standard';
  let prayerOffsets = { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 };
  let calculationMethod = 'MuslimWorldLeague';
  let highLatitudeRule = 'Auto';
  let locationName = 'Muslim Atlas';

  try {
    const cachedLoc = await AsyncStorage.getItem('@cached_location');
    if (cachedLoc) {
      const parsedLoc = JSON.parse(cachedLoc);
      if (parsedLoc?.latitude && parsedLoc?.longitude) {
        lat = parsedLoc.latitude;
        lng = parsedLoc.longitude;
      }
    }

    const storedLocName = await AsyncStorage.getItem('@cached_location_name');
    if (storedLocName) locationName = storedLocName;

    const storedAsr = await AsyncStorage.getItem(ASR_METHOD_KEY);
    if (storedAsr) asrMethod = storedAsr;

    const storedOffsets = await AsyncStorage.getItem(PRAYER_OFFSETS_KEY);
    if (storedOffsets) prayerOffsets = JSON.parse(storedOffsets);

    const storedCalc = await AsyncStorage.getItem(CALCULATION_METHOD_KEY);
    if (storedCalc) calculationMethod = storedCalc;

    const storedHighLat = await AsyncStorage.getItem(HIGH_LATITUDE_RULE_KEY);
    if (storedHighLat) highLatitudeRule = storedHighLat;
  } catch (e) {
    console.warn('Widget task handler failed to load config:', e);
  }

  return { lat, lng, asrMethod, prayerOffsets, calculationMethod, highLatitudeRule, locationName };
}

/**
 * Resolves fully-merged prayer times, applying Google API Sunrise/Maghrib
 * overrides when timingMode is 'default'.
 */
async function resolveTimesForWidget(lat, lng, options) {
  const { asrMethod, prayerOffsets, calculationMethod, highLatitudeRule } = options;
  const now = new Date();

  // Base adhan calculation
  const times = calculatePrayerTimes(lat, lng, now, {
    asrMethod,
    prayerOffsets,
    calculationMethod,
    highLatitudeRule,
  });

  // In 'LondonUnifiedDefault' mode, override Sunrise and Maghrib with Google/aladhan API values
  if (calculationMethod === 'LondonUnifiedDefault') {
    try {
      const today = now;
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const dateStr = `${day}-${month}-${year}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      const data = await res.json();
      if (data?.data?.timings) {
        const apiTimings = data.data.timings;
        // Override Sunrise — strip any trailing " (BST)" etc from API value
        if (apiTimings.Sunrise) {
          times.Sunrise = apiTimings.Sunrise.split(' ')[0];
        }
        // Override Maghrib — Google sunset time
        if (apiTimings.Maghrib) {
          times.Maghrib = apiTimings.Maghrib.split(' ')[0];
        }
      }
    } catch (e) {
      // Network failure or abort — silently keep adhan values
      console.warn('Widget: aladhan API fetch failed, using adhan Sunrise/Maghrib:', e?.message);
    }
  }

  return { times, now };
}

/**
 * Shared helper to determine next and current prayer names from a times object.
 */
function derivePrayerState(times, now) {
  const currentMs = now.getHours() * 60 + now.getMinutes();
  const getMs = (timeString) => {
    if (!timeString) return 0;
    const timeStr = timeString.split(' ')[0];
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (isNaN(h) || isNaN(m)) ? 0 : h * 60 + m;
  };

  // Only the 5 obligatory prayers define the active prayer window (matching HomeScreen and Widget grid)
  const prayers = [
    { name: 'Fajr', ms: getMs(times?.Fajr) },
    { name: 'Dhuhr', ms: getMs(times?.Dhuhr) },
    { name: 'Asr', ms: getMs(times?.Asr) },
    { name: 'Maghrib', ms: getMs(times?.Maghrib) },
    { name: 'Isha', ms: getMs(times?.Isha) },
  ];

  const sunriseMs = getMs(times?.Sunrise);

  // Next prayer: if between Fajr and Sunrise, indicate Sunrise next; otherwise next of 5 prayers
  let nextPrayerName;
  if (currentMs >= getMs(times?.Fajr) && currentMs < sunriseMs) {
    nextPrayerName = 'Sunrise';
  } else {
    const nextPrayer = prayers.find(p => p.ms > currentMs);
    nextPrayerName = nextPrayer ? nextPrayer.name : 'Fajr';
  }

  let currentPrayer = [...prayers].reverse().find(p => currentMs >= p.ms);
  if (!currentPrayer) {
    currentPrayer = prayers[prayers.length - 1]; // Isha if before Fajr
  }
  const currentPrayerName = currentPrayer.name;

  return { nextPrayerName, currentPrayerName };
}

export async function widgetTaskHandler(props) {
  const { widgetAction, clickAction } = props;

  if (
    widgetAction === 'WIDGET_ADDED' ||
    widgetAction === 'WIDGET_UPDATE' ||
    widgetAction === 'WIDGET_RESIZED' ||
    (widgetAction === 'WIDGET_CLICK' && clickAction === 'REFRESH_WIDGET')
  ) {
    const config = await loadWidgetConfig();
    const { times, now } = await resolveTimesForWidget(config.lat, config.lng, config);
    const { nextPrayerName, currentPrayerName } = derivePrayerState(times, now);

    props.renderWidget(
      <PrayerWidget
        prayerTimes={times}
        nextPrayerName={nextPrayerName}
        currentPrayerName={currentPrayerName}
        locationName={config.locationName}
      />
    );
  }
}

/**
 * Triggers a manual update of all active widget instances.
 */
export async function updateAppWidgets() {
  try {
    const config = await loadWidgetConfig();
    const { times, now } = await resolveTimesForWidget(config.lat, config.lng, config);
    const { nextPrayerName, currentPrayerName } = derivePrayerState(times, now);

    requestWidgetUpdate({
      widgetName: 'PrayerWidget',
      renderWidget: () => (
        <PrayerWidget
          prayerTimes={times}
          nextPrayerName={nextPrayerName}
          currentPrayerName={currentPrayerName}
          locationName={config.locationName}
        />
      ),
    });
  } catch (e) {
    console.warn('Failed to update app widgets:', e);
  }
}
