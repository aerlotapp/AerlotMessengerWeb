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
