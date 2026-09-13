import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export const CURRENT_APP_VERSION = 
  Constants?.expoConfig?.version || 
  Constants?.manifest2?.extra?.expoClient?.version || 
  '1.1.0';

export const GITHUB_REPO_LATEST_RELEASE_API = 
  'https://api.github.com/repos/YusufQuresh1/Muslim-Atlas/releases/latest';

export const STORAGE_KEYS = {
  LAST_NOTIFIED_VERSION: '@last_notified_update_version',
  LAST_SEEN_CHANGELOG_VERSION: '@last_seen_changelog_version',
};

/**
 * Compare two semver strings (e.g. "v1.1.0" vs "1.0.0").
 * Returns true if remote is strictly greater than local.
 */
export function isNewerVersion(remoteVersion, localVersion) {
  if (!remoteVersion || !localVersion) return false;

  const clean = (v) => v.toString().replace(/^v/i, '').trim();
  const rParts = clean(remoteVersion).split('.').map((n) => parseInt(n, 10) || 0);
  const lParts = clean(localVersion).split('.').map((n) => parseInt(n, 10) || 0);

  const maxLen = Math.max(rParts.length, lParts.length);
  for (let i = 0; i < maxLen; i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

/**
 * Checks GitHub for the latest release and compares with currently installed version.
 */
export async function checkForAppUpdate(currentVersion = CURRENT_APP_VERSION) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(GITHUB_REPO_LATEST_RELEASE_API, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Muslim-Atlas-Mobile-App',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        updateAvailable: false,
        currentVersion,
        error: `GitHub API returned ${response.status}`,
      };
    }

    const data = await response.json();
    const latestVersion = (data.tag_name || '').replace(/^v/i, '');
    const updateAvailable = isNewerVersion(latestVersion, currentVersion);

    // Find direct APK asset if attached
    const apkAsset = Array.isArray(data.assets) 
      ? data.assets.find((a) => a.name?.endsWith('.apk')) 
      : null;
    
    const downloadUrl = apkAsset?.browser_download_url || data.html_url || 'https://github.com/YusufQuresh1/Muslim-Atlas/releases';

    return {
      success: true,
      updateAvailable,
      currentVersion,
      latestVersion,
      releaseName: data.name || `Version ${latestVersion}`,
      releaseNotes: data.body || '',
      downloadUrl,
      releaseUrl: data.html_url,
      publishedAt: data.published_at,
    };
  } catch (err) {
    return {
      success: false,
      updateAvailable: false,
      currentVersion,
      error: err.message,
    };
  }
}

/**
 * Triggers a local push notification if a new update is available,
 * ensuring users are only notified once per version.
 */
export async function triggerUpdateNotification(updateInfo) {
  if (!updateInfo || !updateInfo.updateAvailable || !updateInfo.latestVersion) {
    return false;
  }

  try {
    const lastNotified = await AsyncStorage.getItem(STORAGE_KEYS.LAST_NOTIFIED_VERSION);
    if (lastNotified === updateInfo.latestVersion) {
      return false; // Already notified for this specific version
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🕌 Muslim Atlas v${updateInfo.latestVersion} Available`,
        body: 'A new update is available with improved prayer features and masjid transit info. Tap to download.',
        data: {
          type: 'app_update',
          url: updateInfo.downloadUrl,
          version: updateInfo.latestVersion,
        },
        priority: Notifications.AndroidNotificationPriority?.HIGH || 'high',
      },
      trigger: null, // deliver immediately
    });

    await AsyncStorage.setItem(STORAGE_KEYS.LAST_NOTIFIED_VERSION, updateInfo.latestVersion);
    return true;
  } catch (err) {
    console.warn('[UpdateChecker] Failed to schedule notification:', err);
    return false;
  }
}

/**
 * Convenience method that performs check and notification in one call.
 */
export async function checkAndNotifyUpdate(currentVersion = CURRENT_APP_VERSION) {
  const info = await checkForAppUpdate(currentVersion);
  if (info.updateAvailable) {
    await triggerUpdateNotification(info);
  }
  return info;
}
