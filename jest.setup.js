/* eslint-env jest */

// In @testing-library/react-native v12.4+, extend-expect is built-in
try {
  require('@testing-library/react-native/extend-expect');
} catch (e) {
  // fallback if extend-expect path is different in v13
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));
jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb({ isAnonymous: false, uid: 'test-user-id', email: 'user@muslimatlas.com' });
    return jest.fn();
  }),
  signInAnonymously: jest.fn(async () => ({ user: { isAnonymous: true } })),
  signOut: jest.fn(async () => {}),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  EmailAuthProvider: { credential: jest.fn() },
  linkWithCredential: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(async () => ({ exists: () => false, data: () => ({}) })),
  setDoc: jest.fn(async () => {}),
  updateDoc: jest.fn(async () => {}),
  arrayUnion: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  useFonts: jest.fn(() => [true, null]),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 51.5074,
      longitude: -0.1278,
      altitude: 0,
      accuracy: 5,
      heading: 0,
      speed: 0,
    },
  })),
  watchPositionAsync: jest.fn(),
  Accuracy: { High: 4, Balanced: 3 },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
}));

// Mock expo-task-manager and expo-background-fetch
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(async () => false),
}));

jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(),
  unregisterTaskAsync: jest.fn(),
  BackgroundFetchStatus: { Available: 3 },
}));

// Mock @rnmapbox/maps
jest.mock('@rnmapbox/maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      setAccessToken: jest.fn(),
      requestAndroidLocationPermissions: jest.fn(async () => true),
    },
    MapView: (props) => React.createElement(View, { testID: 'rnmapbox-mapview', ...props }, props.children),
    Camera: (props) => React.createElement(View, { testID: 'rnmapbox-camera', ...props }, props.children),
    ShapeSource: (props) => React.createElement(View, { testID: 'rnmapbox-shapesource', ...props }, props.children),
    SymbolLayer: (props) => React.createElement(View, { testID: 'rnmapbox-symbollayer', ...props }, props.children),
    LineLayer: (props) => React.createElement(View, { testID: 'rnmapbox-linelayer', ...props }, props.children),
    PointAnnotation: (props) => React.createElement(View, { testID: 'rnmapbox-pointannotation', ...props }, props.children),
    MarkerView: (props) => React.createElement(View, { testID: 'rnmapbox-markerview', ...props }, props.children),
    UserLocation: (props) => React.createElement(View, { testID: 'rnmapbox-userlocation', ...props }, props.children),
    StyleURL: {
      Street: 'mapbox://styles/mapbox/streets-v11',
      Dark: 'mapbox://styles/mapbox/dark-v10',
      Light: 'mapbox://styles/mapbox/light-v10',
    },
  };
});

// Mock react-native-android-widget
jest.mock('react-native-android-widget', () => ({
  requestWidgetUpdate: jest.fn(),
  FlexWidget: 'FlexWidget',
  TextWidget: 'TextWidget',
  SvgWidget: 'SvgWidget',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
  };
});
