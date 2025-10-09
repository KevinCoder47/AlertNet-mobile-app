/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import admin from "firebase-admin";
import cors from "cors";

admin.initializeApp();

const corsHandler = cors({ origin: true });

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Export existing functions
export { sendConfirmationEmail } from "./sendVerificationCode.js";

// SOS Notification Functions
export const sendSOSNotification = onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
      }

      const { token, title, body, data } = request.body;

      if (!token || !title || !body) {
        return response.status(400).json({ 
          error: 'Missing required fields: token, title, body' 
        });
      }

      logger.info('Sending SOS notification', { token: token.substring(0, 10) + '...', title, body });

      // Prepare the message
      const message = {
        token: token,
        notification: {
          title: title,
          body: body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'emergency'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1
            }
          }
        }
      };

      // Send the message
      const response_msg = await admin.messaging().send(message);
      
      logger.info('Successfully sent SOS notification:', response_msg);
      
      return response.status(200).json({
        success: true,
        messageId: response_msg
      });

    } catch (error) {
      logger.error('Error sending SOS notification:', error);
      
      // Handle specific FCM errors
      let errorMessage = 'Failed to send notification';
      if (error.code === 'messaging/invalid-registration-token') {
        errorMessage = 'Invalid registration token';
      } else if (error.code === 'messaging/registration-token-not-registered') {
        errorMessage = 'Token not registered';
      }
      
      return response.status(500).json({
        success: false,
        error: errorMessage,
        details: error.message
      });
    }
  });
});

// Batch SOS notification function (send to multiple friends at once)
export const sendBatchSOSNotifications = onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
      }

      const { tokens, title, body, data } = request.body;

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        return response.status(400).json({ 
          error: 'Missing or invalid tokens array' 
        });
      }

      if (!title || !body) {
        return response.status(400).json({ 
          error: 'Missing required fields: title, body' 
        });
      }

      logger.info('Sending batch SOS notifications', { tokenCount: tokens.length, title, body });

      // Prepare the message
      const message = {
        tokens: tokens,
        notification: {
          title: title,
          body: body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'emergency'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1
            }
          }
        }
      };

      // Send the batch message
      const batchResponse = await admin.messaging().sendEachForMulticast(message);
      
      logger.info(`Successfully sent ${batchResponse.successCount} SOS notifications`);
      if (batchResponse.failureCount > 0) {
        logger.warn(`Failed to send ${batchResponse.failureCount} SOS notifications`);
      }
      
      return response.status(200).json({
        success: true,
        successCount: batchResponse.successCount,
        failureCount: batchResponse.failureCount,
        responses: batchResponse.responses
      });

    } catch (error) {
      logger.error('Error sending batch SOS notifications:', error);
      
      return response.status(500).json({
        success: false,
        error: 'Failed to send batch notifications',
        details: error.message
      });
    }
  });
});

// Function to clean up old SOS notifications (run periodically)
export const cleanupOldSOSNotifications = onRequest(async (request, response) => {
  try {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotifications = await db
      .collection('sosNotifications')
      .where('createdAt', '<=', thirtyDaysAgo)
      .get();

    const batch = db.batch();
    oldNotifications.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    logger.info(`Deleted ${oldNotifications.size} old SOS notifications`);
    
    return response.status(200).json({
      success: true,
      deletedCount: oldNotifications.size
    });

  } catch (error) {
    logger.error('Error cleaning up SOS notifications:', error);
    return response.status(500).json({
      success: false,
      error: error.message
    });
  }
});