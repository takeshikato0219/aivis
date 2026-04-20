/* eslint-env jest */

// ============================================
// SETUP @testing-library/jest-native
// ============================================
import '@testing-library/jest-native/extend-expect';

// ============================================
// MOCK REACT NATIVE VECTOR ICONS
// ============================================

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MockIcon = (props) => {
    return React.createElement(
      Text,
      {
        testID: props.testID || 'mock-icon',
        onPress: props.onPress,
        accessible: true,
        accessibilityRole: 'imagebutton',
      },
      props.name || 'icon'
    );
  };

  MockIcon.getImageSource = jest.fn(() => Promise.resolve(''));
  MockIcon.loadFont = jest.fn(() => Promise.resolve());

  return MockIcon;
});

jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MockIcon = (props) => {
    return React.createElement(
      Text,
      {
        testID: props.testID || 'mock-icon',
        onPress: props.onPress,
      },
      props.name || 'icon'
    );
  };

  return MockIcon;
});

// ============================================
// MOCK REACT NATIVE PAPER - COMPLETE
// ============================================

jest.mock('react-native-paper', () => {
  const React = require('react');
  const RN = require('react-native');
  const RealModule = jest.requireActual('react-native-paper');

  // Mock Icon component
  const MockIcon = (props) => {
    return React.createElement(
      RN.TouchableOpacity,
      {
        testID: props.testID || (props.icon ? `${props.icon}-icon` : 'paper-icon'),
        onPress: props.onPress,
        disabled: props.disabled,
      },
      React.createElement(RN.Text, {}, props.icon || 'icon')
    );
  };

  // Mock TextInput with Icon subcomponent
  const MockTextInput = (props) => {
    return React.createElement(RN.TextInput, {
      ...props,
      testID: props.testID || 'text-input',
    });
  };

  // Add Icon as a subcomponent
  MockTextInput.Icon = MockIcon;

  return {
    ...RealModule,
    Portal: ({ children }) => children,
    TextInput: MockTextInput,
    // Mock other Paper components if needed
    Button: RealModule.Button,
    Card: RealModule.Card,
  };
});

// ============================================
// MOCK STORAGE & NETWORK
// ============================================

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {
        isConnectionExpensive: false,
      },
    })
  ),
}));

// ============================================
// MOCK DEVICE INFO
// ============================================

jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(() => Promise.resolve('iPhone 13')),
  getSystemVersion: jest.fn(() => Promise.resolve('15.0')),
  getUniqueId: jest.fn(() => Promise.resolve('unique-id-12345')),
  getVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '1'),
  getBundleId: jest.fn(() => 'com.aivis.camera.ai'),
  getDeviceName: jest.fn(() => Promise.resolve('Test Device')),
  isEmulator: jest.fn(() => Promise.resolve(false)),
}));

// ============================================
// MOCK REACT NAVIGATION
// ============================================

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
      canGoBack: jest.fn(() => true),
      reset: jest.fn(),
      setParams: jest.fn(),
    }),
    useRoute: () => ({
      key: 'test-route',
      name: 'TestScreen',
      params: {},
    }),
    useFocusEffect: jest.fn((callback) => callback()),
    useIsFocused: jest.fn(() => true),
  };
});

// ============================================
// MOCK GESTURE HANDLER
// ============================================

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// ============================================
// MOCK SAFE AREA CONTEXT
// ============================================

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: jest.fn(() => inset),
    useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 390, height: 844 })),
    // Required by @react-navigation/stack StackView
    SafeAreaInsetsContext: {
      Consumer: ({ children }) => (typeof children === 'function' ? children(inset) : children),
      Provider: ({ children }) => children,
    },
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    },
  };
});

// ============================================
// MOCK REANIMATED
// ============================================

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// ============================================
// MOCK LOCALIZE
// ============================================

jest.mock('react-native-localize', () => ({
  getLocales: jest.fn(() => [
    {
      countryCode: 'US',
      languageTag: 'en-US',
      languageCode: 'en',
      isRTL: false,
    },
  ]),
  getNumberFormatSettings: jest.fn(() => ({
    decimalSeparator: '.',
    groupingSeparator: ',',
  })),
  getCalendar: jest.fn(() => 'gregorian'),
  getCountry: jest.fn(() => 'US'),
  getCurrencies: jest.fn(() => ['USD']),
  getTemperatureUnit: jest.fn(() => 'celsius'),
  getTimeZone: jest.fn(() => 'America/New_York'),
  uses24HourClock: jest.fn(() => false),
  usesMetricSystem: jest.fn(() => false),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// ============================================
// MOCK I18N
// ============================================

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  Trans: ({ children }) => children,
}));

jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockReturnThis(),
  changeLanguage: jest.fn(),
  language: 'en',
  t: (key) => key,
}));

// ============================================
// GLOBAL MOCKS
// ============================================

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
  })
);

global.alert = jest.fn();

// ============================================
// SUPPRESS CONSOLE WARNINGS
// ============================================

const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn((...args) => {
    const message = args[0];

    // Suppress react-native-paper icon warnings
    if (
      typeof message === 'string' &&
      (message.includes('Tried to use the icon') ||
        message.includes('react-native-paper') ||
        message.includes('icon libraries'))
    ) {
      return;
    }

    originalWarn(...args);
  });

  console.error = jest.fn((...args) => {
    const message = args[0];

    // Suppress common React warnings in tests
    if (
      typeof message === 'string' &&
      (message.includes('Warning:  ReactDOM.render') || message.includes('not wrapped in act'))
    ) {
      return;
    }

    originalError(...args);
  });
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// ============================================
// GLOBAL CONFIGURATION
// ============================================

jest.setTimeout(10000);

// ============================================
// SETUP/TEARDOWN
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});
