export interface PremiumFeature {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  comingSoon?: boolean;
}

export interface PremiumPlan {
  id: string;
  planName: string;
  billingCycle: "monthly" | "annual" | string;
  currency: string;
  description: string;
  price: number;
  features: PremiumFeature[];
  isActive: boolean;
  discountPercentage?: number;
  monthlyEquivalent?: number;
}
