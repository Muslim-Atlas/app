import 'react-native-gesture-handler'; // MUST BE THE FIRST LINE
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Unbounded_400Regular, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { Syne_400Regular, Syne_700Bold } from '@expo-google-fonts/syne';

import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/components/SettingsScreen';
import { MosqueProvider } from './src/context/MosqueContext';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { PrayerSettingsProvider } from './src/context/PrayerSettingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChangelogModal from './src/components/ChangelogModal';
import UpdateAvailableModal from './src/components/UpdateAvailableModal';
import { checkAndNotifyUpdate, CURRENT_APP_VERSION, STORAGE_KEYS } from './src/utils/updateChecker';
import { ensureNotificationChannels } from './src/utils/notificationService';
import Mapbox from '@rnmapbox/maps';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
Mapbox.setTelemetryEnabled(false);

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const { theme } = useTheme();
  const [showLaunchChangelog, setShowLaunchChangelog] = React.useState(false);
  const [appUpdateInfo, setAppUpdateInfo] = React.useState(null);

  React.useEffect(() => {
    // 0. Ensure Android notification channels are registered immediately
    ensureNotificationChannels().catch(console.warn);

    // 1. Check if user hasn't seen changelog for current version
    AsyncStorage.getItem(STORAGE_KEYS.LAST_SEEN_CHANGELOG_VERSION).then((lastSeen) => {
      if (lastSeen !== CURRENT_APP_VERSION) {
        setShowLaunchChangelog(true);
      }
    }).catch(console.warn);

    // 2. Perform background update check after 3 seconds
    const timer = setTimeout(() => {
      checkAndNotifyUpdate(CURRENT_APP_VERSION)
        .then((info) => {
          if (info?.updateAvailable) {
            setAppUpdateInfo(info);
          }
        })
        .catch(console.warn);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismissChangelog = async () => {
    setShowLaunchChangelog(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SEEN_CHANGELOG_VERSION, CURRENT_APP_VERSION);
    } catch (e) {
      console.warn('Failed to save last seen changelog version:', e);
    }
  };
  
  const navTheme = {
    dark: theme.mode === 'dark',
    colors: {
      primary: theme.primary,
      background: theme.background,
      card: theme.primary, // Using primary for the header background
      text: '#FFFFFF',     // Header text white
      border: 'transparent',
      notification: theme.primary,
    },
    fonts: {
      regular: { fontFamily: 'Syne-Regular' },
      medium: { fontFamily: 'Syne-Bold' },
      bold: { fontFamily: 'Unbounded-Bold' },
      heavy: { fontFamily: 'Unbounded-Bold' },
    },
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
            },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Map') {
                iconName = focused ? 'map' : 'map-outline';
              } else if (route.name === 'Settings' || route.name === 'Profile') {
                iconName = focused ? 'settings' : 'settings-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.subText,
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Map" component={MapScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      
      <ChangelogModal
        visible={showLaunchChangelog}
        onClose={handleDismissChangelog}
      />

      <UpdateAvailableModal
        visible={!!appUpdateInfo}
        updateInfo={appUpdateInfo}
        onClose={() => setAppUpdateInfo(null)}
      />

      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'Unbounded-Regular': Unbounded_400Regular,
    'Unbounded-Bold': Unbounded_700Bold,
    'Syne-Regular': Syne_400Regular,
    'Syne-Bold': Syne_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <PreferencesProvider>
          <PrayerSettingsProvider>
            <AuthProvider>
              <MosqueProvider>
                <SafeAreaProvider>
                  <MainNavigator />
                </SafeAreaProvider>
              </MosqueProvider>
            </AuthProvider>
          </PrayerSettingsProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});