export type IntakeChannel = 'web' | 'sms' | 'ussd';
export type VerificationTier = 1 | 2 | 3 | 4;

export interface RequesterToken { id: string; hashedToken: string; channel: IntakeChannel; createdAt: string; }

export interface SwapRequest {
  id: string; tokenHash: string; bundleCategory: string; lockerLocation: string;
  status: 'reserved' | 'collected'; pin: string; qrPayload: string; timestamp: string;
}

export interface PoolRequest {
  id: string; tokenHash: string; category: 'utility' | 'school_fee' | 'hospital_invoice';
  hashedObjectId: string; amount: number; tier: VerificationTier;
  status: 'pending_check' | 'verified' | 'submitted_to_partner' | 'fulfilled'; timestamp: string;
}

export interface Pledge {
  id: string; donorHash: string; type: 'goods' | 'service_credit'; description: string;
  maxValue?: number; locality: string;
  status: 'awaiting_match' | 'matched' | 'settled'; timestamp: string;
}

export interface Campaign {
  id: string; title: string; cohortGoalText: string; targetAmount: number;
  pooledAmount: number; targetCount: number; coveredCount: number; daysRemaining: number;
}

export interface RiskFlag {
  id: string; targetHash: string; severity: 'high' | 'elevated' | 'routine';
  title: string; description: string;
  status: 'pending' | 'routed_tier4' | 'cleared_false_positive';
  timestamp: string; investigationNotes?: string;
}

export interface AuditLogEntry {
  id: string; timestamp: string; actorRole: 'enrolment' | 'fulfilment' | 'audit';
  action: string; targetHash: string;
}

export interface DedupItem {
  id: string; hashedObjectId: string; objectType: string;
  firstFundedBy: string; firstFundedDate: string; duplicateAttemptDate: string;
  status: 'blocked' | 'under_review' | 'cleared';
}

export interface LockerStock {
  location: string; bundleType: string; available: number;
  capacity: number; lowStockThreshold: number;
}

export interface DepotCounts {
  receivedUnits: number; qualityCheckedUnits: number; packedBundles: number; loadedLockerUnits: number;
}

export interface DonorContribution {
  id: string; amount: number; isAnonymous: boolean; optInLedger: boolean; timestamp: string;
}
