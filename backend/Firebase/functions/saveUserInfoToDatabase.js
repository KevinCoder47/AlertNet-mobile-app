import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const saveUserInfoToDatabase = functions.https.onRequest(async (req, res) => {
  try {
    const { uid, name, surname, phone, email, friends, imageurl, currentLocation } = req.body;

    if (!uid || !name || !surname || !phone || !email || !currentLocation?.lat || !currentLocation?.lng) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await db.collection("users").doc(uid).set({
      name,
      surname,
      phone,
      email,
      friends: friends || [],
      imageurl: imageurl || "",
      currentLocation: {
        lat: currentLocation.lat,
        lng: currentLocation.lng
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ message: "User info saved successfully" });
  } catch (error) {
    console.error("Error saving user info:", error);
    return res.status(500).json({ error: error.message });
  }
});