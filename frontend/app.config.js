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
      // MODIFIED: Removed LSApplicationQueriesSchemes from here.
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      supportsTablet: true,
      bundleIdentifier: 'alertnet.co.za',
      // MODIFIED: Added LSApplicationQueriesSchemes to the correct location inside infoPlist.
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app uses your location for the SOS feature and to verify functionality during tests.',
        LSApplicationQueriesSchemes: ['youtube', 'https'],
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
      // ADDED: This entire 'queries' block is new.
      // It's required for Android 11+ to open external links.
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