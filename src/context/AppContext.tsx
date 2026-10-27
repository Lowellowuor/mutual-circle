import React, { createContext, useContext, useState } from 'react';
import { 
  Surface, 
  RequesterScreen, 
  RequesterChannel, 
  ConsoleRole, 
  NetworkRequest, 
  BundleItem, 
  RiskFlag, 
  DeduplicationItem, 
  AuditLogEntry, 
  CampaignData,
  PoolRequestInput,
  PartnerMonthlyStatement,
  DepotStageCount,
  LockerLocationStock
} from '../types';
import { 
  INITIAL_BUNDLES, 
  INITIAL_REQUESTS, 
  INITIAL_RISK_FLAGS, 
  INITIAL_DEDUPLICATION_ITEMS, 
  INITIAL_AUDIT_LOG, 
  INITIAL_CAMPAIGNS,
  PARTNER_MONTHLY_STATEMENTS,
  DEPOT_STAGE_COUNTS,
  LOCKER_LOCATION_STOCKS,
  TRANSLATIONS 
} from '../mockData';
import { en } from '../i18n/en';
import { sw } from '../i18n/sw';

interface AppContextType {
  surface: Surface;
  setSurface: (surface: Surface) => void;
  requesterScreen: RequesterScreen;
  setRequesterScreen: (screen: RequesterScreen) => void;
  requesterChannel: RequesterChannel;
  setRequesterChannel: (channel: RequesterChannel) => void;
  language: 'en' | 'sw';
  setLanguage: (lang: 'en' | 'sw') => void;
  t: (key: string) => string;
  exportComplianceCsv: () => void;
  isPhoneFramed: boolean;
  setIsPhoneFramed: (val: boolean) => void;
  phoneNumber: string;
  setPhoneNumber: (num: string) => void;
  isPhoneVerified: boolean;
  setIsPhoneVerified: (val: boolean) => void;
  activeRequestId: string | null;
  setActiveRequestId: (id: string | null) => void;
  requests: NetworkRequest[];
  bundles: BundleItem[];
  campaigns: CampaignData[];
  riskFlags: RiskFlag[];
  dedupItems: DeduplicationItem[];
  auditLog: AuditLogEntry[];
  consoleRole: ConsoleRole;
  setConsoleRole: (role: ConsoleRole) => void;
  demoDrawerOpen: boolean;
  setDemoDrawerOpen: (val: boolean) => void;
  partnerPin: string;
  setPartnerPin: (pin: string) => void;
  partnerResult: 'idle' | 'valid' | 'used' | 'invalid';
  partnerMessage: string;
  redeemPartnerPin: (pin: string) => void;
  partnerStatements: PartnerMonthlyStatement[];
  depotCounts: DepotStageCount;
  lockerStocks: LockerLocationStock[];
  opportunityOptIn: boolean;
  setOpportunityOptIn: (optIn: boolean) => void;
  opportunityDismissed: boolean;
  setOpportunityDismissed: (dismissed: boolean) => void;
  isLoadingRequests: boolean;
  setIsLoadingRequests: (val: boolean) => void;
  isLoadingBundles: boolean;
  setIsLoadingBundles: (val: boolean) => void;
  emptyRequestsMode: boolean;
  setEmptyRequestsMode: (val: boolean) => void;
  emptyBundlesMode: boolean;
  setEmptyBundlesMode: (val: boolean) => void;
  emptyQueueMode: boolean;
  setEmptyQueueMode: (val: boolean) => void;
  addSwapRequest: (bundle: BundleItem) => NetworkRequest;
  addPoolRequest: (input: PoolRequestInput) => NetworkRequest;
  routeFlagToTier4: (flagId: string) => void;
  clearFlagAsFalsePositive: (flagId: string, notes: string) => void;
  dispatchRequestBatch: (requestId: string) => void;
  addDonorContribution: (amount: number, isAnonymous: boolean, optInLedger: boolean) => void;
  logAuditEvent: (role: ConsoleRole | 'system', action: string, targetHash: string, justification?: string) => void;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [surface, setSurface] = useState<Surface>('requester');
  const [requesterScreen, setRequesterScreen] = useState<RequesterScreen>('welcome');
  const [requesterChannel, setRequesterChannel] = useState<RequesterChannel>('web');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [isPhoneFramed, setIsPhoneFramed] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState<string>('+254 712 345 678');
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(true);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  
  const [requests, setRequests] = useState<NetworkRequest[]>(INITIAL_REQUESTS);
  const [bundles, setBundles] = useState<BundleItem[]>(INITIAL_BUNDLES);
  const [campaigns, setCampaigns] = useState<CampaignData[]>(INITIAL_CAMPAIGNS);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>(INITIAL_RISK_FLAGS);
  const [dedupItems] = useState<DeduplicationItem[]>(INITIAL_DEDUPLICATION_ITEMS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [consoleRole, setConsoleRoleState] = useState<ConsoleRole>('fulfilment');
  const [demoDrawerOpen, setDemoDrawerOpen] = useState<boolean>(false);

  // Loading and empty state controls for demo reviewers
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [isLoadingBundles, setIsLoadingBundles] = useState<boolean>(false);
  const [emptyRequestsMode, setEmptyRequestsMode] = useState<boolean>(false);
  const [emptyBundlesMode, setEmptyBundlesMode] = useState<boolean>(false);
  const [emptyQueueMode, setEmptyQueueMode] = useState<boolean>(false);

  // Partner statements & Depot inventory
  const [partnerStatements] = useState<PartnerMonthlyStatement[]>(PARTNER_MONTHLY_STATEMENTS);
  const [depotCounts] = useState<DepotStageCount>(DEPOT_STAGE_COUNTS);
  const [lockerStocks] = useState<LockerLocationStock[]>(LOCKER_LOCATION_STOCKS);

  // Partner redemption state
  const [partnerPin, setPartnerPin] = useState<string>('8341');
  const [partnerResult, setPartnerResult] = useState<'idle' | 'valid' | 'used' | 'invalid'>('idle');
  const [partnerMessage, setPartnerMessage] = useState<string>('');

  // Opportunity surfaced opt-in state (default false, non-identifying)
  const [opportunityOptIn, setOpportunityOptIn] = useState<boolean>(false);
  const [opportunityDismissed, setOpportunityDismissed] = useState<boolean>(false);

  const t = (key: string): string => {
    if (language === 'sw') {
      return (sw as any)[key] || (en as any)[key] || TRANSLATIONS['sw']?.[key] || TRANSLATIONS['en']?.[key] || key;
    }
    return (en as any)[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const exportComplianceCsv = () => {
    const headers = "RequestID,Category,KeyedObjectHash,SettlementAmountKES,CoarseLocation,Status,Timestamp,ComplianceStandard\n";
    const rows = requests.map(r => `${r.id},${r.categoryTitle},obj #8f4c…,${r.amount},${r.coarseLocation},${r.status},${r.timestamp},POCAMLA-Shortcode-Duties\n`).join('');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_audit_pocamla_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const logAuditEvent = (role: ConsoleRole | 'system', action: string, targetHash: string, justification?: string) => {
    const newEntry: AuditLogEntry = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actorRole: role,
      action: action,
      targetHash: targetHash,
      timestamp: 'Just now',
      justification: justification
    };
    setAuditLog(prev => [newEntry, ...prev]);
  };

  const setConsoleRole = (role: ConsoleRole) => {
    setConsoleRoleState(role);
    logAuditEvent(role, `Switched view to ${role.toUpperCase()}`, 'obj #auth-session', 'Separation of duties role view switched');
  };

  const addSwapRequest = (bundle: BundleItem): NetworkRequest => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashFrag = `obj #${Math.random().toString(16).slice(2, 6)}…`;
    const newReq: NetworkRequest = {
      id: `REQ-SWAP-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'swap',
      categoryTitle: `${bundle.name} Bundle`,
      amount: bundle.category === 'family' ? 2400 : 1350,
      coarseLocation: bundle.lockerLocation.split(' ')[0], // "Westlands", "Kasarani", etc.
      status: 'submitted',
      timestamp: 'Just now',
      objectIdMasked: `Locker: ${bundle.lockerLocation.slice(0, 3).toUpperCase()}-Box-${Math.floor(1 + Math.random() * 24).toString().padStart(2, '0')}`,
      hashedObjectId: hashFrag,
      verificationTier: 'Tier 1',
      fulfillmentDetails: 'PIN generated and delivered via simulated SMS',
      pinCode: pin
    };

    setRequests(prev => [newReq, ...prev]);
    // update inventory
    setBundles(prev => prev.map(b => b.id === bundle.id ? { ...b, availableCount: Math.max(0, b.availableCount - 1) } : b));
    
    // Add audit entry (target hash fragment only)
    logAuditEvent('fulfilment', 'Fulfilment: locker allocation verified', hashFrag, 'Automated Tier 1 quota and coarse location check');

    return newReq;
  };

  const addPoolRequest = (input: PoolRequestInput): NetworkRequest => {
    const hashFrag = `obj #${Math.random().toString(16).slice(2, 6)}…`;
    const newReq: NetworkRequest = {
      id: `REQ-POOL-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'pool',
      categoryTitle: input.subType,
      amount: input.amount,
      coarseLocation: 'Nairobi Region',
      status: 'submitted',
      timestamp: 'Just now',
      objectIdMasked: `${input.category === 'utility' ? 'Meter' : input.category === 'school' ? 'Adm' : 'Inv'}: ${input.objectId.slice(0, 4)}***${input.objectId.slice(-2)}`,
      hashedObjectId: hashFrag,
      verificationTier: input.amount > 5000 ? 'Tier 3' : 'Tier 2',
      fulfillmentDetails: 'Submitted to payment partner (Safaricom institution-payment product, unconfirmed)'
    };

    setRequests(prev => [newReq, ...prev]);

    logAuditEvent('fulfilment', 'Fulfilment: automated Tier 2 check confirmed', hashFrag, 'Institutional object query pass; submitted to payment partner queue');

    return newReq;
  };

  const routeFlagToTier4 = (flagId: string) => {
    setRiskFlags(prev => prev.map(f => f.id === flagId ? { ...f, status: 'routed_tier4' } : f));
    const targetFlag = riskFlags.find(f => f.id === flagId);
    if (targetFlag) {
      logAuditEvent('audit', 'Audit: routed flag to Tier 4', targetFlag.hashedTargetId, 'Escalated to Tier 4 independent review panel');
    }
  };

  const clearFlagAsFalsePositive = (flagId: string, notes: string) => {
    setRiskFlags(prev => prev.map(f => f.id === flagId ? { ...f, status: 'cleared_false_positive', investigationNotes: notes } : f));
    const targetFlag = riskFlags.find(f => f.id === flagId);
    if (targetFlag) {
      logAuditEvent('audit', 'Audit: cleared flag as false positive (shared-meter compound)', targetFlag.hashedTargetId, notes || 'Verified legitimate multi-family usage pattern');
    }
  };

  const dispatchRequestBatch = (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'fulfilled', fulfillmentDetails: 'Submitted to payment partner (Safaricom institution-payment product, unconfirmed)' } : r));
    const req = requests.find(r => r.id === requestId);
    if (req) {
      logAuditEvent('fulfilment', 'Fulfilment: submitted request to payment partner', req.hashedObjectId || 'obj #8f4c…', 'Automated institutional verification and payment partner transmission');
    }
  };

  const redeemPartnerPin = (pin: string) => {
    const cleanPin = pin.trim();
    if (cleanPin === '8341') {
      setPartnerResult('used');
      setPartnerMessage('Already used: Voucher PIN 8341 was redeemed earlier today at Westlands Locker Hub.');
    } else if (cleanPin === '5920' || cleanPin.length === 4) {
      setPartnerResult('valid');
      setPartnerMessage('Valid voucher: Voucher for Pantry Basics (1 Package). Box Door #07 unlocked. Zero requester identity required.');
    } else {
      setPartnerResult('invalid');
      setPartnerMessage('Invalid code: Voucher PIN not found in current active cycle or already expired.');
    }
  };

  const addDonorContribution = (amount: number, isAnonymous: boolean, optInLedger: boolean) => {
    // Undifferentiated fund contribution
    setCampaigns(prev => prev.map(c => {
      if (c.id === 'cmp-01') {
        return {
          ...c,
          pooledAmount: c.pooledAmount + amount,
          recentGiftsCountToday: c.recentGiftsCountToday + 1,
          recentPooledAmountToday: c.recentPooledAmountToday + amount,
          coveredCount: Math.min(c.targetCount, Math.floor((c.pooledAmount + amount) / 9000))
        };
      }
      return c;
    }));

    logAuditEvent('enrolment', `Intake: pooled contribution received KES ${amount.toLocaleString()}`, 'obj #pool-intake', `${isAnonymous ? 'Anonymous contribution.' : 'Non-identifying contribution.'} Undifferentiated pool.`);
  };

  const resetToDefaults = () => {
    setRequests(INITIAL_REQUESTS);
    setBundles(INITIAL_BUNDLES);
    setCampaigns(INITIAL_CAMPAIGNS);
    setRiskFlags(INITIAL_RISK_FLAGS);
    setAuditLog(INITIAL_AUDIT_LOG);
    setPartnerResult('idle');
    setPartnerMessage('');
    setOpportunityOptIn(false);
    setOpportunityDismissed(false);
    setIsPhoneVerified(true);
    setEmptyRequestsMode(false);
    setEmptyBundlesMode(false);
    setEmptyQueueMode(false);
    setIsLoadingRequests(false);
    setIsLoadingBundles(false);
    setRequesterScreen('home');
  };

  return (
    <AppContext.Provider
      value={{
        surface,
        setSurface,
        requesterScreen,
        setRequesterScreen,
        requesterChannel,
        setRequesterChannel,
        language,
        setLanguage,
        t,
        isPhoneFramed,
        setIsPhoneFramed,
        phoneNumber,
        setPhoneNumber,
        isPhoneVerified,
        setIsPhoneVerified,
        activeRequestId,
        setActiveRequestId,
        requests,
        bundles,
        campaigns,
        riskFlags,
        dedupItems,
        auditLog,
        consoleRole,
        setConsoleRole,
        demoDrawerOpen,
        setDemoDrawerOpen,
        partnerPin,
        setPartnerPin,
        partnerResult,
        partnerMessage,
        redeemPartnerPin,
        partnerStatements,
        depotCounts,
        lockerStocks,
        opportunityOptIn,
        setOpportunityOptIn,
        opportunityDismissed,
        setOpportunityDismissed,
        isLoadingRequests,
        setIsLoadingRequests,
        isLoadingBundles,
        setIsLoadingBundles,
        emptyRequestsMode,
        setEmptyRequestsMode,
        emptyBundlesMode,
        setEmptyBundlesMode,
        emptyQueueMode,
        setEmptyQueueMode,
        addSwapRequest,
        addPoolRequest,
        routeFlagToTier4,
        clearFlagAsFalsePositive,
        dispatchRequestBatch,
        addDonorContribution,
        logAuditEvent,
        exportComplianceCsv,
        resetToDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
