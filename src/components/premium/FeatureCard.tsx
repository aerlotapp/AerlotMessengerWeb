import { motion } from "framer-motion";
import type { PremiumFeature } from "@/types/premium";
import { getIcon } from "@/utils/iconMapper";

export function FeatureCard({ feature, index = 0 }: { feature: PremiumFeature; index?: number }) {
  const Icon = getIcon(feature.icon);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative flex items-start gap-4 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors hover:border-primary/30"
    >
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 ring-1 ring-primary/30">
        <Icon className="h-7 w-7 text-primary" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
          {feature.comingSoon && (
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              Coming soon
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
