import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { PricingCard } from "@/components/premium/PricingCard";
import { Loader } from "@/components/common/Loader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { usePremiumPlans } from "@/hooks/usePremiumPlans";
import { useAuthStore } from "@/store/authStore";
import { initializePayment } from "@/services/paymentService";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Choose your plan — Aerlot Premium+" },
      { name: "description", content: "Pick the Aerlot Premium+ plan that fits you." },
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
  const { selectedPlan, setSelectedPlan, email } = useAuthStore();

  const active = plans.filter((p) => p.isActive);

  const checkout = async () => {
    if (!selectedPlan || !email) {
      toast.error("Select a plan first");
      return;
    }
    try {
      const { reference } = await initializePayment({ email, plan: selectedPlan });
      toast.success(`Payment initialized (${reference.slice(0, 12)}…)`);
    } catch {
      toast.error("Could not start payment");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
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
          className="text-center"
        >
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Choose your <span className="text-primary">Premium+</span> plan
          </h1>
          <p className="mt-3 text-muted-foreground">
            Flexible plans. Cancel anytime. Welcome back, {email}.
          </p>
        </motion.div>

        <section className="mt-14">
          {loading && <Loader label="Loading plans…" />}
          {error && !loading && <ErrorState message={error} />}
          {!loading && !error && active.length === 0 && <EmptyState title="No plans available" />}
          {!loading && !error && active.length > 0 && (
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

        {selectedPlan && (
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
    </main>
  );
}
