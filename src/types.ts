export type UserRole = 'admin' | 'partner' | 'associate' | 'analyst';

export type DealStage = 
  | 'INGESTED'
  | 'ENRICHED'
  | 'SCORED'
  | 'UNDERWRITTEN'
  | 'IC_GENERATED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'OUTREACH_TRIGGERED'
  | 'CRM_SYNCED'
  | 'FAILED'
  | 'PAUSED';

// Legacy alias compatibility
export type LeadStatus = 'new' | 'analyzing' | 'qualified' | 'outreach_triggered' | 'in_loi' | 'under_contract' | 'archived' | DealStage;

export type DealSourceChannel = 
  | 'OFF_MARKET_SCOUT' 
  | 'ON_MARKET_LISTING' 
  | 'INBOUND_INTEREST';

export interface ListingDetails {
  sourcePlatform: 'BizBuySell' | 'Axial' | 'BusinessesForSale' | 'Transworld' | 'Sunbelt' | 'Crexi' | 'LoopNet' | 'MarcusMillichap' | 'SVN' | 'DirectBroker' | 'Other';
  listingId?: string;
  listingUrl?: string;
  askingPrice?: number;
  cashFlowOrSde?: number;
  daysOnMarket?: number;
  priceDropPct?: number; // e.g. 15 for 15% price cut
  isBlindTeaser?: boolean;
  brokerName?: string;
  brokerFirm?: string;
  brokerEmail?: string;
  matchedEntityId?: string;
  matchConfidence?: number; // 0-100% confidence matching blind listing to registered entity
  teaserSummary?: string;
  // Real Estate & Property Management Specific Metrics
  doorsUnderManagement?: number;
  unitsCount?: number;
  occupancyRatePct?: number;
  inPlaceNoi?: number;
  capRatePct?: number;
}

export interface InboundInterestDetails {
  submissionChannel: 'VALUATION_PORTAL' | 'BROKER_SUBMISSION' | 'INTERMEDIARY_REFERRAL' | 'DIRECT_EMAIL';
  founderName: string;
  founderEmail: string;
  founderPhone?: string;
  targetTimeline: 'IMMEDIATE_0_3M' | 'SHORT_3_6M' | 'MEDIUM_6_12M' | 'EXPLORING';
  saleReason: 'RETIREMENT' | 'BURNOUT_HEALTH' | 'PARTNERSHIP_SPLIT' | 'GROWTH_RECAP' | 'OTHER';
  sellerExpectedValuation?: number;
  urgencyScore: number; // 1-10
  notes?: string;
}

export interface FundDeploymentConfig {
  fundId: string;
  fundName: string;
  configVersion: number;
  updatedAt: string;
  
  financialThresholds: {
    minRevenue: number;
    minEbitda: number;
    minProfitMargin: number;
    maxPermitDropPct: number;
  };
  
  underwritingAssumptions: {
    defaultSeniorDebtLtv: number;
    interestRatePct: number;
    defaultHoldYears: number;
    minDscrThreshold: number;
  };
  
  scoringWeights: {
    permitDropWeight: number;
    marginWeight: number;
    entityAgeWeight: number;
    digitalPostWeight: number;
  };
  
  integrations: {
    outreachProvider: 'sendgrid' | 'smartlead' | 'mock';
    crmProvider: 'hubspot' | 'salesforce' | 'mock';
    aiModel: 'gemini-2.5-flash' | 'gemini-1.5-pro';
  };
  
  approvalPolicy: {
    requirePartnerLOIApproval: boolean;
    requireICMemoValidation: boolean;
  };
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
}

export interface DealComment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  timestamp: string;
}

export interface BusinessProfile {
  streetAddress?: string;
  suite?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  ownerTitle?: string;
  employeeCount?: number;
  yearEstablished?: number;
  entityType?: 'LLC' | 'S-Corp' | 'C-Corp' | 'Partnership' | 'Sole Proprietorship' | string;
  coreServices?: string[];
  facilitySqFt?: number;
  fleetSize?: number;
  unitCount?: number; // For property management & multifamily
  occupancyRate?: number; // e.g. 94.5%
  googleRating?: number; // e.g. 4.7
  totalReviews?: number; // e.g. 88
  licenseNumber?: string; // e.g. State Certified Mechanical / Electrical Contractor #
  bbbRating?: string; // e.g. 'A+'
  businessDescription?: string;
}

export interface Lead {
  id: string;
  fundId: string; // Multi-Tenant Scoping Key
  name: string;
  industry: string;
  location: string;
  registrationDate: string;
  agentName: string;
  isCorporateAgent: boolean;
  permitVolume2023_2025: number;
  permitVolume2026: number;
  permitDrop: number;
  lastDigitalPostDate: string;
  reviewVelocity: number;
  exitPropensityScore: number;
  aiThesis: string;
  valuationEstimate: number;
  suggestedSubjectLines?: string[];
  status: LeadStatus;
  
  // Explicit Durable FSM States
  currentState?: DealStage;
  previousState?: DealStage | null;
  stateVersion?: number;
  isPaused?: boolean;
  
  // Business Specific Profile & Contact Details
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  businessProfile?: BusinessProfile;
  aiStrengths?: string[];
  aiWeaknesses?: string[];

  revenue?: number;
  ebitda?: number;
  profitMargin?: number;
  archiveReason?: string;
  archiveNotes?: string;
  loiApprovalStatus?: 'pending_approval' | 'approved' | 'rejected';
  loiApprovedBy?: string;
  loiApprovedAt?: string;
  activityLogs?: ActivityLog[];
  comments?: DealComment[];
  thesisFeedback?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
  tags?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  permitAnalysis?: string;
  
  // Multi-Channel Deal Flow & Ingestion Metadata
  dealSourceChannel?: DealSourceChannel;
  listingDetails?: ListingDetails;
  inboundInterestDetails?: InboundInterestDetails;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface UserProfile {
  uid: string;
  fundId: string; // Multi-Tenant Scoping Key
  email: string;
  displayName: string;
  role: UserRole;
  systemPrompt?: string;
  industryMultiples?: Record<string, number>;
  valuationParameters?: {
    defaultProfitMargin?: number;
    revenueTiers?: {
      min: number;
      max: number;
      multiplier: number;
    }[];
    profitMarginTiers?: {
      min: number;
      max: number;
      multiplier: number;
    }[];
    locationMultipliers?: Record<string, number>;
    ageMultipliers?: {
      minYears: number;
      multiplier: number;
    }[];
    customValuationRules?: string[];
  };
}
