import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistance as formatDistanceUtil, UNIT_SYSTEMS, UNIT_OPTIONS } from '../utils/distance';

export const UNIT_STORAGE_KEY = '@mosquemap_unit_preference';

const PreferencesContext = createContext();

export const PreferencesProvider = ({ children }) => {
  const [unitSystem, setUnitSystemState] = useState(UNIT_SYSTEMS.IMPERIAL);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(UNIT_STORAGE_KEY);
        if (stored === UNIT_SYSTEMS.IMPERIAL || stored === UNIT_SYSTEMS.METRIC) {
          setUnitSystemState(stored);
        }
      } catch (e) {
        console.warn('Failed to load unit system preference:', e);
      } finally {
        setIsReady(true);
      }
    };
    loadPreferences();
  }, []);

  const setUnitSystem = useCallback(async (mode) => {
    if (mode !== UNIT_SYSTEMS.IMPERIAL && mode !== UNIT_SYSTEMS.METRIC) return;
    try {
      await AsyncStorage.setItem(UNIT_STORAGE_KEY, mode);
      setUnitSystemState(mode);
    } catch (e) {
      console.warn('Failed to save unit system preference:', e);
    }
  }, []);

  const formatDistance = useCallback((meters) => {
    return formatDistanceUtil(meters, unitSystem);
  }, [unitSystem]);

  return (
    <PreferencesContext.Provider
      value={{
        unitSystem,
        setUnitSystem,
        formatDistance,
        UNIT_SYSTEMS,
        UNIT_OPTIONS,
        isReady,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    // Fallback if rendered outside provider (e.g. in tests)
    return {
      unitSystem: UNIT_SYSTEMS.IMPERIAL,
      setUnitSystem: async () => {},
      formatDistance: (meters) => formatDistanceUtil(meters, UNIT_SYSTEMS.IMPERIAL),
      UNIT_SYSTEMS,
      UNIT_OPTIONS,
      isReady: true,
    };
  }
  return context;
};
