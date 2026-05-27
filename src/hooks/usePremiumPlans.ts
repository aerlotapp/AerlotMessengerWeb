import { useEffect, useState } from "react";
import { fetchPremiumPlans, mergeFeatures } from "@/services/premiumService";
import type { PremiumPlan, PremiumFeature } from "@/types/premium";

export function usePremiumPlans() {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchPremiumPlans();
        if (cancelled) return;
        setPlans(data);
        setFeatures(mergeFeatures(data));
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, features, loading, error };
}
