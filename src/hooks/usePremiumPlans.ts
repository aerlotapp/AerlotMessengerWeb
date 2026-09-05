import { useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/config/firebase";
import { fetchPremiumPlans, mergeFeatures, DEFAULT_FEATURES } from "@/services/premiumService";
import type { PremiumPlan, PremiumFeature } from "@/types/premium";

export function usePremiumPlans() {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [features, setFeatures] = useState<PremiumFeature[]>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async (user: FirebaseUser | null) => {
      // If user is logged out or Firebase Auth Bridge is not active,
      // show DEFAULT_FEATURES and do NOT query protected Firestore collection.
      if (!user) {
        if (!cancelled) {
          setPlans([]);
          setFeatures(DEFAULT_FEATURES);
          setError(null);
          setLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) setLoading(true);
        const data = await fetchPremiumPlans();
        if (cancelled) return;
        setPlans(data);
        const merged = mergeFeatures(data);
        setFeatures(merged.length > 0 ? merged : DEFAULT_FEATURES);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          console.warn("[usePremiumPlans] Error fetching Firestore plans:", e);
          // Gracefully fallback to DEFAULT_FEATURES without displaying raw permission errors
          setFeatures(DEFAULT_FEATURES);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Check initial auth state
    loadPlans(auth.currentUser);

    // Re-evaluate whenever Firebase Auth state changes (e.g. after establishFirebaseAuth)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      loadPlans(user);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { plans, features, loading, error };
}

