import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function UpdateAvailableModal({ visible, updateInfo, onClose }) {
  const { theme } = useTheme();

  if (!updateInfo) return null;

  const handleDownload = () => {
    if (updateInfo.downloadUrl) {
      Linking.openURL(updateInfo.downloadUrl).catch((err) => {
        console.warn('Failed to open download URL:', err);
      });
    }
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header Icon & Version Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.iconSquircle, { backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)' }]}>
              <Ionicons name="cloud-download" size={26} color="#10b981" />
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>
                v{updateInfo.latestVersion} AVAILABLE
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>
            Update Available
          </Text>

          <Text style={[styles.subtitle, { color: theme.subText }]}>
            A new version of Muslim Atlas is ready with distance unit preferences (Miles &amp; Kilometers), reliable prayer notifications, and weekly mosque timetables.
          </Text>

          {/* Release Notes (if any) */}
          {Boolean(updateInfo.releaseNotes?.trim()) && (
            <View style={[styles.notesBox, { backgroundColor: theme.mode === 'dark' ? '#1e293b' : '#f8fafc', borderColor: theme.border }]}>
              <Text style={[styles.notesHeader, { color: theme.subText }]}>
                Release Highlights:
              </Text>
              <ScrollView style={styles.notesScroll} nestedScrollEnabled>
                <Text style={[styles.notesText, { color: theme.text }]}>
                  {updateInfo.releaseNotes.trim()}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.laterBtn, { borderColor: theme.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.laterBtnText, { color: theme.subText }]}>
                Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={handleDownload}
              activeOpacity={0.85}
            >
              <Ionicons name="download-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.downloadBtnText}>
                Download APK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconSquircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  versionBadgeText: {
    color: '#10b981',
    fontFamily: 'Syne-Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Unbounded-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Syne-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  notesBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    maxHeight: 120,
    marginBottom: 20,
  },
  notesHeader: {
    fontSize: 12,
    fontFamily: 'Syne-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  notesScroll: {
    maxHeight: 80,
  },
  notesText: {
    fontSize: 13,
    fontFamily: 'Syne-Regular',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  laterBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontSize: 15,
    fontFamily: 'Syne-Bold',
  },
  downloadBtn: {
    flex: 1.6,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Unbounded-Bold',
  },
});
