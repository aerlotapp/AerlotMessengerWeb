import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function ContinueButton({ onClick, label = "Continue" }: { onClick: () => void; label?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_hsl(0_100%_30%/0.7)] transition-shadow hover:shadow-[0_15px_50px_-10px_hsl(0_100%_30%/0.9)]"
    >
      <span className="flex items-center justify-center gap-2">
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </motion.button>
  );
}
