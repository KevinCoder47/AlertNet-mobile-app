import 'dotenv/config';

export default {
  expo: {
    name: 'frontend',
    slug: 'frontend',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      supportsTablet: true,
      bundleIdentifier: 'alertnet.co.za',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app uses your location for the SOS feature and to verify functionality during tests.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'AlertNet uses your location in the background to keep your friends updated during an emergency SOS session, even when the app is closed.',
        NSLocationAlwaysUsageDescription:
          'AlertNet uses your location in the background to keep your friends updated during an emergency SOS session, even when the app is closed.',
        NSMicrophoneUsageDescription:
          'AlertNet needs microphone access to detect voice emergency keywords like "help" and "danger" for instant emergency response.',
        NSSpeechRecognitionUsageDescription:
          'AlertNet uses speech recognition to listen for emergency keywords in the background, providing hands-free safety monitoring.',
        LSApplicationQueriesSchemes: ['youtube', 'https'],
        UIBackgroundModes: ['location'], // ADD THIS LINE
      },
    },
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'alertnet.co.za',
      permissions: [
        'RECORD_AUDIO',
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION', // ADD THIS LINE
      ],
      queries: {
        intent: [
          {
            action: 'android.intent.action.VIEW',
            data: {
              scheme: 'https',
            },
          },
          {
            action: 'android.intent.action.VIEW',
            data: {
              scheme: 'vnd.youtube',
            },
          },
        ],
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-router',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'This app uses your location for the SOS feature and to verify functionality during tests.',
          locationAlwaysAndWhenInUsePermission:
            'AlertNet uses your location in the background to keep your friends updated during an emergency SOS session, even when the app is closed.',
        },
      ],
      [
        '@react-native-voice/voice',
        {
          microphonePermission: 'AlertNet needs microphone access to detect voice emergency keywords like "help" and "danger".',
          speechRecognitionPermission: 'AlertNet uses speech recognition for hands-free emergency detection and safety monitoring.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '88c49cde-fb05-4f7a-b0b6-91528eceac23',
      },
    },
  },
};