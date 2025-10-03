// backend/routes/walkRequests.js
const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// Send walk request to all users (in production, you'd filter by location)
router.post('/send-walk-request', async (req, res) => {
  try {
    const { walkData } = req.body;

    // In production, you'd get device tokens for users near the location
    const message = {
      data: {
        type: 'walk_request',
        walkData: JSON.stringify(walkData),
      },
      topic: 'walk_requests', // Send to all users subscribed to this topic
      // OR send to specific tokens:
      // tokens: ['device_token_1', 'device_token_2']
    };

    const response = await admin.messaging().send(message);
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending FCM message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;