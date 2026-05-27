import { db } from "@/config/firebase";
import type { PremiumPlan } from "@/types/premium";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { addMonths, addYears } from "date-fns";

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

  let expiresAt = new Date();
  if (plan.billingCycle.toLowerCase().includes("month")) {
    expiresAt = addMonths(createdAt, 1);
  } else if (plan.billingCycle.toLowerCase().includes("year") || plan.billingCycle.toLowerCase().includes("annual")) {
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
