// sendWalkRequestNotification.js

import * as admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import * as functions from "firebase-functions";

// Initialize the Admin SDK
  initializeApp({
    // credential: admin.credential.applicationDefault(),
    projectId: "alertnet-1ecfb",
  });

  // firebase deploy --only functions:sendWalkRequest

export const sendWalkRequest = functions.https.onCall(async (data, context) => {
 // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  const { token, notification, data: messageData } = data;

  try {
    const message = {
      token: token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...messageData,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    // console.log($&);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending FCM message:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});