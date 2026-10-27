import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BundleItem, NetworkRequest } from '../../types';
import { 
  Package, 
  MapPin, 
  Check, 
  QrCode, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight,
  Clock,
  AlertTriangle,
  RotateCcw,
  Inbox
} from 'lucide-react';

export const SwapFlow: React.FC = () => {
  const { 
    bundles, 
    addSwapRequest, 
    setRequesterScreen, 
    requesterScreen,
    setSurface, 
    setPartnerPin, 
    isLoadingBundles,
    setIsLoadingBundles,
    emptyBundlesMode,
    setEmptyBundlesMode,
    t 
  } = useApp();

  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedBundle, setSelectedBundle] = useState<BundleItem | null>(null);
  const [confirmedRequest, setConfirmedRequest] = useState<NetworkRequest | null>(null);
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [messagingError, setMessagingError] = useState<boolean>(false);
  const [retryingMessage, setRetryingMessage] = useState<boolean>(false);

  useEffect(() => {
    if (requesterScreen === 'messaging_unavailable_demo' && bundles.length > 0) {
      const req = addSwapRequest(bundles[0]);
      setConfirmedRequest(req);
      setMessagingError(true);
    }
  }, [requesterScreen, bundles]);

  const locations = ['All', 'Westlands', 'Kasarani', 'Embakasi', 'CBD', 'Unavailable Area'];

  const filteredBundles = emptyBundlesMode || selectedLocation === 'Unavailable Area' 
    ? [] 
    : bundles.filter(b => selectedLocation === 'All' || b.lockerLocation.includes(selectedLocation));

  const handleReserve = (bundle: BundleItem, forceMessagingError = false) => {
    setIsReserving(true);
    setTimeout(() => {
      const req = addSwapRequest(bundle);
      setConfirmedRequest(req);
      setIsReserving(false);
      if (forceMessagingError) {
        setMessagingError(true);
      } else {
        setMessagingError(false);
      }
      if (req.pinCode) {
        setPartnerPin(req.pinCode);
      }
    }, 500);
  };

  const handleRetryDelivery = () => {
    setRetryingMessage(true);
    setTimeout(() => {
      setRetryingMessage(false);
      setMessagingError(false);
    }, 700);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <button
          onClick={() => setRequesterScreen('home')}
          className="text-xs text-[#111111]/60 hover:text-[#111111] mb-2 inline-flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A] rounded"
        >
          ← Back to Network Home
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#111111]">The Swap: Smart Lockers</h2>
            <p className="text-xs sm:text-sm text-[#111111]/70 mt-0.5">
              Standardised essential packages reserved in automated electronic lockers across Nairobi.
            </p>
          </div>
          <span className="text-xs font-mono bg-[#DCE8E0] text-[#1F6B4A] px-2 py-1 rounded hidden sm:inline-block">
            Capacity Guaranteed
          </span>
        </div>
      </div>

      {!confirmedRequest ? (
        /* Step 1: Browse standardised bundles */
        <div className="space-y-4">
          
          {/* Location Filter */}
          <div className="bg-white p-3.5 rounded-xl border border-[#111111]/15">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="font-semibold text-[#111111] shrink-0">Hub Location:</span>
              {locations.map(loc => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#1F6B4A] ${
                    selectedLocation === loc
                      ? 'bg-[#1F6B4A] text-white font-medium'
                      : 'bg-black/5 text-[#111111]/70 hover:bg-black/10'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Controls Panel */}
          <div className="p-3 bg-[#FAF8F4] border border-[#111111]/15 rounded-xl space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#111111]/60 font-bold block">
              {t('demo_controls')}:
            </span>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setIsLoadingBundles(!isLoadingBundles)}
                className="px-2.5 py-1 bg-white border border-[#111111]/15 rounded-lg hover:bg-black/5 cursor-pointer text-[#111111]/80"
              >
                {isLoadingBundles ? 'Stop Skeleton' : 'Test Skeleton View'}
              </button>
              <button
                type="button"
                onClick={() => setEmptyBundlesMode(!emptyBundlesMode)}
                className="px-2.5 py-1 bg-white border border-[#111111]/15 rounded-lg hover:bg-black/5 cursor-pointer text-[#111111]/80"
              >
                {emptyBundlesMode ? 'Restore Bundles' : 'Test Empty State'}
              </button>
              <button
                type="button"
                onClick={() => handleReserve(filteredBundles[0] || bundles[0], true)}
                className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-50 cursor-pointer"
              >
                Simulate SMS Delivery Failure
              </button>
            </div>
          </div>

          {/* Skeletons Loader */}
          {isLoadingBundles ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-[#111111]/10 space-y-3 animate-pulse">
                  <div className="w-40 h-5 bg-black/10 rounded" />
                  <div className="w-full h-3 bg-black/10 rounded" />
                  <div className="w-3/4 h-3 bg-black/10 rounded" />
                  <div className="h-10 bg-black/5 rounded-xl mt-3" />
                </div>
              ))}
            </div>
          ) : filteredBundles.length === 0 ? (
            /* Empty State */
            <div className="p-8 rounded-2xl bg-white border border-[#111111]/15 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF8F4] flex items-center justify-center text-[#111111]/40 mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#111111]">
                No bundles available at this location right now, try another location
              </h3>
              <p className="text-xs text-[#111111]/60 max-w-sm mx-auto leading-relaxed">
                Smart locker capacity adjusts as depot supplies are delivered. Select a different coarse location hub like Westlands or Kasarani.
              </p>
              <button
                onClick={() => { setSelectedLocation('All'); setEmptyBundlesMode(false); }}
                className="px-4 py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                View All Available Locations
              </button>
            </div>
          ) : (
            /* Standard Bundle Cards */
            <div className="grid grid-cols-1 gap-4">
              {filteredBundles.map(bundle => {
                const isSelected = selectedBundle?.id === bundle.id;

                return (
                  <div
                    key={bundle.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-white border-[#1F6B4A] ring-1 ring-[#1F6B4A] shadow-md'
                        : 'bg-white/80 border-[#111111]/15 hover:border-[#111111]/30 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-lg font-bold text-[#111111]">
                            {bundle.name}
                          </span>
                          <span className="text-[11px] font-mono text-[#111111]/60 bg-black/5 px-2 py-0.5 rounded">
                            {bundle.weightApprox}
                          </span>
                        </div>

                        <p className="text-xs text-[#111111]/75 leading-relaxed">
                          {bundle.description}
                        </p>

                        {/* Items contents list */}
                        <div className="pt-2">
                          <span className="text-[11px] font-semibold text-[#111111]/60 uppercase tracking-wider block mb-1.5">
                            Package Contents:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#111111]/85">
                            {bundle.items.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A]/60 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Coarse Location & Capacity */}
                        <div className="flex items-center gap-4 text-xs font-mono text-[#111111]/70 pt-2 border-t border-[#111111]/10">
                          <div className="flex items-center gap-1.5 text-[#1F6B4A]">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{bundle.lockerLocation}</span>
                          </div>
                          <div>
                            <span>{bundle.availableCount} available today</span>
                          </div>
                        </div>
                      </div>

                      {/* Reserve Action Button */}
                      <div className="sm:self-center shrink-0 pt-2 sm:pt-0">
                        <button
                          onClick={() => handleReserve(bundle, false)}
                          disabled={isReserving}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white text-xs font-semibold tracking-wide transition-all shadow-sm cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
                        >
                          {isReserving ? 'Reserving...' : 'Reserve Package'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/70 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1F6B4A] shrink-0 mt-0.5" />
            <span>
              Locker reservations are private. The electronic locker hub records only the single-use PIN and unlocks automatically. Staff never attend the pickup.
            </span>
          </div>
        </div>
      ) : (
        /* Step 2: Confirmation Screen with Single-Use PIN and QR */
        <div className="space-y-5 animate-in zoom-in-95 duration-200">
          
          <div className="p-4 rounded-xl bg-[#DCE8E0]/40 border border-[#1F6B4A]/30 flex items-center gap-2.5 text-xs text-[#1F6B4A]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">Reservation Confirmed</span>
          </div>

          {/* Error State: Messaging Unavailable */}
          {messagingError && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-serif text-sm font-bold text-amber-900">
                    Messaging unavailable
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    SMS and PIN delivery to your phone temporarily failed due to telecom gateway latency. Your locker PIN has still been generated securely below. You can retry the SMS transmission.
                  </p>
                </div>
              </div>

              {/* Security Review Flag Design Note (Item 8) */}
              <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300/80 text-[11px] text-amber-950 space-y-1">
                <span className="font-bold text-rose-900 font-mono text-[10px] uppercase tracking-wider block">
                  [For Security Review]
                </span>
                <p className="leading-relaxed">
                  <strong>Design note:</strong> When SMS delivery fails, the PIN is shown on screen as a fallback. Flagged for security review to evaluate screen-shoulder-surfing risk against user accessibility.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleRetryDelivery}
                  disabled={retryingMessage}
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-900"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${retryingMessage ? 'animate-spin' : ''}`} />
                  <span>{retryingMessage ? 'Retrying delivery...' : t('retry_sms')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Single-Use PIN Display */}
          <div className="p-6 rounded-2xl bg-white border border-[#111111]/15 text-center space-y-4 shadow-sm">
            <span className="text-xs font-mono uppercase text-[#111111]/60 tracking-wider">
              Single-Use Locker Pickup PIN
            </span>
            <div className="font-mono text-4xl sm:text-5xl font-bold tracking-widest text-[#1F6B4A] py-2 bg-[#FAF8F4] rounded-xl border border-[#111111]/10 max-w-xs mx-auto">
              {confirmedRequest.pinCode || '8341'}
            </div>

            <div className="text-xs text-[#111111]/70 font-mono">
              Assigned Box: {confirmedRequest.objectIdMasked}
            </div>

            {/* Simulated QR Code for scanner till */}
            <div className="pt-2 flex flex-col items-center gap-2">
              <div className="p-3 bg-white border-2 border-dashed border-[#111111]/20 rounded-xl inline-block shadow-inner">
                <svg className="w-28 h-28 text-[#111111]" viewBox="0 0 100 100" fill="currentColor" aria-label="Simulated optical QR code for locker scanner">
                  <rect x="5" y="5" width="25" height="25" fill="#111111" />
                  <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
                  <rect x="13" y="13" width="9" height="9" fill="#111111" />

                  <rect x="70" y="5" width="25" height="25" fill="#111111" />
                  <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
                  <rect x="78" y="13" width="9" height="9" fill="#111111" />

                  <rect x="5" y="70" width="25" height="25" fill="#111111" />
                  <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
                  <rect x="13" y="78" width="9" height="9" fill="#111111" />

                  <rect x="35" y="10" width="5" height="5" />
                  <rect x="45" y="15" width="10" height="5" />
                  <rect x="60" y="10" width="5" height="10" />
                  <rect x="35" y="25" width="10" height="5" />
                  <rect x="50" y="25" width="5" height="10" />
                  <rect x="10" y="35" width="5" height="10" />
                  <rect x="25" y="40" width="10" height="5" />
                  <rect x="40" y="40" width="15" height="5" />
                  <rect x="60" y="40" width="10" height="10" />
                  <rect x="75" y="35" width="15" height="5" />
                  <rect x="15" y="55" width="10" height="5" />
                  <rect x="35" y="50" width="5" height="15" />
                  <rect x="45" y="55" width="10" height="5" />
                  <rect x="65" y="55" width="5" height="10" />
                  <rect x="80" y="50" width="10" height="10" />
                  <rect x="35" y="70" width="15" height="5" />
                  <rect x="55" y="70" width="10" height="10" />
                  <rect x="75" y="70" width="5" height="15" />
                  <rect x="40" y="85" width="20" height="5" />
                </svg>
              </div>
              <span className="text-[11px] text-[#111111]/50 font-mono">
                Scan at automated locker optical reader
              </span>
            </div>

            {/* Countdown-free Collect Any Time Copy */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/80 space-y-1 text-left">
              <div className="font-semibold text-[#1F6B4A] flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{t('collect_anytime')}</span>
              </div>
              <p className="text-xs text-[#111111]/70 leading-relaxed">
                The smart locker remains reserved for you at Westlands Locker Hub. There is no countdown timer or penalty. Collect at whatever time fits your schedule.
              </p>
            </div>
          </div>

          {/* Delivered "by SMS" simulated notification bubble */}
          {!messagingError && (
            <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                <MessageSquare className="w-4 h-4 text-[#1F6B4A]" />
                <span>Delivered to your phone by SMS</span>
              </div>
              <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#111111]/10 text-xs font-mono text-[#111111]/90 leading-relaxed">
                &quot;The Mutual Circle: Your request {confirmedRequest.id} is confirmed. Box: {confirmedRequest.objectIdMasked}. Single-use PIN: {confirmedRequest.pinCode}. Collect at your convenience.&quot;
              </div>
            </div>
          )}

          {/* Test link to Partner Till Redemption */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                setSurface('partner');
                setPartnerPin(confirmedRequest.pinCode || '8341');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Test Pickup in Partner Till</span>
            </button>

            <button
              onClick={() => setRequesterScreen('home')}
              className="py-3 px-4 rounded-xl bg-white hover:bg-black/5 text-[#111111] border border-[#111111]/20 text-xs font-medium cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            >
              Done / Return Home
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
