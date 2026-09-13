import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerSettingsProvider, usePrayerSettings } from '../../src/context/PrayerSettingsContext';

describe('PrayerSettingsContext Unit Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('initializes with default values after loading', async () => {
    const { result } = renderHook(() => usePrayerSettings(), {
      wrapper: PrayerSettingsProvider,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.asrMethod).toBe('standard');
    expect(result.current.calculationMethod).toBe('MuslimWorldLeague');
    expect(result.current.highLatitudeRule).toBe('Auto');
  });

  it('updates calculation method and persists to AsyncStorage', async () => {
    const { result } = renderHook(() => usePrayerSettings(), {
      wrapper: PrayerSettingsProvider,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.setCalculationMethod('LondonUnifiedDefault');
    });

    expect(result.current.calculationMethod).toBe('LondonUnifiedDefault');
    const stored = await AsyncStorage.getItem('@muslimatlas_calc_method');
    expect(stored).toBe('LondonUnifiedDefault');
  });

  it('updates asr method to hanafi and persists to AsyncStorage', async () => {
    const { result } = renderHook(() => usePrayerSettings(), {
      wrapper: PrayerSettingsProvider,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.setAsrMethod('hanafi');
    });

    expect(result.current.asrMethod).toBe('hanafi');
    const stored = await AsyncStorage.getItem('@muslimatlas_asr_method');
    expect(stored).toBe('hanafi');
  });

  it('updates prayer offsets and persists them', async () => {
    const { result } = renderHook(() => usePrayerSettings(), {
      wrapper: PrayerSettingsProvider,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.updatePrayerOffset('Maghrib', 7);
    });

    expect(result.current.prayerOffsets.Maghrib).toBe(7);
    const stored = await AsyncStorage.getItem('@muslimatlas_prayer_offsets');
    const parsed = JSON.parse(stored);
    expect(parsed.Maghrib).toBe(7);
  });
});
