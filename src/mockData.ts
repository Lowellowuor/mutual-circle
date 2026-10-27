import { 
  BundleItem, 
  NetworkRequest, 
  RiskFlag, 
  DeduplicationItem, 
  AuditLogEntry, 
  CampaignData, 
  PartnerMonthlyStatement, 
  DepotStageCount, 
  LockerLocationStock 
} from './types';

export const INITIAL_BUNDLES: BundleItem[] = [
  {
    id: 'bnd-01',
    name: 'Pantry Basics',
    category: 'pantry',
    description: 'Dry food essentials sealed in dry-store standard package.',
    items: ['Maize flour (Ungwa) 2kg', 'Long grain rice 2kg', 'Vegetable cooking oil 1L', 'Dried yellow beans 1kg', 'Iodised table salt 500g'],
    lockerLocation: 'Westlands Locker Hub',
    availableCount: 14,
    weightApprox: '6.5 kg'
  },
  {
    id: 'bnd-02',
    name: 'Hygiene Essentials',
    category: 'hygiene',
    description: 'Personal and household hygiene essentials for 3–4 weeks.',
    items: ['Multi-purpose laundry bar 1kg', 'Bathing soap (2 bars)', 'Fluoride toothpaste & 2 brushes', 'Sanitary towel pads (2 packs)', 'Surface disinfectant 500ml'],
    lockerLocation: 'Kasarani Station Locker',
    availableCount: 19,
    weightApprox: '3.2 kg'
  },
  {
    id: 'bnd-03',
    name: 'Family Staples',
    category: 'family',
    description: 'Fortified meal provisions for larger household sharing.',
    items: ['Maize flour 4kg', 'Wheat flour 2kg', 'Cane sugar 1kg', 'Kenyan black tea leaves 250g', 'Green grams (Ndengu) 1.5kg', 'Fortified cooking fat 500g'],
    lockerLocation: 'Embakasi Central Hub',
    availableCount: 3, // Low stock for warning demonstration
    weightApprox: '10.2 kg'
  },
  {
    id: 'bnd-04',
    name: 'Student Study Kit',
    category: 'student',
    description: 'Essential school materials and solar study lighting.',
    items: ['Ruled exercise books (A4, pack of 6)', 'Blue & black ballpoint pens (pack of 4)', 'Mathematical instrument set', 'Rechargeable solar study lamp', 'Bar soap (1 bar)'],
    lockerLocation: 'CBD Locker Exchange',
    availableCount: 22,
    weightApprox: '2.8 kg'
  }
];

export const INITIAL_REQUESTS: NetworkRequest[] = [
  {
    id: 'REQ-SWAP-4102',
    type: 'swap',
    categoryTitle: 'Pantry Basics Bundle',
    amount: 1450,
    coarseLocation: 'Westlands',
    status: 'fulfilled',
    timestamp: 'Today, 08:15',
    objectIdMasked: 'Locker Box 14',
    hashedObjectId: 'obj #8f4c…',
    verificationTier: 'Tier 1',
    fulfillmentDetails: 'Collected at Westlands Hub Locker',
    pinCode: '8341'
  },
  {
    id: 'REQ-POOL-9812',
    type: 'pool',
    categoryTitle: 'KPLC Electricity Meter',
    amount: 2200,
    coarseLocation: 'Kasarani',
    status: 'fulfilled',
    timestamp: 'Today, 07:42',
    objectIdMasked: 'Meter: 8421***19',
    hashedObjectId: 'obj #3b11…',
    verificationTier: 'Tier 2',
    fulfillmentDetails: 'Submitted to payment partner (Safaricom institution-payment product, unconfirmed)'
  },
  {
    id: 'REQ-POOL-9819',
    type: 'pool',
    categoryTitle: 'Secondary Term Fees',
    amount: 6500,
    coarseLocation: 'Embakasi',
    status: 'verified',
    timestamp: 'Today, 06:20',
    objectIdMasked: 'Adm: SCH-9024',
    hashedObjectId: 'obj #c09a…',
    verificationTier: 'Tier 3',
    fulfillmentDetails: 'Submitted to payment partner queue'
  },
  {
    id: 'REQ-SWAP-4109',
    type: 'swap',
    categoryTitle: 'Hygiene Essentials',
    amount: 1100,
    coarseLocation: 'CBD',
    status: 'submitted',
    timestamp: 'Yesterday, 19:10',
    objectIdMasked: 'Locker Box 08',
    hashedObjectId: 'obj #71de…',
    verificationTier: 'Tier 1',
    fulfillmentDetails: 'PIN generated and delivered via simulated SMS',
    pinCode: '5920'
  },
  {
    id: 'REQ-POOL-9804',
    type: 'pool',
    categoryTitle: 'Hospital Invoice',
    amount: 3800,
    coarseLocation: 'Dagoretti',
    status: 'fulfilled',
    timestamp: '24 Oct 2026, 14:30',
    objectIdMasked: 'Invoice #48213',
    hashedObjectId: 'obj #2ea4…',
    verificationTier: 'Tier 2',
    fulfillmentDetails: 'Submitted to payment partner for Nairobi West facility account'
  }
];

export const INITIAL_RISK_FLAGS: RiskFlag[] = [
  {
    id: 'FLG-108',
    flagType: 'device_cluster',
    title: 'Cell-Tower & Subnet Clustering',
    description: '4 reservation attempts received within 90 seconds from identical cellular gateway IP in Kasarani.',
    severity: 'elevated',
    category: 'Hygiene Essentials',
    amount: 4400,
    coarseLocation: 'Kasarani',
    timestamp: 'Today, 08:04',
    status: 'pending',
    hashedTargetId: 'obj #4491…',
    investigationNotes: 'May indicate a shared router in shared-meter households (e.g. multi-family compounds) or automated script.'
  },
  {
    id: 'FLG-109',
    flagType: 'threshold_proximity',
    title: 'Amount Just Under Verification Threshold',
    description: 'Submitted pool request of KES 4,950 is within 1% of the Tier 3 automated photo verification threshold (KES 5,000).',
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
    title: 'Off-Peak Volume Burst',
    description: '12 simultaneous locker reservations between 02:45 and 03:00 AM outside standard Nairobi movement hours.',
    severity: 'high',
    category: 'Family Staples',
    amount: 18400,
    coarseLocation: 'CBD',
    timestamp: 'Yesterday, 02:50',
    status: 'routed_tier4',
    hashedTargetId: 'obj #c09a…',
    investigationNotes: 'Escalated to Tier 4 independent review panel for temporal audit.'
  }
];

export const INITIAL_DEDUPLICATION_ITEMS: DeduplicationItem[] = [
  {
    id: 'DEDUP-01',
    hashedObjectId: '8f4c...91a2',
    objectType: 'KPLC Meter (Hashed)',
    firstFundedBy: 'County Emergency Energy Pool',
    firstFundedDate: '21 Oct 2026',
    duplicateAttemptDate: 'Today, 06:14',
    status: 'flagged_external_funder'
  },
  {
    id: 'DEDUP-02',
    hashedObjectId: '3b11...e7f0',
    objectType: 'Secondary School Admission (Hashed)',
    firstFundedBy: 'The Mutual Circle Pool',
    firstFundedDate: '15 Oct 2026',
    duplicateAttemptDate: 'Yesterday, 16:30',
    status: 'internal_repeat_suppressed'
  }
];

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'LOG-315',
    actorRole: 'fulfilment',
    action: 'Fulfilment: submitted request to payment partner',
    targetHash: 'obj #8f4c…',
    timestamp: 'Today, 08:45',
    justification: 'Automated Tier 2 institutional verification complete'
  },
  {
    id: 'LOG-314',
    actorRole: 'audit',
    action: 'Audit: routed flag to Tier 4',
    targetHash: 'obj #c09a…',
    timestamp: 'Today, 08:35',
    justification: 'Off-peak volume burst requiring second-line review'
  },
  {
    id: 'LOG-313',
    actorRole: 'enrolment',
    action: 'Enrolment: token rate-limit window refreshed',
    targetHash: 'obj #d4a1…',
    timestamp: 'Today, 08:30',
    justification: 'Weekly rolling quota reset cycle'
  },
  {
    id: 'LOG-312',
    actorRole: 'fulfilment',
    action: 'Fulfilment: submitted request to payment partner',
    targetHash: 'obj #3b11…',
    timestamp: 'Today, 08:14',
    justification: 'KPLC token cleared institutional query'
  },
  {
    id: 'LOG-311',
    actorRole: 'audit',
    action: 'Audit: cleared flag as false positive (shared-meter compound)',
    targetHash: 'obj #71de…',
    timestamp: 'Today, 08:02',
    justification: 'Shared-meter multi-family compound verified'
  },
  {
    id: 'LOG-310',
    actorRole: 'audit',
    action: 'Audit: initiated false-positive review',
    targetHash: 'obj #4491…',
    timestamp: 'Today, 07:58',
    justification: 'Assessing cell-tower clustering flag'
  },
  {
    id: 'LOG-309',
    actorRole: 'fulfilment',
    action: 'Fulfilment: submitted batch to payment partner',
    targetHash: 'obj #1842…',
    timestamp: 'Today, 07:45',
    justification: 'Morning institutional settlement batch'
  },
  {
    id: 'LOG-308',
    actorRole: 'fulfilment',
    action: 'Fulfilment: automated Tier 2 check confirmed',
    targetHash: 'obj #9812…',
    timestamp: 'Today, 07:42',
    justification: 'Water utility account verified unpaid'
  },
  {
    id: 'LOG-307',
    actorRole: 'audit',
    action: 'Audit: cross-funder deduplication hit suppressed',
    targetHash: 'obj #8f4c…',
    timestamp: 'Today, 07:15',
    justification: 'Duplicate detected from external emergency fund'
  },
  {
    id: 'LOG-306',
    actorRole: 'enrolment',
    action: 'Enrolment: rate-limit quota check executed',
    targetHash: 'obj #2ea4…',
    timestamp: 'Today, 07:05',
    justification: 'Within 7-day rolling window quota'
  },
  {
    id: 'LOG-305',
    actorRole: 'fulfilment',
    action: 'Fulfilment: locker allocation verified',
    targetHash: 'obj #7a3e…',
    timestamp: 'Today, 06:50',
    justification: 'Westlands capacity confirmed'
  },
  {
    id: 'LOG-304',
    actorRole: 'audit',
    action: 'Audit: sampled 5% random audit batch',
    targetHash: 'obj #b2f1…',
    timestamp: 'Today, 06:30',
    justification: 'Periodic statistical sanity sample'
  },
  {
    id: 'LOG-303',
    actorRole: 'fulfilment',
    action: 'Fulfilment: submitted request to payment partner',
    targetHash: 'obj #5c89…',
    timestamp: 'Today, 06:20',
    justification: 'Direct hospital invoice credit cleared'
  },
  {
    id: 'LOG-302',
    actorRole: 'audit',
    action: 'Audit: verified absence of identity linkage',
    targetHash: 'obj #9e03…',
    timestamp: 'Today, 06:05',
    justification: 'Routine privacy invariant verification'
  },
  {
    id: 'LOG-301',
    actorRole: 'fulfilment',
    action: 'Fulfilment: submitted request to payment partner',
    targetHash: 'obj #650d…',
    timestamp: 'Today, 05:50',
    justification: 'Secondary tuition fee batch'
  }
];

export const INITIAL_CAMPAIGNS: CampaignData[] = [
  {
    id: 'cmp-01',
    title: 'Secondary Term Fees for 200 Students',
    cohortGoalText: 'Cover Term 1 tuition and examination fees for 200 secondary school students across Nairobi county.',
    targetAmount: 1800000,
    pooledAmount: 1284500,
    targetCount: 200,
    coveredCount: 142,
    daysRemaining: 8,
    recentGiftsCountToday: 16,
    recentPooledAmountToday: 54000
  },
  {
    id: 'cmp-02',
    title: 'Replenish 500 Family Pantry & Hygiene Bundles',
    cohortGoalText: 'Fund bulk wholesale purchase of staple maize flour, legumes, oil, and hygiene supplies for locker distribution.',
    targetAmount: 750000,
    pooledAmount: 512000,
    targetCount: 500,
    coveredCount: 341,
    daysRemaining: 14,
    recentGiftsCountToday: 23,
    recentPooledAmountToday: 38500
  }
];

export const PARTNER_MONTHLY_STATEMENTS: PartnerMonthlyStatement[] = [
  {
    month: 'October 2026 (Current)',
    voucherCount: 312,
    totalValueKes: 421200,
    reimbursementStatus: 'Approved',
    institutionCategory: 'Locker Network Provider'
  },
  {
    month: 'September 2026',
    voucherCount: 284,
    totalValueKes: 383400,
    reimbursementStatus: 'Paid',
    institutionCategory: 'Locker Network Provider'
  },
  {
    month: 'August 2026',
    voucherCount: 195,
    totalValueKes: 263250,
    reimbursementStatus: 'Paid',
    institutionCategory: 'Locker Network Provider'
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
    available: 19,
    capacity: 24,
    lowStockThreshold: 5
  },
  {
    location: 'Embakasi Central Hub',
    bundleType: 'Family Staples',
    available: 3,
    capacity: 24,
    lowStockThreshold: 5 // Trigger warning!
  },
  {
    location: 'CBD Locker Exchange',
    bundleType: 'Student Study Kit',
    available: 22,
    capacity: 24,
    lowStockThreshold: 5
  }
];

export const SIMULATED_ASSUMPTIONS = [
  {
    id: 'asm-1',
    component: 'Smart Locker reservation/PIN APIs',
    hypothesis: 'Pre-existing commercial parcel locker networks in Nairobi offer multi-tenant capacity booking via webhook.',
    risk: 'High',
    mitigation: 'Fallback to cooperative kiosk pick-up points with manual SMS code validation.',
    status: 'Unconfirmed'
  },
  {
    id: 'asm-2',
    component: 'Real-time institution account lookup',
    hypothesis: 'KPLC meter validation, water accounts, and hospital billing systems provide reliable query APIs for outstanding balance.',
    risk: 'High',
    mitigation: 'Bill-photo OCR fallback with human verification tiers.',
    status: 'Unconfirmed'
  },
  {
    id: 'asm-3',
    component: 'Safaricom institution-payment product (unconfirmed)',
    hypothesis: 'Automated batch disbursement via institutional payment products to school bank accounts and utilities operates with zero human recipient touchpoints.',
    risk: 'Moderate',
    mitigation: 'Standard bulk institutional settlements via licensed payment partner.',
    status: 'Unconfirmed'
  },
  {
    id: 'asm-4',
    component: 'Gift-card provider (carries Kenyan merchants? unconfirmed)',
    hypothesis: 'Supermarket and pharmacy digital vouchers can be generated and redeemed at till terminals without requiring customer registration.',
    risk: 'Moderate',
    mitigation: 'Direct merchant terminal redemption using camera QR scan.',
    status: 'Unconfirmed'
  },
  {
    id: 'asm-5',
    component: 'Ledger technology (open decision: blockchain vs append-only database with external audit)',
    hypothesis: 'A tamper-evident ledger provides verifiable deduplication and aggregate fund solvency reporting without compromising requester anonymity.',
    risk: 'Moderate',
    mitigation: 'Open decision: evaluating append-only cryptographic log with independent third-party auditor attestation vs permissioned ledger.',
    status: 'Open decision'
  },
  {
    id: 'asm-6',
    component: 'Reaching the phone (open design decision: phone number encrypted in separate store)',
    hypothesis: 'SMS gateways can deliver PINs and status updates while isolating phone numbers in an encrypted, isolated store accessible only to automated services.',
    risk: 'Moderate',
    mitigation: 'Open design decision: hardware security module (HSM) enclave or blind telecommunications routing agreement.',
    status: 'Open decision'
  },
  {
    id: 'asm-7',
    component: 'Kenya Data Protection Act (KDPA) 2019 review',
    hypothesis: 'Because no names, addresses, or medical details are gathered, the system operates as an anonymous processor under KDPA.',
    risk: 'Moderate',
    mitigation: 'Formal Data Protection Impact Assessment (DPIA) with Office of the Data Protection Commissioner (ODPC).',
    status: 'Not yet reviewed'
  },
  {
    id: 'asm-8',
    component: 'Anti-Money Laundering (AML) reporting requirements (POCAMLA)',
    hypothesis: 'Direct institution-to-institution utility and school fee settlement relieves the network from carrying cash-holding KYC requirements, but shortcode holder carries POCAMLA duties.',
    risk: 'High',
    mitigation: 'Disbursing exclusively to registered schools, hospitals, and utilities. Exact record requirements to be confirmed with compliance counsel.',
    status: 'To confirm with counsel'
  },
  {
    id: 'asm-9',
    component: 'WFP Building Blocks technical details to reuse: read WFP documentation before reuse',
    hypothesis: 'Proven humanitarian technology patterns (e.g. UN World Food Programme Building Blocks blockchain for inter-agency coordination) can be adapted for civil society deduplication.',
    risk: 'Moderate',
    mitigation: 'Review published WFP architecture specifications and governance models prior to code reuse.',
    status: 'To verify'
  }
];

export const TOKENS_PER_DAY_HISTORY = [
  { day: 'Mon', count: 340, web: 185, sms: 105, ussd: 50, rateLimits: 38 },
  { day: 'Tue', count: 362, web: 198, sms: 112, ussd: 52, rateLimits: 41 },
  { day: 'Wed', count: 395, web: 215, sms: 122, ussd: 58, rateLimits: 44 },
  { day: 'Thu', count: 378, web: 204, sms: 117, ussd: 57, rateLimits: 39 },
  { day: 'Fri', count: 410, web: 220, sms: 128, ussd: 62, rateLimits: 45 },
  { day: 'Sat', count: 355, web: 190, sms: 110, ussd: 55, rateLimits: 37 },
  { day: 'Today (Sun)', count: 384, web: 207, sms: 119, ussd: 58, rateLimits: 42 }
];

export const TRANSLATIONS: Record<'en' | 'sw', Record<string, string>> = {
  en: {
    brand_sub: 'A resource-sharing network for Nairobi',
    get_started: 'Get started',
    welcome_title: 'Dignified community sharing, without barriers',
    welcome_desc: 'Access essential pantry bundles, water & electricity bills, and school tuition directly with complete personal privacy.',
    privacy_title: 'Plain-language privacy note',
    privacy_body: 'In this network, your identity is private from everyone in the chain—including staff, operators, and contributors. We never ask for your name, residential address, or clinical history. Please note: M-Pesa mobile wallets are legally registered to verified SIM identities under Kenyan regulations, but our records maintain only one-way cryptographic tokens.',
    reserve_bundle: 'Reserve a bundle',
    reserve_bundle_desc: 'Food and hygiene packages available in smart lockers across Nairobi.',
    pay_bill: 'Pay a bill or fee',
    pay_bill_desc: 'Direct payment to KPLC power, water, school fees, or hospital bills.',
    my_requests: 'My recent requests',
    give_cta: 'Contribute to the pool',
    give_desc: 'Every community contribution goes directly to locker bundle replenishment, utilities, and school fees.',
    anonymous_give: 'Give anonymously',
    recognition_ledger: 'Opt in to aggregate non-identifying recognition list',
    campaigns: 'Cohort campaigns',
    impact_stats: 'Network impact',
    console_title: 'Operations & Fulfilment Console',
    separation_banner: 'Separation of duties enforced: No role holds both identity-contact access and payment authority.',
    collect_anytime: 'Collect at your convenience. No countdown timer.',
    direct_payment_note: 'Funds go directly to the institution. No cash is sent to you.',
    data_rights: 'Your data and your rights',
    data_rights_banner: 'Pending Data Protection Act review. Wording will change.',
    access_export: 'Access & Export',
    correction: 'Correction',
    erasure: 'Right to Erasure',
    return_home: 'Return to Home',
    supply_depot: 'Supply and depot',
    monthly_statement: 'Monthly statement',
    demo_controls: 'Demo controls',
    retry_sms: 'Retry SMS delivery',
    duplicate_title: 'Duplicate: this bill has already been settled',
    intake_health: 'Intake Health Dashboard',
    audit_center: 'Audit & Risk Center',
    fulfilment_queue: 'Fulfilment Queue'
  },
  sw: {
    brand_sub: 'Mtandao wa kugawana rasilimali Nairobi',
    get_started: 'Anza sasa',
    welcome_title: 'Ushirikiano wa heshima wa jamii, bila vikwazo',
    welcome_desc: 'Pata vifurushi vya chakula, bili za umeme na maji, na ada za shule moja kwa moja kwa faragha kamili.',
    privacy_title: 'Ufafanuzi rahisi wa faragha',
    privacy_body: 'Kwenye mtandao huu, utambulisho wako ni siri kwa kila mtu—wakiwemo wafanyakazi, wasimamizi, na wachangiaji. Hatuulizi jina lako, anwani ya makazi, wala taarifa za matibabu. Tafadhali kumbuka: M-Pesa inasajiliwa kisheria na vitambulisho, lakini kumbukumbu zetu zinahifadhi misimbo ya siri tu.',
    reserve_bundle: 'Weka nafasi ya kifurushi',
    reserve_bundle_desc: 'Vifurushi vya chakula na usafi vinavyopatikana kwenye kabati za kielektroniki Nairobi.',
    pay_bill: 'Lipa bili au ada',
    pay_bill_desc: 'Malipo ya moja kwa moja kwa KPLC, maji, ada ya shule, au ankara za hospitali.',
    my_requests: 'Maombi yangu ya hivi karibuni',
    give_cta: 'Changia kwenye hazina',
    give_desc: 'Kila mchango wa jamii huenda moja kwa moja kwenye vifurushi na kulipia bili na ada.',
    anonymous_give: 'Changia bila kutaja jina',
    recognition_ledger: 'Jiunge na orodha ya jumla isiyotambulisha',
    campaigns: 'Kampeni za makundi',
    impact_stats: 'Matokeo ya mtandao',
    console_title: 'Kituo cha Uendeshaji na Utekelezaji',
    separation_banner: 'Mgawanyo wa majukumu unatekelezwa: Hakuna afisa anayeshikilia mawasiliano na idhini ya malipo kwa pamoja.',
    collect_anytime: 'Chukua kwa wakati unaokufaa. Hakuna kikomo cha muda.',
    direct_payment_note: 'Pesa huenda moja kwa moja kwenye taasisi. Hakuna pesa taslimu unayotumiwa.',
    data_rights: 'Haki zako za faragha na data',
    data_rights_banner: 'Inasubiri ukaguzi wa Sheria ya Kulinda Data. Maneno yatabadilika.',
    access_export: 'Pata na Pakua',
    correction: 'Marekebisho',
    erasure: 'Haki ya Kufutwa',
    return_home: 'Rudi Nyumbani',
    supply_depot: 'Ugavi na bohari',
    monthly_statement: 'Taarifa ya kila mwezi',
    demo_controls: 'Vidhibiti vya maonyesho',
    retry_sms: 'Jaribu kutuma SMS tena',
    duplicate_title: 'Rudufu: bili hii tayari imeshalipwa',
    intake_health: 'Dashibodi ya Afya ya Uandikishaji',
    audit_center: 'Kituo cha Ukaguzi na Hatari',
    fulfilment_queue: 'Msururu wa Utekelezaji'
  }
};
