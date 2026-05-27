import { AnimatePresence, motion } from "framer-motion";
import { Mail, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { isValidEmail } from "@/utils/validators";
import { existsInFirebase } from "@/services/authService";
import { requestOtp } from "@/services/otpService";

interface Props {
  open: boolean;
  onClose: () => void;
  onOtpSent: (email: string, exists: boolean) => void;
}

export function EmailLoginModal({ open, onClose, onOtpSent }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const exists = await existsInFirebase(email);
      await requestOtp(email);
      toast.success("OTP sent to your email");
      onOtpSent(email, exists);
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
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
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Sign in to continue</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the email linked to your Aerlot account. We'll send you a 6-digit code.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="you@example.com"
              autoFocus
              className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-foreground outline-none transition focus:border-primary/50 focus:bg-white/[0.06]"
            />
            <button
              onClick={submit}
              disabled={loading}
              className="mt-4 w-full rounded-full bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
