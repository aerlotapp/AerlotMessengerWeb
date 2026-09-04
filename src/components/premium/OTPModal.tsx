import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { isValidOtp } from "@/utils/validators";
import { confirmOtp, requestOtp } from "@/services/otpService";
import { aerlotSupabase } from "@/config/supabase";
import { establishFirebaseAuth } from "@/services/firebaseAuthBridge";
import { checkUserStatus, createFirestoreUser, getUserProfile } from "@/services/authService";
import { db } from "@/config/firebase";
import { updateDoc } from "firebase/firestore";
import { AlertTriangle, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface Props {
  open: boolean;
  email: string;
  emailExists: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function OTPModal({ open, email, emailExists, onClose, onVerified }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [statusBlock, setStatusBlock] = useState<"suspended" | "deactivated" | null>(null);
  const [userRef, setUserRef] = useState<any>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    setDigits(Array(6).fill(""));
    setResendIn(30);
    setStatusBlock(null);
    const i = setInterval(() => setResendIn((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, [open]);

  const value = digits.join("");

  const handleChange = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length) {
      e.preventDefault();
      const arr = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setDigits(arr);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const submit = async () => {
    if (!isValidOtp(value)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const data = await confirmOtp(email, value);
      const user = data?.user;
      if (!user) {
        toast.error("Verification failed");
        return;
      }

      // ── Firebase Auth Bridge ──────────────────────────────────────────
      // Exchange the fresh Supabase access_token for a Firebase custom token
      // so Firestore reads on the Premium page see request.auth != null.
      const supabaseAccessToken = data?.session?.access_token;
      if (supabaseAccessToken) {
        await establishFirebaseAuth(supabaseAccessToken);
      } else {
        console.warn("[OTPModal] No Supabase session access_token — Firebase Auth not established.");
      }

      const uid = user.id;
      const userEmail = user.email ?? email;
      const username = (userEmail.split("@")[0] || uid)
        .replace(/[^a-zA-Z0-9_.-]/g, "")
        .toLowerCase();

      const seed = `${username}-${Date.now()}`;
      const imageUrl = `https://api.dicebear.com/6.x/pixel-art/png?seed=${encodeURIComponent(seed)}`;

      // In web, we can use navigator.userAgent or similar for deviceName
      const deviceName = navigator.userAgent.slice(0, 50);

      // Fetch country using ipinfo (matching user's code)
      let country = "unknown";
      try {
        const resp = await fetch("https://ipinfo.io?token=90883ca1824185");
        if (resp.ok) {
          const info = await resp.json();
          country = info?.country || "unknown";
        }
      } catch (err) {
        console.warn("[Auth] error fetching ipinfo:", err);
      }

      // Create Firestore doc if new
      if (!emailExists) {
        await createFirestoreUser({
          uid,
          email: userEmail,
          username,
          imageUrl,
          deviceName,
          country,
        });
      }

      // Check status
      const statusData = await checkUserStatus(uid);
      if (statusData) {
        if (statusData.account_status === 0) {
          setUserRef(statusData.ref);
          setStatusBlock("deactivated");
          setLoading(false);
          return;
        }
        if (statusData.status === 0) {
          setStatusBlock("suspended");
          setLoading(false);
          return;
        }
      }

      // Finalize logic logic (matching user's AsyncStorage logic)
      const sessionInfo = {
        userId: uid,
        email: userEmail,
        username,
        imageUrl,
        deviceName,
        country,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem("@userSession", JSON.stringify(sessionInfo));

      // Fetch latest profile from Firestore for the store
      const profile = await getUserProfile(userEmail);
      if (profile) {
        useAuthStore.getState().setUser({
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          imageUrl: profile.imageUrl,
        });
      }

      toast.success("Verified!");
      onVerified(); // navigates to /premium — Firebase Auth is now active
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const reactivateAccount = async () => {
    if (!userRef) return;
    setLoading(true);
    try {
      await updateDoc(userRef, { account_status: 1 });
      toast.success("Account reactivated!");
      setStatusBlock(null);
      // Re-trigger verify flow logic or just call onVerified
      onVerified();
    } catch (e) {
      console.error(e);
      toast.error("Failed to reactivate account");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    try {
      await requestOtp(email);
      toast.success("New code sent");
      setResendIn(30);
    } catch {
      toast.error("Could not resend");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-card p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Enter verification code</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="text-foreground">{email}</span>.
            </p>

            {statusBlock === "suspended" ? (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
                  <Lock className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Account Suspended</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your account was frozen for breaking the Terms and Conditions. Submit an appeal
                  within 30 days or your account will be deleted.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 w-full rounded-full bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
                >
                  I Understand
                </button>
              </div>
            ) : statusBlock === "deactivated" ? (
              <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/20">
                  <AlertTriangle className="h-7 w-7 text-yellow-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Account Deactivated</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your account is currently deactivated. Would you like to reactivate it and
                  continue?
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={reactivateAccount}
                    disabled={loading}
                    className="w-full rounded-full bg-yellow-500 px-6 py-3 font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {loading ? "Reactivating..." : "Reactivate"}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full rounded-full bg-white/5 px-6 py-3 font-semibold text-foreground transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 flex justify-between gap-2" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputs.current[i] = el;
                      }}
                      value={d}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !d && i > 0) inputs.current[i - 1]?.focus();
                      }}
                      inputMode="numeric"
                      maxLength={1}
                      className="h-14 w-12 rounded-xl border border-white/10 bg-white/[0.03] text-center text-xl font-semibold text-foreground outline-none transition focus:border-primary/60 focus:bg-white/[0.06]"
                    />
                  ))}
                </div>
                <button
                  onClick={submit}
                  disabled={loading || value.length !== 6}
                  className="mt-6 w-full rounded-full bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Verifying…" : "Verify"}
                </button>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {resendIn > 0 ? (
                    <span>Resend code in {resendIn}s</span>
                  ) : (
                    <button onClick={resend} className="font-medium text-primary hover:underline">
                      Resend code
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
