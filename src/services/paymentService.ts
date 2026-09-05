import { db, auth } from "@/config/firebase";
import type { PremiumPlan } from "@/types/premium";
import { addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { addDays, addWeeks, addMonths, addYears, isAfter } from "date-fns";


export interface SubscriptionStatus {
  isActive: boolean;
  expiresAt: Date | null;
  planName: string | null;
}

export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  if (!auth.currentUser) {
    return { isActive: false, expiresAt: null, planName: null };
  }
  try {

    // We simplify the query to avoid needing a composite index for (userId, status, createdAt)
    // fetching all active records for this user and finding the valid one in memory is more robust.
    const q = query(
      collection(db, "premium"),
      where("userId", "==", userId),
      where("status", "==", "active")
    );

    const snap = await getDocs(q);
    if (snap.empty) {
      return { isActive: false, expiresAt: null, planName: null };
    }

    // Find the latest active subscription that hasn't expired
    let latestValidSub: any = null;
    let maxExpiry: Date | null = null;

    snap.docs.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : new Date(data.expiresAt);

      if (!maxExpiry || isAfter(expiresAt, maxExpiry)) {
        maxExpiry = expiresAt;
        latestValidSub = data;
      }
    });

    if (maxExpiry && isAfter(maxExpiry, new Date())) {
      return {
        isActive: true,
        expiresAt: maxExpiry,
        planName: latestValidSub?.plan?.planName || "Premium",
      };
    }

    return { isActive: false, expiresAt: maxExpiry, planName: null };
  } catch (error) {
    console.error("[paymentService] Error checking subscription status:", error);
    return { isActive: false, expiresAt: null, planName: null };
  }
}

/**
 * Paystack integration service.
 */
export interface PaymentInit {
  email: string;
  plan: PremiumPlan;
  userId: string;
}

export async function savePremiumTransaction({
  userId,
  email,
  plan,
  reference,
}: {
  userId: string;
  email: string;
  plan: PremiumPlan;
  reference: string;
}) {
  const amountNGN = plan.price;
  const amountInKobo = amountNGN * 100;
  const createdAt = new Date();

  const cycle = plan.billingCycle.toLowerCase();
  let expiresAt: Date;

  if (cycle.includes("day")) {
    expiresAt = addDays(createdAt, 1);
  } else if (cycle.includes("week")) {
    expiresAt = addWeeks(createdAt, 1);
  } else if (cycle.includes("month")) {
    expiresAt = addMonths(createdAt, 1);
  } else if (cycle.includes("year") || cycle.includes("annual")) {
    expiresAt = addYears(createdAt, 1);
  } else {
    // Default to 1 month if unsure
    expiresAt = addMonths(createdAt, 1);
  }

  const transactionData = {
    userId,
    email,
    plan: {
      id: plan.id,
      planName: plan.planName,
      billingCycle: plan.billingCycle,
    },
    amountNGN,
    amountInKobo,
    reference,
    provider: "paystack",
    status: "active",
    createdAt: serverTimestamp(),
    expiresAt,
  };

  try {
    const docRef = await addDoc(collection(db, "premium"), transactionData);
    console.log("[paystack] Transaction saved:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[paystack] Error saving transaction:", error);
    throw error;
  }
}

export async function initializePayment(_init: PaymentInit): Promise<{ reference: string }> {
  // This is typically handled by the Paystack hook in the UI, 
  // but we provide a reference generator if needed.
  return { reference: `aerlot_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
}
