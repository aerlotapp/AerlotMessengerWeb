import { createRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
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
import { getUserProfile } from "@/services/authService";
import { establishFirebaseAuth } from "@/services/firebaseAuthBridge";
import { aerlotSupabase } from "@/config/supabase";
import { Footer } from "@/components/common/Footer";
import { Route as rootRoute } from "./__root";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { features, loading, error } = usePremiumPlans();
  const { setEmail, setAuthenticated, setUser, isAuthenticated, logout } = useAuthStore();

  const [showEmail, setShowEmail] = useState(false);
  const [otpState, setOtpState] = useState<{
    open: boolean;
    email: string;
    exists: boolean;
  } | null>(null);

  // Initialize app - check for existing session in localStorage
  useEffect(() => {
    const storedSession = localStorage.getItem("@userSession");
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        console.log("✅ Found stored session for:", session.email);
        setEmail(session.email);
        setAuthenticated(true);

        // Fetch latest profile to keep UI in sync
        getUserProfile(session.email).then((profile) => {
          if (profile) {
            setUser({
              uid: profile.uid,
              firstName: profile.firstName,
              lastName: profile.lastName,
              username: profile.username,
              imageUrl: profile.imageUrl,
            });
          }
        });

        // ── Firebase Auth Bridge (session restore) ───────────────────────
        // Re-establish Firebase Auth from the live Supabase session so that
        // returning users (page reload) also pass Firestore's isAuthenticated()
        // check without going through OTP again.
        aerlotSupabase.auth.getSession().then(({ data }) => {
          const accessToken = data?.session?.access_token;
          if (accessToken) {
            establishFirebaseAuth(accessToken).catch((err) =>
              console.warn("[HomePage] Firebase Auth restore failed:", err),
            );
          } else {
            console.warn("[HomePage] Supabase session expired on restore — Firebase Auth not re-established.");
          }
        });
      } catch (err) {
        console.warn("⚠️ Error parsing stored session:", err);
      }
    }
  }, [setEmail, setAuthenticated, setUser]);

  const handleContinue = () => {
    if (isAuthenticated) {
      navigate({ to: "/premium" });
    } else {
      setShowEmail(true);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Logout button */}
      {isAuthenticated && (
        <button
          onClick={() => logout()}
          className="absolute right-6 top-6 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      )}

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
          <ContinueButton onClick={handleContinue} />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to Aerlot's{" "}
            <a
              href="https://aerlotapp.github.io/AerlotMessengerPrivacyPolicy/"
              className="underline hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms and Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      <EmailLoginModal
        open={showEmail}
        onClose={() => setShowEmail(false)}
        onOtpSent={(email, exists) => {
          setShowEmail(false);
          setOtpState({ open: true, email, exists });
        }}
      />

      {otpState && (
        <OTPModal
          open={otpState.open}
          email={otpState.email}
          emailExists={otpState.exists}
          onClose={() => setOtpState(null)}
          onVerified={() => {
            const currentEmail = otpState.email;
            setEmail(currentEmail);
            setAuthenticated(true);
            setOtpState(null);

            // Sync profile immediately to get UID
            getUserProfile(currentEmail).then((profile) => {
              if (profile) {
                setUser({
                  uid: profile.uid,
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  username: profile.username,
                  imageUrl: profile.imageUrl,
                });
              }
            });

            navigate({ to: "/premium" });
          }}
        />
      )}
      <Footer />
    </main>
  );
}
