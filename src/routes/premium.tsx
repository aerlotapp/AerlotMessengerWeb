import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { PricingCard } from "@/components/premium/PricingCard";
import { Loader } from "@/components/common/Loader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { usePremiumPlans } from "@/hooks/usePremiumPlans";
import { useAuthStore } from "@/store/authStore";
import { usePaystackPayment } from "react-paystack";
import {
  savePremiumTransaction,
  initializePayment,
  checkSubscriptionStatus,
  type SubscriptionStatus,
} from "@/services/paymentService";
import { useState, useEffect } from "react";
import { CheckCircle2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Footer } from "@/components/common/Footer";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Choose your plan — Aerlot premium" },
      { name: "description", content: "Pick the Aerlot premium plan that fits you." },
    ],
  }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("aerlot-auth");
    if (!raw) throw redirect({ to: "/" });
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.state?.isAuthenticated) throw redirect({ to: "/" });
    } catch {
      throw redirect({ to: "/" });
    }
  },
  component: PremiumPage,
});

function PremiumPage() {
  const navigate = useNavigate();
  const { plans, loading, error } = usePremiumPlans();
  const { selectedPlan, setSelectedPlan, email, user, logout } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setCheckingSubscription(true);
      checkSubscriptionStatus(user.uid)
        .then((status) => {
          console.log("[Premium] Subscription status checked:", status);
          setSubscription(status);
        })
        .finally(() => {
          setCheckingSubscription(false);
        });
    } else {
      setCheckingSubscription(false);
    }
  }, [user?.uid]);

  const active = plans.filter((p) => p.isActive);

  const config = {
    reference: `aerlot_${Date.now()}`,
    email: email || "",
    amount: (selectedPlan?.price || 0) * 100, // Amount in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
  };

  const initializePaystack = usePaystackPayment(config);

  const onSuccess = async (reference: any) => {
    if (!selectedPlan || !user) return;
    try {
      await savePremiumTransaction({
        userId: user.uid || "",
        email: email || "",
        plan: selectedPlan,
        reference: reference.reference,
      });
      toast.success("Payment successful! Your premium plan is now active.");

      // Refresh subscription status immediately to show the success UI
      const status = await checkSubscriptionStatus(user.uid || "");
      setSubscription(status);
    } catch (error) {
      console.error("[Premium] Error after payment success:", error);
      toast.error(
        "Payment was successful but we couldn't activate your plan automatically. Please contact support.",
      );
    }
  };

  const onClose = () => {
    toast.error("Payment cancelled");
  };

  const checkout = () => {
    if (!selectedPlan || !email) {
      toast.error("Select a plan first");
      return;
    }
    // @ts-ignore - react-paystack types can be tricky
    initializePaystack({ onSuccess, onClose });
  };

  const displayName =
    (user?.firstName || user?.lastName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : user?.username || email) ?? "Guest";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Logout button */}
      <button
        onClick={() => {
          logout();
          navigate({ to: "/" });
        }}
        className="absolute right-6 top-6 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          {user?.imageUrl && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 h-20 w-20 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10 p-1 shadow-2xl ring-4 ring-primary/5"
            >
              <img
                src={user.imageUrl}
                alt={displayName}
                className="h-full w-full rounded-full object-cover"
              />
            </motion.div>
          )}

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Choose your <span className="text-primary">premium</span> plan
          </h1>
          <p className="mt-3 text-muted-foreground">
            Flexible plans. Cancel anytime. Welcome back, {displayName}.
          </p>
        </motion.div>

        <section className="mt-14">
          {checkingSubscription || loading ? (
            <Loader label="Checking status…" />
          ) : error ? (
            <ErrorState message={error} />
          ) : subscription?.isActive ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center shadow-xl backdrop-blur-sm"
            >
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 ring-8 ring-primary/5">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Premium Active</h2>
              <p className="mt-2 text-muted-foreground">
                You are currently on the{" "}
                <span className="font-semibold text-foreground">{subscription.planName}</span> plan.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl bg-white/5 p-6 sm:flex-row sm:justify-around">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Expires on
                    </p>
                    <p className="font-medium text-foreground">
                      {subscription.expiresAt
                        ? format(subscription.expiresAt, "MMMM dd, yyyy")
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="h-px w-full bg-white/10 sm:h-12 sm:w-px" />

                <div className="text-left">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                    </span>
                    Active
                  </div>
                </div>
              </div>

              <p className="mt-8 text-sm text-muted-foreground italic">
                Subscription options are hidden while your premium plan is active to prevent
                duplicate purchases.
              </p>
            </motion.div>
          ) : active.length === 0 ? (
            <EmptyState title="No plans available" />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {active.map((p, i) => (
                <PricingCard
                  key={p.id}
                  plan={p}
                  index={i}
                  selected={selectedPlan?.id === p.id}
                  onSelect={() => setSelectedPlan(p)}
                />
              ))}
            </div>
          )}
        </section>

        {selectedPlan && !subscription?.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-12 max-w-md"
          >
            <button
              onClick={checkout}
              className="w-full rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_15px_50px_-10px_hsl(0_100%_30%/0.7)] transition hover:bg-primary/90"
            >
              Continue with {selectedPlan.planName}
            </button>
          </motion.div>
        )}
      </div>
      <Footer />
    </main>
  );
}
