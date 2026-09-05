import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { PremiumPlan, PremiumFeature } from "@/types/premium";

const COLLECTION = "AerlotPremiumPrice";

export const DEFAULT_FEATURES: PremiumFeature[] = [
  {
    title: "Verified Badge",
    description: "Display an official verified badge on your profile and in all chats.",
    icon: "verified",
  },
  {
    title: "Exclusive Features",
    description: "Unlock special customization options, custom badges, and exclusive themes.",
    icon: "sparkles",
  },
  {
    title: "Privacy Controls",
    description: "Advanced privacy protection including screenshot blocking and incognito options.",
    icon: "eye-off",
  },
  {
    title: "Priority Perks",
    description: "High-priority support, automatic group permissions, and early feature access.",
    icon: "crown",
  },
];

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

