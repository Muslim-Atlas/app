import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking } from 'react-native';
import { calculatePrayerTimes } from './prayerEngine';

// ---------------------------------------------------------------------------
// Notification handler config (how notifications behave when app is foregrounded)
// ---------------------------------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------------------------------------------------------------------------
// Prayer metadata
// ---------------------------------------------------------------------------
const PRAYER_META = {
  Fajr:    { emoji: '🌅' },
  Dhuhr:   { emoji: '☀️' },
  Asr:     { emoji: '🌤️' },
  Maghrib: { emoji: '🌇' },
  Isha:    { emoji: '🌙' },
};

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// ---------------------------------------------------------------------------
// Android notification channels
// ---------------------------------------------------------------------------
export async function ensureNotificationChannels() {
  if (Platform.OS !== 'android') return;

  try {
    // MAX importance = heads-up notification, bypasses Doze batching UI delivery
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a7f4b',
      description: 'Notifications for daily prayer times',
      bypassDnd: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync('prayer-reminders', {
      name: 'Prayer Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 200, 200],
      description: 'Pre-prayer reminder notifications',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch (e) {
    console.warn('[NotificationService] Failed to create notification channels:', e);
  }
}

// Ensure channels are created as soon as the module loads
ensureNotificationChannels().catch(console.warn);

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

/**
 * Request notification permissions + exact alarm capability (Android 12+).
 * Returns true if notifications are granted.
 * Will prompt the user if exact alarms aren't available.
 */
export async function requestNotificationPermissions() {
  await ensureNotificationChannels();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  // Android 12+ (API 31+): must also have SCHEDULE_EXACT_ALARM grant
  // Without it, the OS can defer notifications by minutes or hours
  if (Platform.OS === 'android') {
    await checkAndPromptExactAlarms();
  }

  return true;
}

/**
 * Check if exact alarms are schedulable on Android 12+.
 * If not, show a user-facing alert explaining why and directing them to settings.
 */
export async function checkAndPromptExactAlarms() {
  if (Platform.OS !== 'android') return true;

  try {
    const canSchedule = await Notifications.canScheduleExactNotificationsAsync();
    if (!canSchedule) {
      Alert.alert(
        'Enable Exact Notifications',
        'To receive prayer notifications at the exact time, Muslim Atlas needs permission to schedule exact alarms.\n\nTap "Open Settings", then enable "Alarms & Reminders" for Muslim Atlas.',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // Opens the system-level exact alarm permission page
              Linking.openURL('android.settings.REQUEST_SCHEDULE_EXACT_ALARM').catch(() => {
                // Fallback to app settings if the intent isn't handled
                Linking.openSettings();
              });
            },
          },
        ],
      );
      return false;
    }
    return true;
  } catch (_e) {
    // canScheduleExactNotificationsAsync not available on older Android — that's fine
    return true;
  }
}

/**
 * Returns true if notification permissions are currently granted.
 */
export async function hasNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ---------------------------------------------------------------------------
// Core scheduling
// ---------------------------------------------------------------------------

/**
 * Cancel ALL scheduled prayer notifications managed by this service.
 */
export async function cancelAllPrayerNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ids = scheduled
      .filter(n => n.identifier?.startsWith('prayer-'))
      .map(n => n.identifier);
    await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
  } catch (e) {
    console.warn('[NotificationService] Failed to cancel notifications:', e);
  }
}

/**
 * Parse "HH:mm" → { hours, minutes }. Returns null on failure.
 */
function parseTime(timeStr) {
  if (!timeStr) return null;
  const clean = timeStr.split(' ')[0];
  const parts = clean.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return { hours: parts[0], minutes: parts[1] };
}

/**
 * Build a Date for a given base Date and HH:mm time.
 */
function buildDate(baseDate, hours, minutes) {
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Schedule all prayer notifications for the next `days` days.
 *
 * Uses exact alarm triggers (AlarmManager.setExactAndAllowWhileIdle on Android)
 * so notifications fire at the precise second even in Doze/standby mode.
 *
 * @param {object} coords               - { latitude, longitude }
 * @param {object} prayerSettings       - { asrMethod, prayerOffsets, calculationMethod, highLatitudeRule }
 * @param {object} notificationSettings - { enabled, prayers, preReminderEnabled, preReminderMinutes }
 * @param {number} days                 - Days ahead to pre-schedule (default: 7)
 */
export async function scheduleAllPrayerNotifications(coords, prayerSettings, notificationSettings, days = 7) {
  // Always cancel first to avoid duplicates when settings change
  await cancelAllPrayerNotifications();

  if (!notificationSettings?.enabled) return;
  if (!coords?.latitude || !coords?.longitude) return;

  const hasPermission = await hasNotificationPermissions();
  if (!hasPermission) return;

  // On Android 12+, verify exact alarm capability (silently — alert already shown at setup)
  if (Platform.OS === 'android') {
    try {
      const canSchedule = await Notifications.canScheduleExactNotificationsAsync();
      if (!canSchedule) {
        console.warn('[NotificationService] Exact alarm permission not granted — notifications may be delayed.');
        // Still attempt scheduling; OS will use inexact if exact not available
      }
    } catch (_e) { /* older Android — skip check */ }
  }

  const { prayers = {}, preReminders = {}, preReminderEnabled = false, preReminderMinutes = 15 } = notificationSettings;
  const now = new Date();
  let scheduledCount = 0;

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    targetDate.setHours(0, 0, 0, 0);

    const times = calculatePrayerTimes(
      coords.latitude,
      coords.longitude,
      targetDate,
      prayerSettings,
    );

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    for (const prayer of PRAYERS) {
      if (!prayers[prayer]) continue;

      const parsed = parseTime(times[prayer]);
      if (!parsed) continue;

      const prayerDate = buildDate(targetDate, parsed.hours, parsed.minutes);

      // Skip past times on today
      if (dayOffset === 0 && prayerDate <= now) continue;

      const meta = PRAYER_META[prayer] || { emoji: '🕌' };

      // ── At-time notification ─────────────────────────────────────────────
      const atTimeId = `prayer-${prayer}-${dateKey}`;
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: atTimeId,
          content: {
            title: `${meta.emoji} It's time for ${prayer}`,
            body: `It's ${prayer} time now (${times[prayer]})`,
            sound: 'default',
            data: { prayer, type: 'at-time', time: times[prayer] },
            ...(Platform.OS === 'android' && { channelId: 'prayer-times', color: '#1a7f4b' }),
          },
          trigger: {
            type: 'date',
            date: prayerDate,
            ...(Platform.OS === 'android' && { channelId: 'prayer-times' }),
          },
        });
        scheduledCount++;
      } catch (e) {
        console.warn(`[NotificationService] Failed to schedule ${prayer} at-time for ${dateKey}:`, e);
      }

      // ── Pre-reminder notification (per-prayer configuration) ──────────────
      const prayerPreReminder = preReminders[prayer] || {
        enabled: preReminderEnabled,
        minutes: preReminderMinutes,
      };

      if (prayerPreReminder.enabled && prayerPreReminder.minutes > 0) {
        const reminderMinutes = prayerPreReminder.minutes;
        const reminderDate = new Date(prayerDate.getTime() - reminderMinutes * 60_000);
        if (reminderDate > now) {
          const reminderId = `prayer-reminder-${prayer}-${dateKey}`;
          try {
            await Notifications.scheduleNotificationAsync({
              identifier: reminderId,
              content: {
                title: `⏰ ${reminderMinutes} min until ${prayer}`,
                body: `There's ${reminderMinutes} ${reminderMinutes === 1 ? 'minute' : 'minutes'} until ${prayer} (${times[prayer]})`,
                sound: 'default',
                data: { prayer, type: 'reminder', time: times[prayer] },
                ...(Platform.OS === 'android' && { channelId: 'prayer-reminders' }),
              },
              trigger: {
                type: 'date',
                date: reminderDate,
                ...(Platform.OS === 'android' && { channelId: 'prayer-reminders' }),
              },
            });
            scheduledCount++;
          } catch (e) {
            console.warn(`[NotificationService] Failed to schedule ${prayer} reminder for ${dateKey}:`, e);
          }
        } else if (dayOffset === 0 && prayerDate > now && (prayerDate.getTime() - now.getTime()) >= 30_000) {
          // If the pre-reminder threshold has already passed today, but prayer is still in the future!
          // (e.g. user enabled 25 min reminder when 23 mins left).
          // Schedule an immediate reminder (in 1.5s) so the user gets alerted right away!
          const minsRemaining = Math.max(1, Math.round((prayerDate.getTime() - now.getTime()) / 60_000));
          const reminderId = `prayer-reminder-${prayer}-${dateKey}-now`;
          try {
            await Notifications.scheduleNotificationAsync({
              identifier: reminderId,
              content: {
                title: `⏰ ${minsRemaining} min until ${prayer}`,
                body: `There's ${minsRemaining} ${minsRemaining === 1 ? 'minute' : 'minutes'} until ${prayer} (${times[prayer]})`,
                sound: 'default',
                data: { prayer, type: 'reminder', time: times[prayer] },
                ...(Platform.OS === 'android' && { channelId: 'prayer-reminders' }),
              },
              trigger: {
                type: 'date',
                date: new Date(Date.now() + 1500),
                ...(Platform.OS === 'android' && { channelId: 'prayer-reminders' }),
              },
            });
            scheduledCount++;
          } catch (e) {
            console.warn(`[NotificationService] Failed to schedule catch-up reminder for ${prayer}:`, e);
          }
        }
      }
    }
  }

  console.log(`[NotificationService] ✓ Scheduled ${scheduledCount} notifications over ${days} days.`);
  return scheduledCount;
}
