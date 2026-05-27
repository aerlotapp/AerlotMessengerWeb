import type { PremiumPlan } from "@/types/premium";

/**
 * Paystack integration placeholder.
 * Wire up the actual Paystack inline JS later.
 */
export interface PaymentInit {
  email: string;
  plan: PremiumPlan;
}

export async function initializePayment(_init: PaymentInit): Promise<{ reference: string }> {
  // TODO: integrate Paystack inline.
  return { reference: `pending_${Date.now()}` };
}

export function onPaymentSuccess(reference: string) {
  console.log("[paystack] success", reference);
}

export function onPaymentFailure(reason: string) {
  console.warn("[paystack] failure", reason);
}
