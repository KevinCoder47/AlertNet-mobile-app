import { getFirestore, collection, query, where, limit, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();

/** Normalize to +27... format (very simple for now, assumes ZA default) */
function normalizePhone(rawPhone) {
  if (!rawPhone) return "";
  let phone = rawPhone.trim();

  if (phone.startsWith("0")) {
    // South African default
    phone = "+27" + phone.substring(1);
  }

  if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }

  return phone;
}

/**
 * Check if a user exists in Firestore by phone number
 */
export async function checkUserExists(rawPhone) {
  try {
    const auth = getAuth();
    const currentUid = auth.currentUser?.uid || null;

    const phoneE164 = normalizePhone(rawPhone);

    const q = query(
      collection(db, "users"),
      where("phoneE164", "==", phoneE164),
      limit(1)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return { exists: false };
    }

    const doc = snap.docs[0];
    const userId = doc.id;

    return {
      exists: true,
      userId,
      isSelf: currentUid === userId,
    };
  } catch (err) {
    console.error("checkUserExists error:", err);
    return { error: err.message || String(err), exists: false };
  }
}
