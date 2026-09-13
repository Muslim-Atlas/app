import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Switch,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePrayerSettings } from '../context/PrayerSettingsContext';
import { usePreferences } from '../context/PreferencesContext';
import LoginModal from './LoginModal';

const SUPPORT_URL = 'https://buymeacoffee.com/muslimatlas';

const CALC_METHODS = [
  { label: 'Muslim Atlas (Default)', value: 'LondonUnifiedDefault' },
  { label: 'London Unified (UK)', value: 'LondonUnified' },
  { label: 'Muslim World League', value: 'MuslimWorldLeague' },
  { label: 'Egyptian General Authority', value: 'Egyptian' },
  { label: 'Karachi (UISK)', value: 'Karachi' },
  { label: 'Umm Al-Qura (Makkah)', value: 'UmmAlQura' },
  { label: 'North America (ISNA)', value: 'NorthAmerica' },
  { label: 'Moonsighting Committee', value: 'MoonsightingCommittee' },
  { label: 'Diyanet (Turkey)', value: 'Turkey' },
  { label: 'Dubai', value: 'Dubai' },
  { label: 'Singapore', value: 'Singapore' },
  { label: 'Tehran', value: 'Tehran' },
];

const HIGH_LAT_RULES = [
  { label: 'Auto (Recommended)', value: 'Auto' },
  { label: 'Seventh of the Night', value: 'SeventhOfTheNight' },
  { label: 'Twilight Angle Method', value: 'TwilightAngle' },
  { label: 'Middle of the Night', value: 'MiddleOfTheNight' },
  { label: 'No Adjustment', value: 'None' },
];

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const PRE_REMINDER_OPTIONS = [5, 10, 15, 20, 25, 30, 45, 60];

// ─── Reusable iOS Inset-Grouped Layout Elements ───────────────────────────────

function SettingsSection({ title, footer, children }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionContainer}>
      {title ? (
        <Text style={[styles.sectionHeader, { color: theme.subText }]}>{title}</Text>
      ) : null}
      <View style={[styles.groupedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {children}
      </View>
      {footer ? (
        <Text style={[styles.sectionFooter, { color: theme.subText }]}>{footer}</Text>
      ) : null}
    </View>
  );
}

function SquircleIcon({ name, bg, type = 'ionicons' }) {
  return (
    <View style={[styles.squircle, { backgroundColor: bg }]}>
      {type === 'material' ? (
        <MaterialCommunityIcons name={name} size={17} color="#FFFFFF" />
      ) : (
        <Ionicons name={name} size={17} color="#FFFFFF" />
      )}
    </View>
  );
}

function SettingsRow({
  icon,
  iconBg,
  iconType = 'ionicons',
  title,
  subtitle,
  value,
  rightElement,
  onPress,
  isLast = false,
  showChevron = false,
  destructive = false,
}) {
  const { theme } = useTheme();

  const content = (
    <View style={styles.rowInner}>
      {icon ? (
        <SquircleIcon name={icon} bg={iconBg} type={iconType} />
      ) : null}
      <View style={styles.rowLabelContainer}>
        <Text
          style={[
            styles.rowTitle,
            { color: destructive ? (theme.danger || '#ef4444') : theme.text },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: theme.subText }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowRight}>
        {value ? (
          <Text style={[styles.rowValue, { color: theme.subText }]} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {rightElement}
        {showChevron ? (
          <Ionicons
            name="chevron-forward"
            size={17}
            color={theme.subText}
            style={styles.chevron}
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.rowWrapper}>
      {onPress ? (
        <TouchableOpacity
          style={styles.rowTouch}
          onPress={onPress}
          activeOpacity={0.6}
        >
          {content}
        </TouchableOpacity>
      ) : (
        <View style={styles.rowTouch}>
          {content}
        </View>
      )}
      {!isLast && (
        <View
          style={[
            styles.separator,
            { backgroundColor: theme.border, left: icon ? 57 : 16 },
          ]}
        />
      )}
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn, logout } = useAuth();
  const { theme, themeMode, setTheme } = useTheme();
  const {
    asrMethod,
    setAsrMethod,
    prayerOffsets,
    updatePrayerOffset,
    calculationMethod,
    setCalculationMethod,
    highLatitudeRule,
    setHighLatitudeRule,
    notificationSettings,
    setNotificationsEnabled,
    updatePrayerNotification,
    updatePrayerPreReminder,
  } = usePrayerSettings();

  const { unitSystem, setUnitSystem, UNIT_OPTIONS, UNIT_SYSTEMS } = usePreferences();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [unitsExpanded, setUnitsExpanded] = useState(false);
  const [methodExpanded, setMethodExpanded] = useState(false);
  const [ruleExpanded, setRuleExpanded] = useState(false);
  const [offsetsExpanded, setOffsetsExpanded] = useState(false);
  const [reminderPickerPrayer, setReminderPickerPrayer] = useState(null);

  const handleSupport = async () => {
    try {
      const supported = await Linking.canOpenURL(SUPPORT_URL);
      if (supported) {
        await Linking.openURL(SUPPORT_URL);
      } else {
        Alert.alert('Unable to open URL', 'Could not open the browser link.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const selectedMethodObj = CALC_METHODS.find((m) => m.value === calculationMethod);
  const selectedRuleObj = HIGH_LAT_RULES.find((r) => r.value === highLatitudeRule);

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
        {/* iOS Large Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* ── 1. Account Section ────────────────────────────────────────── */}
          <SettingsSection title="Account">
            {isLoggedIn ? (
              <>
                <SettingsRow
                  icon="person"
                  iconBg="#34C759"
                  title={user?.email || 'Logged In User'}
                  subtitle="Signed in to Muslim Atlas"
                  isLast={false}
                />
                <SettingsRow
                  title="Sign Out"
                  destructive
                  onPress={handleSignOut}
                  isLast={true}
                />
              </>
            ) : (
              <SettingsRow
                icon="person-outline"
                iconBg="#8E8E93"
                title="Sign In"
                subtitle="Join the community to suggest edits"
                showChevron
                onPress={() => setShowLoginModal(true)}
                isLast={true}
              />
            )}
          </SettingsSection>

          {/* ── 2. Appearance Section ────────────────────────────────────── */}
          <SettingsSection title="Appearance">
            <SettingsRow
              icon="moon"
              iconBg="#5856D6"
              title="Dark Mode"
              rightElement={
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                  trackColor={{ false: '#767577', true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              }
              isLast={true}
            />
          </SettingsSection>

          {/* ── 2b. Preferences Section (Units) ─────────────────────────── */}
          <SettingsSection title="Preferences">
            <SettingsRow
              icon="speedometer-outline"
              iconBg="#0284C7"
              title="Distance Units"
              value={unitSystem === UNIT_SYSTEMS.METRIC ? 'Kilometers (km)' : 'Miles (mi)'}
              showChevron
              onPress={() => setUnitsExpanded(!unitsExpanded)}
              isLast={!unitsExpanded}
            />
            {unitsExpanded && (
              <View style={[styles.pickerContainer, { borderTopColor: theme.border }]}>
                {UNIT_OPTIONS.map((opt, idx) => {
                  const isSelected = unitSystem === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.pickerItem,
                        idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                      ]}
                      onPress={() => {
                        setUnitSystem(opt.value);
                        setUnitsExpanded(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: theme.text },
                          isSelected && { color: theme.primary, fontWeight: '600' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={18} color={theme.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </SettingsSection>

          {/* ── 3. Prayer Times Calculation Section ──────────────────────── */}
          <SettingsSection title="Prayer Times Calculation">
            {/* Calculation Method Selection */}
            <SettingsRow
              icon="calculator"
              iconBg="#059669"
              title="Method"
              value={selectedMethodObj?.label?.split(' (')[0] || calculationMethod}
              showChevron
              onPress={() => setMethodExpanded(!methodExpanded)}
              isLast={false}
            />
            {methodExpanded && (
              <ScrollView
                style={[styles.scrollablePickerContainer, { borderTopColor: theme.border }]}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {CALC_METHODS.map((m, idx) => {
                  const isSelected = calculationMethod === m.value;
                  return (
                    <TouchableOpacity
                      key={m.value}
                      style={[
                        styles.pickerItem,
                        idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                      ]}
                      onPress={() => {
                        setCalculationMethod(m.value);
                        setMethodExpanded(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: theme.text },
                          isSelected && { color: theme.primary, fontWeight: '600' },
                        ]}
                      >
                        {m.label}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={18} color={theme.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* High Latitude Rule Selection */}
            <SettingsRow
              icon="globe"
              iconBg="#0284C7"
              title="High Latitude"
              value={selectedRuleObj?.label?.split(' (')[0] || highLatitudeRule}
              showChevron
              onPress={() => setRuleExpanded(!ruleExpanded)}
              isLast={false}
            />
            {ruleExpanded && (
              <View style={[styles.pickerContainer, { borderTopColor: theme.border }]}>
                {HIGH_LAT_RULES.map((r, idx) => {
                  const isSelected = highLatitudeRule === r.value;
                  return (
                    <TouchableOpacity
                      key={r.value}
                      style={[
                        styles.pickerItem,
                        idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                      ]}
                      onPress={() => {
                        setHighLatitudeRule(r.value);
                        setRuleExpanded(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: theme.text },
                          isSelected && { color: theme.primary, fontWeight: '600' },
                        ]}
                      >
                        {r.label}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={18} color={theme.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Hanafi Asr Method */}
            <SettingsRow
              icon="time"
              iconBg="#D97706"
              title="Hanafi Asr"
              subtitle="Shadow length factor 2"
              rightElement={
                <Switch
                  value={asrMethod === 'hanafi'}
                  onValueChange={(val) => setAsrMethod(val ? 'hanafi' : 'standard')}
                  trackColor={{ false: '#767577', true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              }
              isLast={false}
            />

            {/* Manual Adjustments (Offsets) Disclosure */}
            <SettingsRow
              icon="tune"
              iconBg="#64748B"
              iconType="material"
              title="Manual Adjustments"
              value={offsetsExpanded ? 'Hide' : 'Adjust'}
              showChevron
              onPress={() => setOffsetsExpanded(!offsetsExpanded)}
              isLast={!offsetsExpanded}
            />
            {offsetsExpanded && (
              <View style={[styles.pickerContainer, { borderTopColor: theme.border }]}>
                {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((pName, idx) => {
                  const offsetVal = prayerOffsets[pName] || 0;
                  return (
                    <View
                      key={pName}
                      style={[
                        styles.offsetRow,
                        idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.offsetLabel, { color: theme.text }]}>{pName}</Text>
                      <View style={[styles.stepperContainer, { backgroundColor: theme.chipBg || '#e2e8f0' }]}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updatePrayerOffset(pName, offsetVal - 1)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="remove" size={14} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.stepperText, { color: theme.text }]}>
                          {offsetVal > 0 ? `+${offsetVal}` : offsetVal}m
                        </Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updatePrayerOffset(pName, offsetVal + 1)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="add" size={14} color={theme.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </SettingsSection>

          {/* ── 4. Prayer Notifications Section ───────────────────────────── */}
          <SettingsSection
            title="Notifications"
            footer={
              notificationSettings.enabled
                ? 'Pre-reminders alert you before prayer time so you can prepare for salat.'
                : 'Turn on to receive exact azan notifications at each prayer time.'
            }
          >
            {/* Master Toggle Row */}
            <SettingsRow
              icon="notifications"
              iconBg="#007AFF"
              title="Allow Notifications"
              rightElement={
                <Switch
                  value={notificationSettings.enabled}
                  onValueChange={(val) => setNotificationsEnabled(val)}
                  trackColor={{ false: '#767577', true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              }
              isLast={!notificationSettings.enabled}
            />

            {/* Folded Per-Prayer List */}
            {notificationSettings.enabled &&
              PRAYERS.map((prayer, pIdx) => {
                const isEnabled = notificationSettings.prayers?.[prayer] ?? true;
                const preReminder = notificationSettings.preReminders?.[prayer] || {
                  enabled: false,
                  minutes: 15,
                };
                const isLastPrayer = pIdx === PRAYERS.length - 1;

                return (
                  <View key={prayer}>
                    {/* Main Prayer Row */}
                    <View style={styles.prayerRow}>
                      <Text style={[styles.prayerName, { color: theme.text }]}>
                        {prayer}
                      </Text>
                      <Switch
                        value={isEnabled}
                        onValueChange={(val) => updatePrayerNotification(prayer, val)}
                        trackColor={{ false: '#767577', true: theme.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    {/* Condensed Single-line Pre-Reminder (Only if prayer notification is active) */}
                    {isEnabled && (
                      <View style={styles.compactReminderRow}>
                        <View style={styles.compactReminderLeft}>
                          <Ionicons
                            name="alarm-outline"
                            size={14}
                            color={preReminder.enabled ? theme.primary : theme.subText}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={[styles.compactReminderLabel, { color: theme.subText }]}>
                            Pre-reminder
                          </Text>
                        </View>

                        <View style={styles.compactReminderRight}>
                          {preReminder.enabled && (
                            <TouchableOpacity
                              style={[
                                styles.minuteSelectorBtn,
                                {
                                  backgroundColor:
                                    theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                  borderColor: theme.border,
                                },
                              ]}
                              onPress={() => setReminderPickerPrayer(prayer)}
                              activeOpacity={0.65}
                            >
                              <Text style={[styles.minuteSelectorText, { color: theme.text }]}>
                                {preReminder.minutes || 15} min
                              </Text>
                              <Ionicons
                                name="chevron-down"
                                size={11}
                                color={theme.subText}
                                style={{ marginLeft: 3 }}
                              />
                            </TouchableOpacity>
                          )}

                          <Switch
                            value={preReminder.enabled}
                            onValueChange={(val) =>
                              updatePrayerPreReminder(prayer, { enabled: val })
                            }
                            trackColor={{ false: '#767577', true: theme.primary }}
                            thumbColor="#FFFFFF"
                            style={styles.compactSwitch}
                          />
                        </View>
                      </View>
                    )}

                    {!isLastPrayer && (
                      <View
                        style={[
                          styles.separator,
                          { backgroundColor: theme.border, left: 16 },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
          </SettingsSection>

          {/* ── 5. Support Section ─────────────────────────────────────────── */}
          <SettingsSection
            title="Support"
            footer="Muslim Atlas uses accurate location databases and live timetable services. Thank you for your support!"
          >
            <SettingsRow
              icon="cafe"
              iconBg="#FF9500"
              title="Support Server Costs"
              subtitle="Buy us a coffee"
              showChevron
              onPress={handleSupport}
              isLast={true}
            />
          </SettingsSection>

          {/* ── 6. Version Footer ─────────────────────────────────────────── */}
          <View style={styles.footerContainer}>
            <Text style={[styles.versionText, { color: theme.subText }]}>
              Muslim Atlas 1.0.0
            </Text>
          </View>
        </ScrollView>
      </View>

      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Pre-Reminder Number Selector Modal */}
      <Modal
        visible={!!reminderPickerPrayer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReminderPickerPrayer(null)}
      >
        <TouchableWithoutFeedback onPress={() => setReminderPickerPrayer(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    paddingBottom: Math.max(insets.bottom, 16) + 8,
                  },
                ]}
              >
                {/* iOS Grabber */}
                <View style={styles.modalGrabberContainer}>
                  <View style={[styles.modalGrabber, { backgroundColor: theme.subText }]} />
                </View>

                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {reminderPickerPrayer} Pre-Reminder
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.subText }]}>
                    Choose how many minutes before {reminderPickerPrayer} to be alerted
                  </Text>
                </View>

                {/* Grouped Options List */}
                <View
                  style={[
                    styles.modalOptionsContainer,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  {PRE_REMINDER_OPTIONS.map((mins, idx) => {
                    const currentMins =
                      notificationSettings.preReminders?.[reminderPickerPrayer]?.minutes || 15;
                    const isSelected = currentMins === mins;

                    return (
                      <TouchableOpacity
                        key={mins}
                        style={[
                          styles.modalOptionRow,
                          idx > 0 && {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: theme.border,
                          },
                        ]}
                        onPress={() => {
                          updatePrayerPreReminder(reminderPickerPrayer, { minutes: mins });
                          setReminderPickerPrayer(null);
                        }}
                        activeOpacity={0.65}
                      >
                        <Text
                          style={[
                            styles.modalOptionText,
                            { color: theme.text },
                            isSelected && { color: theme.primary, fontWeight: '600' },
                          ]}
                        >
                          {mins === 60 ? '60 minutes (1 hour) before' : `${mins} minutes before`}
                        </Text>
                        {isSelected ? (
                          <Ionicons name="checkmark" size={18} color={theme.primary} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Done Button */}
                <TouchableOpacity
                  style={[
                    styles.modalCancelBtn,
                    {
                      backgroundColor:
                        theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                  onPress={() => setReminderPickerPrayer(null)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalCancelText, { color: theme.text }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

// ─── Styles: iOS System Settings Inset Grouped Aesthetic ───────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: 'Unbounded-Bold',
    fontSize: 28,
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingTop: 12,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontFamily: 'Syne-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 32,
    marginBottom: 7,
  },
  sectionFooter: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.08,
    marginLeft: 32,
    marginRight: 32,
    marginTop: 7,
  },
  groupedCard: {
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  rowWrapper: {
    position: 'relative',
  },
  rowTouch: {
    minHeight: 44,
    justifyContent: 'center',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  squircle: {
    width: 29,
    height: 29,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: 'Syne-Bold',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.41,
    marginRight: 6,
    maxWidth: 160,
  },
  chevron: {
    marginLeft: 2,
    opacity: 0.35,
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },

  // Per-Prayer Nested Layout
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  prayerName: {
    fontFamily: 'Syne-Bold',
    fontSize: 16,
    letterSpacing: -0.2,
  },

  // Condensed Sub-row Pre-Reminder
  compactReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 34,
    paddingRight: 16,
    paddingBottom: 9,
    marginTop: -2,
  },
  compactReminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactReminderLabel: {
    fontFamily: 'Syne-Bold',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  compactReminderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  minuteSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  minuteSelectorText: {
    fontFamily: 'Syne-Bold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
  },

  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalGrabberContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalGrabber: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.3,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  modalTitle: {
    fontFamily: 'Unbounded-Bold',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
    marginTop: 3,
    textAlign: 'center',
  },
  modalOptionsContainer: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 16,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalOptionText: {
    fontFamily: 'Syne-Bold',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  modalCancelBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: 'Syne-Bold',
    fontSize: 17,
    letterSpacing: -0.41,
  },

  // Manual Adjustments Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 7,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  stepperText: {
    fontFamily: 'Syne-Bold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    minWidth: 42,
    textAlign: 'center',
  },

  // Inline Pickers & Offsets
  scrollablePickerContainer: {
    maxHeight: 220,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pickerContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  pickerItemText: {
    fontFamily: 'Syne-Bold',
    fontSize: 15,
    letterSpacing: -0.2,
    flex: 1,
    paddingRight: 10,
  },
  offsetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  offsetLabel: {
    fontFamily: 'Syne-Bold',
    fontSize: 15,
    letterSpacing: -0.2,
  },

  // Footer Version
  footerContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
    opacity: 0.5,
  },
});
