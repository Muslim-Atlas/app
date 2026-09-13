import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferencesProvider, usePreferences, UNIT_STORAGE_KEY } from '../../src/context/PreferencesContext';
import { formatDistance, UNIT_SYSTEMS } from '../../src/utils/distance';

describe('formatDistance utility', () => {
  test('returns fallback for invalid or null inputs', () => {
    expect(formatDistance(null)).toBe('—');
    expect(formatDistance(undefined)).toBe('—');
    expect(formatDistance(NaN)).toBe('—');
    expect(formatDistance(-5)).toBe('—');
  });

  test('formats imperial units accurately', () => {
    // Under 0.1 miles (approx 160m) should format in feet
    expect(formatDistance(50, UNIT_SYSTEMS.IMPERIAL)).toBe('164 ft');
    expect(formatDistance(100, UNIT_SYSTEMS.IMPERIAL)).toBe('328 ft');

    // 0.1 miles and above should format in miles (1 decimal place)
    expect(formatDistance(400, UNIT_SYSTEMS.IMPERIAL)).toBe('0.2 mi');
    expect(formatDistance(1609.34, UNIT_SYSTEMS.IMPERIAL)).toBe('1.0 mi');
    expect(formatDistance(5000, UNIT_SYSTEMS.IMPERIAL)).toBe('3.1 mi');
  });

  test('formats metric units accurately', () => {
    // Under 1km should format in meters
    expect(formatDistance(50, UNIT_SYSTEMS.METRIC)).toBe('50 m');
    expect(formatDistance(400, UNIT_SYSTEMS.METRIC)).toBe('400 m');
    expect(formatDistance(950, UNIT_SYSTEMS.METRIC)).toBe('950 m');

    // 1km and above should format in kilometers (1 decimal place)
    expect(formatDistance(1000, UNIT_SYSTEMS.METRIC)).toBe('1.0 km');
    expect(formatDistance(2500, UNIT_SYSTEMS.METRIC)).toBe('2.5 km');
  });
});

describe('PreferencesContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('initializes with default imperial units when no stored preference exists', async () => {
    const wrapper = ({ children }) => <PreferencesProvider>{children}</PreferencesProvider>;
    const { result } = renderHook(() => usePreferences(), { wrapper });

    expect(result.current.unitSystem).toBe(UNIT_SYSTEMS.IMPERIAL);
    expect(result.current.formatDistance(1609)).toBe('1.0 mi');
  });

  test('loads stored preference from AsyncStorage', async () => {
    await AsyncStorage.setItem(UNIT_STORAGE_KEY, UNIT_SYSTEMS.METRIC);

    const wrapper = ({ children }) => <PreferencesProvider>{children}</PreferencesProvider>;
    const { result } = renderHook(() => usePreferences(), { wrapper });

    // Wait for effect to load
    await act(async () => {});

    expect(result.current.unitSystem).toBe(UNIT_SYSTEMS.METRIC);
    expect(result.current.formatDistance(1000)).toBe('1.0 km');
  });

  test('setUnitSystem updates state and persists to AsyncStorage', async () => {
    const wrapper = ({ children }) => <PreferencesProvider>{children}</PreferencesProvider>;
    const { result } = renderHook(() => usePreferences(), { wrapper });

    await act(async () => {
      await result.current.setUnitSystem(UNIT_SYSTEMS.METRIC);
    });

    expect(result.current.unitSystem).toBe(UNIT_SYSTEMS.METRIC);
    expect(result.current.formatDistance(500)).toBe('500 m');

    const stored = await AsyncStorage.getItem(UNIT_STORAGE_KEY);
    expect(stored).toBe(UNIT_SYSTEMS.METRIC);
  });
});
