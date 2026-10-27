export type Surface = 'requester' | 'donor' | 'console' | 'partner' | 'architecture' | 'phase2';

export type RequesterScreen = 
  | 'welcome' 
  | 'channel' 
  | 'verification' 
  | 'home' 
  | 'swap' 
  | 'pool' 
  | 'detail' 
  | 'rate_limit_demo'
  | 'error_demo'
  | 'data_rights'
  | 'duplicate_demo'
  | 'messaging_unavailable_demo';

export type RequesterChannel = 'web' | 'ussd' | 'sms';

export type ConsoleRole = 'enrolment' | 'fulfilment' | 'audit';

export type BundleCategory = 'pantry' | 'hygiene' | 'family' | 'student';

export interface BundleItem {
  id: string;
  name: string;
  category: BundleCategory;
  description: string;
  items: string[];
  lockerLocation: string; // Coarse: "Westlands", "Kasarani", "Embakasi", "CBD"
  availableCount: number;
  weightApprox: string;
}

export type PoolCategory = 'utility' | 'school' | 'hospital';

export interface PoolRequestInput {
  category: PoolCategory;
  subType: string; // e.g. "KPLC Prepaid", "Nairobi Water", "Secondary Term Fees", "County Hospital Bill"
  objectId: string; // Meter number, Admission number, or Invoice number
  amount: number;
  uploadedBillName?: string;
}

export type RequestStatus = 'submitted' | 'verified' | 'fulfilled' | 'review';

export interface NetworkRequest {
  id: string;
  type?: 'swap' | 'pool';
  category?: string; // e.g. "swap", "utility", "school", "hospital"
  categoryTitle: string; // e.g. "Pantry Basics", "KPLC Electricity", "Term 1 School Fees", "Hospital Invoice"
  amount: number;
  coarseLocation: string; // "Westlands", "Kasarani", "Embakasi", "CBD", "Dagoretti"
  status: RequestStatus;
  timestamp: string;
  objectIdMasked: string; // User-facing only e.g. "Meter: 8421***41", "Invoice #48213", "Locker Box 04"
  hashedObjectId?: string; // Staff-facing ONLY: short keyed-hash fragment e.g. "obj #8f4c…"
  verificationTier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | number | string;
  fulfillmentDetails?: string;
  pinCode?: string; // For swap bundles only, shown to requester
  qrCodeString?: string;
}

export type ResourceRequest = NetworkRequest;

export interface RiskFlag {
  id: string;
  flagType: 'device_cluster' | 'timing_anomaly' | 'threshold_proximity';
  title: string;
  description: string;
  severity: 'moderate' | 'elevated' | 'high';
  category: string;
  amount: number;
  coarseLocation: string;
  timestamp: string;
  status: 'pending' | 'routed_tier4' | 'cleared_false_positive';
  investigationNotes?: string;
  hashedTargetId: string; // Staff view only: "obj #8f4c…"
}

export interface DeduplicationItem {
  id: string;
  hashedObjectId: string; // truncated hash, e.g. "8f4c...91a2"
  objectType: string;
  firstFundedBy: string;
  firstFundedDate: string;
  duplicateAttemptDate: string;
  status: 'flagged_external_funder' | 'internal_repeat_suppressed' | 'already_cleared' | 'blocked_in_review' | string;
}

export interface AuditLogEntry {
  id: string;
  actorRole: ConsoleRole | 'system';
  action: string;
  targetHash?: string; // Truncated hash fragment only: e.g. "obj #8f4c…"
  targetRef?: string;
  timestamp: string;
  justification?: string;
}

export interface CampaignData {
  id: string;
  title: string;
  cohortGoalText: string;
  targetAmount: number;
  pooledAmount: number;
  targetCount: number;
  coveredCount: number;
  daysRemaining: number;
  recentGiftsCountToday: number;
  recentPooledAmountToday: number;
}

export interface PartnerMonthlyStatement {
  month: string;
  voucherCount: number;
  totalValueKes: number;
  reimbursementStatus: 'Pending' | 'Approved' | 'Paid';
  institutionCategory: string; // "Locker Network Provider", "Participating Pharmacy", etc.
}

export interface DepotStageCount {
  receivedUnits: number;
  qualityCheckedUnits: number;
  packedBundles: number;
  loadedLockerUnits: number;
}

export interface LockerLocationStock {
  location: string;
  bundleType: string;
  available: number;
  capacity: number;
  lowStockThreshold: number;
}

export type PartnerStatement = PartnerMonthlyStatement;

export interface ArchitectureAssumption {
  id: string | number;
  component: string;
  hypothesis?: string;
  assumption?: string;
  risk?: string;
  mitigation?: string;
  status: string;
  detail?: string;
}

