import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateAppWidgets } from '../../widget-task-handler';

const ASR_METHOD_KEY = '@muslimatlas_asr_method';
const PRAYER_OFFSETS_KEY = '@muslimatlas_prayer_offsets';
const CALCULATION_METHOD_KEY = '@muslimatlas_calc_method';
const HIGH_LATITUDE_RULE_KEY = '@muslimatlas_high_lat_rule';
const NOTIFICATION_SETTINGS_KEY = '@muslimatlas_notification_settings';

const DEFAULT_OFFSETS = {
  Fajr: 0,
  Sunrise: 0,
  Dhuhr: 0,
  Asr: 0,
  Maghrib: 0,
  Isha: 0,
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: false,
  prayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
  preReminders: {
    Fajr: { enabled: false, minutes: 15 },
    Dhuhr: { enabled: false, minutes: 15 },
    Asr: { enabled: false, minutes: 15 },
    Maghrib: { enabled: false, minutes: 15 },
    Isha: { enabled: false, minutes: 15 },
  },
  preReminderEnabled: false,
  preReminderMinutes: 15,
};

const PrayerSettingsContext = createContext();

export const PrayerSettingsProvider = ({ children }) => {
  const [asrMethod, setAsrMethodState] = useState('standard'); // 'standard' or 'hanafi'
  const [prayerOffsets, setPrayerOffsetsState] = useState(DEFAULT_OFFSETS);
  const [calculationMethod, setCalculationMethodState] = useState('MuslimWorldLeague');
  const [highLatitudeRule, setHighLatitudeRuleState] = useState('Auto');
  const [notificationSettings, setNotificationSettingsState] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedAsr = await AsyncStorage.getItem(ASR_METHOD_KEY);
        const storedOffsets = await AsyncStorage.getItem(PRAYER_OFFSETS_KEY);
        const storedCalc = await AsyncStorage.getItem(CALCULATION_METHOD_KEY);
        const storedHighLat = await AsyncStorage.getItem(HIGH_LATITUDE_RULE_KEY);
        const storedNotifications = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        
        if (storedAsr) {
          setAsrMethodState(storedAsr);
        }
        if (storedOffsets) {
          try {
            setPrayerOffsetsState(JSON.parse(storedOffsets));
          } catch (e) {
            console.error('Failed to parse stored offsets:', e);
          }
        }
        if (storedCalc) {
          setCalculationMethodState(storedCalc);
        }
        if (storedHighLat) {
          setHighLatitudeRuleState(storedHighLat);
        }
        if (storedNotifications) {
          try {
            const parsed = JSON.parse(storedNotifications);
            const legacyEnabled = parsed.preReminderEnabled ?? false;
            const legacyMinutes = parsed.preReminderMinutes ?? 15;
            const defaultPreReminders = {
              Fajr: { enabled: legacyEnabled, minutes: legacyMinutes },
              Dhuhr: { enabled: legacyEnabled, minutes: legacyMinutes },
              Asr: { enabled: legacyEnabled, minutes: legacyMinutes },
              Maghrib: { enabled: legacyEnabled, minutes: legacyMinutes },
              Isha: { enabled: legacyEnabled, minutes: legacyMinutes },
            };

            setNotificationSettingsState({
              ...DEFAULT_NOTIFICATION_SETTINGS,
              ...parsed,
              prayers: { ...DEFAULT_NOTIFICATION_SETTINGS.prayers, ...parsed.prayers },
              preReminders: {
                ...defaultPreReminders,
                ...(parsed.preReminders || {}),
              },
            });
          } catch (e) {
            console.error('Failed to parse stored notification settings:', e);
          }
        }
      } catch (e) {
        console.warn('Failed to load prayer settings:', e);
      } finally {
        setIsReady(true);
      }
    };
    loadSettings();
  }, []);

  const setAsrMethod = async (method) => {
    try {
      await AsyncStorage.setItem(ASR_METHOD_KEY, method);
      setAsrMethodState(method);
      updateAppWidgets().catch(console.warn);
    } catch (e) {
      console.warn('Failed to save Asr method preference:', e);
    }
  };

  const setCalculationMethod = async (method) => {
    try {
      await AsyncStorage.setItem(CALCULATION_METHOD_KEY, method);
      setCalculationMethodState(method);
      updateAppWidgets().catch(console.warn);
    } catch (e) {
      console.warn('Failed to save calculation method preference:', e);
    }
  };

  const setHighLatitudeRule = async (rule) => {
    try {
      await AsyncStorage.setItem(HIGH_LATITUDE_RULE_KEY, rule);
      setHighLatitudeRuleState(rule);
      updateAppWidgets().catch(console.warn);
    } catch (e) {
      console.warn('Failed to save high latitude rule preference:', e);
    }
  };

  const updatePrayerOffset = async (prayerName, offsetValue) => {
    try {
      const newOffsets = {
        ...prayerOffsets,
        [prayerName]: parseInt(offsetValue, 10) || 0,
      };
      await AsyncStorage.setItem(PRAYER_OFFSETS_KEY, JSON.stringify(newOffsets));
      setPrayerOffsetsState(newOffsets);
      updateAppWidgets().catch(console.warn);
    } catch (e) {
      console.warn('Failed to save prayer offset:', e);
    }
  };

  const setPrayerOffsets = async (offsets) => {
    try {
      await AsyncStorage.setItem(PRAYER_OFFSETS_KEY, JSON.stringify(offsets));
      setPrayerOffsetsState(offsets);
      updateAppWidgets().catch(console.warn);
    } catch (e) {
      console.warn('Failed to save prayer offsets:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // Notification settings setters
  // ---------------------------------------------------------------------------

  const setNotificationSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setNotificationSettingsState(newSettings);
    } catch (e) {
      console.warn('Failed to save notification settings:', e);
    }
  };

  const updatePrayerNotification = async (prayerName, enabled) => {
    const newSettings = {
      ...notificationSettings,
      prayers: { ...notificationSettings.prayers, [prayerName]: enabled },
    };
    await setNotificationSettings(newSettings);
  };

  const setPreReminderEnabled = async (enabled) => {
    const newSettings = { ...notificationSettings, preReminderEnabled: enabled };
    await setNotificationSettings(newSettings);
  };

  const setPreReminderMinutes = async (minutes) => {
    const clamped = Math.min(60, Math.max(5, parseInt(minutes, 10) || 15));
    const newSettings = { ...notificationSettings, preReminderMinutes: clamped };
    await setNotificationSettings(newSettings);
  };

  const updatePrayerPreReminder = async (prayerName, preReminderData) => {
    const current = notificationSettings.preReminders?.[prayerName] || { enabled: false, minutes: 15 };
    const newSettings = {
      ...notificationSettings,
      preReminders: {
        ...notificationSettings.preReminders,
        [prayerName]: {
          ...current,
          ...preReminderData,
          minutes: preReminderData.minutes != null
            ? Math.min(60, Math.max(5, parseInt(preReminderData.minutes, 10) || 15))
            : current.minutes,
        },
      },
    };
    await setNotificationSettings(newSettings);
  };

  const setNotificationsEnabled = async (enabled) => {
    const newSettings = { ...notificationSettings, enabled };
    await setNotificationSettings(newSettings);
  };

  if (!isReady) return null;

  return (
    <PrayerSettingsContext.Provider
      value={{
        asrMethod,
        prayerOffsets,
        calculationMethod,
        highLatitudeRule,
        notificationSettings,
        setAsrMethod,
        updatePrayerOffset,
        setPrayerOffsets,
        setCalculationMethod,
        setHighLatitudeRule,
        setNotificationSettings,
        setNotificationsEnabled,
        updatePrayerNotification,
        updatePrayerPreReminder,
        setPreReminderEnabled,
        setPreReminderMinutes,
      }}
    >
      {children}
    </PrayerSettingsContext.Provider>
  );
};

export const usePrayerSettings = () => useContext(PrayerSettingsContext);
