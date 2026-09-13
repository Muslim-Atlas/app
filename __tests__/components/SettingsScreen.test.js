import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../src/components/SettingsScreen';
import { PrayerSettingsProvider } from '../../src/context/PrayerSettingsContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { PreferencesProvider } from '../../src/context/PreferencesContext';

// Wrap with all required app contexts
const renderSettings = () => {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <PrayerSettingsProvider>
          <PreferencesProvider>
            <SettingsScreen />
          </PreferencesProvider>
        </PrayerSettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

describe('SettingsScreen Component Tests', () => {
  it('renders settings title and primary section headers', async () => {
    const { getByText } = renderSettings();

    await waitFor(() => {
      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Prayer Times Calculation')).toBeTruthy();
      expect(getByText('Appearance')).toBeTruthy();
      expect(getByText('Notifications')).toBeTruthy();
      expect(getByText('Support')).toBeTruthy();
    });
  });

  it('renders prayer calculation rows including Method and Hanafi Asr', async () => {
    const { getByText } = renderSettings();

    await waitFor(() => {
      expect(getByText('Method')).toBeTruthy();
      expect(getByText('Hanafi Asr')).toBeTruthy();
      expect(getByText('Shadow length factor 2')).toBeTruthy();
      expect(getByText('High Latitude')).toBeTruthy();
    });
  });

  it('allows toggling Hanafi Asr switch', async () => {
    const { getByText, getAllByRole } = renderSettings();

    await waitFor(() => {
      expect(getByText('Hanafi Asr')).toBeTruthy();
    });

    const switches = getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);

    // Toggle switch
    fireEvent(switches[1], 'valueChange', true);
  });

  it('allows expanding calculation method picker and selecting Muslim Atlas (Default)', async () => {
    const { getByText, getAllByText } = renderSettings();

    await waitFor(() => {
      expect(getByText('Method')).toBeTruthy();
    });

    // Press the Method row to expand the picker
    fireEvent.press(getByText('Method'));

    // Verify the expanded picker shows the options
    await waitFor(() => {
      expect(getByText('Muslim Atlas (Default)')).toBeTruthy();
      expect(getByText('London Unified (UK)')).toBeTruthy();
      expect(getAllByText('Muslim World League').length).toBeGreaterThan(0);
    });

    // Tap to select Muslim Atlas (Default)
    fireEvent.press(getByText('Muslim Atlas (Default)'));
  });

  it('allows expanding distance units picker and selecting Kilometers (km)', async () => {
    const { getByText, getAllByText } = renderSettings();

    await waitFor(() => {
      expect(getByText('Preferences')).toBeTruthy();
      expect(getByText('Distance Units')).toBeTruthy();
    });

    // Press the Distance Units row to expand the picker
    fireEvent.press(getByText('Distance Units'));

    // Verify the expanded picker shows Miles and Kilometers
    await waitFor(() => {
      expect(getByText('Miles (UK / US)')).toBeTruthy();
      expect(getByText('Kilometers (Metric)')).toBeTruthy();
    });

    // Tap to select Kilometers (Metric)
    fireEvent.press(getByText('Kilometers (Metric)'));
  });
});

