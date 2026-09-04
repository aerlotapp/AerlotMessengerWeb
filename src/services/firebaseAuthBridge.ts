/**
 * firebaseAuthBridge.ts  (AerlotMessengerWeb)
 *
 * Bridges Supabase Auth → Firebase Auth so that Firestore Security Rules
 * can evaluate request.auth != null for authenticated reads.
 *
 * Flow:
 *  1. After Supabase OTP verification, the caller passes the Supabase
 *     access_token to establishFirebaseAuth().
 *  2. This module calls the existing mintFirebaseToken Cloud Function
 *     (deployed in /AerlotMessenger/functions) with the access_token.
 *  3. The Cloud Function verifies the token via Supabase Admin API, then
 *     calls admin.auth().createCustomToken(supabaseUid).
 *  4. signInWithCustomToken(auth, customToken) establishes Firebase Auth.
 *  5. Firestore request.auth.uid now === Supabase user.id.
 *
 * Token expiry:
 *  - Firebase ID Tokens last 1 hour.
 *  - A proactive refresh is scheduled at TOKEN_REFRESH_INTERVAL_MS (50 min)
 *    to keep Firebase Auth alive as long as the Supabase session is valid.
 *
 * Reference: /Users/apple/AerlotMessenger/utils/firebaseAuthBridge.ts
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { signInWithCustomToken, signOut as firebaseSignOut } from "firebase/auth";
import { firebaseApp, auth } from "@/config/firebase";
import { aerlotSupabase } from "@/config/supabase";

const functions = getFunctions(firebaseApp);
const mintFirebaseTokenFn = httpsCallable<
  { supabaseAccessToken: string },
  { customToken: string }
>(functions, "mintFirebaseToken");

// Refresh Firebase ID token proactively 10 minutes before expiry (50 min)
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

let _refreshTimer: ReturnType<typeof setTimeout> | null = null;
let _inFlightPromise: Promise<boolean> | null = null;

/**
 * Clear the scheduled Firebase token refresh timer.
 */
function clearRefreshTimer(): void {
  if (_refreshTimer !== null) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
}

/**
 * Establish Firebase Auth from an active Supabase session.
 *
 * 1. Calls the mintFirebaseToken Cloud Function with the Supabase access_token.
 * 2. Signs into Firebase Auth with the returned custom token.
 * 3. Schedules a proactive refresh before the 1-hour Firebase ID token expires.
 *
 * @param supabaseAccessToken - The access_token from the active Supabase session.
 * @returns true if Firebase Auth was established, false on failure.
 */
export async function establishFirebaseAuth(supabaseAccessToken: string): Promise<boolean> {
  if (auth.currentUser) {
    console.log(`[FirebaseAuthBridge] Firebase Auth already active. UID: ${auth.currentUser.uid}`);
    return true;
  }

  // Deduplicate concurrent calls
  if (_inFlightPromise) {
    console.log("[FirebaseAuthBridge] Reusing in-flight token minting promise...");
    return _inFlightPromise;
  }

  _inFlightPromise = (async () => {
    clearRefreshTimer();

    try {
      // Guard again inside the async block in case of race conditions
      if (auth.currentUser) return true;

      console.log("[FirebaseAuthBridge] Minting Firebase custom token...");
      const result = await mintFirebaseTokenFn({ supabaseAccessToken });
      const { customToken } = result.data;

      if (!customToken) {
        console.error("[FirebaseAuthBridge] mintFirebaseToken returned an empty customToken");
        return false;
      }

      const userCredential = await signInWithCustomToken(auth, customToken);
      console.log(`[FirebaseAuthBridge] Firebase Auth established. UID: ${userCredential.user.uid}`);

      // Schedule proactive refresh so Firebase Auth stays live for the whole Supabase session
      _refreshTimer = setTimeout(async () => {
        console.log("[FirebaseAuthBridge] Proactive token refresh triggered...");
        await refreshFirebaseAuth();
      }, TOKEN_REFRESH_INTERVAL_MS);

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[FirebaseAuthBridge] Failed to establish Firebase Auth:", message);
      return false;
    } finally {
      _inFlightPromise = null;
    }
  })();

  return _inFlightPromise;
}

/**
 * Refresh Firebase Auth by re-fetching the current Supabase session
 * and minting a fresh Firebase Custom Token. Called proactively before expiry
 * and can also be called manually on page focus restore.
 *
 * @returns true if refresh succeeded, false otherwise.
 */
export async function refreshFirebaseAuth(): Promise<boolean> {
  try {
    const { data } = await aerlotSupabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    if (!accessToken) {
      console.warn(
        "[FirebaseAuthBridge] No active Supabase session for refresh — signing Firebase out.",
      );
      await signOutFirebaseAuth();
      return false;
    }
    // Force a fresh token by clearing the current user before re-establishing
    clearRefreshTimer();
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
    return await establishFirebaseAuth(accessToken);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[FirebaseAuthBridge] Token refresh error:", message);
    return false;
  }
}

/**
 * Sign out Firebase Auth and clear the refresh timer.
 * Should be called on Supabase sign-out / logout.
 */
export async function signOutFirebaseAuth(): Promise<void> {
  clearRefreshTimer();
  try {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
      console.log("[FirebaseAuthBridge] Firebase Auth signed out.");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[FirebaseAuthBridge] Error signing out Firebase Auth:", message);
  }
}
