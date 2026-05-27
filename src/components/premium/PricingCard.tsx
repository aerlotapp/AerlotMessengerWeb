import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { PremiumPlan } from "@/types/premium";
import { formatCurrency } from "@/utils/currency";

interface Props {
  plan: PremiumPlan;
  selected: boolean;
  onSelect: () => void;
  index?: number;
}

export function PricingCard({ plan, selected, onSelect, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onSelect}
      className={`relative flex cursor-pointer flex-col rounded-3xl border p-7 backdrop-blur-xl transition-all ${
        selected
          ? "border-primary bg-primary/[0.08] shadow-[0_20px_60px_-15px_hsl(0_100%_30%/0.5)]"
          : "border-white/10 bg-white/[0.03] hover:border-primary/40"
      }`}
    >
      {plan.discountPercentage ? (
        <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
          Save {plan.discountPercentage}%
        </span>
      ) : null}

      <h3 className="text-lg font-semibold text-foreground">{plan.planName}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-foreground">
          {formatCurrency(plan.price, plan.currency)}
        </span>
        <span className="text-sm text-muted-foreground">/ {plan.billingCycle}</span>
      </div>
      {plan.monthlyEquivalent ? (
        <p className="mt-1 text-xs text-muted-foreground">
          ~ {formatCurrency(plan.monthlyEquivalent, plan.currency)} / month
        </p>
      ) : null}

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
              <Check className="h-3 w-3 text-primary" strokeWidth={3} />
            </span>
            <span className="text-foreground/90">{f.title}</span>
          </li>
        ))}
      </ul>

      <button
        className={`mt-7 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
          selected
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
        }`}
      >
        {selected ? "Selected" : "Select plan"}
      </button>
    </motion.div>
  );
}
