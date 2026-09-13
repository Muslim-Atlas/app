import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { CURRENT_APP_VERSION } from '../utils/updateChecker';

export const CHANGELOG_ITEMS = [
  {
    icon: 'notifications-outline',
    color: '#10b981', // emerald
    title: 'Prayer Time Notifications',
    description: "Muslim Atlas can now notify you when it's time to pray! Enable notifications for any of the 5 daily prayers, plus optional advance reminders so you always have time to prepare.",
  },
  {
    icon: 'color-palette-outline',
    color: '#3b82f6', // blue
    title: 'Complete App Redesign & Dark Mode',
    description: 'The entire app has been redesigned from the ground up — home screen, map, mosque details, and directions — with a clean modern interface and full dark mode support.',
  },
  {
    icon: 'speedometer-outline',
    color: '#f59e0b', // amber
    title: 'Distance Units (Miles & Kilometers)',
    description: 'Choose between Miles and Kilometers in Settings. Distances across all mosques, public transit stations, and walking routes now consistently follow your preference.',
  },
  {
    icon: 'calculator-outline',
    color: '#8b5cf6', // purple
    title: 'Customizable Prayer Calculations',
    description: 'Select your preferred prayer calculation method (such as London Unified or Muslim World League) and adjust Asr timing directly in Settings.',
  },
  {
    icon: 'cloud-download-outline',
    color: '#06b6d4', // cyan
    title: 'In-App Update Alerts',
    description: 'Get notified inside the app whenever a new version is released so you can easily see what is new and update.',
  },
];

export default function ChangelogModal({ visible, onClose, version = CURRENT_APP_VERSION }) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)' }]}>
              <Ionicons name="sparkles" size={18} color="#10b981" />
              <Text style={styles.badgeText}>WHAT'S NEW</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color={theme.subText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Muslim Atlas v{version}
          </Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Here are the latest features and design improvements built for you.
          </Text>

          {/* Highlights List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {CHANGELOG_ITEMS.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.itemIconSquircle, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemDesc, { color: theme.subText }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              Continue to App
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 12,
    fontFamily: 'Syne-Bold',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Unbounded-Bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Syne-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  scrollList: {
    marginBottom: 16,
  },
  scrollContent: {
    gap: 12,
    paddingVertical: 4,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 14,
  },
  itemIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: 'Syne-Bold',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 13,
    fontFamily: 'Syne-Regular',
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Unbounded-Bold',
  },
});
