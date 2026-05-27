import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { PremiumPlan, PremiumFeature } from "@/types/premium";

const COLLECTION = "AerlotPremiumPrice";

export async function fetchPremiumPlans(): Promise<PremiumPlan[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  const plans: PremiumPlan[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as Partial<PremiumPlan>;
    plans.push({
      id: doc.id,
      planName: data.planName ?? doc.id,
      billingCycle: (data.billingCycle as PremiumPlan["billingCycle"]) ?? "monthly",
      currency: data.currency ?? "NGN",
      description: data.description ?? "",
      price: Number(data.price ?? 0),
      features: Array.isArray(data.features) ? (data.features as PremiumFeature[]) : [],
      isActive: data.isActive ?? true,
      discountPercentage: data.discountPercentage,
      monthlyEquivalent: data.monthlyEquivalent,
    });
  });
  return plans;
}

export function mergeFeatures(plans: PremiumPlan[]): PremiumFeature[] {
  const seen = new Map<string, PremiumFeature>();
  for (const p of plans) {
    if (!p.isActive) continue;
    for (const f of p.features) {
      const key = (f.title || "").trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.set(key, f);
    }
  }
  return Array.from(seen.values());
}
