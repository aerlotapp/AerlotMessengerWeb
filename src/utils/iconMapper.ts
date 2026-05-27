import {
  BadgeCheck,
  Sparkles,
  EyeOff,
  MessageCircle,
  Languages,
  Gift,
  Star,
  Crown,
  Rocket,
  Zap,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  verified: BadgeCheck,
  sparkles: Sparkles,
  "eye-off": EyeOff,
  "chatbubble-ellipses": MessageCircle,
  language: Languages,
  gift: Gift,
  star: Star,
  crown: Crown,
  rocket: Rocket,
  zap: Zap,
};

export function getIcon(name?: string): LucideIcon {
  if (!name) return Sparkles;
  return map[name.toLowerCase()] ?? Sparkles;
}
