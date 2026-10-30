// Single source of truth for all domain types.
// Imported everywhere as: import { X } from '../types' (resolves to this file).

// --- Auth & roles ---
export type StaffRole = 'enrolment' | 'fulfilment' | 'audit';
export type IntakeChannel = 'web' | 'sms' | 'ussd';
export type VerificationTier = 1 | 2 | 3 | 4;

// --- Requester ---
export interface RequesterToken {
  id: string;
  hashedToken: string;
  channel: IntakeChannel;
  createdAt: string;
}

export interface SwapRequest {
  id: string;
  tokenHash: string;
  bundleCategory: string;
  lockerLocation: string;
  status: 'reserved' | 'collected' | 'withdrawn';
  pin: string;
  qrPayload: string;
  timestamp: string;
}

export interface PoolRequest {
  id: string;
  tokenHash: string;
  category: 'utility' | 'school_fee' | 'hospital_invoice';
  hashedObjectId: string;
  amount: number;
  tier: VerificationTier;
  status: 'pending_check' | 'verified' | 'submitted_to_partner' | 'voucher_issued' | 'fulfilled' | 'withdrawn';
  timestamp: string;
}

// --- Donor ---
export interface Pledge {
  id: string;
  donorHash: string;
  type: 'goods' | 'service_credit';
  description: string;
  maxValue?: number;
  locality: string;
  status: 'awaiting_match' | 'matched' | 'settled';
  timestamp: string;
}

export interface Campaign {
  id: string;
  title: string;
  cohortGoalText: string;
  targetAmount: number;
  pooledAmount: number;
  targetCount: number;
  coveredCount: number;
  daysRemaining: number;
  isClosed?: boolean;
}

export interface DonorContribution {
  id: string;
  amount: number;
  isAnonymous: boolean;
  optInLedger: boolean;
  timestamp: string;
}

// --- Match ---
export interface MatchInterest {
  id: string;
  opportunityId: string;
  title: string;
  tokenHash: string;
  timestamp: string;
  status: 'pending' | 'contacted' | 'closed';
}

// --- Risk & audit ---
export interface RiskFlag {
  id: string;
  targetHash: string;
  severity: 'high' | 'elevated' | 'routine';
  title: string;
  description: string;
  status: 'pending' | 'routed_tier4' | 'cleared_false_positive';
  timestamp: string;
  investigationNotes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: StaffRole | 'system';
  action: string;
  targetHash: string;
}

export interface DedupItem {
  id: string;
  hashedObjectId: string;
  objectType: string;
  firstFundedBy: string;
  firstFundedDate: string;
  duplicateAttemptDate: string;
  status: 'blocked' | 'under_review' | 'cleared';
}

// --- Supply & depot ---
export interface LockerStock {
  location: string;
  bundleType: string;
  available: number;
  capacity: number;
  lowStockThreshold: number;
}

export interface DepotCounts {
  receivedUnits: number;
  qualityCheckedUnits: number;
  packedBundles: number;
  loadedLockerUnits: number;
}

// --- Vouchers ---
export interface Voucher {
  id: string;
  partnerName: string;
  partnerType: 'retailer' | 'hospital';
  description: string;
  maxValue: number;
  status: 'active' | 'redeemed' | 'expired';
  issuedToken: string;
  pin: string;
  expiresAt: string;
}

export interface VoucherRedemption {
  id: string;
  voucherId: string;
  pin: string;
  amount: number;
  partnerName: string;
  timestamp: string;
  status: 'success' | 'invalid' | 'expired' | 'already_redeemed' | 'exceeds_value';
}

// --- Staff ---
export interface StaffSession {
  role: StaffRole;
  id: string;
  loggedInAt: string;
}