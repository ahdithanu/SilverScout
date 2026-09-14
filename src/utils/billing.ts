export type SubscriptionTier = 'free_trial' | 'searcher' | 'sponsor' | 'enterprise';
export type BillingInterval = 'month' | 'year';

export interface PlanFeature {
  name: string;
  included: boolean;
  note?: string;
}

export interface SubscriptionPlanConfig {
  id: SubscriptionTier;
  name: string;
  badge: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  seatsIncluded: number;
  monthlyEnrichedLeads: number;
  features: PlanFeature[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlanConfig> = {
  free_trial: {
    id: 'free_trial',
    name: '14-Day Pilot',
    badge: 'Evaluation',
    tagline: 'Full trial access to evaluate proprietary off-market deal origination',
    priceMonthly: 0,
    priceAnnual: 0,
    seatsIncluded: 1,
    monthlyEnrichedLeads: 50,
    features: [
      { name: 'US 50-State Territory Radar', included: true },
      { name: 'AI Business Profile & Operations Dossier', included: true },
      { name: '4-Touch PE Search Cadence', included: true },
      { name: '1-Click Cold Email Launcher', included: true },
      { name: 'Direct Mail Physical Letter Generator', included: true },
      { name: 'LBO & Waterfall Modeling', included: false, note: 'Sponsor tier' },
      { name: 'Bidirectional CRM Sync', included: false, note: 'Sponsor tier' },
      { name: 'Cryptographic Audit Ledger', included: false, note: 'Enterprise tier' }
    ]
  },

  searcher: {
    id: 'searcher',
    name: 'Independent Searcher',
    badge: 'Solo Sponsor / Search Fund',
    tagline: 'Complete deal sourcing toolkit for single-operator acquisitions',
    priceMonthly: 599,
    priceAnnual: 5990,
    stripePriceIdMonthly: 'price_searcher_monthly',
    stripePriceIdAnnual: 'price_searcher_annual',
    seatsIncluded: 1,
    monthlyEnrichedLeads: 500,
    features: [
      { name: 'US 50-State Territory Radar & TSP Routing', included: true },
      { name: 'AI Business Profile & Operations Dossier', included: true },
      { name: 'All Multi-Touch Cadence Sequences', included: true },
      { name: '1-Click Cold Email (mailto:) & Direct Mail', included: true },
      { name: 'Digital Ghost & Permit Fatigue Detection', included: true },
      { name: 'Standard CSV / Pipeline Export', included: true },
      { name: 'LBO & Waterfall Modeling', included: false, note: 'Sponsor tier' },
      { name: 'CRM Webhook Integrations', included: false, note: 'Sponsor tier' }
    ]
  },

  sponsor: {
    id: 'sponsor',
    name: 'Growth PE Sponsor',
    badge: 'Most Popular for Funds',
    tagline: 'Institutional deal sourcing, underwriting, and team collaboration',
    priceMonthly: 2499,
    priceAnnual: 24000,
    stripePriceIdMonthly: 'price_sponsor_monthly',
    stripePriceIdAnnual: 'price_sponsor_annual',
    seatsIncluded: 5,
    monthlyEnrichedLeads: 3000,
    features: [
      { name: '5 Team Seats (Partner, Associate, Scout, Analyst)', included: true },
      { name: '3,000 Enriched Acquisition Leads / Month', included: true },
      { name: 'Real-Time State Registry Batch Ingestion', included: true },
      { name: 'Institutional LBO Returns & SDE Add-Back Engine', included: true },
      { name: 'LP Waterfall Modeler & 1-Page IC Memo Generator', included: true },
      { name: 'Non-Binding LOI Generator & Legal Drafts', included: true },
      { name: 'Bidirectional CRM Sync (HubSpot, Salesforce)', included: true },
      { name: 'White-Label Fund Branding & Custom Letterhead', included: true }
    ]
  },

  enterprise: {
    id: 'enterprise',
    name: 'Rollup Platform / Enterprise',
    badge: 'Corporate Rollup / M&A',
    tagline: 'Dedicated infrastructure, custom pipelines, and SOC 2 compliance',
    priceMonthly: 7500,
    priceAnnual: 75000,
    stripePriceIdMonthly: 'price_enterprise_monthly',
    stripePriceIdAnnual: 'price_enterprise_annual',
    seatsIncluded: 25,
    monthlyEnrichedLeads: 15000,
    features: [
      { name: 'Unlimited Team Seats across Regional Platforms', included: true },
      { name: '15,000+ Enriched Acquisition Leads / Month', included: true },
      { name: 'Dedicated BigQuery Warehouse & Dataform Pipelines', included: true },
      { name: 'Single-Tenant Data Isolation Option', included: true },
      { name: 'Cryptographic SHA-256 Audit Provenance Ledger', included: true },
      { name: 'Transactional Outbox & Dead-Letter Queue SLA', included: true },
      { name: 'SAML 2.0 / Okta / Azure AD SSO Integration', included: true },
      { name: '24/7 Dedicated Deal Desk Slack & 99.95% Uptime SLA', included: true }
    ]
  }
};

export const getPlanConfig = (tier: SubscriptionTier): SubscriptionPlanConfig => {
  return SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.searcher;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};
