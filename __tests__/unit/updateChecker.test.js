import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  isNewerVersion,
  checkForAppUpdate,
  triggerUpdateNotification,
  STORAGE_KEYS,
} from '../../src/utils/updateChecker';

describe('updateChecker Utility Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('isNewerVersion semver comparison', () => {
    it('correctly identifies newer minor versions', () => {
      expect(isNewerVersion('1.1.0', '1.0.0')).toBe(true);
      expect(isNewerVersion('v1.2.0', '1.1.0')).toBe(true);
    });

    it('correctly identifies newer patch versions', () => {
      expect(isNewerVersion('1.0.1', '1.0.0')).toBe(true);
      expect(isNewerVersion('v1.1.5', '1.1.4')).toBe(true);
    });

    it('correctly identifies newer major versions', () => {
      expect(isNewerVersion('2.0.0', '1.9.9')).toBe(true);
    });

    it('returns false when remote version is equal or older', () => {
      expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
      expect(isNewerVersion('v1.0.0', '1.0.0')).toBe(false);
      expect(isNewerVersion('0.9.0', '1.0.0')).toBe(false);
      expect(isNewerVersion('1.0.0', '1.1.0')).toBe(false);
    });

    it('returns false for invalid or missing inputs', () => {
      expect(isNewerVersion(null, '1.0.0')).toBe(false);
      expect(isNewerVersion('1.1.0', null)).toBe(false);
      expect(isNewerVersion('', '')).toBe(false);
    });
  });

  describe('checkForAppUpdate', () => {
    it('detects update available when remote release is newer and parses APK asset', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tag_name: 'v1.2.0',
          name: 'Muslim Atlas v1.2.0',
          body: 'Major improvements to timetable calculations.',
          html_url: 'https://github.com/YusufQuresh1/Muslim-Atlas/releases/tag/v1.2.0',
          published_at: '2026-09-13T16:00:00Z',
          assets: [
            {
              name: 'MuslimAtlas-v1.2.0.apk',
              browser_download_url: 'https://github.com/download/MuslimAtlas-v1.2.0.apk',
            },
          ],
        }),
      });

      const result = await checkForAppUpdate('1.1.0');
      expect(result.success).toBe(true);
      expect(result.updateAvailable).toBe(true);
      expect(result.latestVersion).toBe('1.2.0');
      expect(result.downloadUrl).toBe('https://github.com/download/MuslimAtlas-v1.2.0.apk');
      expect(result.releaseNotes).toBe('Major improvements to timetable calculations.');
    });

    it('returns updateAvailable false when current version is equal or newer', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tag_name: 'v1.1.0',
          name: 'Muslim Atlas v1.1.0',
          body: '',
          html_url: 'https://github.com/YusufQuresh1/Muslim-Atlas/releases/tag/v1.1.0',
          assets: [],
        }),
      });

      const result = await checkForAppUpdate('1.1.0');
      expect(result.success).toBe(true);
      expect(result.updateAvailable).toBe(false);
      expect(result.latestVersion).toBe('1.1.0');
    });

    it('handles network or API errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network request failed'));

      const result = await checkForAppUpdate('1.1.0');
      expect(result.success).toBe(false);
      expect(result.updateAvailable).toBe(false);
      expect(result.error).toBe('Network request failed');
    });
  });

  describe('triggerUpdateNotification', () => {
    it('schedules notification when not previously notified for this version', async () => {
      const updateInfo = {
        updateAvailable: true,
        latestVersion: '1.2.0',
        downloadUrl: 'https://github.com/download/app.apk',
      };

      const triggered = await triggerUpdateNotification(updateInfo);
      expect(triggered).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: expect.stringContaining('v1.2.0 Available'),
          }),
        })
      );

      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_NOTIFIED_VERSION);
      expect(stored).toBe('1.2.0');
    });

    it('skips scheduling notification if already notified for that version', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_NOTIFIED_VERSION, '1.2.0');

      const updateInfo = {
        updateAvailable: true,
        latestVersion: '1.2.0',
        downloadUrl: 'https://github.com/download/app.apk',
      };

      const triggered = await triggerUpdateNotification(updateInfo);
      expect(triggered).toBe(false);
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
