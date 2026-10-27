import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BundleItem, ResourceRequest } from '../../types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Sheet } from '../../ui/Sheet';
import { 
  Package, 
  ShoppingBasket, 
  Sparkles, 
  GraduationCap, 
  QrCode, 
  Copy, 
  Check, 
  ArrowLeft,
  Info 
} from 'lucide-react';

export const SwapFlow: React.FC = () => {
  const { bundles, addSwapRequest, setRequesterScreen, t } = useApp();

  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [activeBundle, setActiveBundle] = useState<BundleItem | null>(null);
  const [confirmSheetOpen, setConfirmSheetOpen] = useState<boolean>(false);
  const [infoSheetOpen, setInfoSheetOpen] = useState<boolean>(false);
  const [confirmedRequest, setConfirmedRequest] = useState<ResourceRequest | null>(null);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);

  const locations = ['All', 'Westlands', 'Kasarani', 'CBD'];

  const getBundleIcon = (cat: string) => {
    switch (cat) {
      case 'pantry':
        return <ShoppingBasket className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />;
      case 'hygiene':
        return <Sparkles className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />;
      case 'student':
        return <GraduationCap className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />;
      default:
        return <Package className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />;
    }
  };

  const filteredBundles = bundles.filter(b => {
    if (selectedLocation === 'All') return true;
    if (selectedLocation === 'Westlands') return b.lockerLocation.includes('Westlands');
    if (selectedLocation === 'Kasarani') return b.lockerLocation.includes('Kasarani');
    if (selectedLocation === 'CBD') return b.lockerLocation.includes('CBD');
    return true;
  });

  const handleSelectBundle = (bundle: BundleItem) => {
    setActiveBundle(bundle);
    setConfirmSheetOpen(true);
  };

  const handleConfirmReservation = () => {
    if (!activeBundle) return;
    const req = addSwapRequest(activeBundle);
    setConfirmedRequest(req);
    setConfirmSheetOpen(false);
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // 1. PIN TICKET SCREEN
  if (confirmedRequest) {
    const pin = confirmedRequest.pinCode || '8341';

    return (
      <div className="w-full max-w-md mx-auto space-y-4 pb-20 animate-in fade-in">
        
        {/* Top Header: 56px */}
        <div className="h-14 flex items-center justify-between border-b border-[#111111]/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRequesterScreen('home')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111] cursor-pointer"
              aria-label="Back home"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <h1 className="font-serif text-[28px] font-bold text-[#111111]">
              {t('swap_title')}
            </h1>
          </div>
          <button
            onClick={() => setInfoSheetOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer"
            aria-label="Reservation info"
          >
            <Info className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Ticket-Style Card with Notch Edges */}
        <div className="relative bg-white rounded-[18px] border border-[#111111]/10 overflow-hidden shadow-xs">
          
          {/* Left and Right Notches */}
          <div className="absolute left-[-8px] top-[110px] w-4 h-4 rounded-full bg-[#FAF8F4] border-r border-[#111111]/10 z-10" />
          <div className="absolute right-[-8px] top-[110px] w-4 h-4 rounded-full bg-[#FAF8F4] border-l border-[#111111]/10 z-10" />

          {/* Top Ticket Section: Box info */}
          <div className="p-5 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#DCE8E0] text-[#1F6B4A] mx-auto flex items-center justify-center">
              <Package className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div className="font-mono text-base font-bold text-[#111111]">
              {confirmedRequest.objectIdMasked || 'Locker Box 14'}
            </div>
            <div className="text-sm font-medium text-[#1F6B4A]">
              {confirmedRequest.coarseLocation}
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="border-t border-dashed border-[#111111]/15 my-1" />

          {/* Bottom Ticket Section: QR & PIN */}
          <div className="p-5 text-center space-y-4">
            <div className="p-3 bg-[#FAF8F4] rounded-xl inline-block border border-[#111111]/10">
              <QrCode className="w-28 h-28 text-[#111111] mx-auto" strokeWidth={1.75} />
            </div>

            {/* Monospace PIN with spaced digits */}
            <div className="space-y-1">
              <div className="font-mono text-3xl font-bold tracking-[0.4em] text-[#1F6B4A]">
                {pin.split('').join(' ')}
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => handleCopyPin(pin)}
              icon={copiedPin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            >
              {copiedPin ? t('btn_done') : t('btn_copy_pin')}
            </Button>
          </div>
        </div>

        {/* Sticky Primary Action: 52px high, 16px radius */}
        <div className="pt-2">
          <Button
            fullWidth
            size="sticky"
            onClick={() => setRequesterScreen('home')}
          >
            {t('btn_done')}
          </Button>
        </div>

        {/* Info Sheet */}
        <Sheet
          isOpen={infoSheetOpen}
          onClose={() => setInfoSheetOpen(false)}
          title={t('swap_title')}
        >
          <div className="space-y-3">
            <p>Single-use PIN unlocks your reserved locker compartment.</p>
            <p>Collect any time. No personal details asked.</p>
            <Button fullWidth variant="outline" size="md" onClick={() => setInfoSheetOpen(false)}>
              {t('btn_close')}
            </Button>
          </div>
        </Sheet>

      </div>
    );
  }

  // 2. BROWSE BUNDLE GRID SCREEN
  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-20 animate-in fade-in">
      
      {/* Top Header: 56px */}
      <div className="h-14 flex items-center justify-between border-b border-[#111111]/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRequesterScreen('home')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111] cursor-pointer"
            aria-label="Back home"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <h1 className="font-serif text-[28px] font-bold text-[#111111]">
            {t('swap_title')}
          </h1>
        </div>
        <button
          onClick={() => setInfoSheetOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer"
          aria-label="Swap info"
        >
          <Info className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Horizontal Location Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {locations.map(loc => (
          <Chip
            key={loc}
            selected={selectedLocation === loc}
            onClick={() => setSelectedLocation(loc)}
            size="md"
          >
            {loc}
          </Chip>
        ))}
      </div>

      {/* 2-Column Bundle Grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {filteredBundles.map(bundle => (
          <Card
            key={bundle.id}
            variant="interactive"
            onClick={() => handleSelectBundle(bundle)}
            className="p-4 flex flex-col justify-between items-center text-center gap-3 min-h-[170px]"
          >
            {/* 48px round sage container with green icon */}
            <div className="w-12 h-12 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
              {getBundleIcon(bundle.category)}
            </div>

            <div className="space-y-1 w-full">
              <div className="font-medium text-sm text-[#111111] line-clamp-1">
                {bundle.name}
              </div>
              <div className="text-sm font-semibold text-[#1F6B4A]">
                {bundle.availableCount} {t('in_stock')}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Sticky Primary Action Button: 52px */}
      <div className="pt-2">
        <Button
          fullWidth
          size="sticky"
          onClick={() => {
            if (filteredBundles.length > 0) {
              handleSelectBundle(filteredBundles[0]);
            }
          }}
        >
          {t('btn_reserve')}
        </Button>
      </div>

      {/* Bottom Sheet Confirmation with Drag Handle */}
      <Sheet
        isOpen={confirmSheetOpen}
        onClose={() => setConfirmSheetOpen(false)}
        title={t('swap_title')}
      >
        {activeBundle && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10">
              <div className="w-10 h-10 rounded-full bg-[#DCE8E0] flex items-center justify-center shrink-0">
                {getBundleIcon(activeBundle.category)}
              </div>
              <div className="space-y-0.5">
                <div className="font-medium text-sm text-[#111111]">{activeBundle.name}</div>
                <div className="text-sm text-[#1F6B4A]">{activeBundle.lockerLocation}</div>
              </div>
            </div>

            <Button
              fullWidth
              size="sticky"
              onClick={handleConfirmReservation}
            >
              {t('btn_confirm')}
            </Button>
          </div>
        )}
      </Sheet>

      {/* Info Sheet */}
      <Sheet
        isOpen={infoSheetOpen}
        onClose={() => setInfoSheetOpen(false)}
        title={t('swap_title')}
      >
        <div className="space-y-3">
          <p>Standard packages stored in automated lockers across Nairobi.</p>
          <Button fullWidth variant="outline" size="md" onClick={() => setInfoSheetOpen(false)}>
            {t('btn_close')}
          </Button>
        </div>
      </Sheet>

    </div>
  );
};
