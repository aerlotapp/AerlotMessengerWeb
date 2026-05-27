import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { isValidOtp } from "@/utils/validators";
import { confirmOtp, requestOtp } from "@/services/otpService";

interface Props {
  open: boolean;
  email: string;
  token: string;
  expiresAt: number;
  onClose: () => void;
  onVerified: () => void;
  onTokenRefresh: (token: string, expiresAt: number) => void;
}

export function OTPModal({ open, email, token, expiresAt, onClose, onVerified, onTokenRefresh }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    setDigits(Array(6).fill(""));
    setResendIn(30);
    const i = setInterval(() => setResendIn((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, [open, token]);

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
    if (Date.now() > expiresAt) {
      toast.error("Code expired. Request a new one.");
      return;
    }
    setLoading(true);
    try {
      const result = await confirmOtp(email, value, token);
      if (result.ok) {
        toast.success("Verified!");
        onVerified();
      } else {
        toast.error(result.error || "Invalid code");
      }
    } catch (e) {
      console.error(e);
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    try {
      const { token: t, expiresAt: e } = await requestOtp(email);
      onTokenRefresh(t, e);
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
