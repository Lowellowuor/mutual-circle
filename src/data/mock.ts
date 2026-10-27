import { 
  BundleItem, 
  ResourceRequest, 
  RiskFlag, 
  DeduplicationItem, 
  AuditLogEntry, 
  PartnerStatement, 
  DepotStageCount, 
  LockerLocationStock, 
  ArchitectureAssumption 
} from '../types';

export const BUNDLES: BundleItem[] = [
  {
    id: 'bundle-pantry',
    name: 'Pantry Basics',
    category: 'pantry',
    description: 'Essential staple grains, cooking oil, and pulses.',
    items: ['Maize flour 2kg', 'Rice 2kg', 'Cooking oil 1L', 'Dried beans 1kg', 'Iodised table salt 500g'],
    lockerLocation: 'Westlands Locker Hub',
    availableCount: 14,
    weightApprox: '6.5 kg'
  },
  {
    id: 'bundle-hygiene',
    name: 'Hygiene Essentials',
    category: 'hygiene',
    description: 'Sanitation bars, laundry soap, and dental care.',
    items: ['Antiseptic bar soap (4x)', 'Laundry bar 800g', 'Toothpaste & 2 brushes', 'Sanitary pads (2 packs)'],
    lockerLocation: 'Kasarani Station Locker',
    availableCount: 6,
    weightApprox: '2.8 kg'
  },
  {
    id: 'bundle-student',
    name: 'Student Supplies',
    category: 'student',
    description: 'Exercise books, writing instruments, and geometric set.',
    items: ['Exercise books A4 (6x)', 'Pen multipack (blue/black)', 'Mathematical set', 'Pencil & sharpener set'],
    lockerLocation: 'CBD Locker Exchange',
    availableCount: 4,
    weightApprox: '1.9 kg'
  },
  {
    id: 'bundle-family',
    name: 'Family Fortified Package',
    category: 'family',
    description: 'High-yield porridge flour, fortified nutrient flour, and staples.',
    items: ['Nutrient porridge flour 2kg', 'Wheat flour 2kg', 'Green grams 1kg', 'Cooking fat 500g'],
    lockerLocation: 'Westlands Locker Hub',
    availableCount: 8,
    weightApprox: '5.5 kg'
  }
];

export const INITIAL_REQUESTS: ResourceRequest[] = [
  {
    id: 'REQ-SWAP-4102',
    category: 'swap',
    categoryTitle: 'Pantry Basics',
    amount: 1450,
    timestamp: 'Today, 08:14',
    status: 'fulfilled',
    coarseLocation: 'Westlands',
    pinCode: '8341',
    qrCodeString: 'MTC-LK-WST-8341-BOX14',
    objectIdMasked: 'Locker Box 14',
    verificationTier: 1,
    fulfillmentDetails: 'Collected at Westlands Locker Hub'
  },
  {
    id: 'REQ-POOL-8819',
    category: 'pool',
    categoryTitle: 'KPLC Prepaid Electricity',
    amount: 1500,
    timestamp: 'Yesterday, 16:30',
    status: 'fulfilled',
    coarseLocation: 'Embakasi',
    objectIdMasked: 'Meter #•••• 9182',
    verificationTier: 2,
    fulfillmentDetails: 'Submitted to payment partner (KPLC token settled directly)'
  },
  {
    id: 'REQ-POOL-9014',
    category: 'pool',
    categoryTitle: 'Secondary School Term Fees',
    amount: 6500,
    timestamp: '24 Oct 2026',
    status: 'verified',
    coarseLocation: 'Kasarani',
    objectIdMasked: 'Adm #•••• 410',
    verificationTier: 3,
    fulfillmentDetails: 'Submitted to payment partner for school account'
  }
];

export const INITIAL_RISK_FLAGS: RiskFlag[] = [
  {
    id: 'FLG-108',
    flagType: 'device_cluster',
    title: 'Device & Location Clustering',
    description: '4 reservation attempts received within 90 seconds from identical cellular gateway IP.',
    severity: 'elevated',
    category: 'Hygiene Essentials',
    amount: 4400,
    coarseLocation: 'Kasarani',
    timestamp: 'Today, 08:04',
    status: 'pending',
    hashedTargetId: 'obj #4491…',
    investigationNotes: 'May indicate shared WiFi router in compound.'
  },
  {
    id: 'FLG-109',
    flagType: 'threshold_proximity',
    title: 'Amounts Just Under Thresholds',
    description: 'Submitted pool request of KES 4,950 is within 1% of automated photo verification threshold.',
    severity: 'moderate',
    category: 'KPLC Electricity',
    amount: 4950,
    coarseLocation: 'Embakasi',
    timestamp: 'Today, 07:11',
    status: 'pending',
    hashedTargetId: 'obj #8f4c…',
    investigationNotes: 'Single KPLC meter submitted with token volume just below automated document cross-check.'
  },
  {
    id: 'FLG-105',
    flagType: 'timing_anomaly',
    title: 'Request-Timing Anomalies',
    description: '12 simultaneous locker reservations between 02:45 and 03:00 AM outside standard hours.',
    severity: 'high',
    category: 'Pantry Basics',
    amount: 18400,
    coarseLocation: 'CBD',
    timestamp: 'Yesterday, 02:50',
    status: 'routed_tier4',
    hashedTargetId: 'obj #c09a…',
    investigationNotes: 'Escalated to Tier 4 review panel for temporal audit.'
  }
];

export const INITIAL_DEDUPLICATION_ITEMS: DeduplicationItem[] = [
  {
    id: 'DEDUP-01',
    hashedObjectId: '8f4c...91a2',
    objectType: 'KPLC Meter (Hashed)',
    firstFundedBy: 'The Mutual Circle Pool A',
    firstFundedDate: '18 Oct 2026',
    duplicateAttemptDate: 'Today, 09:12',
    status: 'already_cleared'
  },
  {
    id: 'DEDUP-02',
    hashedObjectId: '3b11...fa09',
    objectType: 'Nairobi Water (Hashed)',
    firstFundedBy: 'Collaborating Civil Pool',
    firstFundedDate: '21 Oct 2026',
    duplicateAttemptDate: 'Today, 07:45',
    status: 'blocked_in_review'
  }
];

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'AUD-8812',
    timestamp: 'Today, 11:42 EAT',
    actorRole: 'fulfilment',
    action: 'Queue batch: 14 utility payments dispatched',
    targetRef: 'obj #d4a1…',
    justification: 'Automated batch release to payment partner'
  },
  {
    id: 'AUD-8811',
    timestamp: 'Today, 10:15 EAT',
    actorRole: 'audit',
    action: 'Clear flag: FLG-104 marked false positive',
    targetRef: 'obj #7a3e…',
    justification: 'Shared meter confirmed via historical billing cadence'
  },
  {
    id: 'AUD-8810',
    timestamp: 'Today, 09:00 EAT',
    actorRole: 'audit',
    action: 'Escalate to Tier 4: investigation opened',
    targetRef: 'obj #b2f1…',
    justification: 'Velocity anomaly exceeded 3-sigma standard deviation'
  },
  {
    id: 'AUD-8809',
    timestamp: 'Today, 08:30 EAT',
    actorRole: 'fulfilment',
    action: 'Locker restock allocation authorized',
    targetRef: 'obj #5c89…',
    justification: 'Morning replenishment batch for Westlands Locker Hub'
  },
  {
    id: 'AUD-8808',
    timestamp: 'Today, 07:15 EAT',
    actorRole: 'enrolment',
    action: 'Enrolment: intake velocity monitored',
    targetRef: 'obj #9e03…',
    justification: 'Hourly intake rate normal across Web, SMS and USSD'
  },
  {
    id: 'AUD-8807',
    timestamp: 'Yesterday, 22:10 EAT',
    actorRole: 'audit',
    action: 'Deduplication match verified: duplicate prevented',
    targetRef: 'obj #650d…',
    justification: 'Meter cleared institutional query'
  }
];

export const DEPOT_STAGE_COUNTS: DepotStageCount = {
  receivedUnits: 480,
  qualityCheckedUnits: 465,
  packedBundles: 420,
  loadedLockerUnits: 392
};

export const LOCKER_LOCATION_STOCKS: LockerLocationStock[] = [
  {
    location: 'Westlands Locker Hub',
    bundleType: 'Pantry Basics',
    available: 14,
    capacity: 24,
    lowStockThreshold: 5
  },
  {
    location: 'Kasarani Station Locker',
    bundleType: 'Hygiene Essentials',
    available: 6,
    capacity: 30,
    lowStockThreshold: 8
  },
  {
    location: 'CBD Locker Exchange',
    bundleType: 'Student Supplies',
    available: 4,
    capacity: 20,
    lowStockThreshold: 5
  }
];

export const PARTNER_STATEMENTS: PartnerStatement[] = [
  {
    month: 'October 2026',
    voucherCount: 184,
    totalValueKes: 276000,
    reimbursementStatus: 'Approved',
    institutionCategory: 'Locker Network Provider'
  },
  {
    month: 'September 2026',
    voucherCount: 212,
    totalValueKes: 318000,
    reimbursementStatus: 'Paid',
    institutionCategory: 'Locker Network Provider'
  },
  {
    month: 'August 2026',
    voucherCount: 175,
    totalValueKes: 263250,
    reimbursementStatus: 'Paid',
    institutionCategory: 'Locker Network Provider'
  }
];

export const TOKENS_PER_DAY_HISTORY = [
  { day: 'Mon (20 Oct)', tokensCreated: 342, webCount: 185, smsCount: 106, ussdCount: 51, rateLimits: 28 },
  { day: 'Tue (21 Oct)', tokensCreated: 368, webCount: 198, smsCount: 114, ussdCount: 56, rateLimits: 34 },
  { day: 'Wed (22 Oct)', tokensCreated: 395, webCount: 213, smsCount: 122, ussdCount: 60, rateLimits: 41 },
  { day: 'Thu (23 Oct)', tokensCreated: 410, webCount: 221, smsCount: 127, ussdCount: 62, rateLimits: 39 },
  { day: 'Fri (24 Oct)', tokensCreated: 432, webCount: 233, smsCount: 134, ussdCount: 65, rateLimits: 45 },
  { day: 'Sat (25 Oct)', tokensCreated: 356, webCount: 192, smsCount: 110, ussdCount: 54, rateLimits: 31 },
  { day: 'Sun (26 Oct)', tokensCreated: 384, webCount: 207, smsCount: 119, ussdCount: 58, rateLimits: 42 }
];

export const ASSUMPTIONS: ArchitectureAssumption[] = [
  {
    id: 'asm-1',
    component: 'Smart Locker reservation/PIN APIs',
    hypothesis: 'Pre-existing commercial parcel locker networks in Nairobi offer multi-tenant capacity booking via webhook.',
    risk: 'Moderate',
    mitigation: 'Simulated API wrapper; fallbacks to partner till redemption.',
    status: 'Simulated'
  },
  {
    id: 'asm-2',
    component: 'Safaricom institution-payment product (unconfirmed)',
    hypothesis: 'Direct B2B utility Paybill API clears accounts without routing money through individual consumer wallets.',
    risk: 'High',
    mitigation: 'Submitted to payment partner; LumiereCore accounts hold no funds.',
    status: 'Unconfirmed'
  },
  {
    id: 'asm-3',
    component: 'Automated Tier 2 institutional meter lookup',
    hypothesis: 'KPLC and NCWSC provide balance-query endpoints for validation before funds move.',
    risk: 'High',
    mitigation: 'Three automated checks; fallback to Tier 3 document check.',
    status: 'Simulated'
  },
  {
    id: 'asm-4',
    component: 'Gift-card provider (carries Kenyan merchants? unconfirmed)',
    hypothesis: 'Supermarket and pharmacy digital vouchers can be redeemed without customer registration.',
    risk: 'Moderate',
    mitigation: 'Direct merchant terminal redemption using camera QR scan.',
    status: 'Unconfirmed'
  },
  {
    id: 'asm-5',
    component: 'Ledger technology (open decision: blockchain vs append-only database with external audit)',
    hypothesis: 'A tamper-evident ledger provides verifiable deduplication without compromising anonymity.',
    risk: 'Moderate',
    mitigation: 'Evaluating append-only cryptographic log with auditor attestation vs permissioned ledger.',
    status: 'Open decision'
  },
  {
    id: 'asm-6',
    component: 'Reaching the phone (open design decision: phone number held in separate encrypted store)',
    hypothesis: 'Gateways deliver PINs while isolating phone numbers in an encrypted store accessible only to automated services.',
    risk: 'Moderate',
    mitigation: 'HSM enclave or blind telecommunications routing agreement.',
    status: 'Open decision'
  },
  {
    id: 'asm-7',
    component: 'Kenya Data Protection Act (KDPA) 2019 review',
    hypothesis: 'Because no names or medical details are gathered, the system operates as an anonymous processor under KDPA.',
    risk: 'Moderate',
    mitigation: 'Formal Data Protection Impact Assessment with ODPC.',
    status: 'Not yet reviewed'
  },
  {
    id: 'asm-8',
    component: 'Anti-Money Laundering (AML) reporting requirements (POCAMLA)',
    hypothesis: 'Direct institution settlement relieves network from cash-holding KYC, but shortcode holder carries POCAMLA duties.',
    risk: 'High',
    mitigation: 'Disbursing exclusively to registered schools and utilities. Record requirements to be confirmed with counsel.',
    status: 'To confirm with counsel'
  },
  {
    id: 'asm-9',
    component: 'Produce-Depot aggregation network',
    hypothesis: 'Agricultural and wholesale dry-goods suppliers can deliver packaged bundles directly into locker hubs.',
    risk: 'Low',
    mitigation: 'Buffer inventory held at Nairobi depot; batch fulfillment model.',
    status: 'Simulated'
  }
];
