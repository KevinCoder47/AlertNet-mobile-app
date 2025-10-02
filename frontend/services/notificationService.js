import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async registerForPushNotifications() {
    if (!Constants.expoConfig?.extra?.eas?.projectId) {
      console.error('Project ID not found');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.error('Permission not granted for notifications');
      return null;
    }

    const token = (await Notifications.getExpoPushToken({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;

    return token;
  }

  static async sendWalkRequestNotification(walkData) {
    // This would be called from your server
    // For now, we'll handle local notifications for testing
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Walk Partner Request",
        body: `${walkData.partnerName} wants to walk with you!`,
        data: { 
          type: 'walk_request',
          ...walkData 
        },
      },
      trigger: null, // Send immediately
    });
  }
}