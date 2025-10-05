import 'dotenv/config';

export default {
  expo: {
    name: 'frontend',
    slug: 'frontend',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      useFrameworks: "static",
      useModularHeaders: true,
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      supportsTablet: true,
      bundleIdentifier: 'com.mpilonhle.alertnet',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app uses your location for the SOS feature and to verify functionality during tests.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'This app needs access to your location in the background for safety monitoring.',
        NSLocationAlwaysUsageDescription:
          'This app needs access to your location in the background for safety monitoring.',
        // UIBackgroundModes: ['location'],
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
      package: 'com.mpilonhle.alertnet',
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
            'This app needs access to your location in the background for safety monitoring.',
          locationAlwaysPermission:
            'This app needs access to your location in the background for safety monitoring.',
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
            // Add this to enable Google Maps on iOS
            enableGoogleMaps: true,
          },
          android: {
            // Add these for Android Google Maps support
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            enableGoogleMaps: true,
          },
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