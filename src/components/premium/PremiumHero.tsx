import { motion } from "framer-motion";
import premiumLogo from "@/assets/images/aerlotpremiumlogo.png";

export function PremiumHero() {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-3xl" />
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/30 to-primary/5 shadow-[0_0_40px_-5px_hsl(0_100%_30%/0.6)]">
          <img src={premiumLogo} alt="Aerlot premium" className="h-full w-full object-cover" />
        </div>
      </motion.div>
      <motion.h1
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl"
      >
        Aerlot premium
      </motion.h1>
      <motion.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 max-w-md text-base text-muted-foreground"
      >
        Exclusive premium features and benefits
      </motion.p>
    </div>
  );
}
