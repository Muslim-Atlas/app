/**
 * Background prayer notification rescheduler.
 *
 * This module MUST be imported at the app root (index.js) so the task is
 * registered before React mounts. The task itself runs fully headless —
 * no UI, no context — it reads directly from AsyncStorage.
 *
 * It fires in two situations:
 *   1. Periodically while the device is running (keeps the 7-day window topped up)
 *   2. After a device reboot (startOnBoot: true) — Android clears all AlarmManager
 *      alarms on reboot, so this re-registers every prayer notification automatically.
 */
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleAllPrayerNotifications } from './notificationService';

export const BACKGROUND_NOTIFICATION_TASK = 'muslim-atlas-prayer-notifications';

// ---------------------------------------------------------------------------
// AsyncStorage keys (must match PrayerSettingsContext)
// ---------------------------------------------------------------------------
const KEYS = {
  location:            '@cached_location',
  asrMethod:           '@muslimatlas_asr_method',
  prayerOffsets:       '@muslimatlas_prayer_offsets',
  calculationMethod:   '@muslimatlas_calc_method',
  highLatitudeRule:    '@muslimatlas_high_lat_rule',
  notificationSettings:'@muslimatlas_notification_settings',
};

// ---------------------------------------------------------------------------
// Task definition — must be called at module load time (top of index.js)
// ---------------------------------------------------------------------------
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    // Read everything from AsyncStorage — no React context available here
    const [
      locationStr,
      asrStr,
      offsetsStr,
      calcStr,
      highLatStr,
      notifStr,
    ] = await Promise.all([
      AsyncStorage.getItem(KEYS.location),
      AsyncStorage.getItem(KEYS.asrMethod),
      AsyncStorage.getItem(KEYS.prayerOffsets),
      AsyncStorage.getItem(KEYS.calculationMethod),
      AsyncStorage.getItem(KEYS.highLatitudeRule),
      AsyncStorage.getItem(KEYS.notificationSettings),
    ]);

    if (!locationStr) {
      console.log('[BackgroundTask] No cached location — skipping reschedule.');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const notificationSettings = notifStr ? JSON.parse(notifStr) : null;
    if (!notificationSettings?.enabled) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const { latitude, longitude } = JSON.parse(locationStr);
    const coords = { latitude, longitude };

    const prayerSettings = {
      asrMethod:         asrStr   || 'standard',
      prayerOffsets:     offsetsStr ? JSON.parse(offsetsStr) : {},
      calculationMethod: calcStr  || 'MuslimWorldLeague',
      highLatitudeRule:  highLatStr || 'Auto',
    };

    await scheduleAllPrayerNotifications(coords, prayerSettings, notificationSettings);
    console.log('[BackgroundTask] ✓ Prayer notifications rescheduled.');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error('[BackgroundTask] Failed:', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ---------------------------------------------------------------------------
// Helper called from HomeScreen to register (or re-register) the task
// ---------------------------------------------------------------------------
export async function registerBackgroundNotificationTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (isRegistered) return; // Already registered — nothing to do

    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 60 * 60, // Minimum 1 hour between runs
      stopOnTerminate: false,   // Keep running even after the app is killed
      startOnBoot: true,        // ← This is the key: reschedule after device reboot
    });
    console.log('[BackgroundTask] Registered successfully.');
  } catch (e) {
    // Registration can fail if background fetch isn't supported — safe to ignore
    console.warn('[BackgroundTask] Registration failed (non-fatal):', e);
  }
}

export async function unregisterBackgroundNotificationTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    }
  } catch (e) {
    console.warn('[BackgroundTask] Unregistration failed:', e);
  }
}
