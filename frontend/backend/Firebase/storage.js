import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "./FirebaseConfig";
import { doc, updateDoc } from "firebase/firestore";


export const uploadProfileImage = async (userId, imageUri) => {
  try {
    const formattedUri = imageUri.startsWith("file://") ? imageUri : `file://${imageUri}`;
    
    const response = await fetch(formattedUri);
    const blob = await response.blob();

    // Create a storage reference with user ID folder structure
    const timestamp = Date.now();
    const storageRef = ref(storage, `profileImages/${userId}/${timestamp}.jpg`);

    const metadata = {
      contentType: 'image/jpeg',
    };
    
    await uploadBytes(storageRef, blob, metadata);

    const downloadURL = await getDownloadURL(storageRef);

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { 
      imageUrl: downloadURL,
      lastUpdated: new Date()
    });

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error.message);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};