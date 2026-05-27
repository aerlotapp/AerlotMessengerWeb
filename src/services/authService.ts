import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { aerlotSupabase } from "@/config/supabase";

/**
 * Check if the email exists in Firestore "users" collection.
 */
export async function existsInFirebase(email: string): Promise<boolean> {
  try {
    const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()), limit(1));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.error("Firebase lookup failed", err);
    return false;
  }
}

/**
 * Check if the email exists in Supabase "users" table.
 */
export async function existsInSupabase(email: string): Promise<boolean> {
  try {
    const { data, error } = await aerlotSupabase
      .from("users")
      .select("email")
      .eq("email", email.toLowerCase())
      .limit(1);
    if (error) {
      console.error("Supabase lookup error", error.message);
      return false;
    }
    return !!data && data.length > 0;
  } catch (err) {
    console.error("Supabase lookup failed", err);
    return false;
  }
}

export async function userExistsEverywhere(email: string): Promise<boolean> {
  const [a, b] = await Promise.all([existsInFirebase(email), existsInSupabase(email)]);
  return a && b;
}

/**
 * Check user status from Firestore (account_status and status).
 */
export async function checkUserStatus(uid: string) {
  try {
    const q = query(collection(db, "users"), where("uid", "==", uid), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      return {
        id: snap.docs[0].id,
        ref: snap.docs[0].ref,
        account_status: data.account_status,
        status: typeof data.status === "string" ? parseInt(data.status, 10) : data.status,
      };
    }
    return null;
  } catch (err) {
    console.error("Error checking user status:", err);
    return null;
  }
}

/**
 * Create a new user document in Firestore.
 */
export async function createFirestoreUser(params: {
  uid: string;
  email: string;
  username: string;
  imageUrl: string;
  deviceName: string;
  country: string;
}) {
  const { addDoc, serverTimestamp } = await import("firebase/firestore");
  try {
    const docRef = await addDoc(collection(db, "users"), {
      uid: params.uid,
      email: params.email,
      username: params.username,
      firstName: "",
      lastName: "",
      imageUrl: params.imageUrl,
      createdAt: serverTimestamp(),
      screenCapture: true,
      addToGroup: true,
      accountVisibility: "yes",
      birthday: null,
      status: 1,
      deviceName: params.deviceName,
      country: params.country,
    });
    return docRef;
  } catch (err) {
    console.error("Error creating Firestore user:", err);
    throw err;
  }
}

/**
 * Fetch the complete user profile from Firestore by email.
 */
export async function getUserProfile(email: string) {
  try {
    const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data();
    }
    return null;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}
