import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PremiumHero } from "@/components/premium/PremiumHero";
import { FeatureCard } from "@/components/premium/FeatureCard";
import { ContinueButton } from "@/components/premium/ContinueButton";
import { EmailLoginModal } from "@/components/premium/EmailLoginModal";
import { OTPModal } from "@/components/premium/OTPModal";
import { Loader } from "@/components/common/Loader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { usePremiumPlans } from "@/hooks/usePremiumPlans";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aerlot Premium+ — Exclusive premium features" },
      {
        name: "description",
        content: "Unlock exclusive premium features and benefits with Aerlot Premium+.",
      },
      { property: "og:title", content: "Aerlot Premium+" },
      {
        property: "og:description",
        content: "Unlock exclusive premium features and benefits with Aerlot Premium+.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { features, loading, error } = usePremiumPlans();
  const { setEmail, setAuthenticated } = useAuthStore();

  const [showEmail, setShowEmail] = useState(false);
  const [otpState, setOtpState] = useState<
    { open: boolean; email: string; token: string; expiresAt: number } | null
  >(null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <PremiumHero />

        <section className="mt-16">
          {loading && <Loader label="Loading premium features…" />}
          {error && !loading && <ErrorState message={error} />}
          {!loading && !error && features.length === 0 && (
            <EmptyState
              title="No premium features yet"
              description="Premium features will appear here once they're configured."
            />
          )}
          {!loading && !error && features.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {features.map((f, i) => (
                <FeatureCard key={`${f.title}-${i}`} feature={f} index={i} />
              ))}
            </div>
          )}
        </section>

        <div className="mx-auto mt-14 max-w-md">
          <ContinueButton onClick={() => setShowEmail(true)} />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to Aerlot's Terms and Privacy Policy.
          </p>
        </div>
      </div>

      <EmailLoginModal
        open={showEmail}
        onClose={() => setShowEmail(false)}
        onOtpSent={(email, token, expiresAt) => {
          setShowEmail(false);
          setOtpState({ open: true, email, token, expiresAt });
        }}
      />

      {otpState && (
        <OTPModal
          open={otpState.open}
          email={otpState.email}
          token={otpState.token}
          expiresAt={otpState.expiresAt}
          onClose={() => setOtpState(null)}
          onTokenRefresh={(token, expiresAt) =>
            setOtpState((s) => (s ? { ...s, token, expiresAt } : s))
          }
          onVerified={() => {
            setEmail(otpState.email);
            setAuthenticated(true);
            setOtpState(null);
            navigate({ to: "/premium" });
          }}
        />
      )}
    </main>
  );
}
